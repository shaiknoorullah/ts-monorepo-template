// internal/cli/src/utils/run.ts
// Thin wrapper around execa with sensible defaults for CLI shell-outs.

import { execa } from 'execa'
import { findRepoRoot } from './paths'

export interface RunOptions {
  cwd?: string
  env?: Record<string, string>
  stdio?: 'inherit' | 'pipe'
}

export async function run(
  bin: string,
  args: string[] = [],
  opts: RunOptions = {},
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const result = await execa(bin, args, {
    cwd: opts.cwd ?? findRepoRoot(),
    env: { ...process.env, ...opts.env },
    stdio: opts.stdio ?? 'inherit',
    reject: false,
  })
  return {
    stdout: result.stdout?.toString() ?? '',
    stderr: result.stderr?.toString() ?? '',
    exitCode: result.exitCode ?? 0,
  }
}

export async function runOrThrow(
  bin: string,
  args: string[] = [],
  opts: RunOptions = {},
): Promise<void> {
  const { exitCode } = await run(bin, args, opts)
  if (exitCode !== 0) {
    throw new Error(`Command failed (exit ${exitCode}): ${bin} ${args.join(' ')}`)
  }
}
