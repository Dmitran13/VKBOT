const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function restoreSettings() {
  // === Настройки VK ===
  console.log('Restoring VK settings...');
  const settings = [
    { key: 'vk_access_token', value: 'YOUR_VK_ACCESS_TOKEN' },
    { key: 'vk_group_id', value: 'YOUR_VK_GROUP_ID' },
    { key: 'vk_confirmation_code', value: 'YOUR_VK_CONFIRMATION_CODE' },
    { key: 'vk_callback_secret', value: 'YOUR_VK_CALLBACK_SECRET' },
    { key: 'yookassa_shop_id', value: 'YOUR_YOOKASSA_SHOP_ID' },
    { key: 'yookassa_secret_key', value: 'YOUR_YOOKASSA_SECRET_KEY' },
    { key: 'grace_period_days', value: '14' },
    { key: 'reminder_days', value: '7,3,1' },
    { key: 'auto_remove_expired', value: 'true' },
    { key: 'welcome_message_enabled', value: 'true' }
  ];
  for (const s of settings) {
    await prisma.setting.upsert({ where: { key: s.key }, update: { value: s.value }, create: { key: s.key, value: s.value } });
    console.log('  OK ' + s.key);
  }
  console.log('VK settings restored!');

  // === Тарифы ===
  console.log('Restoring plans...');
  const plans = [
    { name: '1 месяц', days: 30, price: 250, description: 'Пробный тариф' },
    { name: '3 месяца', days: 90, price: 750, description: 'Выгоднее на 3 месяца' },
    { name: '6 месяцев', days: 180, price: 1500, description: 'Полгода доступа' },
    { name: '12 месяцев', days: 365, price: 2700, description: 'Лучшее предложение — скидка!' }
  ];
  for (const p of plans) {
    const existing = await prisma.plan.findFirst({ where: { name: p.name } });
    if (!existing) {
      await prisma.plan.create({ data: p });
      console.log('  CREATED ' + p.name + ' — ' + p.price + 'р.');
    } else {
      console.log('  SKIP ' + p.name + ' (already exists)');
    }
  }
  console.log('Plans restored!');

  // === Шаблоны ===
  console.log('Restoring templates...');
  const templates = [
    { type: 'welcome', name: 'Приветственное сообщение', description: 'При активации подписки', content: 'Здравствуйте, {{name}}! Добро пожаловать! Ваша подписка на закрытую группу активна. План: {{plan}}. Действует до: {{end_date}}. Приятного пользования!', variables: 'name,plan,end_date', active: true },
    { type: 'reminder_7d', name: 'Напоминание за 7 дней', description: 'За 7 дней', content: 'Здравствуйте, {{name}}! Через 7 дней истекает подписка. План: {{plan}}, до: {{end_date}}. Продлите: {{payment_link}}', variables: 'name,plan,end_date,payment_link', active: true },
    { type: 'reminder_3d', name: 'Напоминание за 3 дня', description: 'За 3 дня', content: 'Здравствуйте, {{name}}! Осталось 3 дня! План: {{plan}}, до: {{end_date}}. Продлите: {{payment_link}}', variables: 'name,plan,end_date,payment_link', active: true },
    { type: 'reminder_1d', name: 'Напоминание за 1 день', description: 'За 1 день', content: 'Уважаемый(ая) {{name}}! Подписка истекает ЗАВТРА! План: {{plan}}, до: {{end_date}}. Продлите: {{payment_link}}', variables: 'name,plan,end_date,payment_link', active: true },
    { type: 'payment_success', name: 'Успешная оплата', description: 'После платежа', content: 'Здравствуйте, {{name}}! Оплата проведена! План: {{plan}}, сумма: {{amount}} руб., до: {{end_date}}. Спасибо!', variables: 'name,plan,amount,end_date', active: true },
    { type: 'payment_failed', name: 'Ошибка оплаты', description: 'При ошибке', content: 'Здравствуйте, {{name}}! Ошибка платежа. Попробуйте: {{payment_link}}', variables: 'name,payment_link', active: true },
    { type: 'expired', name: 'Подписка истекла', description: 'При окончании', content: 'Здравствуйте, {{name}}! Подписка истекла. Возобновите: {{payment_link}}', variables: 'name,payment_link', active: true },
    { type: 'grace_reminder', name: 'Период отсрочки', description: 'Льготный период', content: 'Здравствуйте, {{name}}! Льготный период до {{grace_end_date}}. Продлите: {{payment_link}}', variables: 'name,grace_end_date,payment_link', active: true }
  ];
  for (const t of templates) {
    const existing = await prisma.template.findUnique({ where: { type: t.type } });
    if (!existing) {
      await prisma.template.create({ data: t });
      console.log('  CREATED ' + t.name);
    } else {
      console.log('  SKIP ' + t.name + ' (already exists)');
    }
  }
  console.log('Templates restored!');
}

restoreSettings().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
