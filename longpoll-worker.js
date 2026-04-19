/**
 * VK Bots Long Poll Worker
 * Docs: https://dev.vk.com/ru/api/bots-long-poll/getting-started
 */

const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

// ─── helpers ─────────────────────────────────────────────────────────────────

async function getSetting(key) {
  const s = await db.setting.findUnique({ where: { key } })
  return s?.value || null
}

async function sendVkMessage(userId, message) {
  const token = await getSetting('vk_access_token')
  if (!token) { console.error('[VK] No access token'); return { ok: false } }

  const params = new URLSearchParams({
    access_token: token,
    v: '5.131',
    user_id: String(userId),
    message,
    random_id: String(Date.now()),
  })

  try {
    const res = await fetch('https://api.vk.com/method/messages.send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })
    const data = await res.json()
    if (data.error) {
      console.error(`[VK] send error ${data.error.error_code}: ${data.error.error_msg}`)
      return { ok: false, code: data.error.error_code }
    }
    console.log(`[VK] Sent to ${userId}: ok`)
    return { ok: true }
  } catch (e) {
    console.error('[VK] fetch error:', e.message)
    return { ok: false }
  }
}

// ─── message handler ──────────────────────────────────────────────────────────

async function handleMessage(fromId, text) {
  const t = (text || '').toLowerCase().trim()
  console.log(`[MSG] from=${fromId} text="${t}"`)

  const startCmds  = ['старт', 'start', 'подписка', 'начать', '/start']
  const helpCmds   = ['помощь', 'help', '/help']
  const statusCmds = ['моя подписка', 'статус', 'статус подписки']

  if (startCmds.includes(t)) {
    const plans = await db.plan.findMany({ where: { active: true }, orderBy: { price: 'asc' } })
    let msg = '👋 Привет! Выберите тариф подписки:\n\n'
    plans.forEach((p, i) => { msg += `${i + 1}. ${p.name} — ${p.price} руб.\n` })
    msg += `\nНапишите номер тарифа (1–${plans.length}) для оформления`
    await sendVkMessage(fromId, msg)

  } else if (helpCmds.includes(t)) {
    await sendVkMessage(fromId, '📋 Команды:\n\nстарт — список тарифов\nстатус — статус подписки\nпомощь — это сообщение')

  } else if (statusCmds.includes(t)) {
    const sub = await db.subscriber.findFirst({ where: { vkId: fromId }, include: { plan: true } })
    if (sub && sub.status === 'active') {
      await sendVkMessage(fromId, `✅ Ваша подписка активна\n\n📦 Тариф: ${sub.plan?.name || '—'}\n📅 Действует до: ${sub.endDate.toLocaleDateString('ru-RU')}`)
    } else if (sub && sub.status === 'grace') {
      await sendVkMessage(fromId, `⚠️ Подписка в льготном периоде\n\nИстекает: ${sub.gracePeriodEnd?.toLocaleDateString('ru-RU') || '—'}\n\nНапишите «старт» для продления`)
    } else {
      await sendVkMessage(fromId, '❌ У вас нет активной подписки.\n\nНапишите «старт» для оформления.')
    }

  } else if (/^[1-9]$/.test(t)) {
    const idx = parseInt(t) - 1
    const plans = await db.plan.findMany({ where: { active: true }, orderBy: { price: 'asc' } })
    const plan = plans[idx]
    if (plan) {
      const link = `process.env.APP_URL || 'http://localhost:3000'/api/payments/create?planId=${plan.id}&vkId=${fromId}`
      await sendVkMessage(fromId, `💳 Оплата тарифа «${plan.name}» — ${plan.price} руб.\n\nНажмите для оплаты:\n${link}`)
    } else {
      await sendVkMessage(fromId, `Тариф #${t} не найден. Напишите «старт» для просмотра тарифов.`)
    }

  } else {
    // Если активный подписчик — не мешаем общению с админом
    const sub = await db.subscriber.findFirst({ where: { vkId: fromId } })
    if (!sub || (sub.status !== 'active' && sub.status !== 'grace')) {
      await sendVkMessage(fromId, 'Напишите «старт» для оформления подписки или «помощь» для списка команд.')
    }
  }

  await db.activityLog.create({
    data: { type: 'message', action: `Сообщение от VK ID ${fromId}: "${text.slice(0, 100)}"` }
  }).catch(() => {})
}

// ─── event dispatcher ─────────────────────────────────────────────────────────

async function processUpdate(update) {
  const type = update.type
  const obj  = update.object

  if (type === 'message_new') {
    const msg = obj?.message || obj
    if (msg?.from_id > 0) {   // from_id < 0 = сообщение от группы/бота
      await handleMessage(msg.from_id, msg.text || '')
    }
  }
}

// ─── long poll ────────────────────────────────────────────────────────────────

async function getLongPollServer(token, groupId) {
  const url = `https://api.vk.com/method/groups.getLongPollServer` +
    `?access_token=${token}&group_id=${groupId}&v=5.131`
  const res  = await fetch(url)
  const data = await res.json()
  if (data.error) throw new Error(`getLongPollServer error ${data.error.error_code}: ${data.error.error_msg}`)
  return data.response  // { server, key, ts }
}

async function startLongPoll() {
  const token   = await getSetting('vk_access_token')
  const groupId = await getSetting('vk_group_id')

  if (!token || !groupId) {
    console.error('[LP] vk_access_token or vk_group_id not set — retry in 30s')
    setTimeout(startLongPoll, 30_000)
    return
  }

  console.log(`[LP] Connecting to Long Poll for group ${groupId}...`)

  let server, key, ts
  try {
    ;({ server, key, ts } = await getLongPollServer(token, groupId))
    console.log(`[LP] Connected. server=${server} ts=${ts}`)
  } catch (e) {
    console.error('[LP] Failed to get server:', e.message, '— retry in 15s')
    setTimeout(startLongPoll, 15_000)
    return
  }

  let pollCount = 0
  const startTime = Date.now()

  async function loop() {
    try {
      const url = `${server}?act=a_check&key=${encodeURIComponent(key)}&ts=${ts}&wait=25&v=3`
      const res  = await fetch(url, { signal: AbortSignal.timeout(35_000) })
      const data = await res.json()

      if (data.failed) {
        // failed=1: ts устарел — берём новый ts из ответа, ключ сохраняем
        if (data.failed === 1) {
          console.warn(`[LP] failed=1 (ts outdated) — new ts=${data.ts}`)
          ts = data.ts
        }
        // failed=2: ключ истёк — получаем новый ключ, ts НЕ меняем
        else if (data.failed === 2) {
          console.warn('[LP] failed=2 (key expired) — getting new key...')
          try {
            const resp = await getLongPollServer(token, groupId)
            server = resp.server
            key    = resp.key
            // ts сохраняем текущий — не теряем события
            console.log('[LP] New key obtained')
          } catch (e) {
            console.error('[LP] Failed to renew key:', e.message, '— retry in 10s')
            await new Promise(r => setTimeout(r, 10_000))
          }
        }
        // failed=3 или другое — полный перезапуск
        else {
          console.warn(`[LP] failed=${data.failed} — full restart in 5s`)
          await new Promise(r => setTimeout(r, 5_000))
          startLongPoll()
          return
        }
      } else {
        ts = data.ts
        const updates = data.updates || []

        if (updates.length > 0) {
          console.log(`[LP] ${updates.length} event(s) received`)
          for (const update of updates) {
            processUpdate(update).catch(e => console.error('[LP] processUpdate error:', e.message))
          }
        }

        // Лог каждые 10 циклов (~4 мин)
        if (pollCount % 10 === 0) console.log(`[LP] poll #${pollCount} ts=${ts} (alive)`)

        // Heartbeat каждые 50 циклов (~20 мин)
        pollCount++
        if (pollCount % 50 === 0) {
          const upMin = Math.round((Date.now() - startTime) / 60000)
          console.log(`[LP] Heartbeat: ${pollCount} polls, uptime ${upMin}min, ts=${ts}`)
        }
      }
    } catch (e) {
      console.error('[LP] Poll error:', e.message, '— retry in 5s')
      await new Promise(r => setTimeout(r, 5_000))
    }

    setImmediate(loop)
  }

  loop()
}

// ─── graceful shutdown ────────────────────────────────────────────────────────

process.on('SIGINT',  async () => { await db.$disconnect(); process.exit(0) })
process.on('SIGTERM', async () => { await db.$disconnect(); process.exit(0) })

// ─── start ────────────────────────────────────────────────────────────────────

console.log('[LP] VK Long Poll Worker starting...')
startLongPoll()
