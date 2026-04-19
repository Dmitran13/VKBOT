import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Храним прогресс в памяти (между запросами в том же процессе)
let importState: {
  running: boolean
  total: number
  imported: number
  skipped: number
  errors: number
  startedAt: string | null
  finishedAt: string | null
  error: string | null
} = {
  running: false, total: 0, imported: 0, skipped: 0, errors: 0,
  startedAt: null, finishedAt: null, error: null
}

async function fetchVkMembers(token: string, groupId: string, offset: number, count = 1000) {
  const url = `https://api.vk.com/method/groups.getMembers` +
    `?access_token=${token}&group_id=${groupId}&offset=${offset}&count=${count}` +
    `&fields=first_name,last_name,photo_50&v=5.131`
  const res = await fetch(url)
  const data = await res.json()
  if (data.error) throw new Error(`VK ${data.error.error_code}: ${data.error.error_msg}`)
  return data.response // { count, items: [...] }
}

async function runImport(token: string, groupId: string) {
  importState = {
    running: true, total: 0, imported: 0, skipped: 0, errors: 0,
    startedAt: new Date().toISOString(), finishedAt: null, error: null
  }

  try {
    // Получаем общее кол-во
    const first = await fetchVkMembers(token, groupId, 0, 1)
    importState.total = first.count
    console.log(`[VK Import] Total members: ${first.count}`)

    await db.activityLog.create({
      data: { type: 'system', action: `Импорт VK запущен: ${first.count} участников группы` }
    })

    const BATCH = 1000
    const DB_BATCH = 200  // Пишем в БД порциями по 200

    for (let offset = 0; offset < first.count; offset += BATCH) {
      if (!importState.running) break  // Можно прервать

      let members
      try {
        const resp = await fetchVkMembers(token, groupId, offset, BATCH)
        members = resp.items
      } catch (e: any) {
        console.error(`[VK Import] fetch error at offset ${offset}:`, e.message)
        importState.errors++
        // Ждём секунду и продолжаем
        await new Promise(r => setTimeout(r, 1000))
        continue
      }

      // Пишем в БД порциями
      for (let i = 0; i < members.length; i += DB_BATCH) {
        const chunk = members.slice(i, i + DB_BATCH)
        // Far future — admin activates countdown manually via "Установить дедлайн"
        const endDate = new Date('2099-01-01T00:00:00.000Z')

        for (const m of chunk) {
          if (m.deactivated || !m.id) { importState.skipped++; continue }
          try {
            await db.subscriber.upsert({
              where: { vkId: m.id },
              update: {
                firstName: m.first_name || 'VK',
                lastName: m.last_name || null,
                avatarUrl: m.photo_50 || null,
              },
              create: {
                vkId: m.id,
                firstName: m.first_name || 'VK',
                lastName: m.last_name || null,
                avatarUrl: m.photo_50 || null,
                status: 'active',
                endDate,
              }
            })
            importState.imported++
          } catch (e: any) {
            if (e.code === 'P2002') {
              importState.skipped++
            } else {
              importState.errors++
            }
          }
        }
      }

      // Небольшая пауза чтобы не перегружать VK API (3 req/s лимит)
      await new Promise(r => setTimeout(r, 400))

      console.log(`[VK Import] Progress: ${importState.imported + importState.skipped}/${importState.total}`)
    }

    importState.finishedAt = new Date().toISOString()
    importState.running = false

    await db.activityLog.create({
      data: {
        type: 'system',
        action: `Импорт VK завершён: ${importState.imported} добавлено, ${importState.skipped} пропущено, ${importState.errors} ошибок`
      }
    })

    console.log(`[VK Import] Done: imported=${importState.imported} skipped=${importState.skipped} errors=${importState.errors}`)
  } catch (e: any) {
    importState.error = e.message
    importState.running = false
    importState.finishedAt = new Date().toISOString()
    console.error('[VK Import] Fatal error:', e.message)
  }
}

// GET — статус импорта
export async function GET() {
  return NextResponse.json(importState)
}

// POST — запуск импорта
export async function POST(req: NextRequest) {
  if (importState.running) {
    return NextResponse.json({ error: 'Импорт уже запущен', state: importState }, { status: 409 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const stopRequest = body.stop === true

    if (stopRequest) {
      importState.running = false
      return NextResponse.json({ message: 'Импорт остановлен' })
    }

    const [tokenSetting, groupIdSetting] = await Promise.all([
      db.setting.findUnique({ where: { key: 'vk_access_token' } }),
      db.setting.findUnique({ where: { key: 'vk_group_id' } }),
    ])

    if (!tokenSetting?.value) return NextResponse.json({ error: 'vk_access_token не настроен' }, { status: 400 })
    if (!groupIdSetting?.value) return NextResponse.json({ error: 'vk_group_id не настроен' }, { status: 400 })

    // Запускаем в фоне — не ждём завершения
    runImport(tokenSetting.value, groupIdSetting.value).catch(e =>
      console.error('[VK Import] Unhandled:', e)
    )

    return NextResponse.json({ message: 'Импорт запущен', state: importState })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
