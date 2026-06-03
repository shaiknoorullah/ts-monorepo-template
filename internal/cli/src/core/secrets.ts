// internal/cli/src/core/secrets.ts
interface SecretEntry {
  required?: boolean
  profiles?: string[]
  default_dev?: string
  ci_only?: boolean
}

export interface SecretsCheckResult {
  ok: boolean
  missing: string[]
  profile: string
}

function parseToml(text: string): { secrets: Record<string, SecretEntry> } {
  const secrets: Record<string, SecretEntry> = {}
  let current: SecretEntry | null = null
  let currentName: string | null = null
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const header = /^\[secrets\.([A-Z_][A-Z0-9_]*)\]$/.exec(line)
    if (header) {
      if (currentName && current) secrets[currentName] = current
      currentName = header[1]!
      current = {}
      continue
    }
    if (line.startsWith('[')) {
      if (currentName && current) secrets[currentName] = current
      currentName = null
      current = null
      continue
    }
    if (!current) continue
    const kv = /^([a-z_]+)\s*=\s*(.+)$/.exec(line)
    if (!kv) continue
    const key = kv[1]!
    const valRaw = kv[2]!.trim()
    switch (key) {
      case 'ci_only':
      case 'required': {
        ;(current as Record<string, unknown>)[key] = valRaw === 'true'

        break
      }
      case 'default_dev': {
        current.default_dev = valRaw.replaceAll(/^"|"$/g, '')

        break
      }
      case 'profiles': {
        const arr = valRaw
          .replaceAll(/^\[|\]$/g, '')
          .split(',')
          .map((s) => s.trim().replaceAll(/^"|"$/g, ''))
        current.profiles = arr.filter(Boolean)

        break
      }
      // No default
    }
  }
  if (currentName && current) secrets[currentName] = current
  return { secrets }
}

export function checkSecretspec(
  tomlText: string,
  activeProfile: string,
  envSnapshot: Record<string, string>,
): SecretsCheckResult {
  const { secrets } = parseToml(tomlText)
  const missing: string[] = []
  for (const [name, entry] of Object.entries(secrets)) {
    if (entry.ci_only && activeProfile !== 'ci') continue
    const applicable = !entry.profiles || entry.profiles.includes(activeProfile)
    if (!applicable) continue
    if (!entry.required) continue
    if (envSnapshot[name]) continue
    if (entry.default_dev) continue
    missing.push(name)
  }
  return { ok: missing.length === 0, missing, profile: activeProfile }
}
