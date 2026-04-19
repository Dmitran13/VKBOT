import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const templates = await db.template.findMany({ orderBy: { type: 'asc' } })
    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Templates list error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки шаблонов' }, { status: 500 })
  }
}
