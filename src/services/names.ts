import { i18n } from './i18n'
import { randomSelect } from './random'

interface NameList {
  firstNames: string[]
  teamNames: string[]
}

const lists = Object.fromEntries(
  Object.entries(import.meta.glob<{ default: NameList }>('../../locales/names/*.json', { eager: true }))
    .map(([path, mod]) => [path.split('/').pop()!.replace('.json', ''), mod.default]),
)

export function names(): NameList {
  return lists[i18n.global.locale.value] ?? lists.en ?? lists.fr
}

export function randomFirstName(): string {
  return randomSelect(names().firstNames)
}

export function randomTeamName(taken: string[] = []): string {
  const all = names().teamNames
  const free = all.filter(name => !taken.includes(name))
  return randomSelect(free.length ? free : all)
}
