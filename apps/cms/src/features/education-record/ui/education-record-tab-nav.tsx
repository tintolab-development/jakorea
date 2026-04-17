/**
 * 실적 관리 목록 페이지용 상단 탭 네비게이션
 * - 스펙: inactive `#7D7D7D` / active `#01A1AF` 하단 2px mint 보더
 * - 공통 필터 + 구분선 아래, 탭별 본문 위에 배치(페이지 루트 소유)
 */

import type { EducationRecordTabKey } from '../model/education-record-types'

const TAB_ITEMS: Array<{ key: EducationRecordTabKey; label: string }> = [
  { key: 'data', label: '실적 데이터' },
  { key: 'summary', label: '합계' },
]

export type EducationRecordTabNavProps = {
  activeTab: EducationRecordTabKey
  onTabChange: (key: EducationRecordTabKey) => void
}

export function EducationRecordTabNav({ activeTab, onTabChange }: EducationRecordTabNavProps) {
  return (
    <div className="education-record-list-page__tabs" role="tablist">
      {TAB_ITEMS.map(({ key, label }) => {
        const isActive = activeTab === key
        const className = `education-record-list-page__tab${
          isActive ? ' education-record-list-page__tab--active' : ''
        }`
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={className}
            onClick={() => {
              if (!isActive) onTabChange(key)
            }}
          >
            <span className="education-record-list-page__tab-label">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
