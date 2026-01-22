'use client'

import { useEffect, useState } from 'react'

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      checkSubscription()
    }
  }, [])

  async function checkSubscription() {
    try {
      const registration = await navigator.serviceWorker.ready
      const sub = await registration.pushManager.getSubscription()
      setSubscription(sub)
      setIsSubscribed(!!sub)
    } catch (error) {
      console.error('[v0] Error checking subscription:', error)
    }
  }

  async function subscribeToPush() {
    try {
      const permission = await Notification.requestPermission()
      
      if (permission !== 'granted') {
        console.log('[v0] Notification permission denied')
        return false
      }

      const registration = await navigator.serviceWorker.ready
      
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        console.error('[v0] VAPID public key not configured')
        return false
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      })

      // Enviar subscription para o servidor
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sub.toJSON())
      })

      if (!response.ok) {
        throw new Error('Failed to save subscription')
      }

      setSubscription(sub)
      setIsSubscribed(true)
      console.log('[v0] Push notification subscription successful')
      return true
    } catch (error) {
      console.error('[v0] Error subscribing to push:', error)
      return false
    }
  }

  async function unsubscribeFromPush() {
    try {
      if (!subscription) return false

      await subscription.unsubscribe()
      setSubscription(null)
      setIsSubscribed(false)
      return true
    } catch (error) {
      console.error('[v0] Error unsubscribing from push:', error)
      return false
    }
  }

  return {
    isSupported,
    isSubscribed,
    subscribeToPush,
    unsubscribeFromPush
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
