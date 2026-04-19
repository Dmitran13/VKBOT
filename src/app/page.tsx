'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  LayoutDashboard, Users, CreditCard, Bell, Megaphone,
  FileText, Settings, ScrollText,
  Menu, X
} from 'lucide-react'
import DashboardOverview from '@/components/dashboard/dashboard-overview'
import SubscribersSection from '@/components/dashboard/subscribers-section'
import PaymentsSection from '@/components/dashboard/payments-section'
import RemindersSection from '@/components/dashboard/reminders-section'
import BroadcastsSection from '@/components/dashboard/broadcasts-section'
import TemplatesSection from '@/components/dashboard/templates-section'
import SettingsSection from '@/components/dashboard/settings-section'
import ActivityLogsSection from '@/components/dashboard/activity-logs-section'

type Section = 'dashboard' | 'subscribers' | 'payments' | 'reminders' | 'broadcasts' | 'templates' | 'settings' | 'logs'

const NAV_ITEMS: { key: Section; label: string; icon: any }[] = [
  { key: 'dashboard', label: 'Обзор', icon: LayoutDashboard },
  { key: 'subscribers', label: 'Подписчики', icon: Users },
  { key: 'payments', label: 'Платежи', icon: CreditCard },
  { key: 'reminders', label: 'Напоминания', icon: Bell },
  { key: 'broadcasts', label: 'Рассылки', icon: Megaphone },
  { key: 'templates', label: 'Шаблоны', icon: FileText },
  { key: 'settings', label: 'Настройки', icon: Settings },
  { key: 'logs', label: 'Логи', icon: ScrollText },
]

export default function HomePage() {
  const [activeSection, setActiveSection] = useState<Section>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dashboardData, setDashboardData] = useState<{ activeCount: number; totalRevenue: number } | null>(null)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => setDashboardData({ activeCount: d.activeCount || 0, totalRevenue: d.totalRevenue || 0 }))
      .catch(() => {})
  }, [])

  const formatPrice = (p: number) => `${p.toLocaleString('ru-RU')}₽`

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return <DashboardOverview onNavigate={setActiveSection} />
      case 'subscribers': return <SubscribersSection />
      case 'payments': return <PaymentsSection />
      case 'reminders': return <RemindersSection />
      case 'broadcasts': return <BroadcastsSection />
      case 'templates': return <TemplatesSection />
      case 'settings': return <SettingsSection />
      case 'logs': return <ActivityLogsSection />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed lg:static inset-y-0 left-0 z-50 w-72 bg-stone-900 text-stone-100 flex flex-col transition-transform duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Header */}
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-stone-900 font-bold text-lg">
              Н
            </div>
            <div>
              <p className="font-semibold text-sm">Наталья</p>
              <p className="text-xs text-stone-400">Администратор</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden text-stone-400 hover:text-stone-100 hover:bg-stone-800" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <Separator className="bg-stone-700" />

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const isActive = activeSection === item.key
            return (
              <button
                key={item.key}
                onClick={() => { setActiveSection(item.key); setSidebarOpen(false) }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative',
                  isActive
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                )}
              >
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-amber-500 rounded-r-full" />}
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
                {item.key === 'subscribers' && dashboardData && (
                  <Badge className="ml-auto bg-amber-500/20 text-amber-400 hover:bg-amber-500/20 text-xs border-amber-500/30">
                    {dashboardData.activeCount}
                  </Badge>
                )}
              </button>
            )
          })}
        </nav>

        <Separator className="bg-stone-700" />

        {/* Footer */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Система активна</span>
          </div>
          {dashboardData && (
            <div className="space-y-1 text-xs text-stone-500">
              <p>Подписчиков: <span className="text-stone-300">{dashboardData.activeCount}</span></p>
              <p>Доход: <span className="text-stone-300">{formatPrice(dashboardData.totalRevenue)}</span></p>
            </div>
          )}
          <div className="text-xs text-stone-600">
            Мебельная Мастерская
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="h-14 border-b bg-white flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">
              {NAV_ITEMS.find(n => n.key === activeSection)?.label || 'Обзор'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-muted-foreground hidden sm:inline">Online</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold">
              Н
            </div>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-stone-50/50">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}
