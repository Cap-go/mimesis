import { isPlatform } from '@ionic/vue'
import Plausible from 'plausible-tracker'

export function trackEvent(eventName: string, eventData: { [propName: string]: string | number | boolean }) {
  const { trackEvent } = Plausible({
    trackLocalhost: isPlatform('capacitor'),
    domain: import.meta.env.domain as string,
  })
  trackEvent(eventName, { props: eventData })
}

export function initPlausible(): void {
  const { enableAutoPageviews } = Plausible({
    trackLocalhost: isPlatform('capacitor'),
    domain: import.meta.env.domain as string,
  })
  enableAutoPageviews()
}
