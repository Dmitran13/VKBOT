import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Stats
    const [totalReminders, todayReminders, weekReminders, monthReminders] = await Promise.all([
      db.activityLog.count({ where: { type: 'reminder' } }),
      db.activityLog.count({ where: { type: 'reminder', createdAt: { gte: startOfToday } } }),
      db.activityLog.count({ where: { type: 'reminder', createdAt: { gte: startOfWeek } } }),
      db.activityLog.count({ where: { type: 'reminder', createdAt: { gte: startOfMonth } } })
    ])

    // By type
    const sent7d = await db.subscriber.count({ where: { reminderSent7d: true } })
    const sent3d = await db.subscriber.count({ where: { reminderSent3d: true } })
    const sent1d = await db.subscriber.count({ where: { reminderSent1d: true } })

    // Pending reminders
    const pending7d = await db.subscriber.count({
      where: { status: 'active', reminderSent7d: false, endDate: { lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), gt: now } }
    })
    const pending3d = await db.subscriber.count({
      where: { status: 'active', reminderSent3d: false, endDate: { lte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), gt: now } }
    })
    const pending1d = await db.subscriber.count({
      where: { status: 'active', reminderSent1d: false, endDate: { lte: new Date(now.getTime() + 24 * 60 * 60 * 1000), gt: now } }
    })

    // Daily stats for 14 days
    const dailyStats: { date: string; count: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1)
      const count = await db.activityLog.count({
        where: { type: 'reminder', createdAt: { gte: dayStart, lt: dayEnd } }
      })
      dailyStats.push({
        date: dayStart.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
        count
      })
    }

    // Paginated log
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const [logs, total] = await Promise.all([
      db.activityLog.findMany({
        where: { type: 'reminder' },
        include: { subscriber: { select: { firstName: true, lastName: true, vkId: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.activityLog.count({ where: { type: 'reminder' } })
    ])

    // Expired count (removed)
    const expiredCount = await db.subscriber.count({ where: { status: { in: ['expired'] } } })

    return NextResponse.json({
      totalReminders,
      todayReminders,
      weekReminders,
      monthReminders,
      sent7d,
      sent3d,
      sent1d,
      pending7d,
      pending3d,
      pending1d,
      dailyStats,
      logs,
      total: logs.length,
      totalPages: Math.ceil(total / limit),
      expiredCount
    })
  } catch (error) {
    console.error('Reminders API error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки данных о напоминаниях' }, { status: 500 })
  }
}
