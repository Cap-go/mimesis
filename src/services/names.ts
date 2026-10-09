import type { NameList } from './i18n'
import { names as localized } from './i18n'
import { randomSelect } from './random'

export function names(): NameList {
  return localized.value
}

export function randomFirstName(): string {
  return randomSelect(names().firstNames)
}

export function randomTeamName(taken: string[] = []): string {
  const all = names().teamNames
  const free = all.filter(name => !taken.includes(name))
  return randomSelect(free.length ? free : all)
}
