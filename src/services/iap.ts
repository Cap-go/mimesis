import type {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesOffering,
  PurchasesPackage,
} from '@revenuecat/purchases-capacitor'
import { isPlatform } from '@ionic/vue'

import {
  Purchases,
} from '@revenuecat/purchases-capacitor'
import { setPaidOldPlan, setPaidPlan } from './crips'
import { trackEvent } from './plausible'

export interface IAPProductCustom {
  status: 'paid' | 'free'
  id_ios: string
  id_android: string
}

export function initIap(id: string) {
  if (isPlatform('capacitor')) {
    Purchases.setLogLevel({ level: (import.meta.env.DEV ? 'DEBUG' : 'INFO') as LOG_LEVEL })
    Purchases.configure({ apiKey: id })
  }
}

export async function restore(): Promise<CustomerInfo | null> {
  if (!isPlatform('capacitor'))
    return null
  const res = await Purchases.restorePurchases()
  const purchaserInfo = res.customerInfo
  // console.log('restore', res)
  const ids: string[] = []
  const idsOld: string[] = []
  purchaserInfo.activeSubscriptions.forEach((id: string) => {
    ids.push(id)
  })
  purchaserInfo.allPurchasedProductIdentifiers.forEach((id: string) => {
    idsOld.push(id)
  })
  setPaidPlan(ids.join(','))
  setPaidOldPlan(idsOld.join(','))
  return purchaserInfo
}

export async function purchase(p: PurchasesPackage): Promise<CustomerInfo | null> {
  try {
    // console.log('purchase', p)
    const data = await Purchases.purchasePackage({
      aPackage: p,
    })
    const purchaserInfo = data.customerInfo
    // console.log('listenBuy', purchaserInfo)
    if (purchaserInfo.activeSubscriptions.includes(p.identifier)) {
      setPaidPlan(p.identifier)
      trackEvent('purchased', {
        identifier: p.identifier,
      })
    }
    return purchaserInfo
  }
  catch (e) {
    console.error('listenBuy error', e)
  }
  return null
}

export async function getCurrentOfferings(): Promise<PurchasesOffering | null> {
  const data = await Purchases.getOfferings()
  // return data.all['default'] || null // for debug only
  return data.current || null
}

export function getCurrentPrice(p: PurchasesPackage) {
  // Try introductory price first, fall back to regular price
  return (p.product as any)?.introductoryPrice?.price || p?.product?.price || 0
}

export function showCurrentPrice(p: PurchasesPackage) {
  // Try introductory price first, fall back to regular price
  return (p.product as any)?.introductoryPrice?.priceString || p?.product?.priceString || ''
}
export async function findPackage(productId: string): Promise<PurchasesPackage | null> {
  const offering = await getCurrentOfferings()
  if (!offering)
    return null
  for await (const p of offering.availablePackages) {
    if (p.product.identifier === productId)
      return p
  }
  return null
}
export function isAnyActiveSub(productIds: string[], pInfo: CustomerInfo | null): boolean {
  let activeSub = false
  if (pInfo && pInfo.activeSubscriptions.length && productIds)
    activeSub = pInfo.activeSubscriptions.some((id: string) => productIds.includes(id))

  // console.log('isPurchased', productIds, pInfo, activeSub)
  return activeSub
}
export function isPurchased(productId: string, pInfo: CustomerInfo | null): boolean {
  let purchased = false
  if (pInfo && productId) {
    purchased = pInfo.allPurchasedProductIdentifiers.includes(
      productId,
    )
  }
  // console.log('isPurchased', productId, pInfo, purchased)
  return purchased
}
