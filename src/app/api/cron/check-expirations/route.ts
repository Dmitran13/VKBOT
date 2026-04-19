import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendVkMessage, getSetting } from '@/lib/vk'

export async function POST() {
  try {
    const now = new Date()
    const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const in3d = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const in1d = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const graceDaysStr = await getSetting('grace_period_days')
    const graceDaysNum = graceDaysStr ? parseInt(graceDaysStr) : 14

    const autoRemoveStr = await getSetting('auto_remove_expired')
    const shouldRemove = autoRemoveStr === 'true'

    // --- 7-day reminders ---
    const expiring7d = await db.subscriber.findMany({
      where: { status: 'active', endDate: { lte: in7d, gt: in3d }, reminderSent7d: false }
    })
    for (const sub of expiring7d) {
      await db.subscriber.update({ where: { id: sub.id }, data: { reminderSent7d: true } })
      const msg = `⏰ Напоминание: ваша подписка истекает через 7 дней (${sub.endDate.toLocaleDateString('ru-RU')}).\n\nНапишите «старт» для продления.`
      const result = await sendVkMessage(sub.vkId, msg)
      await db.activityLog.create({
        data: {
          type: 'reminder',
          action: `Напоминание 7 дней ${result.ok ? 'отправлено' : 'ошибка: ' + result.error}: ${sub.firstName} ${sub.lastName || ''}`,
          subscriberId: sub.id,
        }
      })
    }

    // --- 3-day reminders ---
    const expiring3d = await db.subscriber.findMany({
      where: { status: 'active', endDate: { lte: in3d, gt: in1d }, reminderSent3d: false }
    })
    for (const sub of expiring3d) {
      await db.subscriber.update({ where: { id: sub.id }, data: { reminderSent3d: true } })
      const msg = `⚠️ Подписка истекает через 3 дня (${sub.endDate.toLocaleDateString('ru-RU')}).\n\nНапишите «старт» для продления.`
      const result = await sendVkMessage(sub.vkId, msg)
      await db.activityLog.create({
        data: {
          type: 'reminder',
          action: `Напоминание 3 дня ${result.ok ? 'отправлено' : 'ошибка: ' + result.error}: ${sub.firstName} ${sub.lastName || ''}`,
          subscriberId: sub.id,
        }
      })
    }

    // --- 1-day reminders ---
    const expiring1d = await db.subscriber.findMany({
      where: { status: 'active', endDate: { lte: in1d, gt: now }, reminderSent1d: false }
    })
    for (const sub of expiring1d) {
      await db.subscriber.update({ where: { id: sub.id }, data: { reminderSent1d: true } })
      const msg = `🚨 Последнее напоминание: подписка истекает ЗАВТРА (${sub.endDate.toLocaleDateString('ru-RU')}).\n\nНапишите «старт» для продления сейчас.`
      const result = await sendVkMessage(sub.vkId, msg)
      await db.activityLog.create({
        data: {
          type: 'reminder',
          action: `Напоминание 1 день ${result.ok ? 'отправлено' : 'ошибка: ' + result.error}: ${sub.firstName} ${sub.lastName || ''}`,
          subscriberId: sub.id,
        }
      })
    }

    // --- Expired → grace period ---
    const expired = await db.subscriber.findMany({
      where: { status: 'active', endDate: { lte: now } }
    })
    for (const sub of expired) {
      const graceEnd = new Date(now.getTime() + graceDaysNum * 24 * 60 * 60 * 1000)
      await db.subscriber.update({ where: { id: sub.id }, data: { status: 'grace', gracePeriodEnd: graceEnd } })
      const msg = `📭 Ваша подписка истекла. Льготный период активен до ${graceEnd.toLocaleDateString('ru-RU')}.\n\nНапишите «старт» для продления и сохранения доступа.`
      await sendVkMessage(sub.vkId, msg)
      await db.activityLog.create({
        data: {
          type: 'subscription',
          action: `Подписка перешла в льготный период до ${graceEnd.toLocaleDateString('ru-RU')}: ${sub.firstName} ${sub.lastName || ''}`,
          subscriberId: sub.id,
        }
      })
    }

    // --- Grace ended → expire / remove ---
    const graceEnded = await db.subscriber.findMany({
      where: { status: 'grace', gracePeriodEnd: { lte: now } }
    })
    for (const sub of graceEnded) {
      if (shouldRemove) {
        await db.activityLog.create({
          data: {
            type: 'subscription',
            action: `Подписка удалена (льготный период истёк): ${sub.firstName} ${sub.lastName || ''} (VK ID: ${sub.vkId})`,
            subscriberId: sub.id,
          }
        })
        await db.subscriber.delete({ where: { id: sub.id } })
      } else {
        await db.subscriber.update({ where: { id: sub.id }, data: { status: 'expired' } })
        const msg = `❌ Льготный период завершён. Ваш доступ к закрытой группе приостановлен.\n\nНапишите «старт» для оформления новой подписки.`
        await sendVkMessage(sub.vkId, msg)
        await db.activityLog.create({
          data: {
            type: 'subscription',
            action: `Подписка истекла: ${sub.firstName} ${sub.lastName || ''}`,
            subscriberId: sub.id,
          }
        })
      }
    }

    await db.activityLog.create({
      data: {
        type: 'system',
        action: `Cron проверка: ${expiring7d.length} напом.(7д) + ${expiring3d.length} (3д) + ${expiring1d.length} (1д) | ${expired.length} → льготный период | ${graceEnded.length} истекло`,
      }
    })

    return NextResponse.json({
      success: true,
      reminders7d: expiring7d.length,
      reminders3d: expiring3d.length,
      reminders1d: expiring1d.length,
      toGrace: expired.length,
      expired: graceEnded.length,
    })
  } catch (error) {
    console.error('Cron check-expirations error:', error)
    return NextResponse.json({ error: 'Ошибка проверки подписок' }, { status: 500 })
  }
}
