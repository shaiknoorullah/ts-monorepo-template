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
  meta: { description: 'Start the local dev stack (postgres, redis, kafka, etc).', name: 'up' },
  async run() {
    await compose(['up', '-d'])
    emit({ message: 'Dev stack up.', status: 'ok' })
  },
})

const down = defineCommand({
  meta: { description: 'Stop the local dev stack (keeps volumes).', name: 'down' },
  async run() {
    await compose(['down'])
    emit({ message: 'Dev stack down.', status: 'ok' })
  },
})

const tools = defineCommand({
  meta: {
    description: 'Start the dev stack + the UI/admin profile (compose.dev-tools.yml).',
    name: 'tools',
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
    emit({ message: 'Dev stack + tools up.', status: 'ok' })
  },
})

const logs = defineCommand({
  args: {
    service: { description: 'Service name', required: true, type: 'positional' },
  },
  meta: { description: 'Tail logs of a compose service.', name: 'logs' },
  async run({ args }) {
    await compose(['logs', '-f', String(args.service)])
  },
})

const reset = defineCommand({
  args: {
    yes: { default: false, description: 'Skip the confirmation prompt.', type: 'boolean' },
  },
  meta: {
    description: 'Tear down dev stack AND volumes. Destructive — prompts for confirmation.',
    name: 'reset',
  },
  async run({ args }) {
    if (!args.yes) {
      const { confirmed } = await prompts({
        initial: false,
        message: 'This deletes ALL dev volumes (postgres data, redis, kafka logs). Continue?',
        name: 'confirmed',
        type: 'confirm',
      })
      if (!confirmed) {
        emit({ message: 'Aborted.', status: 'warning' })
        return
      }
    }
    await compose(['down', '-v'])
    await compose(['up', '-d'])
    emit({ message: 'Dev stack reset (volumes wiped + restarted).', status: 'ok' })
  },
})

const tunnels = defineCommand({
  args: {
    config: {
      default: '.cloudflared/config.yml',
      description: 'Path to cloudflared config (default: .cloudflared/config.yml)',
      type: 'string',
    },
  },
  meta: {
    description:
      'Start cloudflared tunnels exposing local dev apps on *.dev.example.com (free CF tunnel).',
    name: 'tunnels',
  },
  async run({ args }): Promise<void> {
    const cfg = String(args.config)
    const { exitCode } = await run('cloudflared', ['tunnel', '--config', cfg, 'run'])
    if (exitCode !== 0) fail(`cloudflared tunnel run failed (exit ${exitCode})`)
    emit({ message: 'Tunnels exited cleanly.', status: 'ok' })
  },
})

export const devCommand = defineCommand({
  meta: { description: 'Local dev stack — docker compose wrappers + tunnels.', name: 'dev' },
  subCommands: { down, logs, reset, tools, tunnels, up },
})
