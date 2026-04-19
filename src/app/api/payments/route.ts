import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''

    const where: any = {}
    if (status) where.status = status
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z')
    }

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        include: {
          subscriber: { select: { firstName: true, lastName: true, vkId: true } },
          plan: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.payment.count({ where })
    ])

    const stats = await db.payment.groupBy({
      by: ['status'],
      _sum: { amount: true },
      _count: { id: true }
    })

    return NextResponse.json({
      payments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: stats.map(s => ({
        status: s.status,
        amount: s._sum.amount || 0,
        count: s._count.id
      }))
    })
  } catch (error) {
    console.error('Payments list error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки платежей' }, { status: 500 })
  }
}
