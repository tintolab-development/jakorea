/**
 * JA Worldwide — 하단 문구 영역 (상단 지부 테이블과 분리)
 */

import { useEffect, useState } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import { CmsInput, CmsTextArea } from '@/shared/ui'

type BottomTextTableProps = {
  value: string
  statNumber: number
  mode: 'view' | 'edit'
  onChange: (value: string) => void
  onStatNumberChange: (value: number) => void
}

export function BottomTextTable({
  value, statNumber, mode, onChange, onStatNumberChange,
}: BottomTextTableProps) {
  const [statDraft, setStatDraft] = useState(() => statNumber.toLocaleString('en-US'))

  // Do not reformat a focused edit on every keystroke (caret would jump).
  useEffect(() => {
    if (mode === 'view') setStatDraft(statNumber.toLocaleString('en-US'))
  }, [mode, statNumber])

  const updateStat = (raw: string) => {
    if (!/^[0-9,]*$/.test(raw)) return
    const digits = raw.replaceAll(',', '')
    if (digits.length > 16) return
    const next = digits === '' ? 0 : Number(digits)
    if (!Number.isSafeInteger(next) || next < 0) return
    setStatDraft(raw)
    onStatNumberChange(next)
  }

  return (
    <DetailInfoForm title="JA Worldwide 문구" hideHeader mode={mode} className="ja-worldwide-bottom">
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="상단 텍스트"
          view={<span className="ja-worldwide-bottom__text">{statNumber.toLocaleString('en-US')}</span>}
          edit={
            <CmsInput
              inputSize="medium"
              width="100%"
              inputMode="numeric"
              aria-label="JA Worldwide 상단 텍스트 숫자"
              value={statDraft}
              onChange={e => updateStat(e.target.value)}
              onBlur={() => setStatDraft(statNumber.toLocaleString('en-US'))}
            />
          }
        />
      </DetailInfoForm.Row>
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
