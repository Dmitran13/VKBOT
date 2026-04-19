import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [
      activeCount,
      newThisMonth,
      expiringCount,
      totalSubscribers,
      monthlyRevenueAgg,
      totalRevenueAgg,
      recentActivity,
      allPayments,
      planStats
    ] = await Promise.all([
      db.subscriber.count({ where: { status: 'active' } }),
      db.subscriber.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      db.subscriber.count({
        where: {
          status: { in: ['active', 'expiring'] },
          endDate: { lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), gt: now }
        }
      }),
      db.subscriber.count({ where: { status: { in: ['active', 'grace', 'expiring'] } } }),
      db.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'success', createdAt: { gte: thirtyDaysAgo } }
      }),
      db.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'success' }
      }),
      db.activityLog.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { subscriber: { select: { firstName: true, lastName: true, vkId: true } } }
      }),
      db.payment.findMany({
        where: { status: 'success' },
        select: { amount: true, createdAt: true }
      }),
      db.subscriber.groupBy({
        by: ['planId'],
        where: { status: { in: ['active', 'grace'] }, planId: { not: null } },
        _count: { id: true }
      })
    ])

    // Revenue data for 12 months
    const revenueData: { month: string; revenue: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999)
      const monthLabel = monthStart.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' })
      const monthRevenue = allPayments
        .filter(p => p.createdAt >= monthStart && p.createdAt <= monthEnd)
        .reduce((sum, p) => sum + p.amount, 0)
      revenueData.push({ month: monthLabel, revenue: monthRevenue })
    }

    // Plan stats
    const planStatsWithNames = await Promise.all(
      planStats.map(async (ps) => {
        if (!ps.planId) return null
        const plan = await db.plan.findUnique({ where: { id: ps.planId } })
        return { planName: plan?.name || 'Неизвестен', count: ps._count.id }
      })
    )

    return NextResponse.json({
      activeCount,
      newThisMonth,
      monthlyRevenue: monthlyRevenueAgg._sum.amount || 0,
      totalRevenue: totalRevenueAgg._sum.amount || 0,
      expiringCount,
      totalSubscriptions: totalSubscribers,
      recentActivity,
      revenueData,
      planStats: planStatsWithNames.filter(Boolean)
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки данных' }, { status: 500 })
  }
}
