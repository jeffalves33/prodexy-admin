export async function sendPushNotification({
  userId,
  title,
  body,
  url
}: {
  userId: string
  title: string
  body: string
  url?: string
}) {
  try {
    const response = await fetch('/api/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, title, body, url })
    })

    if (!response.ok) {
      console.error('[v0] Failed to send push notification')
      return false
    }

    return true
  } catch (error) {
    console.error('[v0] Error sending push notification:', error)
    return false
  }
}
