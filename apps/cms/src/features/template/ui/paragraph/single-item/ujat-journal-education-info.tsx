import { DatePicker, Input, Select } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import type { UjatJournalEducationInfoParagraph } from '@/features/template/model/writing-form-draft.schema'
import {
  UJAT_JOURNAL_EDUCATION_INFO_CLASS_OPTIONS,
  UJAT_JOURNAL_EDUCATION_INFO_GRADE_OPTIONS,
  UJAT_JOURNAL_EDUCATION_INFO_SAMPLE_INSTITUTION_NAME,
} from '@/features/template/model/writing-form-draft.schema'
import '@/features/template/ui/paragraph/table/vertical-table-paragraph-body.css'
import './ujat-journal-education-info.css'

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

export type UjatJournalEducationInfoAutofill = {
  institutionName?: string
}

export function UjatJournalEducationInfo({
  paragraph,
  onChange,
  isEditMode,
  autofill,
}: {
  paragraph: UjatJournalEducationInfoParagraph
  onChange: (next: UjatJournalEducationInfoParagraph) => void
  isEditMode: boolean
  autofill?: UjatJournalEducationInfoAutofill | null
}) {
  const schoolName =
    (autofill?.institutionName ?? '').trim() ||
    (paragraph.schoolDisplayFallback ?? '').trim() ||
    UJAT_JOURNAL_EDUCATION_INFO_SAMPLE_INSTITUTION_NAME

  const patch = (partial: Partial<UjatJournalEducationInfoParagraph>) => {
    onChange({ ...paragraph, ...partial })
  }

  return (
    <div className="form-editor-body form-editor-vertical-table-wrap ujat-journal-edu-info">
      <div className="form-editor-vertical-table" role="grid">
        <div className="form-editor-vertical-table__row" role="row">
          <div className="form-editor-vertical-table__stage">
            <div className="form-editor-vertical-table__th" role="columnheader">
              <span>담당 학교명</span>
            </div>
            <div className="form-editor-vertical-table__td" role="gridcell">
              <div className="form-editor-vertical-table__cell-input-shell form-editor-vertical-table__cell-input-shell--body">
                <Input
                  className="ujat-journal-edu-info__school-input"
                  variant="borderless"
                  value={schoolName}
                  disabled
                  aria-readonly={true}
                />
              </div>
            </div>
          </div>
          <div className="form-editor-vertical-table__stage">
            <div className="form-editor-vertical-table__th" role="columnheader">
              <span>담당 학년/반</span>
            </div>
            <div className="form-editor-vertical-table__td" role="gridcell">
              <div className="form-editor-vertical-table__cell-input-shell form-editor-vertical-table__cell-input-shell--body">
                <div className="ujat-journal-edu-info__grade-class-row">
                  <div className="ujat-journal-edu-info__field-120">
                    <Select
                      className="ujat-journal-edu-info__select-grade"
                      placeholder="학년"
                      variant="borderless"
                      allowClear
                      disabled={!isEditMode}
                      options={UJAT_JOURNAL_EDUCATION_INFO_GRADE_OPTIONS}
                      value={paragraph.grade || undefined}
                      onChange={v => patch({ grade: String(v ?? '') })}
                      popupMatchSelectWidth={false}
                      getPopupContainer={verticalTableFieldPopupContainer}
                    />
                  </div>
                  <span className="ujat-journal-edu-info__divider" role="presentation" />
                  <div className="ujat-journal-edu-info__field-120">
                    <Select
                      className="ujat-journal-edu-info__select-class"
                      placeholder="반"
                      variant="borderless"
                      allowClear
                      disabled={!isEditMode}
                      options={UJAT_JOURNAL_EDUCATION_INFO_CLASS_OPTIONS}
                      value={paragraph.classSection || undefined}
                      onChange={v => patch({ classSection: String(v ?? '') })}
                      popupMatchSelectWidth={false}
                      getPopupContainer={verticalTableFieldPopupContainer}
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
              <span>수업 준비 일자</span>
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
                    'ujat-journal-edu-info__dt-picker',
                  ].join(' ')}
                  className="form-editor-vertical-table__dt-picker-inner"
                  needConfirm={false}
                  styles={verticalTablePickerPopupStyles}
                  getPopupContainer={verticalTableFieldPopupContainer}
                  value={toDayjsDate(paragraph.prepDate)}
                  onChange={d => isEditMode && patch({ prepDate: fromDayjsDate(d) })}
                  format="YYYY-MM-DD"
                  placeholder="수업 준비일"
                  disabled={!isEditMode}
                />
              </div>
            </div>
          </div>
          <div className="form-editor-vertical-table__stage">
            <div className="form-editor-vertical-table__th" role="columnheader">
              <span>수업 진행 일자</span>
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
                    'ujat-journal-edu-info__dt-picker',
                  ].join(' ')}
                  className="form-editor-vertical-table__dt-picker-inner"
                  needConfirm={false}
                  styles={verticalTablePickerPopupStyles}
                  getPopupContainer={verticalTableFieldPopupContainer}
                  value={toDayjsDate(paragraph.sessionDate)}
                  onChange={d => isEditMode && patch({ sessionDate: fromDayjsDate(d) })}
                  format="YYYY-MM-DD"
                  placeholder="수업 진행일"
                  disabled={!isEditMode}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
