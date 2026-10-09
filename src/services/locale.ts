// Shared by the app and the translation worker, so both agree on language codes.
// "pt-BR" -> "pt", "zh-Hant-TW" / "zh-TW" -> "zh-hant", "zh-Hans-CN" -> "zh".
export function normalizeLocale(tag: string | undefined): string {
  const lower = (tag ?? '').toLowerCase().replaceAll('_', '-')
  const base = lower.split('-')[0]
  if (!/^[a-z]{2,3}$/.test(base))
    return 'en'
  if (base === 'zh' && /-(?:hant|tw|hk|mo)\b/.test(lower))
    return 'zh-hant'
  return base
}
