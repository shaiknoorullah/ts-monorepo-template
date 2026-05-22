// `repo env ...` — YAML config rendering / validation / inspection.

import { defineCommand } from 'citty'
import { envRender } from './env/render'
import { envValidate } from './env/validate'
import { envShow } from './env/show'

export const envCommand = defineCommand({
  meta: {
    name: 'env',
    description: 'Render, validate, and inspect YAML configs in config/.',
  },
  subCommands: {
    render: envRender,
    validate: envValidate,
    show: envShow,
  },
})
