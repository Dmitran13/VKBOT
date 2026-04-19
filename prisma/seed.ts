import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.broadcastRecipient.deleteMany()
  await prisma.broadcast.deleteMany()
  await prisma.activityLog.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.subscriber.deleteMany()
  await prisma.template.deleteMany()
  await prisma.setting.deleteMany()
  await prisma.plan.deleteMany()

  // Seed plans
  const plan1m = await prisma.plan.create({
    data: { id: 'plan_1m', name: '1 месяц', days: 30, price: 250, description: 'Подписка на 1 месяц', active: true }
  })
  const plan3m = await prisma.plan.create({
    data: { id: 'plan_3m', name: '3 месяца', days: 90, price: 750, description: 'Подписка на 3 месяца', active: true }
  })
  const plan6m = await prisma.plan.create({
    data: { id: 'plan_6m', name: '6 месяцев', days: 180, price: 1500, description: 'Подписка на 6 месяцев', active: true }
  })
  const plan12m = await prisma.plan.create({
    data: { id: 'plan_12m', name: '12 месяцев', days: 365, price: 2700, description: 'Подписка на 12 месяцев (скидка 10%)', active: true }
  })
  console.log('✅ Plans seeded')

  // Seed templates
  await prisma.template.createMany({
    data: [
      {
        type: 'welcome',
        name: 'Приветственное сообщение',
        description: 'Отправляется при активации подписки',
        content: 'Здравствуйте, {{name}}! 🎉\n\nДобро пожаловать! Ваша подписка на закрытую группу «Мебельная Мастерская» активна.\n\n📋 План: {{plan}}\n📅 Действует до: {{end_date}}\n\nПриятного пользования! Если возникнут вопросы — пишите в личные сообщения группы.',
        variables: 'name,plan,end_date',
        active: true
      },
      {
        type: 'reminder_7d',
        name: 'Напоминание за 7 дней',
        description: 'Напоминание об окончании подписки за 7 дней',
        content: 'Здравствуйте, {{name}}! ⏰\n\nЧерез 7 дней истекает срок вашей подписки.\n\n📋 План: {{plan}}\n📅 Дата окончания: {{end_date}}\n\nЧтобы продлить подписку, перейдите по ссылке:\n{{payment_link}}\n\nСкидка 10% при оплате на 12 месяцев!',
        variables: 'name,plan,end_date,payment_link',
        active: true
      },
      {
        type: 'reminder_3d',
        name: 'Напоминание за 3 дня',
        description: 'Напоминание об окончании подписки за 3 дня',
        content: 'Здравствуйте, {{name}}! ⚠️\n\nОсталось всего 3 дня до окончания подписки!\n\n📋 План: {{plan}}\n📅 Дата окончания: {{end_date}}\n\nПродлите подписку сейчас, чтобы не потерять доступ:\n{{payment_link}}',
        variables: 'name,plan,end_date,payment_link',
        active: true
      },
      {
        type: 'reminder_1d',
        name: 'Напоминание за 1 день',
        description: 'Напоминание об окончании подписки за 1 день',
        content: 'Уважаемый(ая) {{name}}! 🚨\n\nВаша подписка истекает ЗАВТРА!\n\n📋 План: {{plan}}\n📅 Дата окончания: {{end_date}}\n\nНе упустите шанс продлить:\n{{payment_link}}',
        variables: 'name,plan,end_date,payment_link',
        active: true
      },
      {
        type: 'payment_success',
        name: 'Успешная оплата',
        description: 'Отправляется после успешного платежа',
        content: 'Здравствуйте, {{name}}! ✅\n\nОплата успешно проведена!\n\n📋 План: {{plan}}\n💳 Сумма: {{amount}}₽\n📅 Подписка продлена до: {{end_date}}\n\nСпасибо за доверие!',
        variables: 'name,plan,amount,end_date',
        active: true
      },
      {
        type: 'payment_failed',
        name: 'Ошибка оплаты',
        description: 'Отправляется при неудачном платеже',
        content: 'Здравствуйте, {{name}}! ❌\n\nК сожалению, произошла ошибка при обработке платежа.\n\nПожалуйста, попробуйте ещё раз:\n{{payment_link}}\n\nЕсли проблема сохраняется, обратитесь в поддержку группы.',
        variables: 'name,payment_link',
        active: true
      },
      {
        type: 'expired',
        name: 'Подписка истекла',
        description: 'Отправляется при окончании подписки',
        content: 'Здравствуйте, {{name}}! 📋\n\nСрок вашей подписки истёк.\n\nЧтобы возобновить доступ к закрытой группе:\n{{payment_link}}\n\nНадеемся увидеть вас снова!',
        variables: 'name,payment_link',
        active: true
      },
      {
        type: 'grace_reminder',
        name: 'Период отсрочки',
        description: 'Отправляется при входе в льготный период',
        content: 'Здравствуйте, {{name}}! 📅\n\nВаша подписка истекла, но у вас есть льготный период до {{grace_end_date}}.\n\nВы по-прежнему имеете доступ к группе. П продлите подписку:\n{{payment_link}}\n\nПосле окончания льготного периода доступ будет закрыт.',
        variables: 'name,grace_end_date,payment_link',
        active: true
      }
    ]
  })
  console.log('✅ Templates seeded')

  // Seed settings
  await prisma.setting.createMany({
    data: [
      { key: 'vk_access_token', value: '' },
      { key: 'vk_group_id', value: '' },
      { key: 'yookassa_shop_id', value: '' },
      { key: 'yookassa_secret_key', value: '' },
      { key: 'grace_period_days', value: '14' },
      { key: 'reminder_days', value: '7,3,1' },
      { key: 'group_invite_link', value: '' },
      { key: 'bot_vanity_link', value: '' },
      { key: 'auto_remove_expired', value: 'true' },
      { key: 'welcome_message_enabled', value: 'true' }
    ]
  })
  console.log('✅ Settings seeded')
  console.log('🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
