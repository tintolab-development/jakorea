/**
 * 메뉴 바로가기 위젯
 * 대시보드 설정에서 켜진 바로가기 항목을 그리드로 표시하고,
 * 각 항목의 미확인 내역 뱃지를 렌더링한다.
 */

import { Card } from 'antd'
import {
  AccountBookOutlined,
  BankOutlined,
  BookOutlined,
  BugOutlined,
  CloudDownloadOutlined,
  CustomerServiceOutlined,
  ExperimentOutlined,
  FileDoneOutlined,
  HeartOutlined,
  IdcardOutlined,
  LineChartOutlined,
  MailOutlined,
  NotificationOutlined,
  ProfileOutlined,
  QuestionCircleOutlined,
  ReadOutlined,
  RocketOutlined,
  SafetyOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  ShopOutlined,
  SolutionOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { WidgetTitleWithHandle } from './widget-title-with-handle'
import {
  getMenuShortcutBadgeCounts,
  readDashboardShortcutBadge,
  shouldUseDashboardRemoteApi,
} from '../api/admin-dashboard-service'
import { dashboardQueryKeys } from '../api/dashboard-query-keys'
import { useDashboardSettingsStore } from '../model/dashboard-settings-store'
import { useDashboardShortcuts } from '../hooks/use-dashboard-shortcuts'
import { useDashboardShortcutBadges } from '../hooks/use-dashboard-shortcut-badges'
import { resolveDashboardShortcutItems } from '../lib/resolve-dashboard-shortcut-items'
import './menu-shortcut-widget.css'

/** 배지 표시용: 99 초과 시 "99+" */
function formatBadgeCount(count: number): string {
  return count >= 99 ? '99+' : String(count)
}

const SHORTCUT_ICON_MAP: Record<string, React.ReactNode> = {
  'programs-general-education': <ReadOutlined />,
  'programs-economy': <BookOutlined />,
  'programs-gemini': <ExperimentOutlined />,
  'programs-ujat': <RocketOutlined />,
  'users-all': <TeamOutlined />,
  'users-school': <BankOutlined />,
  'users-instructor': <IdcardOutlined />,
  'users-admin': <UserOutlined />,
  'permission-requests': <SafetyCertificateOutlined />,
  'settlement-payment-orders': <FileDoneOutlined />,
  'settlement-account-payments': <AccountBookOutlined />,
  'settlement-item-settings': <SettingOutlined />,
  notices: <NotificationOutlined />,
  faq: <QuestionCircleOutlined />,
  inquiries: <CustomerServiceOutlined />,
  'template-management': <ProfileOutlined />,
  sponsors: <HeartOutlined />,
  textbooks: <ReadOutlined />,
  'programs-detail': <ShopOutlined />,
  performance: <LineChartOutlined />,
  'email-history': <MailOutlined />,
  'file-download-history': <CloudDownloadOutlined />,
  'privacy-query-history': <SafetyOutlined />,
  'bug-issue-history': <BugOutlined />,
}

export function MenuShortcutWidget() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const shortcutEnabled = useDashboardSettingsStore(s => s.shortcutEnabled)
  const badgeCounts = useDashboardSettingsStore(s => s.shortcutBadgeCounts)
  const setShortcutBadgeCount = useDashboardSettingsStore(s => s.setShortcutBadgeCount)
  const useRemoteShortcuts = shouldUseDashboardRemoteApi()
  const { data: apiShortcuts } = useDashboardShortcuts(useRemoteShortcuts)
  const { data: remoteBadgeCounts } = useDashboardShortcutBadges(useRemoteShortcuts)

  const { mutate: markShortcutRead } = useMutation({
    mutationFn: (shortcutId: string) => readDashboardShortcutBadge(shortcutId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.shortcutBadges('remote') })
    },
  })

  const visibleItems = useMemo(
    () => resolveDashboardShortcutItems(apiShortcuts, shortcutEnabled),
    [apiShortcuts, shortcutEnabled]
  )

  const liveBadgeCounts = useMemo(() => {
    if (useRemoteShortcuts) {
      return remoteBadgeCounts ?? {}
    }
    return getMenuShortcutBadgeCounts()
  }, [useRemoteShortcuts, remoteBadgeCounts])

  if (visibleItems.length === 0) return null

  return (
    <Card
      className="menu-shortcut-widget"
      title={
        <WidgetTitleWithHandle>
          <span className="widget-card-title">메뉴 바로가기</span>
        </WidgetTitleWithHandle>
      }
    >
      <div className="menu-shortcut-widget__body">
        <div className="menu-shortcut-widget__grid">
          {visibleItems.map(item => {
            const live = liveBadgeCounts[item.id] ?? 0
            const count = useRemoteShortcuts ? live : badgeCounts[item.id] === 0 ? 0 : live
            return (
              <button
                key={item.id}
                type="button"
                className="menu-shortcut-widget__item"
                onClick={() => {
                  if (useRemoteShortcuts) {
                    markShortcutRead(item.id)
                  } else {
                    setShortcutBadgeCount(item.id, 0)
                  }
                  navigate(item.path)
                }}
              >
                <span className="menu-shortcut-widget__item-inner">
                  <span className="menu-shortcut-widget__item-left">
                    <span className="menu-shortcut-widget__icon">
                      {SHORTCUT_ICON_MAP[item.id] ?? <SolutionOutlined />}
                    </span>
                    <span className="menu-shortcut-widget__label">{item.label}</span>
                  </span>
                  {count > 0 && (
                    <span className="menu-shortcut-widget__badge">{formatBadgeCount(count)}</span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
