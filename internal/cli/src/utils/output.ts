// internal/cli/src/utils/output.ts
//
// Dual-mode output: pretty (consola) for humans, JSON for agents.
// Every command should funnel results through emit() so that --json works.

import { consola } from 'consola'

export interface EmitPayload {
  data?: unknown
  message: string
  status: EmitStatus
}

export type EmitStatus = 'error' | 'ok' | 'warning'

let JSON_MODE = false

export function emit(payload: EmitPayload): void {
  if (JSON_MODE) {
    console.log(JSON.stringify(payload, null, 2))
    return
  }
  switch (payload.status) {
    case 'error': {
      consola.error(payload.message)
      break
    }
    case 'ok': {
      consola.success(payload.message)
      break
    }
    case 'warning': {
      consola.warn(payload.message)
      break
    }
  }
  if (payload.data !== undefined) {
    consola.info(payload.data)
  }
}

export function fail(message: string, data?: unknown): never {
  emit({ data, message, status: 'error' })
  process.exit(1)
}

export function info(message: string): void {
  if (JSON_MODE) return
  consola.info(message)
}

export function isJsonMode(): boolean {
  return JSON_MODE
}

export function logRaw(text: string): void {
  if (JSON_MODE) return

  console.log(text)
}

export function setJsonMode(on: boolean): void {
  JSON_MODE = on
}
