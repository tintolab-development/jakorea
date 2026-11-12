import fieldDeleteUrl from '@/shared/assets/icons/inputs/delete-20-default.svg'
import { Fragment } from 'react'
import { formatCmsScheduleKoreanDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import {
  canRemoveEducationSchedulePreviewLine,
  chronologicalEducationScheduleLineIndexes,
} from '@/features/template/lib/format-education-schedule-line'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import './education-schedule-preview-lines.css'

export const EDUCATION_SCHEDULE_PREVIEW_PLACEHOLDER =
  '교육 진행 일정을 선택해 주세요. (해당 란에는 선택한 날짜가 노출됩니다.)'

/** 일정 제거 — 시안 `Icon / Field / w20` delete 원본 */
function EducationSchedulePreviewRemoveIcon() {
  return <img src={fieldDeleteUrl} width={20} height={20} alt="" aria-hidden draggable={false} />
}

export type EducationSchedulePreviewLinesProps = {
  lines: readonly string[]
  /** 지정 시 각 행에 X 제거 버튼 노출 */
  onRemove?: (index: number) => void
  placeholder?: string
  /**
   * true(기본): 이미 시작한 줄은 X 숨김(프로그램 상세).
   * false: 등록 위저드 — 지난 일정도 삭제.
   */
  lockStartedLines?: boolean
}

/**
 * 교육 진행 예정일 목록 — 구분선 + 텍스트 + (선택) X
 * 표시는 날짜 → 시각 오름차순(설정 중 새 일정을 추가해도 시간순 자리로 간다).
 * 저장 배열 순서는 그대로 두고, X는 원래 인덱스로 `onRemove`에 넘긴다.
 */
export function EducationSchedulePreviewLines({
  lines,
  onRemove,
  placeholder = EDUCATION_SCHEDULE_PREVIEW_PLACEHOLDER,
  lockStartedLines = true,
}: EducationSchedulePreviewLinesProps) {
  if (lines.length === 0) {
    return (
      <span className="program-registration-paragraph__schedule-preview-placeholder">{placeholder}</span>
    )
  }

  const editable = onRemove != null

  return (
    <div className="education-schedule-preview-lines">
      {chronologicalEducationScheduleLineIndexes(lines).map((index, position) => {
        const line = lines[index] ?? ''
        const displayLine = formatCmsScheduleKoreanDisplayLabel(line)
        return (
          <Fragment key={`${line}-${index}`}>
            {position > 0 ? <DetailInfoForm.InputsSeparator /> : null}
            <span className="education-schedule-preview-lines__item">
              <span className="detail-info-form--text nowrap">{displayLine}</span>
              {editable &&
              canRemoveEducationSchedulePreviewLine(line, undefined, { lockStartedLines }) ? (
                <button
                  type="button"
                  className="education-schedule-preview-lines__remove"
                  aria-label={`${displayLine} 제거`}
                  onClick={() => onRemove(index)}
                >
                  <EducationSchedulePreviewRemoveIcon />
                </button>
              ) : null}
            </span>
          </Fragment>
        )
      })}
    </div>
  )
}
