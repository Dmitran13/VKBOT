'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { Search, Plus, Trash2, RefreshCw, Upload, ChevronLeft, ChevronRight, Download } from 'lucide-react'

export default function SubscribersSection() {
  const [subscribers, setSubscribers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [showAdd, setShowAdd] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showExtend, setShowExtend] = useState<string | null>(null)
  const [plans, setPlans] = useState<any[]>([])
  const { toast } = useToast()

  const [formVkId, setFormVkId] = useState('')
  const [formFirstName, setFormFirstName] = useState('')
  const [formLastName, setFormLastName] = useState('')
  const [formPlanId, setFormPlanId] = useState('')
  const [importText, setImportText] = useState('')
  const [extendPlanId, setExtendPlanId] = useState('')
  const [extendDays, setExtendDays] = useState('')

  // VK import
  const [vkImportState, setVkImportState] = useState<any>(null)
  const [vkImporting, setVkImporting] = useState(false)

  const fetchSubscribers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' })
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/subscribers?${params}`)
      if (res.ok) {
        const data = await res.json()
        setSubscribers(data.subscribers)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      }
    } catch {
      toast({ title: 'Ошибка загрузки', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, toast])

  useEffect(() => { fetchSubscribers() }, [fetchSubscribers])

  useEffect(() => {
    fetch('/api/plans').then(r => r.json()).then(d => setPlans(d.plans || [])).catch(() => {})
  }, [])

  // Poll VK import progress every 3s
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/subscribers/import-vk')
        if (!res.ok) return
        const s = await res.json()
        setVkImportState(s)
        if (s.running) {
          setVkImporting(true)
        } else {
          if (vkImporting && s.finishedAt) {
            fetchSubscribers()
            toast({ title: 'Импорт VK завершён: ' + s.imported + ' добавлено' })
          }
          setVkImporting(false)
        }
      } catch {}
    }
    check()
    const interval = setInterval(check, 3000)
    return () => clearInterval(interval)
  }, [vkImporting])

  const startVkImport = async () => {
    try {
      const res = await fetch('/api/subscribers/import-vk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
      })
      const data = await res.json()
      if (res.ok) {
        setVkImporting(true)
        toast({ title: 'Импорт из VK запущен...' })
      } else {
        toast({ title: data.error || 'Ошибка', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Ошибка', variant: 'destructive' })
    }
  }

  const stopVkImport = async () => {
    await fetch('/api/subscribers/import-vk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stop: true })
    })
    setVkImporting(false)
  }

  const handleAdd = async () => {
    if (!formVkId || !formFirstName) {
      toast({ title: 'Заполните обязательные поля', variant: 'destructive' })
      return
    }
    try {
      const res = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vkId: formVkId, firstName: formFirstName, lastName: formLastName, planId: formPlanId || null })
      })
      if (res.ok) {
        toast({ title: 'Подписчик добавлен' })
        setShowAdd(false)
        setFormVkId(''); setFormFirstName(''); setFormLastName(''); setFormPlanId('')
        fetchSubscribers()
      } else {
        const err = await res.json()
        toast({ title: err.error || 'Ошибка', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Ошибка создания', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Удалить подписчика ${name}?`)) return
    try {
      const res = await fetch(`/api/subscribers/${id}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: 'Подписчик удалён' }); fetchSubscribers() }
    } catch {
      toast({ title: 'Ошибка удаления', variant: 'destructive' })
    }
  }

  const handleExtend = async () => {
    if (!showExtend) return
    try {
      const body: any = {}
      if (extendPlanId) body.planId = extendPlanId
      if (extendDays) body.days = parseInt(extendDays)
      if (!body.planId && !body.days) body.days = 30
      const res = await fetch(`/api/subscribers/${showExtend}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (res.ok) { toast({ title: 'Подписка продлена' }); setShowExtend(null); fetchSubscribers() }
    } catch {
      toast({ title: 'Ошибка продления', variant: 'destructive' })
    }
  }

  const handleImport = async () => {
    if (!importText.trim()) return
    try {
      const lines = importText.trim().split('\n').filter(l => l.trim())
      const subscribersArr = lines.map(line => {
        const parts = line.split(/[,\t;]+/).map((p: string) => p.trim())
        return { vkId: parseInt(parts[0]), firstName: parts[1] || '', lastName: parts[2] || '' }
      }).filter(s => s.vkId && s.firstName)
      const res = await fetch('/api/subscribers/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscribers: subscribersArr })
      })
      if (res.ok) {
        const data = await res.json()
        toast({ title: 'Импорт: ' + data.imported + ' добавлено, ' + data.skipped + ' пропущено' })
        setShowImport(false); setImportText(''); fetchSubscribers()
      }
    } catch {
      toast({ title: 'Ошибка импорта', variant: 'destructive' })
    }
  }

  const getStatusBadge = (status: string) => {
    const m: Record<string, { label: string; className: string }> = {
      active:   { label: 'Активен',           className: 'bg-emerald-100 text-emerald-700' },
      grace:    { label: 'Льготный период',   className: 'bg-amber-100 text-amber-700' },
      expired:  { label: 'Истёк',             className: 'bg-red-100 text-red-700' },
      imported: { label: 'Импортирован',      className: 'bg-blue-100 text-blue-700' },
      pending:  { label: 'Ожидает оплаты',    className: 'bg-gray-100 text-gray-700' },
    }
    const v = m[status] || { label: status, className: '' }
    return <Badge className={v.className}>{v.label}</Badge>
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('ru-RU')

  const importProgress = vkImportState && vkImportState.total > 0
    ? Math.round((vkImportState.imported + vkImportState.skipped) / vkImportState.total * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Подписчики</h2>
          <p className="text-muted-foreground">Всего: {total}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={startVkImport}
            disabled={vkImporting}
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Download className="h-4 w-4 mr-2" />
            {vkImporting ? 'Импорт...' : 'Импорт из VK'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
            <Upload className="h-4 w-4 mr-2" />CSV
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-2" />Добавить
          </Button>
        </div>
      </div>

      {/* VK Import progress banner */}
      {vkImportState && (vkImportState.running || vkImportState.finishedAt) && (
        <Card className={vkImportState.running ? 'border-blue-200 bg-blue-50/50' : 'border-emerald-200 bg-emerald-50/50'}>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {vkImportState.running
                  ? '⏳ Импорт из VK: ' + (vkImportState.imported + vkImportState.skipped) + ' / ' + (vkImportState.total || '...')
                  : '✅ Импорт завершён: ' + vkImportState.imported + ' добавлено, ' + vkImportState.skipped + ' уже были'
                }
              </p>
              {vkImportState.running && (
                <Button size="sm" variant="outline" onClick={stopVkImport}>Остановить</Button>
              )}
            </div>
            {vkImportState.running && vkImportState.total > 0 && (
              <Progress value={importProgress} className="h-2" />
            )}
            {vkImportState.errors > 0 && (
              <p className="text-xs text-red-500">Ошибок: {vkImportState.errors}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Поиск по имени, фамилии или VK ID..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
              />
            </div>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v === 'all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Статус" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="active">Активен</SelectItem>
                <SelectItem value="grace">Льготный период</SelectItem>
                <SelectItem value="expired">Истёк</SelectItem>
                <SelectItem value="pending">Ожидает оплаты</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchSubscribers}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : subscribers.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <p>Подписчики не найдены</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Имя</TableHead>
                    <TableHead className="hidden md:table-cell">VK ID</TableHead>
                    <TableHead>Тариф</TableHead>
                    <TableHead className="hidden sm:table-cell">Начало</TableHead>
                    <TableHead>Окончание</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscribers.map(sub => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.firstName} {sub.lastName || ''}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{sub.vkId}</TableCell>
                      <TableCell>
                        {sub.plan ? <Badge variant="secondary">{sub.plan.name}</Badge> : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{formatDate(sub.startDate)}</TableCell>
                      <TableCell>{formatDate(sub.endDate)}</TableCell>
                      <TableCell>{getStatusBadge(sub.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => { setShowExtend(sub.id); setExtendPlanId(''); setExtendDays('') }} title="Продлить">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(sub.id, sub.firstName + ' ' + (sub.lastName || ''))} title="Удалить">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">Страница {page} из {totalPages}</p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый подписчик</DialogTitle>
            <DialogDescription>Заполните данные нового подписчика</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>VK ID *</Label><Input value={formVkId} onChange={e => setFormVkId(e.target.value)} placeholder="123456789" /></div>
            <div><Label>Имя *</Label><Input value={formFirstName} onChange={e => setFormFirstName(e.target.value)} placeholder="Иван" /></div>
            <div><Label>Фамилия</Label><Input value={formLastName} onChange={e => setFormLastName(e.target.value)} placeholder="Петров" /></div>
            <div>
              <Label>Тариф</Label>
              <Select value={formPlanId} onValueChange={setFormPlanId}>
                <SelectTrigger><SelectValue placeholder="Выберите тариф" /></SelectTrigger>
                <SelectContent>
                  {plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name} — {p.price}₽</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={handleAdd}>Создать</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import dialog */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Импорт подписчиков (CSV)</DialogTitle>
            <DialogDescription>Формат: vk_id, Имя, Фамилия (по одной записи на строку)</DialogDescription>
          </DialogHeader>
          <Textarea
            value={importText}
            onChange={e => setImportText(e.target.value)}
            placeholder={'123456, Иван, Петров\n789012, Мария, Иванова'}
            rows={8}
          />
          <DialogFooter><Button onClick={handleImport}>Импортировать</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend dialog */}
      <Dialog open={!!showExtend} onOpenChange={() => setShowExtend(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Продление подписки</DialogTitle>
            <DialogDescription>Выберите тариф или укажите количество дней</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Тариф</Label>
              <Select value={extendPlanId} onValueChange={setExtendPlanId}>
                <SelectTrigger><SelectValue placeholder="Выберите тариф" /></SelectTrigger>
                <SelectContent>
                  {plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name} — {p.price}₽ ({p.days} дней)</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>или количество дней</Label><Input type="number" value={extendDays} onChange={e => setExtendDays(e.target.value)} placeholder="30" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExtend(null)}>Отмена</Button>
            <Button onClick={handleExtend}>Продлить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
