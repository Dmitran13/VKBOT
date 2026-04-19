import { db } from '@/lib/db'

export async function sendVkMessage(userId: number, message: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const token = await db.setting.findUnique({ where: { key: 'vk_access_token' } })
    if (!token?.value) return { ok: false, error: 'No VK token configured' }

    const params = new URLSearchParams({
      access_token: token.value,
      v: '5.131',
      user_id: String(userId),
      message,
      random_id: String(Date.now()),
    })

    const res = await fetch('https://api.vk.com/method/messages.send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })
    const data = await res.json()
    if (data.error) {
      console.error('VK API error:', data.error)
      return { ok: false, error: `VK ${data.error.error_code}: ${data.error.error_msg}` }
    }
    return { ok: true }
  } catch (e) {
    console.error('VK send error:', e)
    return { ok: false, error: String(e) }
  }
}

export async function getSetting(key: string): Promise<string | null> {
  const s = await db.setting.findUnique({ where: { key } })
  return s?.value || null
}

export async function getTemplate(type: string): Promise<string | null> {
  const t = await db.template.findUnique({ where: { type } })
  return t?.active ? t.content : null
}

export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '')
}
