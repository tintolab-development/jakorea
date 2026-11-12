import { DatePicker, Input, TimePicker } from 'antd'
import time18Url from '@/shared/assets/icons/inputs/time-18-default.svg'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { useRef } from 'react'
import type { LectureReportProgramProgressParagraph } from '@/features/template/model/writing-form-draft.schema'
import '@/features/template/ui/paragraph/table/vertical-table-paragraph-body.css'
import { DeferredBorderlessInput } from '@/features/template/ui/shared/deferred-borderless-input'
import {
  UserInfoPreviewTable,
  type UserInfoPreviewTableSkin,
} from '@/features/template/ui/paragraph/single-item/user-info'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import { formatAppDatepickerDisplay } from '@/shared/ui/app-datepicker'
import { formatDateDotWithWeekday } from '@/shared/utils/date'
import './lecture-report-program-progress.css'

dayjs.extend(customParseFormat)

const verticalTablePickerPopupStyles = {
  popup: {
    root: { minWidth: 300, zIndex: 3100 },
  },
} as const

function verticalTableFieldPopupContainer(): HTMLElement {
  return document.body
}

function toDayjsDate(raw: string): Dayjs | null {
  if (!raw?.trim()) return null
  const d = dayjs(raw, 'YYYY-MM-DD', true)
  return d.isValid() ? d : null
}

function toDayjsTime(raw: string): Dayjs | null {
  if (!raw?.trim()) return null
  const d = dayjs(raw, 'HH:mm', true)
  return d.isValid() ? d : null
}

function wrapClass(base: string, locked: boolean): string {
  return locked ? `${base} ${base}--disabled` : base
}

function displayOrDash(value: string | undefined): string {
  const trimmed = value?.trim() ?? ''
  return trimmed || '-'
}

function joinSplit(left: string | undefined, right: string | undefined): string {
  const parts = [left, right].map(part => part?.trim() ?? '').filter(Boolean)
  return parts.length > 0 ? parts.join(' | ') : '-'
}

function formatProgressEducationDate(raw: string | undefined): string {
  const trimmed = raw?.trim() ?? ''
  if (!trimmed) return '-'
  const formatted = formatDateDotWithWeekday(trimmed)
  return formatted === '-' ? trimmed : formatted
}

/**
 * 시안: 배정 연동 필드는 전부 disabled(회색).
 * 「진행 단원」만 작성 가능(흰 배경).
 * 강의보고서 보기 — 일반 텍스트 표, 개인형은 기관명·소재지 숨김.
 */
export function LectureReportProgramProgress({
  paragraph,
  onChange,
  isEditMode,
  isTemplateAuthoringMode = false,
  previewReadonly = false,
  previewSkin = 'surface',
  hideInstitutionFields = false,
}: {
  paragraph: LectureReportProgramProgressParagraph
  onChange: (next: LectureReportProgramProgressParagraph) => void
  isEditMode: boolean
  /** 템플릿 편집 — 진행 단원은 시안상 항상 활성 */
  isTemplateAuthoringMode?: boolean
  previewReadonly?: boolean
  previewSkin?: UserInfoPreviewTableSkin
  hideInstitutionFields?: boolean
}) {
  const paragraphRef = useRef(paragraph)
  paragraphRef.current = paragraph

  if (previewReadonly) {
    const entries = [
      { key: 'programName', label: '프로그램명' },
      { key: 'textbook', label: '사용교재 및 진행단원' },
      ...(!hideInstitutionFields
        ? [
            { key: 'institutionName', label: '기관명' },
            { key: 'institutionLocation', label: '기관 소재지' },
          ]
        : []),
      { key: 'educationDate', label: '교육 진행일' },
      { key: 'session', label: '교육 진행 시간(차시)' },
      { key: 'educationTarget', label: '교육 대상' },
      { key: 'classCount', label: '학급 및 학생 수' },
    ]
    return (
      <UserInfoPreviewTable
        selectedEntries={entries}
        skin={previewSkin}
        previewValues={{
          programName: displayOrDash(paragraph.programName),
          textbook: joinSplit(paragraph.textbookName, paragraph.progressUnit),
          institutionName: displayOrDash(paragraph.institutionName),
          institutionLocation: displayOrDash(paragraph.institutionLocation),
          educationDate: formatProgressEducationDate(paragraph.educationDate),
          session: joinSplit(paragraph.sessionTime, paragraph.sessionIndex),
          educationTarget: displayOrDash(paragraph.educationTarget),
          classCount: joinSplit(paragraph.classLabel, paragraph.studentCount),
        }}
      />
    )
  }

  const patch = (partial: Partial<LectureReportProgramProgressParagraph>) => {
    onChange({ ...paragraphRef.current, ...partial })
  }

  const autofillLocked = true
  const progressUnitLocked = isTemplateAuthoringMode ? false : !isEditMode

  return (
    <div className="form-editor-body form-editor-vertical-table-wrap lecture-report-prog-info">
      <div className="form-editor-vertical-table" role="grid">
        <div className="form-editor-vertical-table__row" role="row">
          <div className="form-editor-vertical-table__stage">
            <div className="form-editor-vertical-table__th" role="columnheader">
              <span>프로그램명</span>
            </div>
            <div className="form-editor-vertical-table__td" role="gridcell">
              <div className="form-editor-vertical-table__cell-input-shell form-editor-vertical-table__cell-input-shell--body">
                <div className={wrapClass('lecture-report-prog-info__field-wrap', autofillLocked)}>
                  <Input
                    className="lecture-report-prog-info__session-input"
                    variant="borderless"
                    value={paragraph.programName}
                    disabled={autofillLocked}
                    placeholder="프로그램명"
                    aria-label="프로그램명"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="form-editor-vertical-table__stage">
            <div className="form-editor-vertical-table__th" role="columnheader">
              <span>사용교재 및 진행단원</span>
            </div>
            <div className="form-editor-vertical-table__td" role="gridcell">
              <div className="form-editor-vertical-table__cell-input-shell form-editor-vertical-table__cell-input-shell--body">
                <div className="lecture-report-prog-info__time-session-row">
                  <div className={wrapClass('lecture-report-prog-info__split-wrap', autofillLocked)}>
                    <Input
                      className="lecture-report-prog-info__session-input"
                      variant="borderless"
                      value={paragraph.textbookName}
                      disabled={autofillLocked}
                      placeholder="교재명"
                      aria-label="교재명"
                    />
                  </div>
                  <span className="lecture-report-prog-info__divider" role="presentation" />
                  <div className={wrapClass('lecture-report-prog-info__split-wrap', progressUnitLocked)}>
                    <DeferredBorderlessInput
                      className="lecture-report-prog-info__session-input"
                      value={paragraph.progressUnit}
                      onCommit={next => patch({ progressUnit: next })}
                      disabled={progressUnitLocked}
                      placeholder="진행 단원"
                      aria-label="진행 단원"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {hideInstitutionFields ? null : (
        <div className="form-editor-vertical-table__row" role="row">
          <div className="form-editor-vertical-table__stage">
            <div className="form-editor-vertical-table__th" role="columnheader">
              <span>기관명</span>
            </div>
            <div className="form-editor-vertical-table__td" role="gridcell">
              <div className="form-editor-vertical-table__cell-input-shell form-editor-vertical-table__cell-input-shell--body">
                <div className={wrapClass('lecture-report-prog-info__field-wrap', autofillLocked)}>
                  <Input
                    className="lecture-report-prog-info__session-input"
                    variant="borderless"
                    value={paragraph.institutionName}
                    disabled={autofillLocked}
                    placeholder="기관명"
                    aria-label="기관명"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="form-editor-vertical-table__stage">
            <div className="form-editor-vertical-table__th" role="columnheader">
              <span>기관 소재지</span>
            </div>
            <div className="form-editor-vertical-table__td" role="gridcell">
              <div className="form-editor-vertical-table__cell-input-shell form-editor-vertical-table__cell-input-shell--body">
                <div className={wrapClass('lecture-report-prog-info__field-wrap', autofillLocked)}>
                  <Input
                    className="lecture-report-prog-info__session-input"
                    variant="borderless"
                    value={paragraph.institutionLocation}
                    disabled={autofillLocked}
                    placeholder="기관 소재지"
                    aria-label="기관 소재지"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        <div className="form-editor-vertical-table__row" role="row">
          <div className="form-editor-vertical-table__stage">
            <div className="form-editor-vertical-table__th" role="columnheader">
              <span>교육 진행일</span>
            </div>
            <div className="form-editor-vertical-table__td" role="gridcell">
              <div
                className={[
                  'form-editor-vertical-table__cell-input-shell',
                  'form-editor-vertical-table__cell-input-shell--body',
                  'form-editor-vertical-table__cell-input-shell--body-dt-full',
                ].join(' ')}
              >
                <DatePicker
                  rootClassName={[
                    'form-editor-vertical-table__field-box',
                    'form-editor-vertical-table__field-box--picker',
                    'form-editor-vertical-table__dt-picker--full',
                    'lecture-report-prog-info__dt-picker',
                    'lecture-report-prog-info__picker--disabled',
                  ].join(' ')}
                  className="form-editor-vertical-table__dt-picker-inner"
                  needConfirm={false}
                  styles={verticalTablePickerPopupStyles}
                  getPopupContainer={verticalTableFieldPopupContainer}
                  value={toDayjsDate(paragraph.educationDate)}
                  format={formatAppDatepickerDisplay}
                  placeholder="교육 진행일"
                  disabled={autofillLocked}
                />
              </div>
            </div>
          </div>
          <div className="form-editor-vertical-table__stage">
            <div className="form-editor-vertical-table__th" role="columnheader">
              <span>교육 진행 시간(차시)</span>
            </div>
            <div className="form-editor-vertical-table__td" role="gridcell">
              <div className="form-editor-vertical-table__cell-input-shell form-editor-vertical-table__cell-input-shell--body">
                <div className="lecture-report-prog-info__time-session-row">
                  <div className="lecture-report-prog-info__time-wrap">
                    <TimePicker
                      rootClassName={[
                        'form-editor-vertical-table__field-box',
                        'form-editor-vertical-table__field-box--picker',
                        'lecture-report-prog-info__time-picker',
                        'lecture-report-prog-info__picker--disabled',
                      ].join(' ')}
                      className="form-editor-vertical-table__dt-picker-inner"
                      needConfirm={false}
                      styles={verticalTablePickerPopupStyles}
                      getPopupContainer={verticalTableFieldPopupContainer}
                      value={toDayjsTime(paragraph.sessionTime)}
                      format="HH:mm"
                      placeholder="교육 진행 시간"
                      disabled={autofillLocked}
                      suffixIcon={<img src={time18Url} width={18} height={18} alt="" aria-hidden draggable={false} />}
                    />
                  </div>
                  <span className="lecture-report-prog-info__divider" role="presentation" />
                  <div className={wrapClass('lecture-report-prog-info__session-wrap', autofillLocked)}>
                    <Input
                      className="lecture-report-prog-info__session-input"
                      variant="borderless"
                      value={paragraph.sessionIndex}
                      disabled={autofillLocked}
                      placeholder="진행 차시"
                      aria-label="진행 차시"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="form-editor-vertical-table__row" role="row">
          <div className="form-editor-vertical-table__stage">
            <div className="form-editor-vertical-table__th" role="columnheader">
              <span>교육 대상</span>
            </div>
            <div className="form-editor-vertical-table__td" role="gridcell">
              <div className="form-editor-vertical-table__cell-input-shell form-editor-vertical-table__cell-input-shell--body">
                <div className={wrapClass('lecture-report-prog-info__field-wrap', autofillLocked)}>
                  <Input
                    className="lecture-report-prog-info__session-input"
                    variant="borderless"
                    value={paragraph.educationTarget}
                    disabled={autofillLocked}
                    placeholder="교육 대상"
                    aria-label="교육 대상"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="form-editor-vertical-table__stage">
            <div className="form-editor-vertical-table__th" role="columnheader">
              <span>학급 및 학생 수</span>
            </div>
            <div className="form-editor-vertical-table__td" role="gridcell">
              <div className="form-editor-vertical-table__cell-input-shell form-editor-vertical-table__cell-input-shell--body">
                <div className="lecture-report-prog-info__time-session-row">
                  <div className={wrapClass('lecture-report-prog-info__class-wrap', autofillLocked)}>
                    <Input
                      className="lecture-report-prog-info__session-input"
                      variant="borderless"
                      value={paragraph.classLabel}
                      disabled={autofillLocked}
                      placeholder="교육 학급(반)"
                      aria-label="교육 학급(반)"
                    />
                  </div>
                  <span className="lecture-report-prog-info__divider" role="presentation" />
                  <div className={wrapClass('lecture-report-prog-info__count-wrap', autofillLocked)}>
                    <CmsNumericInput
                      mode="integer"
                      min={0}
                      className="lecture-report-prog-info__session-input"
                      inputSize="medium"
                      width="100%"
                      value={paragraph.studentCount}
                      disabled={autofillLocked}
                      placeholder="총 학생 수"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
