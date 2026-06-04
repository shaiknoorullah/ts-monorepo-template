import { loadApps, type AppMeta } from '../core/app-loader.js'

export interface Ctx {
  appsDir: string
}

export interface Output {
  apps: Pick<AppMeta, 'name' | 'language' | 'path'>[]
}

export async function handler(_input: Record<string, never>, ctx: Ctx): Promise<Output> {
  const apps = loadApps(ctx.appsDir)
  return { apps: apps.map((a) => ({ name: a.name, language: a.language, path: a.path })) }
}
