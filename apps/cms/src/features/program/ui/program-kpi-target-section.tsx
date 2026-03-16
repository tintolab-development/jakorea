/**
 * 사업 KPI 목표 테이블 섹션
 * 프로그램 상세 공통 정보 탭 하단에 표시 (참여자 최종 인원, 최종 파견 학교 수, 교육진행자 최종 인원, 최종 파견 학급 수)
 * td 영역에서는 숫자 텍스트만 볼드 처리.
 */

import type { ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { getKpiAchievementList } from '@/features/dashboard/api/admin-dashboard-service'
import type { KpiMetric } from '@/features/dashboard/api/admin-dashboard-service'
import './program-kpi-target-section.css'

export interface ProgramKpiTargetSectionProps {
  programId: string
}

const EDUCATION_INSTRUCTOR_LABEL = '교육진행자 최종 인원'

/** td 내용 중 숫자만 볼드 처리 (예: "감사: 80 봉사자 : 80" → 감사: **80** 봉사자 : **80**) */
function formatKpiValueWithBoldNumbers(value: string | number | undefined): ReactNode {
  if (value === undefined || value === null || value === '') return '-'
  const str = String(value).trim()
  if (str === '-') return '-'
  if (/^\d+(\.\d+)?$/.test(str)) {
    return <span className="program-kpi-target-section__value">{str}</span>
  }
  const parts = str.split(/(\d+)/)
  return parts.map((part, i) =>
    /^\d+$/.test(part) ? (
      <span key={i} className="program-kpi-target-section__value">
        {part}
      </span>
    ) : (
      part
    )
  )
}

export function ProgramKpiTargetSection({ programId }: ProgramKpiTargetSectionProps) {
  const [kpis, setKpis] = useState<KpiMetric[] | null>(null)

  useEffect(() => {
    let cancelled = false
    getKpiAchievementList({ programIds: [programId] })
      .then(list => {
        if (cancelled) return
        const item = list.find(p => p.programId === programId)
        setKpis(item?.kpis ?? null)
      })
      .catch(() => setKpis(null))
    return () => {
      cancelled = true
    }
  }, [programId])

  if (!kpis || kpis.length === 0) {
    return (
      <section className="program-kpi-target-section">
        <h3 className="program-detail-info-tab__section-title">사업 KPI 목표</h3>
        <div className="program-kpi-target-section__table-wrap">
          <table className="program-detail-info-tab__table program-detail-info-tab__table--basic program-kpi-target-section__table">
            <tbody>
              <tr>
                <td colSpan={2} className="program-kpi-target-section__empty">
                  KPI 목표 데이터가 없습니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    )
  }

  const participantsRow = kpis.find(k => k.key === 'finalParticipants')
  const schoolsRow = kpis.find(k => k.key === 'finalSchools')
  const classesRow = kpis.find(k => k.key === 'finalClasses')
  const instructorDisplay = '감사: 80 봉사자 : 80'

  return (
    <section className="program-kpi-target-section">
      <h3 className="program-detail-info-tab__section-title">사업 KPI 목표</h3>
      <div className="program-kpi-target-section__table-wrap">
        <table className="program-detail-info-tab__table program-detail-info-tab__table--basic program-kpi-target-section__table">
          <colgroup>
            <col className="program-kpi-target-section__col-label" />
            <col />
            <col className="program-kpi-target-section__col-label" />
            <col />
          </colgroup>
          <tbody>
            <tr>
              <th>참여자 최종 인원</th>
              <td>{formatKpiValueWithBoldNumbers(participantsRow?.target)}</td>
              <th>{EDUCATION_INSTRUCTOR_LABEL}</th>
              <td>{formatKpiValueWithBoldNumbers(instructorDisplay)}</td>
            </tr>
            <tr>
              <th>최종 파견 학교 수</th>
              <td>{formatKpiValueWithBoldNumbers(schoolsRow?.target)}</td>
              <th>최종 파견 학급 수</th>
              <td>{formatKpiValueWithBoldNumbers(classesRow?.target)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
