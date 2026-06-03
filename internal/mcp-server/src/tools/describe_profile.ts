import { loadProfile, type ProfileDoc } from '../core/profile-loader.js'

export interface Input {
  id: ProfileDoc['id']
}

export interface Ctx {
  profilesDir: string
}

export async function handler(input: Input, ctx: Ctx): Promise<ProfileDoc> {
  return loadProfile(ctx.profilesDir, input.id)
}
