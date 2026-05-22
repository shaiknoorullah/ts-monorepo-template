// `repo completion <bash|zsh>` — emit shell completion script.
//
// We keep this minimal (top-level commands + their immediate subcommands) so
// agents and humans get tab-completion without taking on a runtime-introspection
// dependency.

import { defineCommand } from 'citty'
import { emit, isJsonMode, logRaw } from '../utils/output'

const TOP = [
  'new',
  'env',
  'dev',
  'db',
  'deps',
  'release',
  'lint',
  'format',
  'test',
  'build',
  'type-check',
  'ci',
  'doctor',
  'clean',
  'version',
  'completion',
]

const SUBS: Record<string, string[]> = {
  new: ['app', 'package', 'adr', 'changeset', 'workflow', 'runbook'],
  env: ['render', 'validate', 'show'],
  dev: ['up', 'down', 'tools', 'logs', 'reset'],
  db: ['migrate', 'status', 'diff', 'seed', 'psql'],
  deps: ['check', 'sync', 'audit'],
  release: ['changeset', 'version', 'publish'],
  completion: ['bash', 'zsh'],
}

function bashScript(): string {
  return `# repo bash completion — source this from ~/.bashrc:
#   source <(repo completion bash)

_repo_completion() {
  local cur prev top="${TOP.join(' ')}"
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"

  if [[ \${COMP_CWORD} -eq 1 ]]; then
    COMPREPLY=( $(compgen -W "$top" -- "$cur") )
    return 0
  fi

  case "$prev" in
${Object.entries(SUBS)
  .map(([k, vs]) => `    ${k}) COMPREPLY=( $(compgen -W "${vs.join(' ')}" -- "$cur") ) ;;`)
  .join('\n')}
  esac
}

complete -F _repo_completion repo
`
}

function zshScript(): string {
  return `# repo zsh completion — source from ~/.zshrc:
#   source <(repo completion zsh)

_repo() {
  local -a top
  top=(${TOP.map((t) => `'${t}'`).join(' ')})
  if (( CURRENT == 2 )); then
    _describe 'command' top
    return
  fi
  case "\${words[2]}" in
${Object.entries(SUBS)
  .map(
    ([k, vs]) =>
      `    ${k}) _values 'subcommand' ${vs.map((v) => `'${v}'`).join(' ')} ;;`,
  )
  .join('\n')}
  esac
}

compdef _repo repo
`
}

export const completionCommand = defineCommand({
  meta: { name: 'completion', description: 'Emit shell completion script (bash | zsh).' },
  args: { shell: { type: 'positional', description: 'bash | zsh', required: true } },
  run({ args }) {
    const shell = String(args.shell)
    if (shell === 'bash') {
      if (isJsonMode()) emit({ status: 'ok', message: 'bash completion', data: { script: bashScript() } })
      else logRaw(bashScript())
      return
    }
    if (shell === 'zsh') {
      if (isJsonMode()) emit({ status: 'ok', message: 'zsh completion', data: { script: zshScript() } })
      else logRaw(zshScript())
      return
    }
    emit({ status: 'error', message: `Unknown shell: ${shell}. Use bash or zsh.` })
    process.exit(1)
  },
})
