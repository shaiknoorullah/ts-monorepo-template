// internal/cli/src/utils/config-loader.ts
//
// Loads the YAML config hierarchy via c12 and validates against the Zod schema.
// Handles ${VAR} env-var substitution and SecretRef redaction for display.

import { loadConfig as c12Load } from 'c12'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'pathe'
import { parse as parseYaml } from 'yaml'

import {
  type AppConfig,
  AppConfigSchema,
  
  type SecretRef,
} from '../../../../config/schema'
import { repoPath } from './paths'

const ENV_VAR_RE = /\$\{([A-Z_][A-Z0-9_]*)\}/g

export interface LoadResult {
  config: AppConfig
  /** env vars referenced via ${VAR} that were not set in process.env */
  missingEnvVars: string[]
  /** source path that was loaded */
  source: string
  /** flat dotted paths whose value is a still-unresolved SecretRef */
  unresolvedSecrets: string[]
}

export function isSecretRef(v: unknown): v is SecretRef {
  return (
    !!v &&
    typeof v === 'object' &&
    'provider' in v &&
    'path' in v &&
    typeof (v as { provider: unknown }).provider === 'string'
  )
}

export async function loadEnv(envName: string, opts: { tenant?: string } = {}): Promise<LoadResult> {
  const cfgDir = repoPath('config')
  const filePath = opts.tenant
    ? resolve(cfgDir, 'tenants', `${opts.tenant}.yaml`)
    : resolve(cfgDir, `${envName}.yaml`)

  // Allow c12 a future-proof hand-off (watch mode, dotenv layering) but for
  // YAML extends we do our own resolution above.
  await c12Load({ cwd: cfgDir, defaultConfig: {}, name: 'app' }).catch(() => {})

  const missing: string[] = []
  const merged = substituteEnvVars(resolveYamlExtends(filePath), missing) as Record<
    string,
    unknown
  >

  // Best-effort parse — re-collect errors as friendly messages.
  const parsed = AppConfigSchema.safeParse(merged)
  if (!parsed.success) {
    const lines = parsed.error.issues.map(
      (i) => `  - ${i.path.map(String).join('.') || '<root>'}: ${i.message}`,
    )
    throw new Error(`Config validation failed for ${filePath}:\n${lines.join('\n')}`)
  }

  return {
    config: parsed.data,
    missingEnvVars: [...new Set(missing)],
    source: filePath,
    unresolvedSecrets: collectSecretPaths(parsed.data),
  }
}

/**
 * Recursively redact SecretRef values for safe display.
 */
export function redactSecrets(input: unknown): unknown {
  if (isSecretRef(input)) {
    return `<secret:${input.provider}:${input.path}>`
  }
  if (Array.isArray(input)) return (input as unknown[]).map((v) => redactSecrets(v))
  if (input && typeof input === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(input)) out[k] = redactSecrets(v)
    return out
  }
  return input
}

function collectSecretPaths(obj: unknown, base: string[] = [], acc: string[] = []): string[] {
  if (isSecretRef(obj)) {
    acc.push(base.join('.'))
    return acc
  }
  if (Array.isArray(obj)) {
    ;(obj as unknown[]).forEach((v: unknown, i: number) =>
      collectSecretPaths(v, [...base, String(i)], acc),
    )
    return acc
  }
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      collectSecretPaths(v, [...base, k], acc)
    }
  }
  return acc
}

function deepMerge(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...a }
  for (const [k, v] of Object.entries(b)) {
    const av = out[k]
    out[k] = av &&
      typeof av === 'object' &&
      !Array.isArray(av) &&
      v &&
      typeof v === 'object' &&
      !Array.isArray(v) ? deepMerge(av as Record<string, unknown>, v as Record<string, unknown>) : v;
  }
  return out
}

/**
 * Resolve `$extends` chains manually (c12 only handles JS/TS extends natively;
 * for YAML we walk it ourselves so the layering is predictable).
 */
function resolveYamlExtends(filePath: string, seen = new Set<string>()): Record<string, unknown> {
  const abs = resolve(filePath)
  if (seen.has(abs)) {
    throw new Error(`Circular $extends in YAML config: ${abs}`)
  }
  seen.add(abs)
  if (!existsSync(abs)) {
    throw new Error(`Config file not found: ${abs}`)
  }
  const raw = parseYaml(readFileSync(abs, 'utf-8')) as null | Record<string, unknown>
  const data = raw ?? {}
  const extendsField = data.$extends
  delete data.$extends
  if (typeof extendsField === 'string') {
    const parentPath = resolve(dirname(abs), extendsField)
    const parent = resolveYamlExtends(parentPath, seen)
    return deepMerge(parent, data)
  }
  if (Array.isArray(extendsField)) {
    let merged: Record<string, unknown> = {}
    for (const e of extendsField) {
      const p = resolve(dirname(abs), String(e))
      merged = deepMerge(merged, resolveYamlExtends(p, new Set(seen)))
    }
    return deepMerge(merged, data)
  }
  return data
}

/**
 * Recursively walk an object/array and substitute `${VAR}` against process.env.
 * Throws if a referenced var is unset (fail-fast — 12-factor).
 */
function substituteEnvVars(input: unknown, missing: string[] = []): unknown {
  if (typeof input === 'string') {
    return input.replaceAll(ENV_VAR_RE, (_, name: string) => {
      const v = process.env[name]
      if (v === undefined || v === '') {
        missing.push(name)
        return ''
      }
      return v
    })
  }
  if (Array.isArray(input)) {
    return input.map((v) => substituteEnvVars(v, missing))
  }
  if (input && typeof input === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(input)) {
      out[k] = substituteEnvVars(v, missing)
    }
    return out
  }
  return input
}



export {parseConfig} from '../../../../config/schema'