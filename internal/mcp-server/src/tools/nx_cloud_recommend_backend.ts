type Profile = 'p-solo' | 'p-hobby' | 'p-startup-small' | 'p-startup-scale' | 'p-enterprise'
type Backend = 'saas' | 'powerpack-self-host' | 'community'
type Flag = 'soc2' | 'hipaa' | 'fedramp' | 'gdpr' | 'data-residency'

export interface Input {
  profile: Profile
  monthly_ci_minutes: number
  compliance_flags: Flag[]
}

export interface Ranked {
  backend: Backend
  score: number
  reasons: string[]
}

export interface Output {
  ranked: Ranked[]
  recommended: Backend
}

const PROFILE_DEFAULT: Record<Profile, Backend> = {
  'p-solo': 'community',
  'p-hobby': 'saas',
  'p-startup-small': 'saas',
  'p-startup-scale': 'saas',
  'p-enterprise': 'powerpack-self-host',
}

const HARD_COMPLIANCE = new Set<Flag>(['data-residency', 'fedramp', 'hipaa'])

export async function handler(input: Input, _ctx: Record<string, never>): Promise<Output> {
  const def = PROFILE_DEFAULT[input.profile]
  const hardCompliance = input.compliance_flags.some((f) => HARD_COMPLIANCE.has(f))

  let ranked: Ranked[]
  if (hardCompliance) {
    ranked = [
      {
        backend: 'powerpack-self-host',
        score: 1,
        reasons: [
          `compliance_flags includes ${input.compliance_flags.filter((f) => HARD_COMPLIANCE.has(f)).join(', ')} — self-host required`,
        ],
      },
      {
        backend: 'saas',
        score: 0.2,
        reasons: ['SaaS rejected by data-residency / hipaa / fedramp flag'],
      },
      { backend: 'community', score: 0.05, reasons: ['no remote cache — cold every run'] },
    ]
  } else if (input.profile === 'p-solo' || input.monthly_ci_minutes === 0) {
    ranked = [
      {
        backend: 'community',
        score: 0.9,
        reasons: ['one-machine workspace; remote cache is overkill'],
      },
      { backend: 'saas', score: 0.4, reasons: ['adds an account dependency for negligible win'] },
      { backend: 'powerpack-self-host', score: 0.1, reasons: ['ops overhead does not pay back'] },
    ]
  } else {
    ranked = [
      { backend: def, score: 0.9, reasons: [`Section 3.7 default for ${input.profile}`] },
      {
        backend: def === 'saas' ? 'powerpack-self-host' : 'saas',
        score: 0.5,
        reasons: ['available as an upgrade path'],
      },
      { backend: 'community', score: 0.2, reasons: ['fallback if SaaS account unavailable'] },
    ]
  }

  ranked.sort((a, b) => b.score - a.score)
  return { ranked, recommended: ranked[0]!.backend }
}
