// internal/cli/src/utils/flatten.ts
//
// Flatten a nested config object to KEY=VALUE pairs suitable for a .env file.
// Convention: dot paths become SCREAMING_SNAKE keys.
//
//   database.host -> DATABASE_HOST
//   kafka.bootstrapServers[0] -> KAFKA_BOOTSTRAP_SERVERS_0
//   saas.lago.apiUrl -> SAAS_LAGO_API_URL

import { isSecretRef } from './config-loader'

export function flattenToEnv(
  obj: unknown,
  base: string[] = [],
  acc: Record<string, string> = {},
): Record<string, string> {
  if (obj === null || obj === undefined) return acc

  if (isSecretRef(obj)) {
    // Unresolved secrets are NOT emitted — render() refuses if any remain.
    return acc
  }

  if (Array.isArray(obj)) {
    const arr = obj as unknown[]
    // For homogeneous arrays of strings/numbers, join with commas (common
    // docker-compose convention, e.g. KAFKA_BOOTSTRAP_SERVERS=a,b,c).
    if (arr.every((v: unknown) => typeof v === 'string' || typeof v === 'number')) {
      acc[toEnvKey(base)] = arr.map(String).join(',')
      return acc
    }
    arr.forEach((v: unknown, i: number) => flattenToEnv(v, [...base, String(i)], acc))
    return acc
  }

  if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      flattenToEnv(v, [...base, k], acc)
    }
    return acc
  }

  acc[toEnvKey(base)] = String(obj)
  return acc
}

export function formatEnvFile(pairs: Record<string, string>): string {
  return (
    Object.entries(pairs)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => {
        // Quote values that contain whitespace, special chars, or are empty
        if (v === '' || /[\s"'$`\\]/.test(v)) {
          return `${k}="${v.replaceAll('\\', '\\\\').replaceAll('"', String.raw`\"`)}"`
        }
        return `${k}=${v}`
      })
      .join('\n') + '\n'
  )
}

export function toEnvKey(path: string[]): string {
  return path
    .map((seg) => seg.replaceAll(/([a-z])([A-Z])/g, '$1_$2'))
    .join('_')
    .toUpperCase()
    .replaceAll(/[^A-Z0-9_]/g, '_')
}
