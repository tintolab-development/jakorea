/**
 * 값 셀(td) 안 중첩 테이블 — 시안 2×2 / CTA 2행 가로 격자
 * 규격: apps/admin/.cursor/rules/design/detail-info-nested-table.mdc
 * (DetailInfoForm 중첩 금지 — flex·label 고정폭 충돌)
 */
import type { PerformanceMetric } from '@/entities/main-content/model/types'
import { CmsInput } from '@/shared/ui'

function formatMetricView(metric: PerformanceMetric): string {
  return `${metric.value}${metric.unit}`
}

type MetricsNestedTableProps = {
  metrics: PerformanceMetric[]
  mode: 'view' | 'edit'
  onChangeMetric: (
    id: PerformanceMetric['id'],
    patch: Partial<Pick<PerformanceMetric, 'value' | 'unit'>>
  ) => void
}

/** 실적 및 성과 td — 라벨|값 × 2열 × 2행 */
export function MetricsNestedTable({
  metrics,
  mode,
  onChangeMetric,
}: MetricsNestedTableProps) {
  const items = metrics.slice(0, 4)

  return (
    <div className="main-content-nested-table main-content-nested-table--metrics" role="group" aria-label="실적 및 성과">
      {items.map(metric => (
        <div key={metric.id} className="main-content-nested-table__cell">
          <div className="main-content-nested-table__label">{metric.label}</div>
          <div className="main-content-nested-table__value">
            {mode === 'edit' ? (
              <div className="main-content-metric-edit">
                <CmsInput
                  inputSize="medium"
                  width="100%"
                  value={metric.value}
                  onChange={e => onChangeMetric(metric.id, { value: e.target.value })}
                  placeholder="수치"
                  aria-label={`${metric.label} 수치`}
                />
                <span className="main-content-metric-edit__unit">{metric.unit}</span>
              </div>
            ) : (
              <span className="main-content-metric-view">{formatMetricView(metric)}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

type CtaNestedTableProps = {
  cta1: { label: string; linkUrl: string }
  cta2: { label: string; linkUrl: string }
  mode: 'view' | 'edit'
  onChangeCta1: (patch: Partial<{ label: string; linkUrl: string }>) => void
  onChangeCta2: (patch: Partial<{ label: string; linkUrl: string }>) => void
}

/** CTA 버튼 td — 버튼명|값|연결링크|값 × 2행 */
export function CtaNestedTable({
  cta1,
  cta2,
  mode,
  onChangeCta1,
  onChangeCta2,
}: CtaNestedTableProps) {
  const rows = [
    {
      key: 'cta1',
      buttonLabel: '버튼명 01',
      linkLabel: '연결 링크 01',
      data: cta1,
      onChange: onChangeCta1,
    },
    {
      key: 'cta2',
      buttonLabel: '버튼명 02',
      linkLabel: '연결 링크 02',
      data: cta2,
      onChange: onChangeCta2,
    },
  ] as const

  return (
    <div className="main-content-nested-table main-content-nested-table--cta" role="group" aria-label="CTA 버튼">
      {rows.map(row => (
        <div key={row.key} className="main-content-nested-table__row">
          <div className="main-content-nested-table__cell">
            <div className="main-content-nested-table__label">{row.buttonLabel}</div>
            <div className="main-content-nested-table__value">
              {mode === 'edit' ? (
                <CmsInput
                  inputSize="medium"
                  width="100%"
                  value={row.data.label}
                  onChange={e => row.onChange({ label: e.target.value })}
                  placeholder="버튼명을 입력하세요"
                />
              ) : (
                <span>{row.data.label || '-'}</span>
              )}
            </div>
          </div>
          <div className="main-content-nested-table__cell">
            <div className="main-content-nested-table__label">{row.linkLabel}</div>
            <div className="main-content-nested-table__value">
              {mode === 'edit' ? (
                <CmsInput
                  inputSize="medium"
                  width="100%"
                  value={row.data.linkUrl}
                  onChange={e => row.onChange({ linkUrl: e.target.value })}
                  placeholder="연결 링크를 입력하세요"
                />
              ) : (
                <span className="main-content-nested-table__url">{row.data.linkUrl || '-'}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
