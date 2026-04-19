'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { RefreshCw, ChevronLeft, ChevronRight, Activity, FileText, CreditCard, Bell, Settings, MessageSquare, Upload, Users } from 'lucide-react'

export default function ActivityLogsSection() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [groupByType, setGroupByType] = useState<any[]>([])
  const { toast } = useToast()

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' })
      if (typeFilter) params.set('type', typeFilter)
      const res = await fetch(`/api/activity-logs?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs)
        setTotalPages(data.totalPages)
        setGroupByType(data.groupByType)
      }
    } catch {
      toast({ title: 'Ошибка загрузки', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [page, typeFilter, toast])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const getTypeBadge = (type: string) => {
    const m: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      subscription: { label: 'Подписка', variant: 'default' },
      payment: { label: 'Оплата', variant: 'secondary' },
      reminder: { label: 'Напоминание', variant: 'outline' },
      system: { label: 'Система', variant: 'secondary' },
      broadcast: { label: 'Рассылка', variant: 'destructive' },
      import: { label: 'Импорт', variant: 'outline' }
    }
    const v = m[type] || { label: type, variant: 'outline' as const }
    return <Badge variant={v.variant}>{v.label}</Badge>
  }

  const getTypeIcon = (type: string) => {
    const m: Record<string, any> = {
      subscription: Users,
      payment: CreditCard,
      reminder: Bell,
      system: Settings,
      broadcast: MessageSquare,
      import: Upload
    }
    return m[type] || Activity
  }

  const getTypeColor = (type: string) => {
    const m: Record<string, string> = {
      subscription: 'bg-emerald-50 text-emerald-600',
      payment: 'bg-blue-50 text-blue-600',
      reminder: 'bg-amber-50 text-amber-600',
      system: 'bg-gray-50 text-gray-600',
      broadcast: 'bg-purple-50 text-purple-600',
      import: 'bg-cyan-50 text-cyan-600'
    }
    return m[type] || 'bg-muted text-muted-foreground'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Журнал событий</h2>
          <p className="text-muted-foreground">История всех действий системы</p>
        </div>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={v => { setTypeFilter(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Тип" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              <SelectItem value="subscription">Подписка</SelectItem>
              <SelectItem value="payment">Оплата</SelectItem>
              <SelectItem value="reminder">Напоминание</SelectItem>
              <SelectItem value="system">Система</SelectItem>
              <SelectItem value="broadcast">Рассылка</SelectItem>
              <SelectItem value="import">Импорт</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchLogs}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Stats by type */}
      {groupByType.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {groupByType.map(g => {
            const Icon = getTypeIcon(g.type)
            return (
              <Card key={g.type} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-3 text-center">
                  <div className={`inline-flex p-2 rounded-lg mb-2 ${getTypeColor(g.type)}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-lg font-bold">{g.count}</p>
                  <p className="text-xs text-muted-foreground">{g.type}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Logs table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Записи не найдены</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Действие</TableHead>
                    <TableHead className="hidden sm:table-cell">Подписчик</TableHead>
                    <TableHead>Дата</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const Icon = getTypeIcon(log.type)
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className={`p-1.5 rounded-md ${getTypeColor(log.type)} inline-flex`}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(log.type)}</TableCell>
                        <TableCell className="max-w-md truncate">{log.action}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                          {log.subscriber ? `${log.subscriber.firstName} ${log.subscriber.lastName || ''}` : '—'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString('ru-RU')}
                        </TableCell>
                      </TableRow>
                    )
                  })}
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
