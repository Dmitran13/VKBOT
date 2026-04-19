import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const plans = await db.plan.findMany({
      orderBy: { days: 'asc' },
      include: {
        _count: { select: { subscribers: true } }
      }
    })
    return NextResponse.json({ plans })
  } catch (error) {
    console.error('Plans list error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки тарифов' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, days, price, description, active } = body

    if (!name || !days || !price) {
      return NextResponse.json({ error: 'name, days и price обязательны' }, { status: 400 })
    }

    const plan = await db.plan.create({
      data: { name, days: Number(days), price: Number(price), description: description || null, active: active !== false }
    })

    return NextResponse.json({ plan }, { status: 201 })
  } catch (error) {
    console.error('Create plan error:', error)
    return NextResponse.json({ error: 'Ошибка создания тарифа' }, { status: 500 })
  }
}
