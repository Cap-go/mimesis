import { CapacitorCrispWeb } from './crisp-web'

const CapacitorCrisp = new CapacitorCrispWeb()

export function setUserId(uuid: string): void {
  CapacitorCrisp.setString({ key: 'user-uuid', value: uuid })
}
export function setVersion(version: string): void {
  CapacitorCrisp.setString({ key: 'webVersion', value: version })
}
export function setDeviceInfo(model: string, platform: string, operatingSystem: string, osVersion: string, webVersion: string, manufacturer: string): void {
  CapacitorCrisp.setString({ key: 'model', value: model })
  CapacitorCrisp.setString({ key: 'platform', value: platform })
  CapacitorCrisp.setString({ key: 'operatingSystem', value: operatingSystem })
  CapacitorCrisp.setString({ key: 'osVersion', value: osVersion })
  CapacitorCrisp.setString({ key: 'nativeVersion', value: webVersion })
  CapacitorCrisp.setString({ key: 'manufacturer', value: manufacturer })
}
export function setPaidPlan(planId: string): void {
  CapacitorCrisp.setString({ key: 'paid-plan', value: planId })
}
export function setPaidOldPlan(planId: string): void {
  CapacitorCrisp.setString({ key: 'paid-old-plan', value: planId })
}
export function sendMessage(value: string): void {
  CapacitorCrisp.sendMessage({ value })
}
export function openChat(): void {
  CapacitorCrisp.openMessenger()
}
export function initCrisp(): void {
  try {
    CapacitorCrisp.configure({
      websiteID: import.meta.env.crisp as string,
    })
  }
  catch (e) {
    console.error('Crips cannot be init', e)
  }
}
