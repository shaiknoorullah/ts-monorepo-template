import { score as scoreFromPackage } from '@internal/recommender'
import { loadProfiles, type ProfileDoc } from '../core/profile-loader.js'
import { loadRubric } from '../core/rubric-loader.js'

export interface Input {
  answers: {
    team_size: '1' | '2-5' | '6-20' | '20+'
    env_count: number
    target_budget_usd: number
    compliance_floor: 'none' | 'soc2' | 'hipaa' | 'fedramp'
    workload_shape?: 'stateless-web' | 'batch' | 'streaming' | 'mixed'
    ha_level?: 'best-effort' | 'single-az' | 'multi-az' | 'multi-region'
    observability_depth?: 'logs' | 'logs+metrics' | 'logs+metrics+traces' | '+ebpf'
    secret_backend?: 'keyring' | 'cloud-kms' | 'vault' | 'auto'
    registry?: 'ghcr' | 'cloud-native' | 'harbor' | 'auto'
    cdn_edge?: 'none' | 'cloudflare' | 'cloud-native'
  }
}

export interface Ctx {
  profilesDir: string
  rubricPath: string
}

export interface Ranked {
  profile: ProfileDoc['id']
  score: number
  reasons: string[]
}

export interface Output {
  ranked: Ranked[]
  recommended: ProfileDoc['id']
  rubric_version: string
  rubric_sha256: string
}

// Legacy ctx-driven scoring — preserved so Phase 12 fixture tests continue to pass.
// The Phase 15 implementation in @internal/recommender uses a different rubric
// schema (rubric.yaml with profile_priors) than the Phase 12 fixture rubric
// (rubric.yaml with questions[]). Both must be supported for backward compat.

const TEAM_FIT: Record<string, Record<ProfileDoc['id'], number>> = {
  '1': {
    'p-solo': 1,
    'p-hobby': 0.85,
    'p-startup-small': 0.4,
    'p-startup-scale': 0.1,
    'p-enterprise': 0,
  },
  '2-5': {
    'p-solo': 0.2,
    'p-hobby': 0.5,
    'p-startup-small': 1,
    'p-startup-scale': 0.5,
    'p-enterprise': 0.1,
  },
  '6-20': {
    'p-solo': 0,
    'p-hobby': 0.1,
    'p-startup-small': 0.5,
    'p-startup-scale': 1,
    'p-enterprise': 0.6,
  },
  '20+': {
    'p-solo': 0,
    'p-hobby': 0,
    'p-startup-small': 0.1,
    'p-startup-scale': 0.7,
    'p-enterprise': 1,
  },
}

const COMPLIANCE_FIT: Record<string, Record<ProfileDoc['id'], number>> = {
  none: {
    'p-solo': 1,
    'p-hobby': 1,
    'p-startup-small': 1,
    'p-startup-scale': 1,
    'p-enterprise': 0.5,
  },
  soc2: {
    'p-solo': 0,
    'p-hobby': 0,
    'p-startup-small': 0.4,
    'p-startup-scale': 1,
    'p-enterprise': 1,
  },
  hipaa: {
    'p-solo': 0,
    'p-hobby': 0,
    'p-startup-small': 0,
    'p-startup-scale': 0.6,
    'p-enterprise': 1,
  },
  fedramp: {
    'p-solo': 0,
    'p-hobby': 0,
    'p-startup-small': 0,
    'p-startup-scale': 0.2,
    'p-enterprise': 1,
  },
}

function budgetFit(budget: number, band: { min: number; max: number }): number {
  if (budget < band.min) return 0
  if (budget > band.max * 5) return 0.2
  if (budget > band.max) return 0.6
  const mid = (band.min + band.max) / 2 || 1
  return Math.max(0.5, 1 - Math.abs(budget - mid) / (band.max - band.min + 1))
}

function handleWithCtx(input: Input, ctx: Ctx): Output {
  const rubric = loadRubric(ctx.rubricPath)
  const profiles = loadProfiles(ctx.profilesDir)
  const wTeam = rubric.questions.find((q) => q.id === 'team_size')?.weight ?? 0.2
  const wBudget = rubric.questions.find((q) => q.id === 'target_budget_usd')?.weight ?? 0.25
  const wComp = rubric.questions.find((q) => q.id === 'compliance_floor')?.weight ?? 0.15
  const wEnv = rubric.questions.find((q) => q.id === 'env_count')?.weight ?? 0.1
  const totalW = wTeam + wBudget + wComp + wEnv

  const ranked: Ranked[] = profiles.map((p) => {
    const tFit = TEAM_FIT[input.answers.team_size]![p.id]
    const cFit = COMPLIANCE_FIT[input.answers.compliance_floor]![p.id]
    const bFit = budgetFit(input.answers.target_budget_usd, p.cost_band_usd)
    const eFit = Math.max(
      0,
      1 -
        Math.abs(
          input.answers.env_count -
            (p.id === 'p-solo'
              ? 1
              : p.id === 'p-hobby'
                ? 1
                : p.id === 'p-startup-small'
                  ? 3
                  : p.id === 'p-startup-scale'
                    ? 4
                    : 5),
        ) /
          5,
    )
    const score = (tFit * wTeam + bFit * wBudget + cFit * wComp + eFit * wEnv) / totalW
    const reasons: string[] = []
    if (tFit >= 0.8) reasons.push(`team_size=${input.answers.team_size} fits ${p.name}`)
    else if (tFit <= 0.2)
      reasons.push(`team_size=${input.answers.team_size} does not fit ${p.name}`)
    if (bFit >= 0.8)
      reasons.push(
        `budget $${input.answers.target_budget_usd} fits $${p.cost_band_usd.min}-${p.cost_band_usd.max} band`,
      )
    else if (input.answers.target_budget_usd < p.cost_band_usd.min)
      reasons.push(`budget $${input.answers.target_budget_usd} below $${p.cost_band_usd.min} floor`)
    if (cFit >= 0.8)
      reasons.push(`compliance_floor=${input.answers.compliance_floor} fits ${p.name}`)
    return { profile: p.id, score: Number(score.toFixed(2)), reasons }
  })

  ranked.sort((a, b) => b.score - a.score)
  return {
    ranked,
    recommended: ranked[0]!.profile,
    rubric_version: rubric.version,
    rubric_sha256: rubric.sha256,
  }
}

export async function handler(input: Input, ctx?: Ctx): Promise<Output> {
  if (ctx) {
    return handleWithCtx(input, ctx);
  }
  // Phase 15: delegate to the deterministic @internal/recommender package.
  const result = scoreFromPackage(input.answers)
  return {
    ranked: result.ranked,
    recommended: result.recommended,
    rubric_version: result.rubric_version,
    rubric_sha256: result.rubric_sha256,
  };
}
