/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import content from '../../backend/content/en.json'
import { CURATED_IDIOMS, CURATED_THEMES, curatedDict } from '../../translate/src/curated'
import { itemKey } from '../../translate/src/source'

// Raw strings: the vue-i18n plugin compiles locales/en.json when it is imported here.
const messages = JSON.parse(readFileSync(resolve(import.meta.dirname, '../../locales/en.json'), 'utf8')) as Record<string, string>
const idioms = content.guesses.filter(g => g.mode === 3).map(g => g.title)
const themeKeys = Object.keys(messages).filter(key => key.startsWith('fun.mimesis.'))

describe('curated translations', () => {
  it.each(Object.entries(CURATED_IDIOMS))('%s has one distinct local idiom per English idiom', (_, dict) => {
    expect(Object.keys(dict).sort()).toEqual([...idioms].sort())
    const values = Object.values(dict).map(v => v.trim())
    expect(values.every(Boolean)).toBe(true)
    expect(new Set(values).size).toBe(values.length)
  })

  it.each(Object.entries(CURATED_THEMES))('%s names every theme once', (_, names) => {
    expect(Object.keys(names).sort()).toEqual([...themeKeys].sort())
    expect(new Set(Object.values(names)).size).toBe(themeKeys.length)
  })

  it('keys curated entries like the model output so they override it', () => {
    const fr = curatedDict('fr', messages)
    expect(fr[itemKey('ui', messages['fun.mimesis.animals'])]).toBe(CURATED_THEMES.fr['fun.mimesis.animals'])
    expect(fr[itemKey('idiom', 'Kill two birds with one stone')]).toBe(CURATED_IDIOMS.fr['Kill two birds with one stone'])
    expect(curatedDict('nb', messages)).toEqual(curatedDict('no', messages))
    expect(curatedDict('xx', messages)).toEqual({})
  })
})
