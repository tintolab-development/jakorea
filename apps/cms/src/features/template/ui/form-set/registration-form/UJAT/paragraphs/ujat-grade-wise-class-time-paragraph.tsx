import { useState } from 'react'
import type { Dayjs } from 'dayjs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ParagraphTimePicker } from '@/features/template/ui/paragraph/shared/paragraph-time-picker'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

function LessonTimeRow({ index }: { index: number }) {
  const [start, setStart] = useState<Dayjs | null>(null)
  const [end, setEnd] = useState<Dayjs | null>(null)

  return (
    <DetailInfoForm.Row type="single">
      <DetailInfoForm.Field
        label={`수업 진행 시간 ${String(index + 1).padStart(2, '0')}`}
        fullRow
        edit={
          <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap">
            <ParagraphTimePicker value={start} onChange={setStart} placeholder="시작" width={200} />
            <span style={{ color: 'var(--default-BK, #3d3d3d)', flexShrink: 0 }}>~</span>
            <ParagraphTimePicker value={end} onChange={setEnd} placeholder="종료" width={200} />
          </div>
        }
        view="-"
      />
    </DetailInfoForm.Row>
  )
}

/** UJAT 프로그램 등록 폼 — 학년 별 수업 시간 (추가 버튼은 단락 카드 제목 우측 `titleTrailing`) */
export function UjatGradeWiseClassTimeParagraph({ slotCount }: { slotCount: number }) {
  const safeCount = Math.max(1, slotCount)

  return (
    <DetailInfoForm
      title="학년 별 수업 시간"
      hideHeader
      mode="edit"
      className="program-registration-paragraph"
    >
      {Array.from({ length: safeCount }, (_, i) => (
        <LessonTimeRow key={i} index={i} />
      ))}
    </DetailInfoForm>
  )
}
