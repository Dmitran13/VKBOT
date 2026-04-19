import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const settings = await db.setting.findMany({ orderBy: { key: 'asc' } })
    const settingsMap: Record<string, string> = {}
    for (const s of settings) {
      settingsMap[s.key] = s.value
    }
    return NextResponse.json({ settings: settingsMap })
  } catch (error) {
    console.error('Settings get error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки настроек' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { key, value } = body

    if (!key) {
      return NextResponse.json({ error: 'key обязателен' }, { status: 400 })
    }

    const setting = await db.setting.upsert({
      where: { key },
      update: { value: value || '' },
      create: { key, value: value || '' }
    })

    return NextResponse.json({ setting })
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json({ error: 'Ошибка обновления настроек' }, { status: 500 })
  }
}
