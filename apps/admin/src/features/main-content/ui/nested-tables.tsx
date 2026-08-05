/**
 * 값 셀(td) 안 중첩 가로형 테이블 — DetailInfoForm Row double 활용
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
    patch: Partial<Pick<PerformanceMetric, 'value' | 'unit'>>
  ) => void
}

/** 실적 및 성과 td — 라벨|값 × 2열 × 2행 (가로형 DetailInfoForm) */
export function MetricsNestedTable({
  metrics,
  mode,
  onChangeMetric,
}: MetricsNestedTableProps) {
  const rows: [PerformanceMetric, PerformanceMetric][] = [
    [metrics[0]!, metrics[1]!],
    [metrics[2]!, metrics[3]!],
  ]

  return (
    <div className="main-content-nested-form">
      <DetailInfoForm title="실적 및 성과" hideHeader mode={mode}>
        {rows.map((pair, rowIndex) => (
          <DetailInfoForm.Row key={rowIndex} type="double">
            {pair.map(metric => (
              <DetailInfoForm.Field
                key={metric.id}
                label={metric.label}
                labelWidth={220}
                view={formatMetricView(metric)}
                edit={
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
                }
              />
            ))}
          </DetailInfoForm.Row>
        ))}
      </DetailInfoForm>
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

/** CTA 버튼 td — 버튼명|값|연결링크|값 × 2행 (가로형 DetailInfoForm) */
export function CtaNestedTable({
  cta1,
  cta2,
  mode,
  onChangeCta1,
  onChangeCta2,
}: CtaNestedTableProps) {
  return (
    <div className="main-content-nested-form">
      <DetailInfoForm title="CTA 버튼" hideHeader mode={mode}>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="버튼명 01"
            labelWidth={220}
            view={cta1.label || '-'}
            edit={
              <CmsInput
                inputSize="medium"
                width="100%"
                value={cta1.label}
                onChange={e => onChangeCta1({ label: e.target.value })}
                placeholder="버튼명을 입력하세요"
              />
            }
          />
          <DetailInfoForm.Field
            label="연결 링크 01"
            labelWidth={220}
            view={cta1.linkUrl || '-'}
            edit={
              <CmsInput
                inputSize="medium"
                width="100%"
                value={cta1.linkUrl}
                onChange={e => onChangeCta1({ linkUrl: e.target.value })}
                placeholder="연결 링크를 입력하세요"
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="버튼명 02"
            labelWidth={220}
            view={cta2.label || '-'}
            edit={
              <CmsInput
                inputSize="medium"
                width="100%"
                value={cta2.label}
                onChange={e => onChangeCta2({ label: e.target.value })}
                placeholder="버튼명을 입력하세요"
              />
            }
          />
          <DetailInfoForm.Field
            label="연결 링크 02"
            labelWidth={220}
            view={cta2.linkUrl || '-'}
            edit={
              <CmsInput
                inputSize="medium"
                width="100%"
                value={cta2.linkUrl}
                onChange={e => onChangeCta2({ linkUrl: e.target.value })}
                placeholder="연결 링크를 입력하세요"
              />
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}
