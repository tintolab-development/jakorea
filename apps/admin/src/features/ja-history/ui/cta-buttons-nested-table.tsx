/**
 * JA 살펴보기 — CTA 버튼 값 셀 안 중첩 테이블
 * 규격: apps/admin/.cursor/rules/design/detail-info-nested-table.mdc
 * 참고: main-content CtaNestedTable (버튼명|값|연결 링크|값 × 2행)
 */
import { CmsInput } from '@/shared/ui'

type CtaPair = {
  label: string
  href: string
}

type CtaButtonsNestedTableProps = {
  primary: CtaPair
  secondary: CtaPair
  editing: boolean
  onChangePrimary: (patch: Partial<CtaPair>) => void
  onChangeSecondary: (patch: Partial<CtaPair>) => void
}

export function CtaButtonsNestedTable({
  primary,
  secondary,
  editing,
  onChangePrimary,
  onChangeSecondary,
}: CtaButtonsNestedTableProps) {
  const rows = [
    {
      key: 'primary',
      buttonLabel: '버튼명 01',
      linkLabel: '연결 링크 01',
      data: primary,
      onChange: onChangePrimary,
    },
    {
      key: 'secondary',
      buttonLabel: '버튼명 02',
      linkLabel: '연결 링크 02',
      data: secondary,
      onChange: onChangeSecondary,
    },
  ] as const

  return (
    <div className="ja-history-cta-nested-table" role="group" aria-label="CTA 버튼">
      {rows.map(row => (
        <div key={row.key} className="ja-history-cta-nested-table__row">
          <div className="ja-history-cta-nested-table__cell">
            <div className="ja-history-cta-nested-table__label">{row.buttonLabel}</div>
            <div className="ja-history-cta-nested-table__value">
              {editing ? (
                <CmsInput
                  inputSize="medium"
                  width="100%"
                  value={row.data.label}
                  placeholder="버튼명을 입력하세요"
                  aria-label={row.buttonLabel}
                  onChange={event => row.onChange({ label: event.target.value })}
                />
              ) : (
                <span className="ja-history-cta-nested-table__text">{row.data.label || '-'}</span>
              )}
            </div>
          </div>
          <div className="ja-history-cta-nested-table__cell">
            <div className="ja-history-cta-nested-table__label">{row.linkLabel}</div>
            <div className="ja-history-cta-nested-table__value">
              {editing ? (
                <CmsInput
                  inputSize="medium"
                  width="100%"
                  value={row.data.href}
                  placeholder="연결 링크를 입력하세요"
                  aria-label={row.linkLabel}
                  onChange={event => row.onChange({ href: event.target.value })}
                />
              ) : (
                <span className="ja-history-cta-nested-table__text ja-history-cta-nested-table__text--url">
                  {row.data.href || '-'}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
