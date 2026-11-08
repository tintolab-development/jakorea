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
          label="하단 텍스트"
          view={<span className="ja-worldwide-bottom__text">{value || '-'}</span>}
          edit={
            <CmsTextArea
              layout="fixed"
              inputSize="medium"
              width="100%"
              // 줄바꿈·텍스트 길이만큼 높이가 늘고 줄어든다(hug) — 리사이즈 핸들 없음(layout fixed)
              autoSize={{ minRows: 1 }}
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder="하단 문구를 입력해 주세요"
              aria-label="하단 문구"
            />
          }
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
