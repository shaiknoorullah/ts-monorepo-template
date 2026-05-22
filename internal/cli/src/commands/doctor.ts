// `repo doctor` — health checks for the local dev environment.

import { defineCommand } from 'citty'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'pathe'

import { emit, fail, info, isJsonMode } from '../utils/output'
import { repoPath } from '../utils/paths'
import { run } from '../utils/run'

interface Check {
  expected?: string | undefined
  message?: string | undefined
  name: string
  status: 'error' | 'ok' | 'warning'
  value?: string | undefined
}

async function getVersion(bin: string, args: string[] = ['--version']): Promise<null | string> {
  const { exitCode, stdout } = await run(bin, args, { stdio: 'pipe' })
  if (exitCode !== 0) return null
  return stdout.trim().split('\n')[0] ?? null
}

function semverGte(actual: string, required: string): boolean {
  const norm = (s: string) =>
    s
      .replace(/^v/, '')
      .split(/[.\-+]/)
      .slice(0, 3)
      .map((n) => Number.parseInt(n, 10) || 0)
  const a = norm(actual)
  const r = norm(required)
  for (let i = 0; i < 3; i++) {
    if ((a[i] ?? 0) > (r[i] ?? 0)) return true
    if ((a[i] ?? 0) < (r[i] ?? 0)) return false
  }
  return true
}

export const doctorCommand = defineCommand({
  meta: {
    description:
      'Check repo health: node/pnpm versions, lockfile, dev stack reachability, deps installed.',
    name: 'doctor',
  },
  async run() {
    const checks: Check[] = []

    const requiredNode = '22.0.0'
    const node = process.version
    checks.push({
      expected: `>=${requiredNode}`,
      name: 'node-version',
      status: semverGte(node, requiredNode) ? 'ok' : 'error',
      value: node,
    })

    const pnpm = await getVersion('pnpm')
    checks.push({
      expected: '>=10.15.0',
      name: 'pnpm-version',
      status: pnpm && semverGte(pnpm, '10.15.0') ? 'ok' : 'error',
      value: pnpm ?? '<not found>',
    })

    const lock = repoPath('pnpm-lock.yaml')
    checks.push({
      name: 'pnpm-lockfile',
      status: existsSync(lock) ? 'ok' : 'warning',
      value: existsSync(lock) ? 'present' : 'missing',
    })

    const nodeModules = repoPath('node_modules')
    checks.push({
      message: existsSync(nodeModules) ? undefined : 'Run `pnpm install` to install dependencies.',
      name: 'node-modules-installed',
      status: existsSync(nodeModules) ? 'ok' : 'error',
      value: existsSync(nodeModules) ? 'present' : 'missing',
    })

    const docker = await getVersion('docker', ['--version'])
    checks.push({
      name: 'docker',
      status: docker ? 'ok' : 'warning',
      value: docker ?? '<not found>',
    })

    const git = await getVersion('git')
    checks.push({
      name: 'git',
      status: git ? 'ok' : 'error',
      value: git ?? '<not found>',
    })

    // Config sanity: at least base.yaml + dev.yaml exist.
    for (const f of ['config/base.yaml', 'config/dev.yaml']) {
      checks.push({
        message: existsSync(repoPath(f)) ? undefined : `Expected file: ${f}`,
        name: `config-${f.split('/')[1]?.replace('.yaml', '')}`,
        status: existsSync(repoPath(f)) ? 'ok' : 'error',
        value: existsSync(repoPath(f)) ? 'present' : 'missing',
      })
    }

    // package.json engine band sanity (informational).
    const pkgPath = repoPath('package.json')
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
        checks.push({
          name: 'engines.node',
          status: 'ok',
          value: pkg.engines?.node ?? '<unset>',
        })
      } catch {
        checks.push({ message: 'failed to parse package.json', name: 'engines.node', status: 'error' })
      }
    }

    const errors = checks.filter((c) => c.status === 'error').length
    const warns = checks.filter((c) => c.status === 'warning').length

    if (isJsonMode()) {
      emit({
        data: { checks },
        message: `${checks.length} checks: ${errors} error / ${warns} warning`,
        status: errors > 0 ? 'error' : (warns > 0 ? 'warning' : 'ok'),
      })
    } else {
      for (const c of checks) {
        const icon = c.status === 'ok' ? 'OK ' : (c.status === 'warning' ? 'WARN' : 'ERR ')
        info(`  [${icon}] ${c.name.padEnd(28)} ${c.value ?? ''} ${c.expected ? `(expected ${c.expected})` : ''}`)
        if (c.message) info(`         -> ${c.message}`)
      }
      emit({
        message: `${checks.length} checks · ${errors} error · ${warns} warning`,
        status: errors > 0 ? 'error' : (warns > 0 ? 'warning' : 'ok'),
      })
    }
    if (errors > 0) process.exit(1)
  },
})

// re-export resolve to keep tree-shaking quiet
void resolve
void fail
