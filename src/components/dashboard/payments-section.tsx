'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { RefreshCw, ChevronLeft, ChevronRight, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function PaymentsSection() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [stats, setStats] = useState<any[]>([])
  const { toast } = useToast()

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' })
      if (statusFilter) params.set('status', statusFilter)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      const res = await fetch(`/api/payments?${params}`)
      if (res.ok) {
        const data = await res.json()
        setPayments(data.payments)
        setTotalPages(data.totalPages)
        setStats(data.stats || [])
      }
    } catch {
      toast({ title: 'Ошибка загрузки', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, dateFrom, dateTo, toast])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  const formatPrice = (p: number) => `${p.toLocaleString('ru-RU')}₽`
  const formatDate = (d: string) => new Date(d).toLocaleDateString('ru-RU')
  const formatDateTime = (d: string) => new Date(d).toLocaleString('ru-RU')

  const getStatusBadge = (status: string) => {
    const m: Record<string, { label: string; className: string }> = {
      success: { label: 'Успешно', className: 'bg-emerald-100 text-emerald-700' },
      pending: { label: 'Ожидает', className: 'bg-amber-100 text-amber-700' },
      failed: { label: 'Ошибка', className: 'bg-red-100 text-red-700' },
      refunded: { label: 'Возврат', className: 'bg-gray-100 text-gray-700' }
    }
    const v = m[status] || { label: status, className: '' }
    return <Badge className={v.className}>{v.label}</Badge>
  }

  const successAmount = stats.find(s => s.status === 'success')?.amount || 0
  const pendingAmount = stats.find(s => s.status === 'pending')?.amount || 0
  const failedAmount = stats.find(s => s.status === 'failed')?.amount || 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Платежи</h2>
        <p className="text-muted-foreground">История всех платежей</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-emerald-50 p-2 rounded-lg"><CheckCircle className="h-5 w-5 text-emerald-500" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Успешные</p>
              <p className="text-lg font-bold">{formatPrice(successAmount)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-amber-50 p-2 rounded-lg"><Clock className="h-5 w-5 text-amber-500" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Ожидают</p>
              <p className="text-lg font-bold">{formatPrice(pendingAmount)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-red-50 p-2 rounded-lg"><XCircle className="h-5 w-5 text-red-500" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Ошибка</p>
              <p className="text-lg font-bold">{formatPrice(failedAmount)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v === 'all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Статус" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="success">Успешно</SelectItem>
                <SelectItem value="pending">Ожидает</SelectItem>
                <SelectItem value="failed">Ошибка</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full sm:w-44" />
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full sm:w-44" />
            <Button variant="outline" size="icon" onClick={fetchPayments}><RefreshCw className="h-4 w-4" /></Button>
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
          ) : payments.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Платежи не найдены</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Подписчик</TableHead>
                    <TableHead>Тариф</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Метод</TableHead>
                    <TableHead className="hidden sm:table-cell">Дата</TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {p.subscriber?.firstName || '—'} {p.subscriber?.lastName || ''}
                      </TableCell>
                      <TableCell>{p.plan?.name || '—'}</TableCell>
                      <TableCell className="font-medium">{formatPrice(p.amount)}</TableCell>
                      <TableCell className="uppercase text-xs">{p.method}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{formatDateTime(p.createdAt)}</TableCell>
                      <TableCell>{getStatusBadge(p.status)}</TableCell>
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
