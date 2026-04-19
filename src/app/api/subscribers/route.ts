import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    const where: any = {}
    if (search) {
      const orConditions: any[] = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ]
      // Also try capitalized version for Cyrillic (SQLite LIKE is case-insensitive only for ASCII)
      const capitalized = search.charAt(0).toUpperCase() + search.slice(1).toLowerCase()
      if (capitalized !== search) {
        orConditions.push({ firstName: { contains: capitalized } })
        orConditions.push({ lastName: { contains: capitalized } })
      }
      const lowerSearch = search.toLowerCase()
      if (lowerSearch !== search && lowerSearch !== capitalized) {
        orConditions.push({ firstName: { contains: lowerSearch } })
        orConditions.push({ lastName: { contains: lowerSearch } })
      }
      if (!isNaN(Number(search)) && search.trim() !== '') {
        orConditions.push({ vkId: { equals: Number(search) } })
      }
      where.OR = orConditions
    }
    if (status) {
      where.status = status
    }

    const [subscribers, total] = await Promise.all([
      db.subscriber.findMany({
        where,
        include: { plan: { select: { name: true, days: true, price: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.subscriber.count({ where })
    ])

    return NextResponse.json({ subscribers, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Subscribers list error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки подписчиков' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { vkId, firstName, lastName, avatarUrl, planId, days } = body

    if (!vkId || !firstName) {
      return NextResponse.json({ error: 'vkId и firstName обязательны' }, { status: 400 })
    }

    let endDate = new Date()
    if (days) {
      endDate.setDate(endDate.getDate() + days)
    } else if (planId) {
      const plan = await db.plan.findUnique({ where: { id: planId } })
      if (plan) endDate.setDate(endDate.getDate() + plan.days)
    } else {
      endDate.setDate(endDate.getDate() + 30)
    }

    const subscriber = await db.subscriber.create({
      data: {
        vkId: Number(vkId),
        firstName,
        lastName: lastName || null,
        avatarUrl: avatarUrl || null,
        planId: planId || null,
        startDate: new Date(),
        endDate,
        status: 'active'
      },
      include: { plan: { select: { name: true, days: true, price: true } } }
    })

    await db.activityLog.create({
      data: {
        type: 'subscription',
        action: `Новый подписчик добавлен: ${firstName} ${lastName || ''} (VK ID: ${vkId})`,
        subscriberId: subscriber.id
      }
    })

    return NextResponse.json({ subscriber }, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Подписчик с таким VK ID уже существует' }, { status: 409 })
    }
    console.error('Create subscriber error:', error)
    return NextResponse.json({ error: 'Ошибка создания подписчика' }, { status: 500 })
  }
}
