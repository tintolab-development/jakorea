/**
 * 콘텐츠 01/02 값 셀 안 중첩 테이블 — 타이틀 + 설명글
 * 규격: apps/admin/.cursor/rules/design/detail-info-nested-table.mdc
 */
import type { IntroContentBlock } from '@/entities/ja-korea-intro/model/types'
import { CmsInput, CmsTextArea } from '@/shared/ui'

type ContentNestedTableProps = {
  data: IntroContentBlock
  mode: 'view' | 'edit'
  ariaLabel: string
  onChange: (patch: Partial<IntroContentBlock>) => void
}

export function ContentNestedTable({
  data,
  mode,
  ariaLabel,
  onChange,
}: ContentNestedTableProps) {
  return (
    <div
      className="ja-korea-intro-nested-table ja-korea-intro-nested-table--content"
      role="group"
      aria-label={ariaLabel}
    >
      <div className="ja-korea-intro-nested-table__cell">
        <div className="ja-korea-intro-nested-table__label">타이틀</div>
        <div className="ja-korea-intro-nested-table__value">
          {mode === 'edit' ? (
            <CmsInput
              inputSize="medium"
              width="100%"
              value={data.title}
              onChange={e => onChange({ title: e.target.value })}
              placeholder="타이틀을 입력하세요"
              aria-label={`${ariaLabel} 타이틀`}
            />
          ) : (
            <span className="ja-korea-intro-preline">{data.title || '-'}</span>
          )}
        </div>
      </div>
      <div className="ja-korea-intro-nested-table__cell">
        <div className="ja-korea-intro-nested-table__label">설명글</div>
        <div className="ja-korea-intro-nested-table__value ja-korea-intro-nested-table__value--textarea">
          {mode === 'edit' ? (
            <CmsTextArea
              className="cms-textarea--fixed-rows"
              inputSize="medium"
              width="100%"
              rows={3}
              value={data.description}
              onChange={e => onChange({ description: e.target.value })}
              placeholder="설명글을 입력하세요"
              aria-label={`${ariaLabel} 설명글`}
            />
          ) : (
            <span className="ja-korea-intro-preline">{data.description || '-'}</span>
          )}
        </div>
      </div>
    </div>
  )
}
