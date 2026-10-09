import { describe, expect, it } from 'vitest'
import { normalizeLocale } from '../../src/services/locale'

describe('normalizeLocale', () => {
  it('keeps the base language', () => {
    expect(normalizeLocale('pt-BR')).toBe('pt')
    expect(normalizeLocale('ko_KR')).toBe('ko')
    expect(normalizeLocale('EN')).toBe('en')
  })

  it('separates traditional Chinese', () => {
    expect(normalizeLocale('zh-Hant-TW')).toBe('zh-hant')
    expect(normalizeLocale('zh-HK')).toBe('zh-hant')
    expect(normalizeLocale('zh-Hans-CN')).toBe('zh')
  })

  it('falls back to English', () => {
    expect(normalizeLocale(undefined)).toBe('en')
    expect(normalizeLocale('')).toBe('en')
  })
})
