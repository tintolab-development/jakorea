/**
 * 대시보드 위젯 빈 상태 — 아이콘 없이 타이틀 + 설명 텍스트만
 * 시안: 대시보드 일정 목록 빈 상태(14894:26706 · 14741:1767 Empty/03) 타이포·간격
 * 문구 기본값: 목록 빈 상태(14741:1659 Empty/01) 「등록된 데이터가 없습니다」 / 「데이터가 등록되면 이곳에 목록이 표시됩니다.」
 */
import { CMS_TABLE_EMPTY_COPY } from '@/shared/ui/cms-table-empty-copy'
import './dashboard-widget-empty.css'

type DashboardWidgetEmptyProps = {
  title?: string
  description?: string
  /** 테이블 placeholder 셀 안에 넣을 때 */
  inTable?: boolean
}

export function DashboardWidgetEmpty({
  title = CMS_TABLE_EMPTY_COPY['no-data'].title,
  description = CMS_TABLE_EMPTY_COPY['no-data'].description,
  inTable = false,
}: DashboardWidgetEmptyProps) {
  return (
    <div
      className={
        inTable
          ? 'dashboard-widget-empty dashboard-widget-empty--in-table'
          : 'dashboard-widget-empty'
      }
      role="status"
    >
      <p className="dashboard-widget-empty__title">{title}</p>
      <p className="dashboard-widget-empty__desc">{description}</p>
    </div>
  )
}
