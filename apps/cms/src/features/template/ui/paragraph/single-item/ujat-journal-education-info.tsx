import { DatePicker, Input } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import type { UjatJournalEducationInfoParagraph } from '@/features/template/model/writing-form-draft.schema'
import {
  UJAT_JOURNAL_EDUCATION_INFO_CLASS_OPTIONS,
  UJAT_JOURNAL_EDUCATION_INFO_GRADE_OPTIONS,
} from '@/features/template/model/writing-form-draft.schema'
import { CmsSelect } from '@/shared/ui/cms-select'
import {
  UserInfoPreviewTable,
  type UserInfoPreviewTableSkin,
} from '@/features/template/ui/paragraph/single-item/user-info'
import '@/features/template/ui/form-editor/form-editor-template-field-hint.css'
import '@/features/template/ui/paragraph/table/vertical-table-paragraph-body.css'
import './ujat-journal-education-info.css'

const TEMPLATE_AUTO_USER_INFO_HINT = '로그인 사용자 정보가 자동으로 반영됩니다.'

const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

const UJAT_JOURNAL_EDU_INFO_PREVIEW_SAMPLES = {
  institutionName: '틴토초등학교',
  grade: '2',
  classSection: '3',
  prepDate: '2026-09-15',
  sessionDate: '2026-09-15',
} as const

function formatKoreanDateWithWeekday(raw: string): string {
  const d = dayjs(raw, 'YYYY-MM-DD', true)
  if (!d.isValid()) return raw
  const weekday = WEEKDAYS_KO[d.day()] ?? ''
  return `${d.year()}년 ${d.month() + 1}월 ${d.date()}일(${weekday})`
}

function formatGradeClass(grade: string, classSection: string): string {
  const g = grade.trim()
  const c = classSection.trim()
  const gLabel = g ? (g.endsWith('학년') ? g : `${g}학년`) : ''
  const cLabel = c ? (c.endsWith('반') ? c : `${c}반`) : ''
  return [gLabel, cLabel].filter(Boolean).join(' ')
}

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
  previewReadonly = false,
  previewSkin = 'surface',
}: {
  paragraph: UjatJournalEducationInfoParagraph
  onChange: (next: UjatJournalEducationInfoParagraph) => void
  isEditMode: boolean
  autofill?: UjatJournalEducationInfoAutofill | null
  previewReadonly?: boolean
  previewSkin?: UserInfoPreviewTableSkin
}) {
  const schoolName = (autofill?.institutionName ?? '').trim()

  if (previewReadonly) {
    const grade = paragraph.grade.trim() || UJAT_JOURNAL_EDU_INFO_PREVIEW_SAMPLES.grade
    const classSection =
      paragraph.classSection.trim() || UJAT_JOURNAL_EDU_INFO_PREVIEW_SAMPLES.classSection
    const prepDate = paragraph.prepDate.trim() || UJAT_JOURNAL_EDU_INFO_PREVIEW_SAMPLES.prepDate
    const sessionDate =
      paragraph.sessionDate.trim() || UJAT_JOURNAL_EDU_INFO_PREVIEW_SAMPLES.sessionDate
    const institutionName =
      schoolName ||
      (paragraph.schoolDisplayFallback ?? '').trim() ||
      UJAT_JOURNAL_EDU_INFO_PREVIEW_SAMPLES.institutionName
    return (
      <UserInfoPreviewTable
        selectedEntries={[
          { key: 'institutionName', label: '담당 학교명' },
          { key: 'gradeClass', label: '담당 학년/반' },
          { key: 'prepDate', label: '수업 준비 일자' },
          { key: 'sessionDate', label: '수업 진행 일자' },
        ]}
        skin={previewSkin}
        previewValues={{
          institutionName,
          gradeClass: formatGradeClass(grade, classSection),
          prepDate: formatKoreanDateWithWeekday(prepDate),
          sessionDate: formatKoreanDateWithWeekday(sessionDate),
        }}
      />
    )
  }

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
                {schoolName ? (
                  <Input
                    className="ujat-journal-edu-info__school-input"
                    variant="borderless"
                    value={schoolName}
                    disabled
                    aria-readonly={true}
                  />
                ) : (
                  <span className="form-editor-template-field-hint-text">
                    {TEMPLATE_AUTO_USER_INFO_HINT}
                  </span>
                )}
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
                  <CmsSelect
                    inputSize="medium"
                    width={120}
                    withAllOption={false}
                    placeholder="학년"
                    disabled={!isEditMode}
                    options={UJAT_JOURNAL_EDUCATION_INFO_GRADE_OPTIONS}
                    value={paragraph.grade || undefined}
                    onChange={v => patch({ grade: String(v ?? '') })}
                    getPopupContainer={verticalTableFieldPopupContainer}
                  />
                  <span className="ujat-journal-edu-info__divider" role="presentation" />
                  <CmsSelect
                    inputSize="medium"
                    width={120}
                    withAllOption={false}
                    placeholder="반"
                    disabled={!isEditMode}
                    options={UJAT_JOURNAL_EDUCATION_INFO_CLASS_OPTIONS}
                    value={paragraph.classSection || undefined}
                    onChange={v => patch({ classSection: String(v ?? '') })}
                    getPopupContainer={verticalTableFieldPopupContainer}
                  />
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
