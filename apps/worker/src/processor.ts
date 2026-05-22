import { type Logger } from '@pkg/logger'
import { z } from 'zod'

/** Shape of a single job. Extend this with your domain payloads via a union. */
export const jobPayloadSchema = z.object({
  payload: z.unknown(),
  type: z.string(),
})
export type JobPayload = z.infer<typeof jobPayloadSchema>

export interface JobResult {
  readonly durationMs: number
  readonly handled: string
  readonly ok: boolean
}

export interface ProcessJobOptions {
  readonly logger: Logger
}

/**
 * Process a single job. Exposed independently from the BullMQ worker
 * harness so unit tests can exercise it without Redis.
 */
export async function processJob(raw: unknown, options: ProcessJobOptions): Promise<JobResult> {
  const startedAt = Date.now()
  const job = jobPayloadSchema.parse(raw)
  options.logger.info({ jobType: job.type }, 'processing job')

  // Replace this with your real job-dispatch logic.
  // The template just acknowledges and returns.
  return {
    durationMs: Date.now() - startedAt,
    handled: job.type,
    ok: true,
  }
}
