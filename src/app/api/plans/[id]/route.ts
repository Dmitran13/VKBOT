import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const plan = await db.plan.findUnique({
      where: { id },
      include: { _count: { select: { subscribers: true, payments: true } } }
    })
    if (!plan) {
      return NextResponse.json({ error: 'Тариф не найден' }, { status: 404 })
    }
    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Get plan error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки тарифа' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, days, price, description, active } = body

    const plan = await db.plan.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(days !== undefined && { days: Number(days) }),
        ...(price !== undefined && { price: Number(price) }),
        ...(description !== undefined && { description }),
        ...(active !== undefined && { active })
      }
    })
    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Update plan error:', error)
    return NextResponse.json({ error: 'Ошибка обновления тарифа' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const plan = await db.plan.findUnique({ where: { id } })
    if (!plan) {
      return NextResponse.json({ error: 'Тариф не найден' }, { status: 404 })
    }

    // Unlink subscribers from this plan
    await db.subscriber.updateMany({ where: { planId: id }, data: { planId: null } })

    await db.plan.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete plan error:', error)
    return NextResponse.json({ error: 'Ошибка удаления тарифа' }, { status: 500 })
  }
}
