/**
 * 값 셀 안 중첩 DetailInfoForm — 실적 2×2 / CTA 2행
 */
import { DetailInfoForm } from '@jakorea/form-template-runtime'
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
    patch: Partial<Pick<PerformanceMetric, 'value' | 'unit'>>,
  ) => void
}

/** 실적 및 성과 td — 라벨|값 × 2열 × 2행 */
export function MetricsNestedTable({ metrics, mode, onChangeMetric }: MetricsNestedTableProps) {
  const items = metrics.slice(0, 4)
  const rows: PerformanceMetric[][] = []
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2))
  }

  return (
    <DetailInfoForm
      title="실적 및 성과"
      hideHeader
      mode={mode}
      className="main-content-nested-form main-content-nested-form--metrics"
    >
      {rows.map(row => (
        <DetailInfoForm.Row key={row.map(item => item.id).join('-')} type="double">
          {row.map(metric => (
            <DetailInfoForm.Field
              key={metric.id}
              label={metric.label}
              required
              labelWidth={220}
              view={<span className="main-content-metric-view">{formatMetricView(metric)}</span>}
              edit={
                <div className="main-content-metric-edit">
                  <CmsInput
                    inputSize="compact"
                    width="100%"
                    value={metric.value}
                    onChange={e => onChangeMetric(metric.id, { value: e.target.value })}
                    placeholder="수치"
                    aria-label={`${metric.label} 수치`}
                  />
                  <span className="main-content-metric-edit__unit">{metric.unit}</span>
                </div>
              }
            />
          ))}
        </DetailInfoForm.Row>
      ))}
    </DetailInfoForm>
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
  return (
    <DetailInfoForm
      title="CTA 버튼"
      hideHeader
      mode={mode}
      className="main-content-nested-form main-content-nested-form--cta"
    >
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="버튼명 01"
          required
          labelWidth={220}
          view={<span className="main-content-nested-form__text">{cta1.label || '-'}</span>}
          edit={
            <CmsInput
              inputSize="compact"
              width="100%"
              value={cta1.label}
              onChange={e => onChangeCta1({ label: e.target.value })}
              placeholder="버튼명을 입력해 주세요"
            />
          }
        />
        <DetailInfoForm.Field
          label="연결 링크 01"
          required
          labelWidth={220}
          view={
            <span className="main-content-nested-form__text main-content-nested-form__text--url">
              {cta1.linkUrl || '-'}
            </span>
          }
          edit={
            <CmsInput
              inputSize="compact"
              width="100%"
              value={cta1.linkUrl}
              onChange={e => onChangeCta1({ linkUrl: e.target.value })}
              placeholder="연결 링크를 입력해 주세요"
            />
          }
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="버튼명 02"
          required
          labelWidth={220}
          view={<span className="main-content-nested-form__text">{cta2.label || '-'}</span>}
          edit={
            <CmsInput
              inputSize="compact"
              width="100%"
              value={cta2.label}
              onChange={e => onChangeCta2({ label: e.target.value })}
              placeholder="버튼명을 입력해 주세요"
            />
          }
        />
        <DetailInfoForm.Field
          label="연결 링크 02"
          required
          labelWidth={220}
          view={
            <span className="main-content-nested-form__text main-content-nested-form__text--url">
              {cta2.linkUrl || '-'}
            </span>
          }
          edit={
            <CmsInput
              inputSize="compact"
              width="100%"
              value={cta2.linkUrl}
              onChange={e => onChangeCta2({ linkUrl: e.target.value })}
              placeholder="연결 링크를 입력해 주세요"
            />
          }
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
