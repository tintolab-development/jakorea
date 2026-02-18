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
  BarChartOutlined,
  AuditOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { WidgetTitleWithHandle } from './widget-title-with-handle'
import {
  SHORTCUT_ITEMS,
  useDashboardSettingsStore,
} from '../model/dashboard-settings-store'
import './menu-shortcut-widget.css'

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
  performance: <BarChartOutlined />,
  'audit-log': <AuditOutlined />,
}

export function MenuShortcutWidget() {
  const navigate = useNavigate()
  const shortcutEnabled = useDashboardSettingsStore(s => s.shortcutEnabled)
  const badgeCounts = useDashboardSettingsStore(s => s.shortcutBadgeCounts)

  const visibleItems = SHORTCUT_ITEMS.filter(item => shortcutEnabled[item.id])

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
      <div className="menu-shortcut-widget__grid">
        {visibleItems.map(item => {
          const count = badgeCounts[item.id] ?? 0
          return (
            <button
              key={item.id}
              type="button"
              className="menu-shortcut-widget__item"
              onClick={() => navigate(item.path)}
            >
              <span className="menu-shortcut-widget__item-left">
                <span className="menu-shortcut-widget__icon">
                  {SHORTCUT_ICON_MAP[item.id]}
                </span>
                <span className="menu-shortcut-widget__label">{item.label}</span>
              </span>
              {count > 0 && (
                <span className="menu-shortcut-widget__badge">{count}</span>
              )}
            </button>
          )
        })}
      </div>
    </Card>
  )
}
