/**
 * JA Worldwide — 하단 문구 영역 (상단 지부 테이블과 분리)
 * 시안 th/td 스펙은 flex row로 구현 (table + display:flex 는 레이아웃 붕괴)
 */

import { CmsTextArea } from '@/shared/ui'

type BottomTextTableProps = {
  value: string
  mode: 'view' | 'edit'
  onChange: (value: string) => void
}

export function BottomTextTable({ value, mode, onChange }: BottomTextTableProps) {
  return (
    <div className="ja-worldwide-bottom" role="region" aria-label="하단 문구">
      <div className="ja-worldwide-bottom__label">하단 문구</div>
      <div className="ja-worldwide-bottom__value">
        {mode === 'edit' ? (
          <CmsTextArea
            className="cms-textarea--fixed-rows"
            inputSize="medium"
            width="100%"
            rows={3}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="하단 문구를 입력하세요"
            aria-label="하단 문구"
          />
        ) : (
          <span className="ja-worldwide-bottom__text">{value || '-'}</span>
        )}
      </div>
    </div>
  )
}
