/**
 * CMS Design System — Impact Audit (지표 SSOT 렌더)
 * 데이터: ./data/impact-audit-metrics.ts
 */

import {
  DS_IMPACT_ADOPTION_ROWS,
  DS_IMPACT_AS_OF,
  DS_IMPACT_AUDIT_METHOD,
  DS_IMPACT_CONCLUSION,
  DS_IMPACT_COVERAGE_ROWS,
  DS_IMPACT_FOLLOWUPS,
  DS_IMPACT_NEXT,
  DS_IMPACT_PHASE_ROWS,
  DS_IMPACT_STATS,
  DS_IMPACT_TOUCHPOINT_ROWS,
  type DsImpactTone,
} from '../data/impact-audit-metrics'
import { DsSection } from './section'

function toneClass(tone: DsImpactTone): string {
  return `ds-impact-tone ds-impact-tone--${tone}`
}

export function ImpactAuditSection() {
  return (
    <DsSection
      id="impact-audit"
      title="Impact audit"
      description="공통 수정 가능성·채택 스냅샷. SSOT는 impact-audit-metrics.ts — Cursor Canvas와 동일 수치로 동기화."
    >
      <p className="ds-note">
        기준일 <code>{DS_IMPACT_AS_OF}</code> · {DS_IMPACT_AUDIT_METHOD}. Canvas:{' '}
        <code>cms-design-system-impact-audit.canvas.tsx</code>
      </p>

      <div className="ds-impact-callout ds-impact-callout--warning" role="note">
        <p className="ds-impact-callout__title">결론</p>
        <p className="ds-impact-callout__body">{DS_IMPACT_CONCLUSION}</p>
      </div>

      <div className="ds-impact-stats" aria-label="Impact KPI">
        {DS_IMPACT_STATS.map(stat => (
          <div key={stat.label} className={`ds-impact-stat ${toneClass(stat.tone)}`}>
            <p className="ds-impact-stat__value">{stat.value}</p>
            <p className="ds-impact-stat__label">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="ds-demo">
        <p className="ds-demo__label">공통 반영 구조</p>
        <div className="ds-impact-flow" aria-hidden={false}>
          <div className="ds-impact-flow__node">
            <strong>전역 토큰</strong>
            <span>theme-provider.css / .tsx</span>
          </div>
          <span className="ds-impact-flow__arrow">→</span>
          <div className="ds-impact-flow__node">
            <strong>Current 공통</strong>
            <span>shared/ui · shared/components</span>
          </div>
          <span className="ds-impact-flow__arrow">→</span>
          <div className="ds-impact-flow__node">
            <strong>활성 CMS 화면</strong>
            <span>목록 · 상세 · 모달 · 캘린더</span>
          </div>
        </div>
        <p className="ds-note" style={{ marginTop: 12 }}>
          <span className="ds-coverage-legend__item ds-coverage-legend__item--current">전역 수정</span>{' '}
          theme-provider, shared ·{' '}
          <span className="ds-coverage-legend__item ds-coverage-legend__item--deferred">DS 전용</span>{' '}
          page.css · DsDemo · mock
        </p>
      </div>

      <div className="ds-demo">
        <p className="ds-demo__label">영역별 커버리지</p>
        <div className="ds-impact-table-wrap">
          <table className="ds-impact-table">
            <thead>
              <tr>
                <th>영역</th>
                <th>커버리지</th>
                <th>현재 기반</th>
                <th>공통 수정 판단</th>
              </tr>
            </thead>
            <tbody>
              {DS_IMPACT_COVERAGE_ROWS.map(row => (
                <tr key={row.area} className={toneClass(row.tone)}>
                  <td>{row.area}</td>
                  <td>
                    <span className="ds-impact-pill">{row.coverage}</span>
                  </td>
                  <td>{row.basis}</td>
                  <td>{row.verdict}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="ds-demo">
        <p className="ds-demo__label">Current 채택 스냅샷 (파일 수)</p>
        <div className="ds-impact-table-wrap">
          <table className="ds-impact-table">
            <thead>
              <tr>
                <th>Primitive</th>
                <th>파일 수</th>
                <th>비고</th>
              </tr>
            </thead>
            <tbody>
              {DS_IMPACT_ADOPTION_ROWS.map(row => (
                <tr key={row.primitive}>
                  <td>
                    <code>{row.primitive}</code>
                  </td>
                  <td>{row.files}</td>
                  <td>{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="ds-demo">
        <p className="ds-demo__label">마이그레이션 Phase</p>
        <div className="ds-impact-table-wrap">
          <table className="ds-impact-table">
            <thead>
              <tr>
                <th>Phase</th>
                <th>상태</th>
                <th>비고</th>
              </tr>
            </thead>
            <tbody>
              {DS_IMPACT_PHASE_ROWS.map(row => (
                <tr key={row.phase} className={toneClass(row.tone)}>
                  <td>{row.phase}</td>
                  <td>
                    <span className="ds-impact-pill">{row.status}</span>
                  </td>
                  <td>{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="ds-demo">
        <p className="ds-demo__label">수정 지점별 파급 · 위험도</p>
        <div className="ds-impact-table-wrap">
          <table className="ds-impact-table">
            <thead>
              <tr>
                <th>수정 지점</th>
                <th>변경 내용</th>
                <th>예상 파급</th>
                <th>위험도</th>
              </tr>
            </thead>
            <tbody>
              {DS_IMPACT_TOUCHPOINT_ROWS.map(row => (
                <tr key={row.touchpoint} className={toneClass(row.tone)}>
                  <td>
                    <code>{row.touchpoint}</code>
                  </td>
                  <td>{row.change}</td>
                  <td>{row.blast}</td>
                  <td>
                    <span className="ds-impact-pill">{row.risk}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="ds-demo">
        <p className="ds-demo__label">후속 백로그</p>
        <ul className="ds-list">
          {DS_IMPACT_FOLLOWUPS.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="ds-impact-callout ds-impact-callout--info" role="note">
        <p className="ds-impact-callout__title">권장 다음 단계</p>
        <p className="ds-impact-callout__body">{DS_IMPACT_NEXT}</p>
      </div>
    </DsSection>
  )
}
