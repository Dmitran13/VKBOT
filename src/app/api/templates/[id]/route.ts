import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { content, name, description, active } = body

    const template = await db.template.update({
      where: { id },
      data: {
        ...(content !== undefined && { content }),
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(active !== undefined && { active })
      }
    })
    return NextResponse.json({ template })
  } catch (error) {
    console.error('Update template error:', error)
    return NextResponse.json({ error: 'Ошибка обновления шаблона' }, { status: 500 })
  }
}
