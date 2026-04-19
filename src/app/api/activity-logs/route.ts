import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') || ''

    const where: any = {}
    if (type) where.type = type

    const [logs, total, groupByType] = await Promise.all([
      db.activityLog.findMany({
        where,
        include: { subscriber: { select: { firstName: true, lastName: true, vkId: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.activityLog.count({ where }),
      db.activityLog.groupBy({
        by: ['type'],
        _count: { id: true }
      })
    ])

    return NextResponse.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      groupByType: groupByType.map(g => ({ type: g.type, count: g._count.id }))
    })
  } catch (error) {
    console.error('Activity logs error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки логов' }, { status: 500 })
  }
}
