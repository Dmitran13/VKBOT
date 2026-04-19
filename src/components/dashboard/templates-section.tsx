'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Save, Eye, FileText, RefreshCw } from 'lucide-react'

export default function TemplatesSection() {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editName, setEditName] = useState('')
  const [editActive, setEditActive] = useState(true)
  const { toast } = useToast()

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/templates')
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.templates)
      }
    } catch {
      toast({ title: 'Ошибка загрузки', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTemplates() }, [])

  const startEdit = (t: any) => {
    setEditingId(t.id)
    setEditContent(t.content)
    setEditName(t.name)
    setEditActive(t.active)
  }

  const saveEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent, name: editName, active: editActive })
      })
      if (res.ok) {
        toast({ title: 'Шаблон обновлён' })
        setEditingId(null)
        fetchTemplates()
      }
    } catch {
      toast({ title: 'Ошибка сохранения', variant: 'destructive' })
    }
  }

  const getPreview = (content: string) => {
    return content
      .replace(/\{\{name\}\}/g, 'Иван')
      .replace(/\{\{end_date\}\}/g, '15.06.2025')
      .replace(/\{\{payment_link\}\}/g, 'https://example.com/pay')
      .replace(/\{\{plan\}\}/g, '1 месяц')
      .replace(/\{\{amount\}\}/g, '250')
      .replace(/\{\{grace_end_date\}\}/g, '30.06.2025')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Шаблоны сообщений</h2>
          <p className="text-muted-foreground">Управление шаблонами уведомлений для ВК</p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchTemplates}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      <div className="space-y-4">
        {templates.map((t) => (
          <Card key={t.id} className={!t.active ? 'opacity-60' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-500" />
                  <CardTitle className="text-base">{editingId === t.id ? (
                    <input className="bg-transparent border-b border-amber-300 outline-none" value={editName} onChange={e => setEditName(e.target.value)} />
                  ) : t.name}</CardTitle>
                  <Badge variant="outline" className="text-xs">{t.type}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 mr-2">
                    <Switch checked={editActive} onCheckedChange={setEditActive} disabled={editingId !== t.id} />
                    <span className="text-xs text-muted-foreground">{t.active ? 'Вкл' : 'Выкл'}</span>
                  </div>
                  {editingId === t.id ? (
                    <Button size="sm" onClick={() => saveEdit(t.id)}><Save className="h-4 w-4 mr-1" />Сохранить</Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => startEdit(t)}>Изменить</Button>
                  )}
                </div>
              </div>
              {t.description && <CardDescription>{t.description}</CardDescription>}
            </CardHeader>
            <CardContent>
              {editingId === t.id ? (
                <Textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                />
              ) : (
                <div className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap">{t.content}</div>
              )}
              <div className="mt-3 flex items-center gap-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm"><Eye className="h-4 w-4 mr-1" />Предпросмотр</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Предпросмотр: {t.name}</DialogTitle></DialogHeader>
                    <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap text-sm">
                      {getPreview(t.content)}
                    </div>
                  </DialogContent>
                </Dialog>
                {t.variables && (
                  <div className="flex gap-1 flex-wrap">
                    {t.variables.split(',').map((v: string) => (
                      <Badge key={v.trim()} variant="secondary" className="text-xs">{`{{${v.trim()}}}`}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
