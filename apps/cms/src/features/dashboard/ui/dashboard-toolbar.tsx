/**
 * 대시보드 상단 툴바 (인사말, 진행 프로젝트 수, 설정 버튼)
 */

import { Button } from 'antd'
import { EditOutlined } from '@ant-design/icons'

interface DashboardToolbarProps {
  userName?: string
  roleLabel: string
  activeProgramsCount: number
  onOpenSettings: () => void
}

export function DashboardToolbar({
  userName,
  roleLabel,
  activeProgramsCount,
  onOpenSettings,
}: DashboardToolbarProps) {
  return (
    <div className="dashboard-toolbar">
      <div className="dashboard-toolbar-left">
        <h2 className="dashboard-toolbar-title">
          {userName} {roleLabel}님, 반갑습니다!
        </h2>
        <span className="dashboard-toolbar-description">
          진행 프로젝트 {activeProgramsCount}건
        </span>
      </div>
      <div className="dashboard-toolbar-right">
        <Button type="primary" icon={<EditOutlined />} onClick={onOpenSettings}>
          대시보드 설정
        </Button>
      </div>
    </div>
  )
}
