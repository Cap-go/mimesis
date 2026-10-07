import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { isNative } from './platform'

export function tap(): void {
  if (isNative)
    void Haptics.impact({ style: ImpactStyle.Light })
}

export function success(): void {
  if (isNative)
    void Haptics.notification({ type: NotificationType.Success })
}

export function warning(): void {
  if (isNative)
    void Haptics.notification({ type: NotificationType.Warning })
}
