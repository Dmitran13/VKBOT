import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendVkMessage, getSetting } from '@/lib/vk'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (body.type !== 'notification') {
      return NextResponse.json({ ok: true })
    }

    const event: string = body.event
    const obj = body.object

    if (event === 'payment.succeeded') {
      const payment = await db.payment.findUnique({
        where: { yookassaPaymentId: obj.id },
        include: { subscriber: true, plan: true }
      })

      if (!payment) {
        console.error('Webhook: payment not found in DB:', obj.id)
        return NextResponse.json({ ok: true })
      }

      const plan = payment.plan
      if (!plan) return NextResponse.json({ ok: true })

      const baseDate = payment.subscriber.endDate > new Date() ? payment.subscriber.endDate : new Date()
      const newEndDate = new Date(baseDate)
      newEndDate.setDate(newEndDate.getDate() + plan.days)

      await Promise.all([
        db.payment.update({ where: { id: payment.id }, data: { status: 'success' } }),
        db.subscriber.update({
          where: { id: payment.subscriberId },
          data: {
            status: 'active',
            planId: plan.id,
            endDate: newEndDate,
            reminderSent7d: false,
            reminderSent3d: false,
            reminderSent1d: false,
            gracePeriodEnd: null,
          }
        }),
        db.activityLog.create({
          data: {
            type: 'payment',
            action: `Оплата подтверждена: ${plan.name} (${payment.amount} руб.), подписка до ${newEndDate.toLocaleDateString('ru-RU')}`,
            subscriberId: payment.subscriberId,
          }
        })
      ])

      // Send welcome / confirmation message
      const welcomeEnabled = await getSetting('welcome_message_enabled')
      if (welcomeEnabled === 'true') {
        const inviteLink = await getSetting('group_invite_link')
        const msg = [
          '✅ Оплата прошла успешно!',
          '',
          `📦 Тариф: ${plan.name}`,
          `📅 Подписка активна до: ${newEndDate.toLocaleDateString('ru-RU')}`,
          inviteLink ? `\n🔗 Ссылка для вступления в группу:\n${inviteLink}` : '',
        ].filter(l => l !== undefined).join('\n')

        await sendVkMessage(payment.subscriber.vkId, msg)
      }
    }

    if (event === 'payment.canceled') {
      await db.payment.updateMany({
        where: { yookassaPaymentId: obj.id },
        data: { status: 'cancelled' }
      })
      console.log('Payment cancelled:', obj.id)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Payment webhook error:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
