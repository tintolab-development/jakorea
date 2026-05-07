import { DatePicker, Input, TimePicker } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import type { LectureReportProgramProgressParagraph } from '@/features/template/model/writing-form-draft.schema'
import '@/features/template/ui/paragraph/table/vertical-table-paragraph-body.css'
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

export function LectureReportProgramProgress({
  paragraph,
  onChange,
  isEditMode,
}: {
  paragraph: LectureReportProgramProgressParagraph
  onChange: (next: LectureReportProgramProgressParagraph) => void
  isEditMode: boolean
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
                <Input
                  className="lecture-report-prog-info__input"
                  variant="borderless"
                  value={paragraph.programName}
                  onChange={e => patch({ programName: e.target.value })}
                  disabled={!isEditMode}
                  placeholder="입력"
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
                <Input
                  className="lecture-report-prog-info__input"
                  variant="borderless"
                  value={paragraph.finalInstructorCount}
                  onChange={e => patch({ finalInstructorCount: e.target.value })}
                  disabled={!isEditMode}
                  placeholder="입력"
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
                <Input
                  className="lecture-report-prog-info__input"
                  variant="borderless"
                  value={paragraph.institutionName}
                  onChange={e => patch({ institutionName: e.target.value })}
                  disabled={!isEditMode}
                  placeholder="입력"
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
                <Input
                  className="lecture-report-prog-info__input"
                  variant="borderless"
                  value={paragraph.institutionLocation}
                  onChange={e => patch({ institutionLocation: e.target.value })}
                  disabled={!isEditMode}
                  placeholder="입력"
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
                <Input
                  className="lecture-report-prog-info__input"
                  variant="borderless"
                  value={paragraph.educationTarget}
                  onChange={e => patch({ educationTarget: e.target.value })}
                  disabled={!isEditMode}
                  placeholder="입력"
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
                    <Input
                      className="lecture-report-prog-info__session-input"
                      variant="borderless"
                      value={paragraph.studentCount}
                      onChange={e => patch({ studentCount: e.target.value })}
                      disabled={!isEditMode}
                      placeholder="총 인원"
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
