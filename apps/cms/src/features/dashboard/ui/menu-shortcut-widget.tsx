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
import { FEATURE_COMING_SOON_ALERT_MESSAGE } from '@/shared/constants/messages'
import { WidgetTitleWithHandle } from './widget-title-with-handle'
import { getMenuShortcutBadgeCounts } from '../api/admin-dashboard-service'
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

/** 메뉴 바로가기에서 라우터 이동 대신 준비 중 안내할 프로그램 관련 id (`programs-` 접두, 연결된 분류 제외) */
function isProgramShortcutItemId(id: string): boolean {
  return (
    id.startsWith('programs-') && id !== 'programs-ujat' && id !== 'programs-general-education'
  )
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
  const shortcutEnabled = useDashboardSettingsStore(s => s.shortcutEnabled)
  const badgeCounts = useDashboardSettingsStore(s => s.shortcutBadgeCounts)
  const setShortcutBadgeCount = useDashboardSettingsStore(s => s.setShortcutBadgeCount)

  const visibleItems = SHORTCUT_ITEMS.filter(item => isShortcutItemEnabled(shortcutEnabled, item.id))

  if (visibleItems.length === 0) return null

  /** 목/API 집계. 스토어에 0이면 해당 메뉴는 읽음 처리로 배지 숨김 */
  const liveBadgeCounts = getMenuShortcutBadgeCounts()

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
            const count = badgeCounts[item.id] === 0 ? 0 : live
            return (
              <button
                key={item.id}
                type="button"
                className="menu-shortcut-widget__item"
                onClick={() => {
                  if (isProgramShortcutItemId(item.id)) {
                    window.alert(FEATURE_COMING_SOON_ALERT_MESSAGE)
                    return
                  }
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
