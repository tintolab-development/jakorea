/**
 * 메뉴별 조회 통계 — 메트릭 표
 * DetailInfoForm 외곽 + 값 셀 안 nested table
 * 규격: apps/admin/.cursor/rules/design/detail-info-nested-table.mdc
 * 참고: features/main-content/ui/nested-tables.tsx
 *        features/hero-banner/ui/text-link-cell.tsx (DetailInfoForm view 행)
 */

import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type {
  MenuViewMetric,
  TransparencySubRow,
} from '@/entities/menu-view-stats/model/types'
import { formatCount } from '@/features/menu-view-stats/lib/format-count'

import './metric-matrix.css'

type Props = {
  metric: MenuViewMetric
}

/** 중메뉴 값 셀 — CTA형 행 스택 nested table */
function MidMenuNestedTable({ rows }: { rows: TransparencySubRow[] }) {
  return (
    <div
      className="mvs-nested-table mvs-nested-table--mid"
      role="group"
      aria-label="중메뉴 조회수"
    >
      {rows.map(row => {
        const hasPosts = row.postViewCount !== undefined
        return (
          <div
            key={row.id}
            className={[
              'mvs-nested-table__row',
              hasPosts
                ? 'mvs-nested-table__row--double'
                : 'mvs-nested-table__row--single',
            ].join(' ')}
          >
            <div className="mvs-nested-table__cell">
              <div className="mvs-nested-table__label">{row.label}</div>
              <div className="mvs-nested-table__value">
                {formatCount(row.viewCount)}
              </div>
            </div>
            {hasPosts ? (
              <div className="mvs-nested-table__cell">
                <div className="mvs-nested-table__label">게시글 총 조회수</div>
                <div className="mvs-nested-table__value">
                  {formatCount(row.postViewCount)}
                </div>
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

export function MenuViewMetricMatrix({ metric }: Props) {
  if (metric.kind === 'simple') {
    return (
      <DetailInfoForm
        title="조회수"
        hideHeader
        mode="view"
        className="mvs-metric-form"
      >
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="대메뉴"
            view={formatCount(metric.entryViews)}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    )
  }

  if (metric.kind === 'entry-posts') {
    return (
      <DetailInfoForm
        title="조회수"
        hideHeader
        mode="view"
        className="mvs-metric-form"
      >
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="대메뉴"
            view={formatCount(metric.entryViews)}
          />
          <DetailInfoForm.Field
            label="게시글 총 조회수"
            view={formatCount(metric.postViews)}
          />
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
          <DetailInfoForm.Field
            label="게시글 총 조회수"
            view={metric.message}
          />
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
        <DetailInfoForm.Field
          label="대메뉴"
          view={formatCount(metric.entryViews)}
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="중메뉴"
          view={<MidMenuNestedTable rows={metric.midRows} />}
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
