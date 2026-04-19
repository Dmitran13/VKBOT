import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { planId, days } = body

    const subscriber = await db.subscriber.findUnique({ where: { id } })
    if (!subscriber) {
      return NextResponse.json({ error: 'Подписчик не найден' }, { status: 404 })
    }

    let extendDays = days || 30
    if (planId) {
      const plan = await db.plan.findUnique({ where: { id: planId } })
      if (plan) extendDays = plan.days
    }

    const baseDate = subscriber.endDate > new Date() ? subscriber.endDate : new Date()
    const newEndDate = new Date(baseDate)
    newEndDate.setDate(newEndDate.getDate() + extendDays)

    const updated = await db.subscriber.update({
      where: { id },
      data: {
        endDate: newEndDate,
        status: 'active',
        planId: planId || subscriber.planId,
        reminderSent7d: false,
        reminderSent3d: false,
        reminderSent1d: false,
        gracePeriodEnd: null
      },
      include: { plan: true }
    })

    await db.activityLog.create({
      data: {
        type: 'subscription',
        action: `Подписка продлена на ${extendDays} дней (до ${newEndDate.toLocaleDateString('ru-RU')})`,
        subscriberId: id
      }
    })

    return NextResponse.json({ subscriber: updated })
  } catch (error) {
    console.error('Extend subscription error:', error)
    return NextResponse.json({ error: 'Ошибка продления подписки' }, { status: 500 })
  }
}
