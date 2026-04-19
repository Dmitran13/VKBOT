'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Save, Plus, Trash2, RefreshCw, Globe, CreditCard, Clock } from 'lucide-react'

export default function SettingsSection() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddPlan, setShowAddPlan] = useState(false)
  const [newPlan, setNewPlan] = useState({ name: '', days: '', price: '', description: '' })
  const { toast } = useToast()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [settingsRes, plansRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/plans')
      ])
      if (settingsRes.ok) {
        const data = await settingsRes.json()
        setSettings(data.settings)
      }
      if (plansRes.ok) {
        const data = await plansRes.json()
        setPlans(data.plans)
      }
    } catch {
      toast({ title: 'Ошибка загрузки', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const saveSetting = async (settingKey: string, value: string) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: settingKey, value })
      })
      if (res.ok) {
        setSettings(prev => ({ ...prev, [settingKey]: value }))
        toast({ title: 'Настройка сохранена' })
      }
    } catch {
      toast({ title: 'Ошибка сохранения', variant: 'destructive' })
    }
  }

  const handleAddPlan = async () => {
    if (!newPlan.name || !newPlan.days || !newPlan.price) {
      toast({ title: 'Заполните все поля', variant: 'destructive' })
      return
    }
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlan)
      })
      if (res.ok) {
        toast({ title: 'Тариф создан' })
        setShowAddPlan(false)
        setNewPlan({ name: '', days: '', price: '', description: '' })
        fetchData()
      }
    } catch {
      toast({ title: 'Ошибка создания', variant: 'destructive' })
    }
  }

  const handleDeletePlan = async (id: string, name: string) => {
    if (!confirm(`Удалить тариф «${name}»? Подписчики будут отвязаны.`)) return
    try {
      const res = await fetch(`/api/plans/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Тариф удалён' })
        fetchData()
      }
    } catch {
      toast({ title: 'Ошибка удаления', variant: 'destructive' })
    }
  }

  // FIX: renamed 'key' -> 'settingKey' (React reserves 'key' as reconciliation prop, it never reaches component)
  const SettingField = ({
    label,
    settingKey,
    type = 'text',
    placeholder = ''
  }: {
    label: string
    settingKey: string
    type?: string
    placeholder?: string
  }) => (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <div className="flex gap-2">
        <Input
          type={type}
          value={settings[settingKey] || ''}
          onChange={e => setSettings(prev => ({ ...prev, [settingKey]: e.target.value }))}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button size="icon" variant="outline" onClick={() => saveSetting(settingKey, settings[settingKey] || '')}>
          <Save className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  const BooleanSetting = ({ label, settingKey }: { label: string; settingKey: string }) => (
    <div className="flex items-center justify-between">
      <Label className="text-sm">{label}</Label>
      <Switch
        checked={settings[settingKey] === 'true'}
        onCheckedChange={v => saveSetting(settingKey, v ? 'true' : 'false')}
      />
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Настройки</h2>
          <p className="text-muted-foreground">Параметры системы и интеграций</p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchData}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {/* VK Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            <div>
              <CardTitle className="text-lg">Интеграция ВКонтакте</CardTitle>
              <CardDescription>Токен доступа и параметры группы</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingField label="Токен доступа VK" settingKey="vk_access_token" placeholder="vk1.a.YOUR_TOKEN" type="password" />
          <SettingField label="ID группы VK" settingKey="vk_group_id" placeholder="123456789" />
          <SettingField label="Ссылка-приглашение в группу" settingKey="group_invite_link" placeholder="https://vk.me/join/..." />
          <SettingField label="Ссылка бота (ванити)" settingKey="bot_vanity_link" placeholder="https://vk.me/botname" />
        </CardContent>
      </Card>

      {/* YooKassa */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-500" />
            <div>
              <CardTitle className="text-lg">ЮKassa</CardTitle>
              <CardDescription>Настройки платёжной системы</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingField label="Shop ID" settingKey="yookassa_shop_id" placeholder="123456" />
          <SettingField label="Секретный ключ" settingKey="yookassa_secret_key" placeholder="test_..." type="password" />
        </CardContent>
      </Card>

      {/* Subscription params */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <div>
              <CardTitle className="text-lg">Параметры подписки</CardTitle>
              <CardDescription>Льготный период и напоминания</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingField label="Льготный период (дни)" settingKey="grace_period_days" placeholder="14" type="number" />
          <SettingField label="Дни напоминаний (через запятую)" settingKey="reminder_days" placeholder="7,3,1" />
          <Separator />
          <BooleanSetting label="Автоматически удалять истёкшие подписки" settingKey="auto_remove_expired" />
          <BooleanSetting label="Отправлять приветственное сообщение после оплаты" settingKey="welcome_message_enabled" />
        </CardContent>
      </Card>

      {/* Plans */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Управление тарифами</CardTitle>
              <CardDescription>Тарифные планы подписки</CardDescription>
            </div>
            <Dialog open={showAddPlan} onOpenChange={setShowAddPlan}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-2" />Новый тариф</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Новый тариф</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Название</Label><Input value={newPlan.name} onChange={e => setNewPlan(p => ({ ...p, name: e.target.value }))} placeholder="1 месяц" /></div>
                  <div><Label>Дней</Label><Input type="number" value={newPlan.days} onChange={e => setNewPlan(p => ({ ...p, days: e.target.value }))} placeholder="30" /></div>
                  <div><Label>Цена (₽)</Label><Input type="number" value={newPlan.price} onChange={e => setNewPlan(p => ({ ...p, price: e.target.value }))} placeholder="250" /></div>
                  <div><Label>Описание</Label><Input value={newPlan.description} onChange={e => setNewPlan(p => ({ ...p, description: e.target.value }))} /></div>
                </div>
                <DialogFooter><Button onClick={handleAddPlan}>Создать</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Дней</TableHead>
                <TableHead>Цена</TableHead>
                <TableHead className="hidden md:table-cell">Описание</TableHead>
                <TableHead>Подписчики</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.days} дн.</TableCell>
                  <TableCell className="font-medium">{p.price.toLocaleString('ru-RU')}₽</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{p.description || '—'}</TableCell>
                  <TableCell><Badge variant="secondary">{p._count.subscribers}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => handleDeletePlan(p.id, p.name)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
