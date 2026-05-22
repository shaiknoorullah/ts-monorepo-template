import { type Logger } from '@pkg/logger'
import { z } from 'zod'

/** Shape of a single job. Extend this with your domain payloads via a union. */
export const jobPayloadSchema = z.object({
  type: z.string(),
  payload: z.unknown(),
})
export type JobPayload = z.infer<typeof jobPayloadSchema>

export interface JobResult {
  readonly ok: boolean
  readonly handled: string
  readonly durationMs: number
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
    ok: true,
    handled: job.type,
    durationMs: Date.now() - startedAt,
  }
}
