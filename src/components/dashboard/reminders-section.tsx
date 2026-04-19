'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Bell, Calendar, Clock, Users, ChevronLeft, ChevronRight, RefreshCw, Info } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function RemindersSection() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const { toast } = useToast()

  useEffect(() => {
    fetchReminders()
  }, [page])

  const fetchReminders = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reminders?page=${page}&limit=15`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch {
      toast({ title: 'Ошибка загрузки', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const runCheck = async () => {
    try {
      const res = await fetch('/api/cron/check-expirations', { method: 'POST' })
      if (res.ok) {
        const r = await res.json()
        toast({ title: `Проверка завершена: ${r.reminders7d + r.reminders3d + r.reminders1d} напоминаний отправлено` })
        fetchReminders()
      }
    } catch {
      toast({ title: 'Ошибка проверки', variant: 'destructive' })
    }
  }

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!data) return null

  const reminderTypes = [
    { label: 'За 7 дней', sent: data.sent7d, pending: data.pending7d, color: '#f59e0b' },
    { label: 'За 3 дня', sent: data.sent3d, pending: data.pending3d, color: '#d97706' },
    { label: 'За 1 день', sent: data.sent1d, pending: data.pending1d, color: '#b45309' }
  ]

  const maxSent = Math.max(...reminderTypes.map(r => r.sent), 1)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Напоминания</h2>
          <p className="text-muted-foreground">Управление уведомлениями подписчикам</p>
        </div>
        <Button onClick={runCheck} size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />Запустить проверку
        </Button>
      </div>

      {/* Info banner */}
      <Alert className="border-amber-200 bg-amber-50">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          Напоминания отправляются через личные сообщения ВКонтакте, а не SMS.<br />Убедитесь, что токен доступа VK имеет права на отправку сообщений.
        </AlertDescription>
      </Alert>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-lg"><Bell className="h-5 w-5 text-blue-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Отправлено сегодня</p>
                <p className="text-xl font-bold">{data.todayReminders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 p-2 rounded-lg"><Calendar className="h-5 w-5 text-emerald-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">За неделю</p>
                <p className="text-xl font-bold">{data.weekReminders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-50 p-2 rounded-lg"><Clock className="h-5 w-5 text-amber-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Ожидают отправки</p>
                <p className="text-xl font-bold">{data.pending7d + data.pending3d + data.pending1d}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-50 p-2 rounded-lg"><Users className="h-5 w-5 text-red-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Удалено (истекло)</p>
                <p className="text-xl font-bold">{data.expiredCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart + breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 14-day chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Отправлено за 14 дней</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" radius={[3, 3, 0, 0]} name="Напоминания" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Breakdown by type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Статистика по типам</CardTitle>
            <CardDescription>Отправленные и ожидающие напоминания</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {reminderTypes.map((rt) => (
              <div key={rt.label} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{rt.label}</span>
                  <span className="text-muted-foreground">Отправлено: {rt.sent} | Ожидает: {rt.pending}</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(rt.sent / maxSent) * 100}%`, backgroundColor: rt.color }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Reminder log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Журнал напоминаний</CardTitle>
          <CardDescription>Всего: {data.totalReminders}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {data.logs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Нет записей</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Действие</TableHead>
                    <TableHead>Подписчик</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.logs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('ru-RU')}
                      </TableCell>
                      <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                      <TableCell className="text-sm">
                        {log.subscriber ? `${log.subscriber.firstName} ${log.subscriber.lastName || ''}` : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">Страница {page} из {data.totalPages}</p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
