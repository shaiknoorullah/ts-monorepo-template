// `repo dev ...` — docker-compose wrappers for the local dev stack.

import { defineCommand } from 'citty'
import prompts from 'prompts'
import { emit, fail } from '../utils/output'
import { run } from '../utils/run'

const COMPOSE = ['compose', '-f', 'docker/compose.dev.yml']
const TOOLS = ['-f', 'docker/compose.dev-tools.yml']

async function compose(args: string[]): Promise<void> {
  const { exitCode } = await run('docker', [...COMPOSE, ...args])
  if (exitCode !== 0) fail(`docker compose ${args.join(' ')} failed (exit ${exitCode})`)
}

const up = defineCommand({
  meta: { name: 'up', description: 'Start the local dev stack (postgres, redis, kafka, etc).' },
  async run() {
    await compose(['up', '-d'])
    emit({ status: 'ok', message: 'Dev stack up.' })
  },
})

const down = defineCommand({
  meta: { name: 'down', description: 'Stop the local dev stack (keeps volumes).' },
  async run() {
    await compose(['down'])
    emit({ status: 'ok', message: 'Dev stack down.' })
  },
})

const tools = defineCommand({
  meta: {
    name: 'tools',
    description: 'Start the dev stack + the UI/admin profile (compose.dev-tools.yml).',
  },
  async run() {
    const { exitCode } = await run('docker', [
      ...COMPOSE,
      ...TOOLS,
      '--profile',
      'tools',
      'up',
      '-d',
    ])
    if (exitCode !== 0) fail(`docker compose tools failed (exit ${exitCode})`)
    emit({ status: 'ok', message: 'Dev stack + tools up.' })
  },
})

const logs = defineCommand({
  meta: { name: 'logs', description: 'Tail logs of a compose service.' },
  args: {
    service: { type: 'positional', description: 'Service name', required: true },
  },
  async run({ args }) {
    await compose(['logs', '-f', String(args.service)])
  },
})

const reset = defineCommand({
  meta: {
    name: 'reset',
    description: 'Tear down dev stack AND volumes. Destructive — prompts for confirmation.',
  },
  args: {
    yes: { type: 'boolean', description: 'Skip the confirmation prompt.', default: false },
  },
  async run({ args }) {
    if (!args.yes) {
      const { confirmed } = await prompts({
        type: 'confirm',
        name: 'confirmed',
        message: 'This deletes ALL dev volumes (postgres data, redis, kafka logs). Continue?',
        initial: false,
      })
      if (!confirmed) {
        emit({ status: 'warning', message: 'Aborted.' })
        return
      }
    }
    await compose(['down', '-v'])
    await compose(['up', '-d'])
    emit({ status: 'ok', message: 'Dev stack reset (volumes wiped + restarted).' })
  },
})

const tunnels = defineCommand({
  meta: {
    name: 'tunnels',
    description:
      'Start cloudflared tunnels exposing local dev apps on *.dev.example.com (free CF tunnel).',
  },
  args: {
    config: {
      type: 'string',
      description: 'Path to cloudflared config (default: .cloudflared/config.yml)',
      default: '.cloudflared/config.yml',
    },
  },
  async run({ args }): Promise<void> {
    const cfg = String(args.config)
    const { exitCode } = await run('cloudflared', ['tunnel', '--config', cfg, 'run'])
    if (exitCode !== 0) fail(`cloudflared tunnel run failed (exit ${exitCode})`)
    emit({ status: 'ok', message: 'Tunnels exited cleanly.' })
  },
})

export const devCommand = defineCommand({
  meta: { name: 'dev', description: 'Local dev stack — docker compose wrappers + tunnels.' },
  subCommands: { up, down, tools, logs, reset, tunnels },
})
