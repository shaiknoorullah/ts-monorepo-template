import {
  loadRubric,
  weightCoefficient,
  type ProfileId,
  type ProfilePrior,
  type Rubric,
} from './rubric'

export interface RecommenderAnswers {
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

export interface RankedEntry {
  profile: ProfileId
  score: number
  reasons: string[]
}

export interface ScoreResult {
  ranked: RankedEntry[]
  recommended: ProfileId
  rubric_version: string
  rubric_sha256: string
}

const PROFILE_ORDER: ProfileId[] = [
  'p-solo',
  'p-hobby',
  'p-startup-small',
  'p-startup-scale',
  'p-enterprise',
]

function withinBudget(prior: ProfilePrior, target: number): 'in' | 'under' | 'over' {
  const { min, max } = prior.budget_band_usd
  if (target < min) return 'under'
  if (max > 0 && target > max) return 'over'
  return 'in'
}

function fmtBand(prior: ProfilePrior): string {
  const { min, max } = prior.budget_band_usd
  return max === 0 ? `$${min}+` : `$${min}-${max}`
}

function scoreOne(
  profile: ProfileId,
  prior: ProfilePrior,
  answers: RecommenderAnswers,
  rubric: Rubric,
): RankedEntry {
  const w = (k: string): number => weightCoefficient(rubric.weights[k]!)
  let raw = 0
  let max = 0
  const reasons: string[] = []
  const p = rubric.penalties

  // budget
  {
    const coef = w('target_budget_usd')
    max += coef
    const verdict = withinBudget(prior, answers.target_budget_usd)
    if (verdict === 'in') {
      raw += coef
      reasons.push(`budget $${answers.target_budget_usd} fits ${fmtBand(prior)} band`)
    } else if (verdict === 'under') {
      raw += Math.max(0, coef - p.budget_under_band!)
      reasons.push(`budget $${answers.target_budget_usd} below ${fmtBand(prior)} floor`)
    } else {
      raw += Math.max(0, coef - p.budget_over_band!)
      reasons.push(`budget $${answers.target_budget_usd} above ${fmtBand(prior)} ceiling`)
    }
  }

  // team_size
  {
    const coef = w('team_size')
    max += coef
    if (prior.team_size_fit.includes(answers.team_size)) {
      raw += coef
      reasons.push(`team_size=${answers.team_size} aligns with this profile`)
    } else {
      raw += Math.max(0, coef - p.team_size_mismatch!)
      reasons.push(
        `team_size=${answers.team_size} outside fit ${JSON.stringify(prior.team_size_fit)}`,
      )
    }
  }

  // env_count
  {
    const coef = w('env_count')
    max += coef
    const { min, max: maxEnv } = prior.env_count_fit
    if (answers.env_count >= min && answers.env_count <= maxEnv) {
      raw += coef
      reasons.push(`env_count=${answers.env_count} within ${min}-${maxEnv}`)
    } else if (answers.env_count < min) {
      raw += Math.max(0, coef - p.env_count_under!)
      reasons.push(`env_count=${answers.env_count} below ${min}`)
    } else {
      raw += Math.max(0, coef - p.env_count_over!)
      reasons.push(`env_count=${answers.env_count} above ${maxEnv}`)
    }
  }

  // compliance_floor
  {
    const coef = w('compliance_floor')
    max += coef
    if (prior.compliance_fit.includes(answers.compliance_floor)) {
      raw += coef
      reasons.push(`compliance_floor=${answers.compliance_floor} supported`)
    } else {
      raw += Math.max(0, coef - p.compliance_mismatch!)
      reasons.push(`compliance_floor=${answers.compliance_floor} not supported by this profile`)
    }
  }

  // ha_level (optional)
  if (answers.ha_level !== undefined) {
    const coef = w('ha_level')
    max += coef
    if (prior.ha_level_fit.includes(answers.ha_level)) {
      raw += coef
      reasons.push(`ha_level=${answers.ha_level} matches`)
    } else {
      raw += Math.max(0, coef - p.ha_level_mismatch!)
      reasons.push(`ha_level=${answers.ha_level} outside ${JSON.stringify(prior.ha_level_fit)}`)
    }
  }

  // workload_shape (optional)
  if (answers.workload_shape !== undefined) {
    const coef = w('workload_shape')
    max += coef
    if (prior.workload_shape_fit.includes(answers.workload_shape)) {
      raw += coef
    } else {
      raw += Math.max(0, coef - p.workload_shape_mismatch!)
      reasons.push(`workload_shape=${answers.workload_shape} not a primary fit`)
    }
  }

  // observability_depth (optional)
  if (answers.observability_depth !== undefined) {
    const coef = w('observability_depth')
    max += coef
    if (prior.observability_fit.includes(answers.observability_depth)) {
      raw += coef
    } else {
      raw += Math.max(0, coef - p.observability_mismatch!)
      reasons.push(`observability_depth=${answers.observability_depth} not native to this profile`)
    }
  }

  // secret_backend (optional)
  if (answers.secret_backend !== undefined) {
    const coef = w('secret_backend')
    max += coef
    if (prior.secret_backend_fit.includes(answers.secret_backend)) {
      raw += coef
    } else {
      raw += Math.max(0, coef - p.secret_backend_mismatch!)
      reasons.push(`secret_backend=${answers.secret_backend} outside profile defaults`)
    }
  }

  // registry (optional)
  if (answers.registry !== undefined) {
    const coef = w('registry')
    max += coef
    raw += prior.registry_fit.includes(answers.registry) ? coef : Math.max(0, coef - p.registry_mismatch!);
  }

  // cdn_edge (optional)
  if (answers.cdn_edge !== undefined) {
    const coef = w('cdn_edge')
    max += coef
    raw += prior.cdn_edge_fit.includes(answers.cdn_edge) ? coef : Math.max(0, coef - p.cdn_edge_mismatch!);
  }

  const normalized = max === 0 ? 0 : Math.max(0, Math.min(1, raw / max))
  // round to 4dp so JSON-stringified output is byte-stable
  const rounded = Math.round(normalized * 10_000) / 10_000
  return { profile, score: rounded, reasons }
}

export function score(answers: RecommenderAnswers): ScoreResult {
  const rubric = loadRubric()
  const ranked: RankedEntry[] = PROFILE_ORDER.map((id) =>
    scoreOne(id, rubric.profile_priors[id], answers, rubric),
  )
  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    // deterministic tiebreak: PROFILE_ORDER index
    return PROFILE_ORDER.indexOf(a.profile) - PROFILE_ORDER.indexOf(b.profile)
  })
  return {
    ranked,
    recommended: ranked[0]!.profile,
    rubric_version: rubric.version,
    rubric_sha256: rubric.sha256,
  }
}
