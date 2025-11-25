import { Preferences } from '@capacitor/preferences'

export async function setStorage<Type>(key: string, value: Type): Promise<void> {
  await Preferences.set({
    key,
    value: typeof value === 'string' ? value : JSON.stringify(value),
  })
}

export async function getStorage<Type>(key: string, defaultValue: Type | null = null): Promise<Type | null> {
  const res = await Preferences.get({ key })
  try {
    return res.value ? (JSON.parse(res.value) as Type) : defaultValue
  }
  catch {
    return res.value ? (res.value as unknown as Type) : defaultValue
  }
}
