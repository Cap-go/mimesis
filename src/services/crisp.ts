import { CapacitorCrisp } from '@capgo/capacitor-crisp'

const CRISP_WEBSITE_ID = '1011b75e-c4f6-400c-a6ff-c5077adb9db3'

export async function initCrisp(info: Record<string, string>): Promise<void> {
  try {
    await CapacitorCrisp.configure({ websiteID: CRISP_WEBSITE_ID })
    await Promise.all(Object.entries(info).map(([key, value]) => CapacitorCrisp.setString({ key, value })))
  }
  catch (err) {
    console.warn('crisp', err)
  }
}

export function openChat(): void {
  void CapacitorCrisp.openMessenger()
}
