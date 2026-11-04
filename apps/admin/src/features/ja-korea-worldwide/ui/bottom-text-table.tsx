/**
 * JA Worldwide — 하단 문구 영역 (상단 지부 테이블과 분리)
 */

import { DetailInfoForm } from '@jakorea/form-template-runtime'
import { CmsTextArea } from '@/shared/ui'

type BottomTextTableProps = {
  value: string
  mode: 'view' | 'edit'
  onChange: (value: string) => void
}

export function BottomTextTable({ value, mode, onChange }: BottomTextTableProps) {
  return (
    <DetailInfoForm title="하단 문구" hideHeader mode={mode} className="ja-worldwide-bottom">
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="하단 문구"
          view={<span className="ja-worldwide-bottom__text">{value || '-'}</span>}
          edit={
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
          }
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
