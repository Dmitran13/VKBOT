import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const planId = searchParams.get('planId')
  const vkId = searchParams.get('vkId')

  if (!planId || !vkId) {
    return new NextResponse('Не указан planId или vkId', { status: 400 })
  }

  try {
    const [plan, shopIdSetting, secretKeySetting] = await Promise.all([
      db.plan.findUnique({ where: { id: planId } }),
      db.setting.findUnique({ where: { key: 'yookassa_shop_id' } }),
      db.setting.findUnique({ where: { key: 'yookassa_secret_key' } }),
    ])

    if (!plan) return new NextResponse('Тариф не найден', { status: 404 })
    if (!shopIdSetting?.value || !secretKeySetting?.value) {
      return new NextResponse('ЮKassa не настроена', { status: 503 })
    }

    // Find or create subscriber record
    let subscriber = await db.subscriber.findUnique({ where: { vkId: Number(vkId) } })
    if (!subscriber) {
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + plan.days)
      subscriber = await db.subscriber.create({
        data: {
          vkId: Number(vkId),
          firstName: 'VK',
          lastName: String(vkId),
          planId: plan.id,
          endDate,
          status: 'pending',
        }
      })
    }

    const auth = Buffer.from(`${shopIdSetting.value}:${secretKeySetting.value}`).toString('base64')
    const returnUrl = `process.env.APP_URL || 'http://localhost:3000'/api/payments/success?vkId=${vkId}&planId=${planId}`

    const paymentRes = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Idempotence-Key': randomUUID(),
      },
      body: JSON.stringify({
        amount: { value: plan.price.toFixed(2), currency: 'RUB' },
        confirmation: { type: 'redirect', return_url: returnUrl },
        capture: true,
        description: `Подписка: ${plan.name}`,
        metadata: { subscriberId: subscriber.id, planId: plan.id, vkId }
      })
    })

    const payment = await paymentRes.json()
    if (payment.type === 'error') {
      console.error('YooKassa create payment error:', payment)
      return new NextResponse(`Ошибка оплаты: ${payment.description}`, { status: 500 })
    }

    // Save pending payment to DB
    await db.payment.create({
      data: {
        subscriberId: subscriber.id,
        planId: plan.id,
        amount: plan.price,
        method: 'yookassa',
        yookassaPaymentId: payment.id,
        yookassaConfirmation: payment.confirmation?.confirmation_url || null,
        status: 'pending',
      }
    })

    await db.activityLog.create({
      data: {
        type: 'payment',
        action: `Создан платёж YooKassa: ${plan.name} (${plan.price} руб.), VK ID: ${vkId}`,
        subscriberId: subscriber.id,
      }
    })

    const confirmUrl = payment.confirmation?.confirmation_url
    if (confirmUrl) {
      return NextResponse.redirect(confirmUrl)
    }
    return new NextResponse('Не удалось создать ссылку на оплату', { status: 500 })

  } catch (error) {
    console.error('Payment create error:', error)
    return new NextResponse('Ошибка сервера', { status: 500 })
  }
}
