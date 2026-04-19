'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Users, DollarSign, Clock, TrendingUp,
  ChevronRight, Activity, Shield, MessageSquare,
  AlertTriangle, CalendarX, Bell, Trash2
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

interface DashboardData {
  activeCount: number
  newThisMonth: number
  monthlyRevenue: number
  totalRevenue: number
  expiringCount: number
  totalSubscriptions: number
  recentActivity: any[]
  revenueData: { month: string; revenue: number }[]
  planStats: { planName: string; count: number }[]
}

const PIE_COLORS = ['#f59e0b', '#d97706', '#b45309', '#92400e']

export default function DashboardOverview({ onNavigate }: { onNavigate: (section: string) => void }) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  // Bulk deadline state
  const [deadlineDays, setDeadlineDays] = useState('14')
  const [deadlineConfirm, setDeadlineConfirm] = useState(false)
  const [deadlineLoading, setDeadlineLoading] = useState(false)
  const [subscriberCount, setSubscriberCount] = useState(0)

  const { toast } = useToast()

  useEffect(() => {
    fetchDashboard()
    fetchSubscriberCount()
  }, [])

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard')
      if (res.ok) setData(await res.json())
    } catch {
      toast({ title: 'Ошибка загрузки данных', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const fetchSubscriberCount = async () => {
    try {
      const res = await fetch('/api/subscribers/bulk-deadline')
      if (res.ok) {
        const d = await res.json()
        setSubscriberCount(d.total || 0)
      }
    } catch {}
  }

  const handleSetDeadline = async () => {
    const days = parseInt(deadlineDays)
    if (!days || days < 1) {
      toast({ title: 'Введите корректное количество дней', variant: 'destructive' })
      return
    }
    setDeadlineLoading(true)
    try {
      const res = await fetch('/api/subscribers/bulk-deadline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days })
      })
      const result = await res.json()
      if (res.ok) {
        toast({ title: `✅ ${result.message}` })
        setDeadlineConfirm(false)
        fetchDashboard()
      } else {
        toast({ title: result.error || 'Ошибка', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Ошибка сервера', variant: 'destructive' })
    } finally {
      setDeadlineLoading(false)
    }
  }

  const endDatePreview = () => {
    const d = new Date()
    d.setDate(d.getDate() + (parseInt(deadlineDays) || 0))
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 6) return 'Доброй ночи'
    if (h < 12) return 'Доброе утро'
    if (h < 18) return 'Добрый день'
    return 'Добрый вечер'
  }

  const formatPrice = (p: number) => `${p.toLocaleString('ru-RU')}₽`

  const metrics = data ? [
    { title: 'Активные подписчики', value: data.activeCount, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'Доход за месяц', value: formatPrice(data.monthlyRevenue), icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { title: 'Истекают (7 дней)', value: data.expiringCount, icon: Clock, color: data.expiringCount > 0 ? 'text-orange-500' : 'text-muted-foreground', bg: data.expiringCount > 0 ? 'bg-orange-500/10' : 'bg-muted/30' },
    { title: 'Всего подписок', value: data.totalSubscriptions, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' }
  ] : []

  const quickActions = [
    { label: 'Подписчики', section: 'subscribers', icon: Users, desc: 'Управление подписчиками' },
    { label: 'Платежи', section: 'payments', icon: DollarSign, desc: 'История платежей' },
    { label: 'Рассылки', section: 'broadcasts', icon: MessageSquare, desc: 'Массовые сообщения' },
    { label: 'Настройки', section: 'settings', icon: Shield, desc: 'Параметры системы' }
  ]

  const getTypeBadge = (type: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      subscription: { label: 'Подписка', variant: 'default' },
      payment:      { label: 'Оплата', variant: 'secondary' },
      reminder:     { label: 'Напоминание', variant: 'outline' },
      system:       { label: 'Система', variant: 'secondary' },
      broadcast:    { label: 'Рассылка', variant: 'destructive' },
      message:      { label: 'Сообщение', variant: 'outline' },
    }
    const v = variants[type] || { label: type, variant: 'outline' as const }
    return <Badge variant={v.variant}>{v.label}</Badge>
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold">{getGreeting()}, Наталья!</h2>
        <p className="text-muted-foreground mt-1">Вот обзор текущей ситуации с подписками</p>
      </div>

      {/* ── БЛОК ЗАКРЫТИЯ ГРУППЫ ──────────────────────────────────────────── */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CalendarX className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg text-amber-900">Закрытие группы — дедлайн оплаты</CardTitle>
          </div>
          <CardDescription className="text-amber-700">
            Установите срок, до которого подписчики должны оплатить подписку.
            Система автоматически отправит напоминания за {' '}
            <strong>7, 3 и 1 день</strong> (настраивается в Настройках).
            Неоплатившие будут удалены после льготного периода.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-1 flex-1">
              <Label className="text-amber-800 font-medium">Дней на оплату</Label>
              <Input
                type="number"
                min="1"
                max="365"
                value={deadlineDays}
                onChange={e => setDeadlineDays(e.target.value)}
                className="border-amber-200 max-w-[140px]"
                placeholder="14"
              />
              {parseInt(deadlineDays) > 0 && (
                <p className="text-xs text-amber-700">
                  Дедлайн: <strong>{endDatePreview()}</strong>
                </p>
              )}
            </div>

            <div className="space-y-2 text-sm text-amber-800">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span>Напоминания: за 7, 3, 1 день до дедлайна</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Льготный период: настраивается в Настройках</span>
              </div>
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                <span>Неоплатившие удаляются после льготного периода</span>
              </div>
            </div>
          </div>

          <Separator className="bg-amber-200" />

          <div className="flex items-center justify-between">
            <p className="text-sm text-amber-700">
              Будет обновлено: <strong>{subscriberCount} подписчиков</strong>
            </p>
            <Button
              onClick={() => setDeadlineConfirm(true)}
              disabled={!deadlineDays || parseInt(deadlineDays) < 1}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              <CalendarX className="h-4 w-4 mr-2" />
              Установить дедлайн
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirm dialog */}
      <Dialog open={deadlineConfirm} onOpenChange={setDeadlineConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Подтвердите установку дедлайна
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-2">
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertDescription className="text-amber-800 space-y-1">
                    <p>📅 Дедлайн: <strong>{endDatePreview()}</strong> (через {deadlineDays} дн.)</p>
                    <p>👥 Затронет: <strong>{subscriberCount} подписчиков</strong></p>
                    <p>🔔 Напоминания начнут отправляться автоматически по расписанию</p>
                    <p>⚠️ Флаги отправленных напоминаний будут сброшены</p>
                  </AlertDescription>
                </Alert>
                <p className="text-sm text-muted-foreground">
                  Все подписчики получат новую дату окончания подписки.
                  Те, кто не оплатит до дедлайна, получат напоминания и будут
                  удалены/переведены в просроченные после льготного периода.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeadlineConfirm(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleSetDeadline}
              disabled={deadlineLoading}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {deadlineLoading ? 'Обновляю...' : `Установить для ${subscriberCount} подписчиков`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ─────────────────────────────────────────────────────────────────── */}

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{m.title}</p>
                  <p className="text-2xl font-bold mt-1">{m.value}</p>
                </div>
                <div className={`${m.bg} p-3 rounded-xl`}>
                  <m.icon className={`h-6 w-6 ${m.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Доход по месяцам</CardTitle>
            <CardDescription>Последние 12 месяцев</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.revenueData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => `${v.toLocaleString('ru-RU')}₽`} />
                <Bar dataKey="revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Подписки по тарифам</CardTitle>
            <CardDescription>Активные подписки</CardDescription>
          </CardHeader>
          <CardContent>
            {data.planStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={data.planStats}
                    dataKey="count"
                    nameKey="planName"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ planName, count }) => `${planName}: ${count}`}
                  >
                    {data.planStats.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                Нет данных — подписчики ещё не привязаны к тарифам
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Card
            key={action.section}
            className="cursor-pointer hover:shadow-md hover:border-amber-200 transition-all"
            onClick={() => onNavigate(action.section)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-50 p-2 rounded-lg">
                  <action.icon className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Последние действия</CardTitle>
            <CardDescription>Актуальные события системы</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('logs')}>
            Все логи →
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {data.recentActivity.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Нет активности</p>
            )}
            {data.recentActivity.map((log: any) => (
              <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                <Activity className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getTypeBadge(log.type)}
                    <span className="text-sm">{log.action}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {log.subscriber
                      ? `${log.subscriber.firstName} ${log.subscriber.lastName || ''}`
                      : 'Система'}
                    {' · '}
                    {new Date(log.createdAt).toLocaleString('ru-RU')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
