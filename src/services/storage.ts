import { Preferences } from '@capacitor/preferences'

export async function setStorage<Type>(key: string, value: Type): Promise<void> {
  await Preferences.set({
    key,
    value: typeof value === 'string' ? value : JSON.stringify(value),
  })
}

export async function getStorage<Type>(key: string, defaultValue: Type | null = null): Promise<Type | null> {
  const res = await Preferences.get({ key })
  if (!res.value)
    return defaultValue
  try {
    return JSON.parse(res.value) as Type
  }
  catch {
    return res.value as unknown as Type
  }
}
