/**
 * 메뉴 바로가기 위젯
 * 대시보드 설정에서 켜진 바로가기 항목을 그리드로 표시하고,
 * 각 항목의 미확인 내역 뱃지를 렌더링한다.
 */

import { Card } from 'antd'
import {
  AccountBookOutlined,
  AppstoreOutlined,
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
  SafetyOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  ShopOutlined,
  SolutionOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { WidgetTitleWithHandle } from './widget-title-with-handle'
import {
  SHORTCUT_ITEMS,
  isShortcutItemEnabled,
  useDashboardSettingsStore,
} from '../model/dashboard-settings-store'
import './menu-shortcut-widget.css'

/** 배지 표시용: 99 초과 시 "99+" */
function formatBadgeCount(count: number): string {
  return count >= 99 ? '99+' : String(count)
}

const SHORTCUT_ICON_MAP: Record<string, React.ReactNode> = {
  'programs-all': <AppstoreOutlined />,
  'programs-general-education': <ReadOutlined />,
  'programs-economy': <BookOutlined />,
  'programs-gemini': <ExperimentOutlined />,
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
  const shortcutEnabled = useDashboardSettingsStore(s => s.shortcutEnabled)
  const badgeCounts = useDashboardSettingsStore(s => s.shortcutBadgeCounts)
  const setShortcutBadgeCount = useDashboardSettingsStore(s => s.setShortcutBadgeCount)

  const visibleItems = SHORTCUT_ITEMS.filter(item => isShortcutItemEnabled(shortcutEnabled, item.id))

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
            const count = badgeCounts[item.id] ?? 0
            return (
              <button
                key={item.id}
                type="button"
                className="menu-shortcut-widget__item"
                onClick={() => {
                  setShortcutBadgeCount(item.id, 0)
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
