import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { days, statusFilter } = await req.json()

    if (!days || isNaN(days) || days < 1) {
      return NextResponse.json({ error: 'days должен быть положительным числом' }, { status: 400 })
    }

    const endDate = new Date()
    endDate.setDate(endDate.getDate() + Number(days))

    // По умолчанию обновляем active + imported, но можно передать конкретный список
    const statuses = statusFilter && statusFilter.length > 0
      ? statusFilter
      : ['active', 'imported', 'grace', 'expired']

    const result = await db.subscriber.updateMany({
      where: { status: { in: statuses } },
      data: {
        endDate,
        status: 'active',
        reminderSent7d: false,
        reminderSent3d: false,
        reminderSent1d: false,
        gracePeriodEnd: null,
      }
    })

    await db.activityLog.create({
      data: {
        type: 'system',
        action: `Массовый дедлайн: ${result.count} подписчикам установлена дата окончания ${endDate.toLocaleDateString('ru-RU')} (через ${days} дн.). Напоминания сброшены.`
      }
    })

    return NextResponse.json({
      updated: result.count,
      endDate: endDate.toISOString(),
      message: `${result.count} подписчикам установлена дата окончания ${endDate.toLocaleDateString('ru-RU')}`
    })
  } catch (error) {
    console.error('Bulk deadline error:', error)
    return NextResponse.json({ error: 'Ошибка установки дедлайна' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const [total, byStatus] = await Promise.all([
      db.subscriber.count(),
      db.subscriber.groupBy({ by: ['status'], _count: { id: true } })
    ])
    return NextResponse.json({ total, byStatus })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}
