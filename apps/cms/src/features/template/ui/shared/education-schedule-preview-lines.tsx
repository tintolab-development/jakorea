import { Fragment } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import './education-schedule-preview-lines.css'

export const EDUCATION_SCHEDULE_PREVIEW_PLACEHOLDER =
  '교육 진행 일정을 선택해 주세요. (해당 란에는 선택한 날짜가 노출됩니다.)'

function EducationSchedulePreviewRemoveIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 8.70252L10.0487 10.7513C10.141 10.8436 10.2641 10.8908 10.4178 10.8928C10.5715 10.8949 10.696 10.8477 10.7913 10.7513C10.8866 10.655 10.9343 10.5325 10.9343 10.3837C10.9343 10.2349 10.8866 10.1123 10.7913 10.016L8.74252 7.96727L10.7913 5.91852C10.8836 5.82619 10.9308 5.70308 10.9328 5.54919C10.9349 5.39547 10.8877 5.27097 10.7913 5.17569C10.696 5.08025 10.5735 5.03252 10.4247 5.03252C10.2759 5.03252 10.1533 5.08025 10.057 5.17569L8.00827 7.22444L5.95952 5.17569C5.86719 5.08336 5.74408 5.03614 5.59019 5.03402C5.43647 5.03197 5.31197 5.07919 5.21669 5.17569C5.12125 5.27097 5.07352 5.39347 5.07352 5.54227C5.07352 5.69108 5.12125 5.81369 5.21669 5.90894L7.26544 7.95769L5.21669 10.016C5.12436 10.1083 5.07714 10.2314 5.07502 10.3853C5.07297 10.539 5.12019 10.6635 5.21669 10.7588C5.31197 10.8542 5.43447 10.9019 5.58327 10.9019C5.73208 10.9019 5.85469 10.8542 5.94994 10.7588L8 8.70252ZM8.00113 14.3333C7.12513 14.3333 6.30169 14.1671 5.53081 13.8347C4.75994 13.5022 4.08969 13.051 3.52006 12.4813C2.95044 11.9117 2.49925 11.2414 2.1665 10.4706C1.83375 9.69969 1.66738 8.87625 1.66738 8.00025C1.66738 7.12425 1.83356 6.30081 2.16594 5.52994C2.49831 4.75906 2.9495 4.08881 3.5195 3.51919C4.0895 2.94956 4.75975 2.49838 5.53031 2.16563C6.30088 1.83288 7.12431 1.6665 8.00069 1.6665C8.87706 1.6665 9.7005 1.83269 10.471 2.16506C11.2415 2.49744 11.9117 2.94863 12.4817 3.51863C13.0517 4.08863 13.5029 4.75888 13.8356 5.52944C14.1684 6.29994 14.3348 7.12338 14.3348 8.00025C14.3348 8.87713 14.1686 9.70056 13.8362 10.4714C13.5038 11.2423 13.0526 11.9125 12.4826 12.4819C11.9126 13.0514 11.2424 13.5026 10.4718 13.8353C9.70131 14.1681 8.87788 14.3345 8.00113 14.3333Z"
        fill="#3D3D3D"
        fillOpacity="0.5"
      />
    </svg>
  )
}

export type EducationSchedulePreviewLinesProps = {
  lines: readonly string[]
  /** 지정 시 각 행에 X 제거 버튼 노출 */
  onRemove?: (index: number) => void
  placeholder?: string
}

/** 교육 진행 예정일 목록 — 구분선 + 텍스트 + (선택) X */
export function EducationSchedulePreviewLines({
  lines,
  onRemove,
  placeholder = EDUCATION_SCHEDULE_PREVIEW_PLACEHOLDER,
}: EducationSchedulePreviewLinesProps) {
  if (lines.length === 0) {
    return (
      <span className="program-registration-paragraph__schedule-preview-placeholder">{placeholder}</span>
    )
  }

  const editable = onRemove != null

  return (
    <div className="education-schedule-preview-lines">
      {lines.map((line, index) => (
        <Fragment key={`${line}-${index}`}>
          {index > 0 ? <DetailInfoForm.InputsSeparator /> : null}
          <span className="education-schedule-preview-lines__item">
            <span className="detail-info-form--text nowrap">{line}</span>
            {editable ? (
              <button
                type="button"
                className="education-schedule-preview-lines__remove"
                aria-label={`${line} 제거`}
                onClick={() => onRemove(index)}
              >
                <EducationSchedulePreviewRemoveIcon />
              </button>
            ) : null}
          </span>
        </Fragment>
      ))}
    </div>
  )
}
