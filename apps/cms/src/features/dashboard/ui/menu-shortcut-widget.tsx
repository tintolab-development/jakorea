/**
 * 메뉴 바로가기 위젯
 * 대시보드 설정에서 켜진 바로가기 항목을 그리드로 표시하고,
 * 각 항목의 미확인 내역 뱃지를 렌더링한다.
 */

import { Card } from 'antd'
import {
  ReadOutlined,
  FormOutlined,
  SolutionOutlined,
  TeamOutlined,
  BankOutlined,
  IdcardOutlined,
  MessageOutlined,
  MailOutlined,
  PictureOutlined,
  NotificationOutlined,
  QuestionCircleOutlined,
  CustomerServiceOutlined,
  ProfileOutlined,
  FileOutlined,
  HeartOutlined,
} from '@ant-design/icons'
import { WidgetTitleWithHandle } from './widget-title-with-handle'
import { SHORTCUT_ITEMS, useDashboardSettingsStore } from '../model/dashboard-settings-store'
import './menu-shortcut-widget.css'

/** 배지 표시용: 99 초과 시 "99+" */
function formatBadgeCount(count: number): string {
  return count >= 99 ? '99+' : String(count)
}

const SHORTCUT_ICON_MAP: Record<string, React.ReactNode> = {
  programs: <ReadOutlined />,
  applications: <FormOutlined />,
  'instructor-applications': <SolutionOutlined />,
  users: <TeamOutlined />,
  schools: <BankOutlined />,
  instructors: <IdcardOutlined />,
  'kakao-alimtalk': <MessageOutlined />,
  email: <MailOutlined />,
  banner: <PictureOutlined />,
  notices: <NotificationOutlined />,
  faq: <QuestionCircleOutlined />,
  inquiries: <CustomerServiceOutlined />,
  'program-forms': <ProfileOutlined />,
  'file-forms': <FileOutlined />,
  sponsors: <HeartOutlined />,
}

export function MenuShortcutWidget() {
  const shortcutEnabled = useDashboardSettingsStore(s => s.shortcutEnabled)
  const badgeCounts = useDashboardSettingsStore(s => s.shortcutBadgeCounts)
  const setShortcutBadgeCount = useDashboardSettingsStore(s => s.setShortcutBadgeCount)

  const visibleItems = SHORTCUT_ITEMS.filter(item => shortcutEnabled[item.id])

  if (visibleItems.length === 0) return null

  const navigateHandler = (path: string) => {
    console.log('navigateHandler path', path)
    window.alert('준비 중입니다.')
  }

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
                  navigateHandler(item.path)
                }}
              >
                <span className="menu-shortcut-widget__item-left">
                  <span className="menu-shortcut-widget__icon">{SHORTCUT_ICON_MAP[item.id]}</span>
                  <span className="menu-shortcut-widget__label">{item.label}</span>
                </span>
                {count > 0 && (
                  <span className="menu-shortcut-widget__badge">{formatBadgeCount(count)}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
