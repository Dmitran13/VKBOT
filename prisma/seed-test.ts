import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function daysFromNow(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

function daysAgo(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

async function main() {
  console.log('🧪 Seeding test data...')

  // Plans already seeded, get them
  const plans = await prisma.plan.findMany()
  const plan1m = plans.find(p => p.id === 'plan_1m')!
  const plan3m = plans.find(p => p.id === 'plan_3m')!
  const plan6m = plans.find(p => p.id === 'plan_6m')!
  const plan12m = plans.find(p => p.id === 'plan_12m')!

  // Test subscribers (25 total)
  const subscribers = [
    // Active subscribers (10)
    { vkId: 100001, firstName: 'Александр', lastName: 'Петров', status: 'active', planId: plan1m.id, startDate: daysAgo(15), endDate: daysFromNow(15) },
    { vkId: 100002, firstName: 'Мария', lastName: 'Иванова', status: 'active', planId: plan3m.id, startDate: daysAgo(45), endDate: daysFromNow(45) },
    { vkId: 100003, firstName: 'Дмитрий', lastName: 'Козлов', status: 'active', planId: plan6m.id, startDate: daysAgo(60), endDate: daysFromNow(120) },
    { vkId: 100004, firstName: 'Елена', lastName: 'Новикова', status: 'active', planId: plan12m.id, startDate: daysAgo(90), endDate: daysFromNow(275) },
    { vkId: 100005, firstName: 'Сергей', lastName: 'Морозов', status: 'active', planId: plan1m.id, startDate: daysAgo(5), endDate: daysFromNow(25) },
    { vkId: 100006, firstName: 'Анна', lastName: 'Волкова', status: 'active', planId: plan3m.id, startDate: daysAgo(20), endDate: daysFromNow(70) },
    { vkId: 100007, firstName: 'Иван', lastName: 'Соколов', status: 'active', planId: plan6m.id, startDate: daysAgo(100), endDate: daysFromNow(80) },
    { vkId: 100008, firstName: 'Ольга', lastName: 'Лебедева', status: 'active', planId: plan1m.id, startDate: daysAgo(25), endDate: daysFromNow(5) },
    { vkId: 100009, firstName: 'Андрей', lastName: 'Кузнецов', status: 'active', planId: plan12m.id, startDate: daysAgo(30), endDate: daysFromNow(335) },
    { vkId: 100010, firstName: 'Наталья', lastName: 'Попова', status: 'active', planId: plan3m.id, startDate: daysAgo(60), endDate: daysFromNow(30) },

    // Expiring soon (5 days, 3 days, 1 day) — status active but end date near
    { vkId: 100011, firstName: 'Виктор', lastName: 'Орлов', status: 'active', planId: plan1m.id, startDate: daysAgo(25), endDate: daysFromNow(5), reminderSent7d: true },
    { vkId: 100012, firstName: 'Татьяна', lastName: 'Киселёва', status: 'active', planId: plan1m.id, startDate: daysAgo(27), endDate: daysFromNow(3), reminderSent7d: true, reminderSent3d: true },
    { vkId: 100013, firstName: 'Павел', lastName: 'Макаров', status: 'active', planId: plan3m.id, startDate: daysAgo(87), endDate: daysFromNow(3), reminderSent7d: true, reminderSent3d: true },

    // Grace period (3)
    { vkId: 100014, firstName: 'Екатерина', lastName: 'Андреева', status: 'grace', planId: plan1m.id, startDate: daysAgo(45), endDate: daysAgo(5), gracePeriodEnd: daysFromNow(9) },
    { vkId: 100015, firstName: 'Максим', lastName: 'Фёдоров', status: 'grace', planId: plan3m.id, startDate: daysAgo(95), endDate: daysAgo(5), gracePeriodEnd: daysFromNow(9) },
    { vkId: 100016, firstName: 'Юлия', lastName: 'Николаева', status: 'grace', planId: plan6m.id, startDate: daysAgo(185), endDate: daysAgo(5), gracePeriodEnd: daysFromNow(9) },

    // Expired (3)
    { vkId: 100017, firstName: 'Роман', lastName: 'Егоров', status: 'expired', planId: plan1m.id, startDate: daysAgo(60), endDate: daysAgo(30), gracePeriodEnd: daysAgo(16) },
    { vkId: 100018, firstName: 'Светлана', lastName: 'Павлова', status: 'expired', planId: plan3m.id, startDate: daysAgo(120), endDate: daysAgo(30), gracePeriodEnd: daysAgo(16) },
    { vkId: 100019, firstName: 'Алексей', lastName: 'Семёнов', status: 'expired', planId: plan12m.id, startDate: daysAgo(400), endDate: daysAgo(35), gracePeriodEnd: daysAgo(21) },

    // Imported (3)
    { vkId: 100020, firstName: 'Ирина', lastName: 'Голубева', status: 'imported', planId: null, startDate: daysAgo(1), endDate: daysAgo(1) },
    { vkId: 100021, firstName: 'Владимир', lastName: 'Виноградов', status: 'imported', planId: null, startDate: daysAgo(1), endDate: daysAgo(1) },
    { vkId: 100022, firstName: 'Галина', lastName: 'Богданова', status: 'imported', planId: null, startDate: daysAgo(1), endDate: daysAgo(1) },

    // More active for variety
    { vkId: 100023, firstName: 'Денис', lastName: 'Воробьёв', status: 'active', planId: plan6m.id, startDate: daysAgo(10), endDate: daysFromNow(170) },
    { vkId: 100024, firstName: 'Людмила', lastName: 'Филиппова', status: 'active', planId: plan1m.id, startDate: daysAgo(20), endDate: daysFromNow(10) },
    { vkId: 100025, firstName: 'Артём', lastName: 'Давыдов', status: 'active', planId: plan3m.id, startDate: daysAgo(50), endDate: daysFromNow(40) },
  ]

  for (const sub of subscribers) {
    await prisma.subscriber.create({ data: sub as any })
  }
  console.log('✅ Subscribers seeded (25)')

  // Seed payments (17)
  const payments = [
    // Active subscriber payments
    { subscriberId: 'placeholder', planId: plan1m.id, amount: 250, method: 'sbp', status: 'success', isRecurrent: false, createdAt: daysAgo(15) },
    { subscriberId: 'placeholder', planId: plan3m.id, amount: 750, method: 'card', status: 'success', isRecurrent: false, createdAt: daysAgo(45) },
    { subscriberId: 'placeholder', planId: plan6m.id, amount: 1500, method: 'sbp', status: 'success', isRecurrent: false, createdAt: daysAgo(60) },
    { subscriberId: 'placeholder', planId: plan12m.id, amount: 2700, method: 'card', status: 'success', isRecurrent: false, createdAt: daysAgo(90) },
    { subscriberId: 'placeholder', planId: plan1m.id, amount: 250, method: 'sbp', status: 'success', isRecurrent: true, createdAt: daysAgo(5) },
    { subscriberId: 'placeholder', planId: plan3m.id, amount: 750, method: 'card', status: 'success', isRecurrent: false, createdAt: daysAgo(20) },
    { subscriberId: 'placeholder', planId: plan6m.id, amount: 1500, method: 'sbp', status: 'success', isRecurrent: false, createdAt: daysAgo(100) },
    { subscriberId: 'placeholder', planId: plan12m.id, amount: 2700, method: 'card', status: 'success', isRecurrent: true, createdAt: daysAgo(30) },

    // Pending payments
    { subscriberId: 'placeholder', planId: plan1m.id, amount: 250, method: 'sbp', status: 'pending', isRecurrent: false, createdAt: daysAgo(2) },
    { subscriberId: 'placeholder', planId: plan3m.id, amount: 750, method: 'card', status: 'pending', isRecurrent: false, createdAt: daysAgo(1) },

    // Failed payments
    { subscriberId: 'placeholder', planId: plan1m.id, amount: 250, method: 'sbp', status: 'failed', isRecurrent: false, createdAt: daysAgo(3) },
    { subscriberId: 'placeholder', planId: plan6m.id, amount: 1500, method: 'card', status: 'failed', isRecurrent: false, createdAt: daysAgo(5) },

    // Older successful payments
    { subscriberId: 'placeholder', planId: plan1m.id, amount: 250, method: 'sbp', status: 'success', isRecurrent: false, createdAt: daysAgo(60) },
    { subscriberId: 'placeholder', planId: plan3m.id, amount: 750, method: 'card', status: 'success', isRecurrent: false, createdAt: daysAgo(150) },
    { subscriberId: 'placeholder', planId: plan1m.id, amount: 250, method: 'sbp', status: 'success', isRecurrent: false, createdAt: daysAgo(200) },

    // Recurring renewal
    { subscriberId: 'placeholder', planId: plan12m.id, amount: 2700, method: 'card', status: 'success', isRecurrent: true, createdAt: daysAgo(400) },
  ]

  // Get actual subscriber IDs
  const allSubs = await prisma.subscriber.findMany({ select: { id: true, vkId: true } })
  const subMap = new Map(allSubs.map(s => [s.vkId, s.id]))

  // Map payments to subscribers
  const mappedPayments = payments.map((p, i) => {
    const vkId = 100001 + (i % 25) // Distribute across subscribers
    const subId = subMap.get(vkId) || subMap.get(100001)!
    return { ...p, subscriberId: subId }
  })

  for (const payment of mappedPayments) {
    await prisma.payment.create({ data: payment })
  }
  console.log('✅ Payments seeded (17)')

  // Seed activity logs
  const activityTypes = [
    { type: 'subscription', action: 'Активация подписки (1 месяц)', subscriberVkId: 100001, createdAt: daysAgo(15) },
    { type: 'subscription', action: 'Активация подписки (3 месяца)', subscriberVkId: 100002, createdAt: daysAgo(45) },
    { type: 'subscription', action: 'Активация подписки (12 месяцев)', subscriberVkId: 100004, createdAt: daysAgo(90) },
    { type: 'payment', action: 'Успешный платёж 250₽ (СБП)', subscriberVkId: 100005, createdAt: daysAgo(5) },
    { type: 'payment', action: 'Успешный платёж 2700₽ (карта)', subscriberVkId: 100009, createdAt: daysAgo(30) },
    { type: 'payment', action: 'Ошибка оплаты 250₽', subscriberVkId: 100012, createdAt: daysAgo(3) },
    { type: 'payment', action: 'Успешный платёж 1500₽ (СБП)', subscriberVkId: 100007, createdAt: daysAgo(100) },
    { type: 'reminder', action: 'Напоминание 7 дней отправлено', subscriberVkId: 100011, createdAt: daysAgo(7) },
    { type: 'reminder', action: 'Напоминание 7 дней отправлено', subscriberVkId: 100012, createdAt: daysAgo(7) },
    { type: 'reminder', action: 'Напоминание 3 дня отправлено', subscriberVkId: 100012, createdAt: daysAgo(3) },
    { type: 'reminder', action: 'Напоминание 3 дня отправлено', subscriberVkId: 100013, createdAt: daysAgo(3) },
    { type: 'subscription', action: 'Подписка перешла в льготный период', subscriberVkId: 100014, createdAt: daysAgo(5) },
    { type: 'subscription', action: 'Подписка перешла в льготный период', subscriberVkId: 100015, createdAt: daysAgo(5) },
    { type: 'system', action: 'Автоматическая проверка подписок выполнена', subscriberVkId: null, createdAt: daysAgo(1) },
    { type: 'system', action: 'Автоматическая проверка подписок выполнена', subscriberVkId: null, createdAt: daysAgo(2) },
    { type: 'broadcast', action: 'Рассылка отправлена (45 получателей)', subscriberVkId: null, createdAt: daysAgo(10) },
    { type: 'subscription', action: 'Подписка истекла (удалена)', subscriberVkId: 100017, createdAt: daysAgo(30) },
    { type: 'import', action: 'Импорт подписчиков (3 записи)', subscriberVkId: null, createdAt: daysAgo(1) },
    { type: 'payment', action: 'Успешный платёж 750₽ (карта)', subscriberVkId: 100006, createdAt: daysAgo(20) },
    { type: 'subscription', action: 'Продление подписки (6 месяцев)', subscriberVkId: 100003, createdAt: daysAgo(60) },
  ]

  for (const activity of activityTypes) {
    const subscriberId = activity.subscriberVkId ? subMap.get(activity.subscriberVkId) || null : null
    await prisma.activityLog.create({
      data: {
        type: activity.type,
        action: activity.action,
        subscriberId,
        createdAt: activity.createdAt
      }
    })
  }
  console.log('✅ Activity logs seeded (20)')

  // Seed a test broadcast
  const broadcast = await prisma.broadcast.create({
    data: {
      message: 'Уважаемые подписчики! 📢\n\nМы обновили каталог мебели. Заходите посмотреть новинки!\n\nС уважением,\nМебельная Мастерская',
      target: 'active',
      totalSent: 15,
      delivered: 14,
      failed: 1,
      status: 'completed',
      sentAt: daysAgo(10),
      completedAt: daysAgo(10)
    }
  })

  // Add broadcast recipients
  const activeSubs = await prisma.subscriber.findMany({ where: { status: 'active' }, select: { id: true } })
  for (let i = 0; i < Math.min(activeSubs.length, 15); i++) {
    await prisma.broadcastRecipient.create({
      data: {
        broadcastId: broadcast.id,
        subscriberId: activeSubs[i].id,
        status: i === 5 ? 'failed' : 'delivered',
        error: i === 5 ? 'VK API: User blocked messages' : null,
        sentAt: daysAgo(10)
      }
    })
  }
  console.log('✅ Broadcast seeded')

  console.log('🎉 Test seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
