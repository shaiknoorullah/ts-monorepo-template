import { loadApp, type AppMeta } from '../core/app-loader.js'

export interface Input {
  name: string
}

export interface Ctx {
  appsDir: string
}

export async function handler(input: Input, ctx: Ctx): Promise<AppMeta> {
  return loadApp(ctx.appsDir, input.name)
}
