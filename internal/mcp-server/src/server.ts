#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { validateOrThrow } from './schemas/_validator.js'
import { buildRegistry } from './registry.js'

interface Ctx {
  profilesDir: string
  appsDir: string
  xrdsDir: string
  pricesDir: string
  rubricPath: string
}

function ctxFromEnv(): Ctx {
  const root = process.env.TS_MONOREPO_ROOT ?? process.cwd()
  return {
    profilesDir: process.env.TS_MONOREPO_PROFILES_DIR ?? `${root}/profiles`,
    appsDir: process.env.TS_MONOREPO_APPS_DIR ?? `${root}/apps`,
    xrdsDir: process.env.TS_MONOREPO_XRDS_DIR ?? `${root}/infra/crossplane/xrds`,
    pricesDir: process.env.TS_MONOREPO_PRICES_DIR ?? `${root}/data/cloud-prices`,
    rubricPath:
      process.env.TS_MONOREPO_RUBRIC_PATH ?? `${root}/internal/cli/src/recommender/rubric.yaml`,
  }
}

export async function main(): Promise<void> {
  const registry = buildRegistry()
  const ctx = ctxFromEnv()
  const server = new Server(
    { name: '@ts-monorepo-template/mcp-server', version: '0.1.0' },
    { capabilities: { tools: {} } },
  )

  server.setRequestHandler(ListToolsRequestSchema, () =>
    Promise.resolve({
      tools: Object.entries(registry).map(([name, tool]) => ({
        name,
        description: `ts-monorepo-template tool: ${name}`,
        inputSchema: tool.inputSchema as { type: 'object' },
      })),
    }),
  )

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const tool = registry[req.params.name]
    if (!tool) {
      return {
        isError: true,
        content: [{ type: 'text', text: `unknown tool: ${req.params.name}` }],
      }
    }
    try {
      validateOrThrow(tool.inputSchema, req.params.arguments ?? {}, req.params.name)
      const out = await tool.handler(req.params.arguments ?? {}, ctx)
      validateOrThrow(tool.outputSchema, out, `${req.params.name}.output`)
      return { content: [{ type: 'text', text: JSON.stringify(out) }] }
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: (error as Error).message }],
      }
    }
  })

  const transport = new StdioServerTransport()
  await server.connect(transport)
}

const isEntrypoint = import.meta.url === `file://${process.argv[1]}`
if (isEntrypoint) {
  main().catch((error: unknown) => {
    process.stderr.write(`mcp-server fatal: ${(error as Error).message}\n`)
    process.exit(1)
  })
}
