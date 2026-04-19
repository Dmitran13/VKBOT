'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { Send, Eye, ChevronLeft, ChevronRight, RefreshCw, MessageSquare, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function BroadcastsSection() {
  const [broadcasts, setBroadcasts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [message, setMessage] = useState('')
  const [target, setTarget] = useState('active')
  const [sending, setSending] = useState(false)
  const { toast } = useToast()

  const fetchBroadcasts = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/broadcasts?page=${page}&limit=20`)
      if (res.ok) {
        const data = await res.json()
        setBroadcasts(data.broadcasts)
        setTotalPages(data.totalPages)
      }
    } catch {
      toast({ title: 'Ошибка загрузки', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBroadcasts() }, [page])

  const handleSend = async () => {
    if (!message.trim()) {
      toast({ title: 'Введите сообщение', variant: 'destructive' })
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, target })
      })
      if (res.ok) {
        toast({ title: 'Рассылка отправлена' })
        setMessage('')
        fetchBroadcasts()
      } else {
        const err = await res.json()
        toast({ title: err.error || 'Ошибка', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Ошибка отправки', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const m: Record<string, { label: string; className: string }> = {
      draft: { label: 'Черновик', className: 'bg-gray-100 text-gray-700' },
      sent: { label: 'Отправлено', className: 'bg-blue-100 text-blue-700' },
      completed: { label: 'Завершено', className: 'bg-emerald-100 text-emerald-700' }
    }
    const v = m[status] || { label: status, className: '' }
    return <Badge className={v.className}>{v.label}</Badge>
  }

  const getTargetLabel = (t: string) => {
    const m: Record<string, string> = { active: 'Все активные', expiring: 'Истекают', grace: 'Льготный период', custom: 'Кастомные' }
    return m[t] || t
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Рассылки</h2>
          <p className="text-muted-foreground">Массовые уведомления подписчикам через ВК</p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchBroadcasts}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {/* Composer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Новая рассылка</CardTitle>
          <CardDescription>Напишите сообщение и выберите получателей</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Введите текст рассылки..."
            rows={5}
          />
          <div>
            <Label className="mb-2 block">Получатели</Label>
            <RadioGroup value={target} onValueChange={setTarget} className="flex flex-wrap gap-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="active" id="active" />
                <Label htmlFor="active">Все активные</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="expiring" id="expiring" />
                <Label htmlFor="expiring">Истекают (7 дней)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="grace" id="grace" />
                <Label htmlFor="grace">Льготный период</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={!message.trim()}>
                  <Eye className="h-4 w-4 mr-2" />Предпросмотр
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Предпросмотр сообщения</DialogTitle></DialogHeader>
                <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap text-sm">{message}</div>
                <p className="text-sm text-muted-foreground">Цель: {getTargetLabel(target)}</p>
              </DialogContent>
            </Dialog>
            <Button onClick={handleSend} disabled={sending || !message.trim()}>
              <Send className="h-4 w-4 mr-2" />{sending ? 'Отправка...' : 'Отправить'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">История рассылок</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : broadcasts.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Рассылки ещё не отправлялись</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Цель</TableHead>
                    <TableHead className="hidden md:table-cell">Сообщение</TableHead>
                    <TableHead>Отправлено</TableHead>
                    <TableHead>Доставлено</TableHead>
                    <TableHead>Ошибки</TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {broadcasts.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {b.sentAt ? new Date(b.sentAt).toLocaleString('ru-RU') : '—'}
                      </TableCell>
                      <TableCell><Badge variant="outline">{getTargetLabel(b.target)}</Badge></TableCell>
                      <TableCell className="hidden md:table-cell max-w-[200px] truncate text-sm">{b.message}</TableCell>
                      <TableCell className="text-center">{b.totalSent}</TableCell>
                      <TableCell className="text-center"><CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" /> {b.delivered}</TableCell>
                      <TableCell className="text-center">{b.failed > 0 ? <><XCircle className="h-4 w-4 text-red-500 mx-auto inline" /> {b.failed}</> : '0'}</TableCell>
                      <TableCell>{getStatusBadge(b.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">Страница {page} из {totalPages}</p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
