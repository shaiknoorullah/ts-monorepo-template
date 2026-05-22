// internal/cli/src/utils/output.ts
//
// Dual-mode output: pretty (consola) for humans, JSON for agents.
// Every command should funnel results through emit() so that --json works.

import { consola } from 'consola'

export type EmitStatus = 'ok' | 'warning' | 'error'

export interface EmitPayload {
  status: EmitStatus
  message: string
  data?: unknown
}

let JSON_MODE = false

export function setJsonMode(on: boolean): void {
  JSON_MODE = on
}

export function isJsonMode(): boolean {
  return JSON_MODE
}

export function emit(payload: EmitPayload): void {
  if (JSON_MODE) {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(payload, null, 2))
    return
  }
  switch (payload.status) {
    case 'ok':
      consola.success(payload.message)
      break
    case 'warning':
      consola.warn(payload.message)
      break
    case 'error':
      consola.error(payload.message)
      break
  }
  if (payload.data !== undefined) {
    consola.info(payload.data)
  }
}

export function info(message: string): void {
  if (JSON_MODE) return
  consola.info(message)
}

export function logRaw(text: string): void {
  if (JSON_MODE) return
  // eslint-disable-next-line no-console
  console.log(text)
}

export function fail(message: string, data?: unknown): never {
  emit({ status: 'error', message, data })
  process.exit(1)
}
