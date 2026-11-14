/**
 * 대시보드 상단 툴바 (인사말, 프로그램 수, 설정 버튼)
 */

import dashboardIconUrl from '@/shared/assets/icons/buttons/dashboard.svg'
import { CmsButton } from '@/shared/ui'
import { MaskIcon } from '@/shared/ui/icons'

/** 시안 `Icon / Button / w24` dashboard 원본 — 색은 버튼 글자색(흰색) */
function IconDashboardEdit() {
  return <MaskIcon src={dashboardIconUrl} />
}

interface DashboardToolbarProps {
  userName?: string
  activeProgramsCount: number | null
  /**
   * 건수 앞 라벨 — 집계 범위와 일치시킨다 (QA-0381).
   * 관리자 home.programCount는 상태 무관 전체(삭제 제외) 건수라 '전체 프로그램'.
   */
  programsCountLabel?: string
  onOpenSettings: () => void
}

export function DashboardToolbar({
  userName,
  activeProgramsCount,
  programsCountLabel = '진행 프로그램',
  onOpenSettings,
}: DashboardToolbarProps) {
  return (
    <div className="dashboard-toolbar">
      <div className="dashboard-toolbar-left">
        <span className="dashboard-toolbar-title">{userName} 관리자님, 반갑습니다!</span>
        <span className="dashboard-toolbar-description">
          {programsCountLabel} {activeProgramsCount == null ? '-' : activeProgramsCount}건
        </span>
      </div>
      <div className="dashboard-toolbar-right">
        <CmsButton
          variant="primary"
          size="large"
          style={{ minWidth: 180, lineHeight: 1.2 }}
          className="dashboard-toolbar-settings-btn"
          icon={<IconDashboardEdit />}
          adminAction="dashboardWrite"
          onClick={onOpenSettings}
        >
          대시보드 설정
        </CmsButton>
      </div>
    </div>
  )
}
