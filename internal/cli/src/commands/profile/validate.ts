// internal/cli/src/commands/profile/validate.ts
//
// `profile:validate <id>` — runs the materializer dry-run gates on a profile:
//   1. profile-v1 JSON schema validation of profile.env
//   2. helm template per chart with the profile's helm-values overlay
//   3. kubeconform on the rendered manifests
//   4. crossplane beta render of the composition pins
// Used by the profile-validate CI matrix gate (one job per profile id).
import { Args, Command, Flags } from '@oclif/core'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { parse } from 'yaml'

import { findRepoRoot } from '../../lib/profile-repo-root.js'

const requireFn = createRequire(import.meta.url)
const schema = requireFn('@internal/schemas/profile-v1.schema.json') as object

export interface ValidateStep {
  name: string
  cmd: string
  args: string[]
  cwd: string
}

export interface ValidatePlan {
  profileId: string
  steps: ValidateStep[]
}

export function buildValidatePlan(
  profileId: string,
  repoRoot: string = process.cwd(),
): ValidatePlan {
  const profileDir = resolve(repoRoot, 'profiles', profileId)
  const libChartDir = resolve(repoRoot, 'infra', 'helm', 'lib-chart')
  const renderedDir = resolve(repoRoot, '.cache', 'profile-validate', profileId)
  const helmStep = (chart: string): ValidateStep => ({
    name: `helm-template-${chart}`,
    cmd: 'helm',
    args:
      chart === 'lib-chart'
        ? [
            'template',
            'lib-chart',
            libChartDir,
            '-f',
            resolve(profileDir, 'helm-values', `${chart}.values.yaml`),
            '--output-dir',
            resolve(renderedDir, chart),
          ]
        : [
            'template',
            chart,
            resolve(repoRoot, 'infra', 'helm', 'apps', chart),
            '-f',
            resolve(profileDir, 'helm-values', `${chart}.values.yaml`),
            '--output-dir',
            resolve(renderedDir, chart),
          ],
    cwd: repoRoot,
  })
  return {
    profileId,
    steps: [
      {
        name: 'profile-v1-schema',
        cmd: 'node',
        args: ['-e', '0'],
        cwd: repoRoot,
      },
      helmStep('lib-chart'),
      helmStep('go-hello'),
      helmStep('py-hello'),
      helmStep('rs-hello'),
      {
        name: 'kubeconform-rendered-manifests',
        cmd: 'kubeconform',
        args: [
          '-strict',
          '-summary',
          '-schema-location',
          'default',
          '-schema-location',
          'https://raw.githubusercontent.com/datreeio/CRDs-catalog/main/{{.Group}}/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json',
          renderedDir,
        ],
        cwd: repoRoot,
      },
      {
        name: 'crossplane-render-compositions',
        cmd: 'crossplane',
        args: [
          'beta',
          'render',
          resolve(profileDir, 'crossplane', 'composition-pins.yaml'),
          resolve(repoRoot, 'infra', 'crossplane', 'compositions'),
          resolve(repoRoot, 'infra', 'crossplane', 'functions'),
        ],
        cwd: repoRoot,
      },
    ],
  }
}

export interface SchemaResult {
  ok: boolean
  errors: string[]
}

export function validateProfileSchemas(
  profileId: string,
  repoRoot: string = process.cwd(),
): SchemaResult {
  const envPath = resolve(repoRoot, 'profiles', profileId, 'profile.env')
  if (!existsSync(envPath)) {
    return { ok: false, errors: [`profile.env not found for ${profileId}`] }
  }
  const ajv = new Ajv2020({ allErrors: true, strict: true })
  addFormats(ajv)
  const validate = ajv.compile(schema)
  const doc = parse(readFileSync(envPath, 'utf8'))
  const ok = validate(doc)
  return {
    ok,
    errors: ok ? [] : (validate.errors ?? []).map((e) => `${e.instancePath} ${e.message}`),
  }
}

export interface ValidateOptions {
  cwd?: string
  dryRun?: boolean
}

export function runValidateCommand(profileId: string, opts: ValidateOptions = {}): number {
  const repoRoot = opts.cwd ?? process.cwd()
  const schemaResult = validateProfileSchemas(profileId, repoRoot)
  if (!schemaResult.ok) {
    process.stderr.write(`profile:validate FAIL schema:\n${schemaResult.errors.join('\n')}\n`)
    return 10
  }
  const plan = buildValidatePlan(profileId, repoRoot)
  for (const step of plan.steps) {
    if (step.name === 'profile-v1-schema') continue
    if (opts.dryRun) {
      process.stdout.write(`DRY ${step.name}: ${step.cmd} ${step.args.join(' ')}\n`)
      continue
    }
    const r = spawnSync(step.cmd, step.args, { cwd: step.cwd, stdio: 'inherit' })
    if (r.status !== 0) {
      process.stderr.write(`profile:validate FAIL ${step.name}\n`)
      return 11
    }
  }
  process.stdout.write(`profile:validate OK ${profileId}\n`)
  return 0
}

export default class ProfileValidate extends Command {
  static override readonly description =
    'Run profile materializer dry-run (schema + helm + kubeconform + xp render)'
  static override readonly args = {
    profile: Args.string({ required: true, description: 'Profile machine id' }),
  }
  static override readonly flags = {
    'dry-run': Flags.boolean({
      default: false,
      description: 'Print planned steps without executing them',
    }),
  }
  async run(): Promise<void> {
    const { args, flags } = await this.parse(ProfileValidate)
    const code = runValidateCommand(args.profile, {
      dryRun: flags['dry-run'],
      cwd: findRepoRoot(),
    })
    if (code !== 0) this.exit(code)
  }
}
