/**
 * JA Worldwide — 하단 문구 영역 (상단 지부 테이블과 분리)
 */

import { useEffect, useState, type ChangeEvent } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import { formatThousands, handleThousandsInputEvent } from '@/shared/lib/thousands-input'
import { CmsInput, CmsTextArea } from '@/shared/ui'

type BottomTextTableProps = {
  value: string
  statNumber: number
  mode: 'view' | 'edit'
  onChange: (value: string) => void
  /** 입력란을 비우면 null — 저장 시 필수값 검증 대상 */
  onStatNumberChange: (value: number | null) => void
}

export function BottomTextTable({
  value, statNumber, mode, onChange, onStatNumberChange,
}: BottomTextTableProps) {
  const [statDraft, setStatDraft] = useState(() => formatThousands(statNumber))

  // 조회 모드로 돌아가면(저장·취소) 서버 값 기준으로 다시 맞춘다.
  useEffect(() => {
    if (mode === 'view') setStatDraft(formatThousands(statNumber))
  }, [mode, statNumber])

  /** 입력 즉시 세 자리 콤마를 붙이고, 커서는 입력한 숫자 기준 위치를 유지한다. */
  const updateStat = (e: ChangeEvent<HTMLInputElement>) => {
    const result = handleThousandsInputEvent(e, { maxDigits: 16 })
    if (!result) return
    setStatDraft(result.formatted)
    onStatNumberChange(result.value)
  }

  return (
    <DetailInfoForm title="JA Worldwide 문구" hideHeader mode={mode} className="ja-worldwide-bottom">
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="JA Worldwide 수치"
          view={<span className="ja-worldwide-bottom__text">{formatThousands(statNumber)}</span>}
          edit={
            <CmsInput
              inputSize="medium"
              width="100%"
              inputMode="numeric"
              aria-label="JA Worldwide 수치"
              value={statDraft}
              onChange={updateStat}
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
