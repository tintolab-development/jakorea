import { DatePicker, Input, TimePicker } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import type { ReactNode } from 'react'
import type { LectureReportProgramProgressParagraph } from '@/features/template/model/writing-form-draft.schema'
import '@/features/template/ui/form-editor/form-editor-template-field-hint.css'
import '@/features/template/ui/paragraph/table/vertical-table-paragraph-body.css'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import './lecture-report-program-progress.css'

dayjs.extend(customParseFormat)

const LECTURE_REPORT_PROGRAM_PROGRESS_AUTO_HINT =
  '배정된 프로그램·기관·교육 일정 정보가 자동으로 반영됩니다.'

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

function fromDayjsDate(d: Dayjs | null): string {
  if (!d || !d.isValid()) return ''
  return d.format('YYYY-MM-DD')
}

function toDayjsTime(raw: string): Dayjs | null {
  if (!raw?.trim()) return null
  const d = dayjs(raw, 'HH:mm', true)
  return d.isValid() ? d : null
}

function fromDayjsTime(d: Dayjs | null): string {
  if (!d || !d.isValid()) return ''
  return d.format('HH:mm')
}

function ProgramProgressCell({
  value,
  isTemplateAuthoringMode,
  control,
}: {
  value: string
  isTemplateAuthoringMode: boolean
  control: ReactNode
}) {
  if (isTemplateAuthoringMode && value.trim() === '') {
    return (
      <span className="form-editor-template-field-hint-text">
        {LECTURE_REPORT_PROGRAM_PROGRESS_AUTO_HINT}
      </span>
    )
  }
  return control
}

export function LectureReportProgramProgress({
  paragraph,
  onChange,
  isEditMode,
  isTemplateAuthoringMode = false,
}: {
  paragraph: LectureReportProgramProgressParagraph
  onChange: (next: LectureReportProgramProgressParagraph) => void
  isEditMode: boolean
  /** 템플릿 편집 — 프로그램 연동 안내. false: 실제 응답·프로그램 미리보기 본문 */
  isTemplateAuthoringMode?: boolean
}) {
  const patch = (partial: Partial<LectureReportProgramProgressParagraph>) => {
    onChange({ ...paragraph, ...partial })
  }

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
                <ProgramProgressCell
                  value={paragraph.programName}
                  isTemplateAuthoringMode={isTemplateAuthoringMode}
                  control={
                    <Input
                      className="lecture-report-prog-info__input"
                      variant="borderless"
                      value={paragraph.programName}
                      onChange={e => patch({ programName: e.target.value })}
                      disabled={!isEditMode}
                      placeholder="입력"
                    />
                  }
                />
              </div>
            </div>
          </div>
          <div className="form-editor-vertical-table__stage">
            <div className="form-editor-vertical-table__th" role="columnheader">
              <span>교육진행자 최종 인원</span>
            </div>
            <div className="form-editor-vertical-table__td" role="gridcell">
              <div className="form-editor-vertical-table__cell-input-shell form-editor-vertical-table__cell-input-shell--body">
                <ProgramProgressCell
                  value={paragraph.finalInstructorCount}
                  isTemplateAuthoringMode={isTemplateAuthoringMode}
                  control={
                    <Input
                      className="lecture-report-prog-info__input"
                      variant="borderless"
                      value={paragraph.finalInstructorCount}
                      onChange={e => patch({ finalInstructorCount: e.target.value })}
                      disabled={!isEditMode}
                      placeholder="입력"
                    />
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="form-editor-vertical-table__row" role="row">
          <div className="form-editor-vertical-table__stage">
            <div className="form-editor-vertical-table__th" role="columnheader">
              <span>기관명</span>
            </div>
            <div className="form-editor-vertical-table__td" role="gridcell">
              <div className="form-editor-vertical-table__cell-input-shell form-editor-vertical-table__cell-input-shell--body">
                <ProgramProgressCell
                  value={paragraph.institutionName}
                  isTemplateAuthoringMode={isTemplateAuthoringMode}
                  control={
                    <Input
                      className="lecture-report-prog-info__input"
                      variant="borderless"
                      value={paragraph.institutionName}
                      onChange={e => patch({ institutionName: e.target.value })}
                      disabled={!isEditMode}
                      placeholder="입력"
                    />
                  }
                />
              </div>
            </div>
          </div>
          <div className="form-editor-vertical-table__stage">
            <div className="form-editor-vertical-table__th" role="columnheader">
              <span>기관 소재지</span>
            </div>
            <div className="form-editor-vertical-table__td" role="gridcell">
              <div className="form-editor-vertical-table__cell-input-shell form-editor-vertical-table__cell-input-shell--body">
                <ProgramProgressCell
                  value={paragraph.institutionLocation}
                  isTemplateAuthoringMode={isTemplateAuthoringMode}
                  control={
                    <Input
                      className="lecture-report-prog-info__input"
                      variant="borderless"
                      value={paragraph.institutionLocation}
                      onChange={e => patch({ institutionLocation: e.target.value })}
                      disabled={!isEditMode}
                      placeholder="입력"
                    />
                  }
                />
              </div>
            </div>
          </div>
        </div>

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
                <ProgramProgressCell
                  value={paragraph.educationDate}
                  isTemplateAuthoringMode={isTemplateAuthoringMode}
                  control={
                    <DatePicker
                      rootClassName={[
                        'form-editor-vertical-table__field-box',
                        'form-editor-vertical-table__field-box--picker',
                        'form-editor-vertical-table__dt-picker--full',
                        'lecture-report-prog-info__dt-picker',
                      ].join(' ')}
                      className="form-editor-vertical-table__dt-picker-inner"
                      needConfirm={false}
                      styles={verticalTablePickerPopupStyles}
                      getPopupContainer={verticalTableFieldPopupContainer}
                      value={toDayjsDate(paragraph.educationDate)}
                      onChange={d => isEditMode && patch({ educationDate: fromDayjsDate(d) })}
                      format="YYYY-MM-DD"
                      placeholder="날짜 선택"
                      disabled={!isEditMode}
                    />
                  }
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
                <ProgramProgressCell
                  value={`${paragraph.sessionTime}${paragraph.sessionIndex}`}
                  isTemplateAuthoringMode={isTemplateAuthoringMode}
                  control={
                    <div className="lecture-report-prog-info__time-session-row">
                      <div className="lecture-report-prog-info__time-wrap">
                        <TimePicker
                          rootClassName={[
                            'form-editor-vertical-table__field-box',
                            'form-editor-vertical-table__field-box--picker',
                            'lecture-report-prog-info__time-picker',
                          ].join(' ')}
                          className="form-editor-vertical-table__dt-picker-inner"
                          needConfirm={false}
                          styles={verticalTablePickerPopupStyles}
                          getPopupContainer={verticalTableFieldPopupContainer}
                          value={toDayjsTime(paragraph.sessionTime)}
                          onChange={d => isEditMode && patch({ sessionTime: fromDayjsTime(d) })}
                          format="HH:mm"
                          placeholder="시간"
                          disabled={!isEditMode}
                        />
                      </div>
                      <span className="lecture-report-prog-info__divider" role="presentation" />
                      <div className="lecture-report-prog-info__session-wrap">
                        <Input
                          className="lecture-report-prog-info__session-input"
                          variant="borderless"
                          value={paragraph.sessionIndex}
                          onChange={e => patch({ sessionIndex: e.target.value })}
                          disabled={!isEditMode}
                          placeholder="차시"
                        />
                      </div>
                    </div>
                  }
                />
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
                <ProgramProgressCell
                  value={paragraph.educationTarget}
                  isTemplateAuthoringMode={isTemplateAuthoringMode}
                  control={
                    <Input
                      className="lecture-report-prog-info__input"
                      variant="borderless"
                      value={paragraph.educationTarget}
                      onChange={e => patch({ educationTarget: e.target.value })}
                      disabled={!isEditMode}
                      placeholder="입력"
                    />
                  }
                />
              </div>
            </div>
          </div>
          <div className="form-editor-vertical-table__stage">
            <div className="form-editor-vertical-table__th" role="columnheader">
              <span>학급 및 학생 수</span>
            </div>
            <div className="form-editor-vertical-table__td" role="gridcell">
              <div className="form-editor-vertical-table__cell-input-shell form-editor-vertical-table__cell-input-shell--body">
                <ProgramProgressCell
                  value={`${paragraph.classLabel}${paragraph.studentCount}`}
                  isTemplateAuthoringMode={isTemplateAuthoringMode}
                  control={
                    <div className="lecture-report-prog-info__time-session-row">
                      <div className="lecture-report-prog-info__class-wrap">
                        <Input
                          className="lecture-report-prog-info__session-input"
                          variant="borderless"
                          value={paragraph.classLabel}
                          onChange={e => patch({ classLabel: e.target.value })}
                          disabled={!isEditMode}
                          placeholder="학급"
                        />
                      </div>
                      <span className="lecture-report-prog-info__divider" role="presentation" />
                      <div className="lecture-report-prog-info__count-wrap">
                        <CmsNumericInput
                          mode="integer"
                          min={0}
                          className="lecture-report-prog-info__session-input"
                          inputSize="medium"
                          width="100%"
                          value={paragraph.studentCount}
                          onValueChange={value => patch({ studentCount: value })}
                          disabled={!isEditMode}
                          placeholder="총 인원"
                        />
                      </div>
                    </div>
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
