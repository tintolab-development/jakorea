import { DatePicker, Input } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { useRef } from 'react'
import type { UjatJournalEducationInfoParagraph } from '@/features/template/model/writing-form-draft.schema'
import { UJAT_JOURNAL_EDUCATION_INFO_GRADE_OPTIONS } from '@/features/template/model/writing-form-draft.schema'
import { DeferredBorderlessInput } from '@/features/template/ui/shared/deferred-borderless-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import {
  UserInfoPreviewTable,
  type UserInfoPreviewTableSkin,
} from '@/features/template/ui/paragraph/single-item/user-info'
import '@/features/template/ui/paragraph/table/vertical-table-paragraph-body.css'
import './ujat-journal-education-info.css'

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

function wrapClass(base: string, locked: boolean): string {
  return locked ? `${base} ${base}--disabled` : base
}

export type UjatJournalEducationInfoAutofill = {
  institutionName?: string
}

/**
 * 시안: 담당 학교명만 배정 연동 → 항상 disabled.
 * 학년/반·수업 일자는 작성 가능(템플릿 편집 시에도 활성).
 */
export function UjatJournalEducationInfo({
  paragraph,
  onChange,
  isEditMode,
  autofill,
  previewReadonly = false,
  previewSkin = 'surface',
  isTemplateAuthoringMode = false,
}: {
  paragraph: UjatJournalEducationInfoParagraph
  onChange: (next: UjatJournalEducationInfoParagraph) => void
  isEditMode: boolean
  autofill?: UjatJournalEducationInfoAutofill | null
  previewReadonly?: boolean
  previewSkin?: UserInfoPreviewTableSkin
  /** 템플릿 편집 — 학년/반·일자 활성 */
  isTemplateAuthoringMode?: boolean
}) {
  const paragraphRef = useRef(paragraph)
  paragraphRef.current = paragraph

  const schoolName = (autofill?.institutionName ?? paragraph.schoolDisplayFallback ?? '').trim()
  const fieldsLocked = isTemplateAuthoringMode ? false : !isEditMode

  if (previewReadonly) {
    const grade = paragraph.grade.trim() || UJAT_JOURNAL_EDU_INFO_PREVIEW_SAMPLES.grade
    const classSection =
      paragraph.classSection.trim() || UJAT_JOURNAL_EDU_INFO_PREVIEW_SAMPLES.classSection
    const prepDate = paragraph.prepDate.trim() || UJAT_JOURNAL_EDU_INFO_PREVIEW_SAMPLES.prepDate
    const sessionDate =
      paragraph.sessionDate.trim() || UJAT_JOURNAL_EDU_INFO_PREVIEW_SAMPLES.sessionDate
    const institutionName = schoolName || UJAT_JOURNAL_EDU_INFO_PREVIEW_SAMPLES.institutionName
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
    onChange({ ...paragraphRef.current, ...partial })
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
                <div className={wrapClass('ujat-journal-edu-info__field-wrap', true)}>
                  <Input
                    className="ujat-journal-edu-info__school-input"
                    variant="borderless"
                    value={schoolName}
                    disabled
                    placeholder="담당 학교명"
                    aria-label="담당 학교명"
                    aria-readonly={true}
                  />
                </div>
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
                    disabled={fieldsLocked}
                    options={UJAT_JOURNAL_EDUCATION_INFO_GRADE_OPTIONS}
                    value={paragraph.grade || undefined}
                    onChange={v => patch({ grade: String(v ?? '') })}
                    getPopupContainer={verticalTableFieldPopupContainer}
                  />
                  <span className="ujat-journal-edu-info__divider" role="presentation" />
                  <div className={wrapClass('ujat-journal-edu-info__class-wrap', fieldsLocked)}>
                    <DeferredBorderlessInput
                      className="ujat-journal-edu-info__class-input"
                      value={paragraph.classSection}
                      onCommit={next => patch({ classSection: next })}
                      disabled={fieldsLocked}
                      placeholder="반"
                      aria-label="반"
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
                    fieldsLocked ? 'ujat-journal-edu-info__dt-picker--disabled' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  className="form-editor-vertical-table__dt-picker-inner"
                  needConfirm={false}
                  styles={verticalTablePickerPopupStyles}
                  getPopupContainer={verticalTableFieldPopupContainer}
                  value={toDayjsDate(paragraph.prepDate)}
                  onChange={d => !fieldsLocked && patch({ prepDate: fromDayjsDate(d) })}
                  format="YYYY-MM-DD"
                  placeholder="수업 준비일"
                  disabled={fieldsLocked}
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
                    fieldsLocked ? 'ujat-journal-edu-info__dt-picker--disabled' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  className="form-editor-vertical-table__dt-picker-inner"
                  needConfirm={false}
                  styles={verticalTablePickerPopupStyles}
                  getPopupContainer={verticalTableFieldPopupContainer}
                  value={toDayjsDate(paragraph.sessionDate)}
                  onChange={d => !fieldsLocked && patch({ sessionDate: fromDayjsDate(d) })}
                  format="YYYY-MM-DD"
                  placeholder="수업 진행일"
                  disabled={fieldsLocked}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
