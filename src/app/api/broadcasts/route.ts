import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendVkMessage } from '@/lib/vk'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const [broadcasts, total] = await Promise.all([
      db.broadcast.findMany({ orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      db.broadcast.count()
    ])

    return NextResponse.json({ broadcasts, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Broadcasts list error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки рассылок' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, target, customVkIds } = body

    if (!message || !target) {
      return NextResponse.json({ error: 'message и target обязательны' }, { status: 400 })
    }

    // Fetch target subscribers
    let subscribers
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    switch (target) {
      case 'active':
        subscribers = await db.subscriber.findMany({ where: { status: 'active' } })
        break
      case 'expiring':
        subscribers = await db.subscriber.findMany({
          where: { status: 'active', endDate: { lte: sevenDaysFromNow } }
        })
        break
      case 'grace':
        subscribers = await db.subscriber.findMany({ where: { status: 'grace' } })
        break
      case 'custom':
        if (!customVkIds) return NextResponse.json({ error: 'customVkIds обязателен' }, { status: 400 })
        const ids = customVkIds.split(',').map((id: string) => parseInt(id.trim())).filter(Boolean)
        subscribers = await db.subscriber.findMany({ where: { vkId: { in: ids } } })
        break
      default:
        return NextResponse.json({ error: 'Неизвестный тип цели' }, { status: 400 })
    }

    const broadcast = await db.broadcast.create({
      data: {
        message,
        target,
        customVkIds: customVkIds || null,
        totalSent: subscribers.length,
        status: 'sent',
        sentAt: new Date(),
      }
    })

    // Actually send VK messages
    let delivered = 0
    let failed = 0
    for (const sub of subscribers) {
      const result = await sendVkMessage(sub.vkId, message)
      const status = result.ok ? 'delivered' : 'failed'
      if (result.ok) delivered++; else failed++

      await db.broadcastRecipient.create({
        data: {
          broadcastId: broadcast.id,
          subscriberId: sub.id,
          status,
          error: result.error || null,
          sentAt: new Date(),
        }
      })
    }

    await db.broadcast.update({
      where: { id: broadcast.id },
      data: { delivered, failed, status: 'completed', completedAt: new Date() }
    })

    await db.activityLog.create({
      data: {
        type: 'broadcast',
        action: `Рассылка завершена: ${delivered} доставлено, ${failed} ошибок (цель: ${target})`
      }
    })

    return NextResponse.json({ broadcast: { ...broadcast, delivered, failed } }, { status: 201 })
  } catch (error) {
    console.error('Create broadcast error:', error)
    return NextResponse.json({ error: 'Ошибка отправки рассылки' }, { status: 500 })
  }
}
