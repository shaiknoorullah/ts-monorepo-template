export { loadRubric, weightCoefficient } from './rubric'
export type { Rubric, ProfileId, ProfilePrior, WeightTier } from './rubric'

export const RUBRIC_VERSION = '1.0.0'

export function score(): never {
  throw new Error('score: not yet implemented')
}
