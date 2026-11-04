/**
 * 메뉴별 조회 통계 — 메트릭 표
 * 외곽 + 중메뉴 값 셀 모두 DetailInfoForm
 * 참고: features/ja-korea-intro/ui/content-nested-table.tsx
 *        features/ja-history/ui/cta-buttons-nested-table.tsx
 */

import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { MenuViewMetric, TransparencySubRow } from '@/entities/menu-view-stats/model/types'
import { formatCount } from '@/features/menu-view-stats/lib/format-count'

import './metric-matrix.css'

type Props = {
  metric: MenuViewMetric
}

/** 중메뉴 값 셀 — DetailInfoForm 행 스택 */
function MidMenuNestedForm({ rows }: { rows: TransparencySubRow[] }) {
  return (
    <DetailInfoForm title="중메뉴 조회수" hideHeader mode="view" className="mvs-nested-form">
      {rows.map(row => {
        const hasPosts = row.postViewCount !== undefined
        if (hasPosts) {
          return (
            <DetailInfoForm.Row key={row.id} type="double">
              <DetailInfoForm.Field
                label={row.label}
                labelWidth={200}
                view={formatCount(row.viewCount)}
              />
              <DetailInfoForm.Field
                label="게시글 총 조회수"
                labelWidth={200}
                view={formatCount(row.postViewCount)}
              />
            </DetailInfoForm.Row>
          )
        }
        return (
          <DetailInfoForm.Row key={row.id} type="single">
            <DetailInfoForm.Field
              label={row.label}
              labelWidth={200}
              view={formatCount(row.viewCount)}
            />
          </DetailInfoForm.Row>
        )
      })}
    </DetailInfoForm>
  )
}

export function MenuViewMetricMatrix({ metric }: Props) {
  if (metric.kind === 'simple') {
    return (
      <DetailInfoForm title="조회수" hideHeader mode="view" className="mvs-metric-form">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field label="대메뉴" view={formatCount(metric.entryViews)} />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    )
  }

  if (metric.kind === 'entry-posts') {
    return (
      <DetailInfoForm title="조회수" hideHeader mode="view" className="mvs-metric-form">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="대메뉴" view={formatCount(metric.entryViews)} />
          <DetailInfoForm.Field label="게시글 총 조회수" view={formatCount(metric.postViews)} />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    )
  }

  if (metric.kind === 'disabled') {
    return (
      <DetailInfoForm
        title="조회수"
        hideHeader
        mode="view"
        className="mvs-metric-form mvs-metric-form--disabled"
      >
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="대메뉴" view={metric.message} />
          <DetailInfoForm.Field label="게시글 총 조회수" view={metric.message} />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    )
  }

  // 투명경영: 대메뉴 행 + 중메뉴 행(값 = nested table)
  return (
    <DetailInfoForm
      title="투명경영 조회수"
      hideHeader
      mode="view"
      className="mvs-metric-form mvs-metric-form--transparency"
    >
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field label="대메뉴" view={formatCount(metric.entryViews)} />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field label="중메뉴" view={<MidMenuNestedForm rows={metric.midRows} />} />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
