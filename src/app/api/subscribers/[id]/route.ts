import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const subscriber = await db.subscriber.findUnique({
      where: { id },
      include: {
        plan: true,
        payments: { orderBy: { createdAt: 'desc' }, take: 10 },
        activities: { orderBy: { createdAt: 'desc' }, take: 10 }
      }
    })
    if (!subscriber) {
      return NextResponse.json({ error: 'Подписчик не найден' }, { status: 404 })
    }
    return NextResponse.json({ subscriber })
  } catch (error) {
    console.error('Get subscriber error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки подписчика' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { firstName, lastName, status, planId, endDate, autoPay } = body

    const subscriber = await db.subscriber.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(status !== undefined && { status }),
        ...(planId !== undefined && { planId: planId || null }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(autoPay !== undefined && { autoPay })
      },
      include: { plan: true }
    })

    await db.activityLog.create({
      data: {
        type: 'subscription',
        action: `Подписчик обновлён: ${subscriber.firstName} ${subscriber.lastName || ''}`,
        subscriberId: subscriber.id
      }
    })

    return NextResponse.json({ subscriber })
  } catch (error) {
    console.error('Update subscriber error:', error)
    return NextResponse.json({ error: 'Ошибка обновления подписчика' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const subscriber = await db.subscriber.findUnique({ where: { id } })
    if (!subscriber) {
      return NextResponse.json({ error: 'Подписчик не найден' }, { status: 404 })
    }

    await db.activityLog.create({
      data: {
        type: 'subscription',
        action: `Подписчик удалён: ${subscriber.firstName} ${subscriber.lastName || ''} (VK ID: ${subscriber.vkId})`,
        subscriberId: id
      }
    })

    await db.subscriber.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete subscriber error:', error)
    return NextResponse.json({ error: 'Ошибка удаления подписчика' }, { status: 500 })
  }
}
