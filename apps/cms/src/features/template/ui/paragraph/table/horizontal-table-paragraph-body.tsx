import { useMemo, useState } from 'react'
import { DatePicker, Input, Select, TimePicker } from 'antd'
import type { RadioChangeEvent } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import type {
  HorizontalTableColumnField,
  HorizontalTableFieldCellValue,
  HorizontalTableParagraph,
  HorizontalTableRowSelection,
  TableBottomConsent,
} from '@/features/template/model/writing-form-draft.schema'
import {
  createEmptyFieldCellValue,
  fieldCellValueToPlainText,
  getEffectiveHorizontalCellField,
  HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
  horizontalTableSetFieldCellValue,
  normalizeHorizontalTableParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { PERSONAL_INFO_HORIZONTAL_TABLE_DISCLAIMER_PARAGRAPH_IDS } from '@/features/template/lib/personal-info-horizontal-table-disclaimer-paragraph-ids'
import { ParagraphInput } from '@/features/template/ui/paragraph/shared/paragraph-input'
import type { PaymentStatementCalculationLinesViewModel } from '@/features/template/model/lecture-fee-calculation-lines-sample'
import type { PaymentStatementBasicInfoAutofillValues } from '@/features/template/ui/form-set/payment-statement-basic-info-detail-form'
import type { LectureFeeCalculationAutofillValues } from '@/features/template/ui/form-set/lecture-fee-calculation-detail-form'
import type { PaymentStatementIssuanceParagraphDisplayMode } from '@/features/template/ui/form-set/payment-statement-issuance/display-mode'
import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '@/features/template/model/payment-statement-pre-consent-draft'
import { renderPaymentStatementIssuanceParagraphBody } from '@/features/template/ui/form-set/payment-statement-issuance/paragraph-body'
import { renderApplicantRecruitFormIndividualParagraphBody } from '@/features/template/ui/form-set/recruit-form/individual/paragraph-body'
import { renderApplicantRecruitFormInstitutionParagraphBody } from '@/features/template/ui/form-set/recruit-form/institution/paragraph-body'
import { renderUjatRecruitFormInstitutionParagraphBody } from '@/features/template/ui/form-set/recruit-form/UJAT-institution/paragraph-body'
import { renderRecruitFormInstructorParagraphBody } from '@/features/template/ui/form-set/recruit-form/instructor/paragraph-body'
import { renderRecruitFormVolunteerParagraphBody } from '@/features/template/ui/form-set/recruit-form/volunteer/paragraph-body'
import { renderUjatRecruitFormVolunteerParagraphBody } from '@/features/template/ui/form-set/recruit-form/UJAT-volunteer/paragraph-body'
import { renderProgramApplicationFormInstitutionParagraphBody } from '@/features/template/ui/form-set/application-form/institution/paragraph-body'
import { renderUjatProgramApplicationFormInstitutionParagraphBody } from '@/features/template/ui/form-set/application-form/UJAT-institution/paragraph-body'
import { renderUjatProgramApplicationFormVolunteerParagraphBody } from '@/features/template/ui/form-set/application-form/UJAT-volunteer/paragraph-body'
import {
  renderProgramApplicationFormInstructorParagraphBody,
  type ProgramApplicationFormInstructorBodyOptions,
} from '@/features/template/ui/form-set/application-form/instructor/paragraph-body'
import {
  renderProgramApplicationFormVolunteerParagraphBody,
  type ProgramApplicationFormVolunteerBodyOptions,
} from '@/features/template/ui/form-set/application-form/volunteer/paragraph-body'
import {
  renderProgramRegistrationParagraphBody,
  type ProgramRegistrationParagraphBodyOptions,
} from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { renderUjatProgramRegistrationParagraphBody } from '@/features/template/ui/form-set/registration-form/UJAT/paragraph-body'
import type {
  UjatProgramApplicationGradeClassTimeParagraphOptions,
  UjatProgramApplicationGradeInfoParagraphOptions,
} from '@/features/template/ui/form-set/application-form/UJAT-institution/ujat-program-application-institution-body-options'
import type { ParagraphBodyInteractionMode } from '@/features/template/ui/paragraph/paragraph-body-interaction-mode'
import { IdTypeWithInputBody } from '@/features/template/ui/paragraph/single-item/id-type-with-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import '@/features/template/ui/form-editor/form-editor.css'
import '@/features/template/ui/form-editor/form-editor-horizontal-table.css'

dayjs.extend(customParseFormat)

/** 좌측 `.form-editor-left`(overflow: auto) 안에서 팝업이 잘리지 않도록 body에 붙임 */
function horizontalTableFieldPopupContainer(): HTMLElement {
  return document.body
}

/** 셀 트리거는 max 249px — rc-picker가 패널 너비를 트리거에 맞추면 7열 캘린더·헤더가 잘림 */
const horizontalTablePickerPopupStyles = {
  popup: {
    root: { minWidth: 300 },
  },
} as const

/** 날짜+시간: 시간 패널이 캘린더 옆에 같이 노출되도록 팝업 폭 확보 */
const horizontalTableDateTimePickerPopupStyles = {
  popup: {
    root: { minWidth: 560 },
  },
} as const

const horizontalTableDateTimeShowTime = {
  format: 'HH:mm',
  minuteStep: 5,
} as const

/** 우측 패널 `유형` 라디오(날짜/시간/날짜+시간)에 맞는 placeholder — 비어 있을 때만 모드별 기본 */
function dateTimeFieldPlaceholder(
  field: Extract<HorizontalTableColumnField, { kind: 'dateTime' }>
): string {
  const t = field.placeholder?.trim() ?? ''
  if (t.length > 0) return field.placeholder
  if (field.dateTimeMode === 'date') return '날짜를 선택해 주세요'
  if (field.dateTimeMode === 'time') return '시간을 선택해 주세요'
  return '날짜·시간을 선택해 주세요'
}

/** 캔버스 테이블 셀 전용 — 우측 커스텀 필드는 비번호 고정 문구 유지 */
function tableHeaderPlaceholder(_colIndex: number) {
  return '항목명을 입력해 주세요'
}

function tableCellPlaceholder(_colIndex: number, _rowIndex: number) {
  return '텍스트를 입력해 주세요'
}

/** 필드형·비편집: 텍스트형은 기본 안내 문구·셀별 placeholder 조합 */
function fieldNonEditCellPlaceholder(
  field: HorizontalTableColumnField,
  colIdx: number,
  rowIdx: number
): string {
  if (field.kind === 'dateTime') {
    const t = field.placeholder?.trim()
    if (t.length > 0) return field.placeholder
    return dateTimeFieldPlaceholder(field)
  }
  if (field.kind === 'text') {
    const t = field.placeholder?.trim()
    return t.length > 0 && t !== HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER
      ? field.placeholder
      : tableCellPlaceholder(colIdx, rowIdx)
  }
  if (field.kind === 'subjective' || field.kind === 'dropdown') {
    const t = field.placeholder?.trim()
    return t.length > 0 ? field.placeholder : HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER
  }
  return tableCellPlaceholder(colIdx, rowIdx)
}

function HorizontalTableCellText({
  value,
  placeholder,
  variant,
}: {
  value: string
  placeholder: string
  variant: 'header' | 'body'
}) {
  const filled = value.trim().length > 0
  return (
    <span
      className={[
        'form-editor-horizontal-table__cell-text',
        variant === 'header'
          ? 'form-editor-horizontal-table__cell-text--header'
          : 'form-editor-horizontal-table__cell-text--body',
        !filled ? 'form-editor-horizontal-table__cell-text--placeholder' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {filled ? value : placeholder}
    </span>
  )
}

function isEventFromTableInteractive(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.closest(
      [
        '.ant-input',
        '.ant-select',
        '.ant-select-selector',
        '.ant-picker',
        '.ant-picker-input',
        '.ant-checkbox',
        '.ant-checkbox-wrapper',
        '.ant-radio',
        '.ant-radio-wrapper',
        'input',
        'textarea',
        'label',
        'button',
      ].join(',')
    ) != null
  )
}

function rehomeForDisplay(
  f: HorizontalTableColumnField,
  cell: HorizontalTableFieldCellValue
): HorizontalTableFieldCellValue {
  if (cell.kind === f.kind) return cell
  return createEmptyFieldCellValue(f)
}

function toDayjs(mode: 'date' | 'time' | 'dateTime', raw: string): Dayjs | null {
  if (!raw?.trim()) return null
  if (mode === 'date') {
    const d = dayjs(raw, 'YYYY-MM-DD', true)
    return d.isValid() ? d : null
  }
  if (mode === 'time') {
    const d = dayjs(raw, 'HH:mm', true)
    return d.isValid() ? d : null
  }
  const d = dayjs(raw, 'YYYY-MM-DD HH:mm', true)
  return d.isValid() ? d : null
}

function fromDayjs(mode: 'date' | 'time' | 'dateTime', d: Dayjs | null): string {
  if (!d || !d.isValid()) return ''
  if (mode === 'date') return d.format('YYYY-MM-DD')
  if (mode === 'time') return d.format('HH:mm')
  return d.format('YYYY-MM-DD HH:mm')
}

function FieldTableBodyCell({
  field,
  cell,
  rowIdx: _rowIdx,
  colIdx: _colIdx,
  isEditMode,
  ph,
  onFieldChange,
  onSelectBodyRow,
}: {
  field: HorizontalTableColumnField
  cell: HorizontalTableFieldCellValue
  rowIdx: number
  colIdx: number
  isEditMode: boolean
  ph: string
  onFieldChange: (v: HorizontalTableFieldCellValue) => void
  onSelectBodyRow: () => void
}) {
  if (!isEditMode) {
    const text = fieldCellValueToPlainText(rehomeForDisplay(field, cell))
    return <HorizontalTableCellText value={text} placeholder={ph} variant="body" />
  }

  if (field.kind === 'text') {
    const text = fieldCellValueToPlainText(rehomeForDisplay(field, cell))
    return <HorizontalTableCellText value={text} placeholder={ph} variant="body" />
  }

  if (field.kind === 'subjective') {
    const essayValue = cell.kind === 'subjective' || cell.kind === 'text' ? cell.value : ''
    return (
      <div
        className="form-editor-horizontal-table__field-box form-editor-horizontal-table__field-box--text"
        title="주관식형"
      >
        <Input
          variant="borderless"
          className="form-editor-horizontal-table__field-text-input"
          value={essayValue}
          placeholder={ph}
          onChange={e => onFieldChange({ kind: 'subjective', value: e.target.value })}
          onFocus={onSelectBodyRow}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') e.stopPropagation()
          }}
        />
      </div>
    )
  }

  if (field.kind === 'dateTime' && field.dateTimeMode === 'time') {
    return (
      <TimePicker
        key={`ht-dt-${field.dateTimeMode}-c${_colIdx}-r${_rowIdx}`}
        rootClassName="form-editor-horizontal-table__field-box form-editor-horizontal-table__field-box--picker"
        className="form-editor-horizontal-table__field-time"
        needConfirm={false}
        styles={horizontalTablePickerPopupStyles}
        getPopupContainer={horizontalTableFieldPopupContainer}
        value={toDayjs('time', cell.kind === 'dateTime' ? cell.value : '')}
        onChange={d => onFieldChange({ kind: 'dateTime', value: fromDayjs('time', d) })}
        onFocus={onSelectBodyRow}
        format="HH:mm"
        minuteStep={5}
        placeholder={ph}
      />
    )
  }

  if (field.kind === 'dateTime' && field.dateTimeMode === 'date') {
    return (
      <DatePicker
        key={`ht-dt-${field.dateTimeMode}-c${_colIdx}-r${_rowIdx}`}
        rootClassName="form-editor-horizontal-table__field-box form-editor-horizontal-table__field-box--picker"
        className="form-editor-horizontal-table__field-date"
        needConfirm={false}
        styles={horizontalTablePickerPopupStyles}
        getPopupContainer={horizontalTableFieldPopupContainer}
        value={toDayjs('date', cell.kind === 'dateTime' ? cell.value : '')}
        onChange={d => onFieldChange({ kind: 'dateTime', value: fromDayjs('date', d) })}
        onFocus={onSelectBodyRow}
        format="YYYY-MM-DD"
        placeholder={ph}
      />
    )
  }

  if (field.kind === 'dateTime' && field.dateTimeMode === 'dateTime') {
    return (
      <DatePicker
        key={`ht-dt-${field.dateTimeMode}-c${_colIdx}-r${_rowIdx}`}
        rootClassName="form-editor-horizontal-table__field-box form-editor-horizontal-table__field-box--picker"
        className="form-editor-horizontal-table__field-datetime"
        showTime={horizontalTableDateTimeShowTime}
        needConfirm={false}
        styles={horizontalTableDateTimePickerPopupStyles}
        getPopupContainer={horizontalTableFieldPopupContainer}
        value={toDayjs('dateTime', cell.kind === 'dateTime' ? cell.value : '')}
        onChange={d => onFieldChange({ kind: 'dateTime', value: fromDayjs('dateTime', d) })}
        onFocus={onSelectBodyRow}
        format="YYYY-MM-DD HH:mm"
        placeholder={ph}
      />
    )
  }

  if (field.kind === 'dropdown') {
    return (
      <Select
        className="form-editor-horizontal-table__field-select form-editor-horizontal-table__field-box form-editor-horizontal-table__field-box--dropdown"
        value={cell.kind === 'dropdown' && cell.value ? cell.value : undefined}
        options={field.options.map(o => ({ value: o, label: o }))}
        placeholder={ph}
        onChange={v => onFieldChange({ kind: 'dropdown', value: (v as string) ?? '' })}
        onFocus={onSelectBodyRow}
        getPopupContainer={horizontalTableFieldPopupContainer}
      />
    )
  }

  if (field.kind === 'single') {
    return (
      <CmsRadio.Group
        size="large"
        className="form-editor-horizontal-table__field-radios"
        value={cell.kind === 'single' ? cell.value : undefined}
        onChange={(e: RadioChangeEvent) => onFieldChange({ kind: 'single', value: e.target.value })}
        onFocus={onSelectBodyRow}
      >
        {field.options.map((o, i) => (
          <CmsRadio key={i} size="large" value={o}>
            {o}
          </CmsRadio>
        ))}
      </CmsRadio.Group>
    )
  }

  if (field.kind === 'multiple') {
    const checked = cell.kind === 'multiple' ? cell.values : []
    return (
      <div
        className="form-editor-horizontal-table__field-checks"
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') e.stopPropagation()
        }}
      >
        {field.options.map((o, i) => (
          <CmsCheckbox
            key={i}
            checkboxSize="large"
            className="form-editor-horizontal-table__field-check-label"
            checked={checked.includes(o)}
            onChange={e => {
              const s = new Set(checked)
              if (e.target.checked) s.add(o)
              else s.delete(o)
              onFieldChange({ kind: 'multiple', values: [...s] })
            }}
            onFocus={onSelectBodyRow}
          >
            {o}
          </CmsCheckbox>
        ))}
      </div>
    )
  }

  return null
}

export function HorizontalTableParagraphBody({
  paragraph,
  onChange,
  isEditMode,
  /** false: 구조 잠금·작성 모드 등 — 격자 클릭·행 선택·셀 포커스·편집 비활성 */
  tableCanvasInteractive = true,
  /** 구조 잠금 작성 중에도 하단 동의 라디오만 조작 가능 */
  bottomConsentPreviewInAuthoring = false,
  tableRowSelection: controlledSelection,
  onTableRowSelectionChange,
  paymentStatementBasicInfoValues,
  paymentStatementBasicInfoOnlyPaymentPurposeLocked,
  lectureFeeCalculationValues,
  paymentStatementCalculationLines,
  paymentStatementDisplayMode,
  programRegistration,
  ujatProgramRegistration,
  programApplicationFormInstitution,
  ujatProgramApplicationFormInstitution,
  ujatProgramApplicationFormVolunteer,
  ujatProgramApplicationGradeInfo,
  ujatProgramApplicationGradeClassTime,
  applicantRecruitFormInstitution,
  ujatRecruitFormInstitution,
  applicantRecruitFormIndividual,
  recruitFormInstructor,
  recruitFormVolunteer,
  ujatRecruitFormVolunteer,
  programApplicationFormInstructor,
  programApplicationFormVolunteer,
  paragraphInteractionMode = 'authoring',
}: {
  paragraph: HorizontalTableParagraph
  onChange: (next: HorizontalTableParagraph) => void
  isEditMode: boolean
  tableCanvasInteractive?: boolean
  bottomConsentPreviewInAuthoring?: boolean
  /** 있으면 상위(우측 패널)와 행 선택 동기화 */
  tableRowSelection?: HorizontalTableRowSelection | null
  onTableRowSelectionChange?: (next: HorizontalTableRowSelection | null) => void
  paymentStatementBasicInfoValues?: Partial<PaymentStatementBasicInfoAutofillValues>
  paymentStatementBasicInfoOnlyPaymentPurposeLocked?: boolean
  lectureFeeCalculationValues?: Partial<LectureFeeCalculationAutofillValues>
  paymentStatementCalculationLines?: PaymentStatementCalculationLinesViewModel
  paymentStatementDisplayMode?: PaymentStatementIssuanceParagraphDisplayMode
  programRegistration?: ProgramRegistrationParagraphBodyOptions
  ujatProgramRegistration?: boolean
  /** 프로그램 참여자 신청 폼 (학교) 시드 단락 — `DetailInfoForm` 본문 */
  programApplicationFormInstitution?: boolean
  /** UJAT 프로그램 학교 신청 폼 시드 단락 — `DetailInfoForm` 본문 */
  ujatProgramApplicationFormInstitution?: boolean
  /** UJAT 프로그램 봉사자 신청 폼 시드 단락 — `DetailInfoForm` 본문 */
  ujatProgramApplicationFormVolunteer?: boolean
  ujatProgramApplicationGradeInfo?: UjatProgramApplicationGradeInfoParagraphOptions
  ujatProgramApplicationGradeClassTime?: UjatProgramApplicationGradeClassTimeParagraphOptions
  /** 프로그램 참여자 모집 폼 (학교) 시드 단락 — `DetailInfoForm` 본문 */
  applicantRecruitFormInstitution?: boolean
  /** UJAT 프로그램 학교 모집 폼 시드 단락 — `DetailInfoForm` 본문 */
  ujatRecruitFormInstitution?: boolean
  /** 프로그램 참여자 모집 폼 (개인) 시드 단락 — `DetailInfoForm` 본문 */
  applicantRecruitFormIndividual?: boolean
  /** 프로그램 강사 모집 폼 시드 단락 — `DetailInfoForm` 본문 */
  recruitFormInstructor?: boolean
  /** 프로그램 봉사자 모집 폼 시드 단락 — `DetailInfoForm` 본문 */
  recruitFormVolunteer?: boolean
  /** UJAT 프로그램 봉사자 모집 폼 시드 단락 — `DetailInfoForm` 본문 */
  ujatRecruitFormVolunteer?: boolean
  programApplicationFormInstructor?: ProgramApplicationFormInstructorBodyOptions
  programApplicationFormVolunteer?: ProgramApplicationFormVolunteerBodyOptions
  paragraphInteractionMode?: ParagraphBodyInteractionMode
}) {
  const p = useMemo(() => normalizeHorizontalTableParagraph(paragraph), [paragraph])

  const [internalSelection, setInternalSelection] = useState<HorizontalTableRowSelection | null>(
    null
  )
  const isControlled = onTableRowSelectionChange != null
  const selection = isControlled ? (controlledSelection ?? null) : internalSelection
  const setSelection = (next: HorizontalTableRowSelection | null) => {
    if (isControlled) onTableRowSelectionChange(next)
    else setInternalSelection(next)
  }

  const layout = useMemo(() => {
    const colCount = Math.max(1, p.columnHeaders.length)
    const headers = p.columnHeaders.slice(0, colCount)
    while (headers.length < colCount) headers.push('')
    const rows = p.dataRows.map(r => {
      const row = [...r]
      while (row.length < colCount) row.push('')
      return row.slice(0, colCount)
    })
    if (rows.length === 0) {
      rows.push(Array.from({ length: colCount }, () => ''))
    }
    return { colCount, headers, rows }
  }, [p.columnHeaders, p.dataRows])

  const activeSelection = useMemo((): HorizontalTableRowSelection | null => {
    if (selection == null) return null
    if (selection.area === 'header') return selection
    if (selection.row < 0 || selection.row >= layout.rows.length) return null
    return selection
  }, [selection, layout.rows.length])

  const programRegistrationBody = renderProgramRegistrationParagraphBody(p, programRegistration)
  if (programRegistrationBody != null) return programRegistrationBody

  const ujatProgramRegistrationBody = renderUjatProgramRegistrationParagraphBody(
    p,
    ujatProgramRegistration
  )
  if (ujatProgramRegistrationBody != null) return ujatProgramRegistrationBody

  const applicantRecruitFormIndividualBody = renderApplicantRecruitFormIndividualParagraphBody(
    p,
    applicantRecruitFormIndividual
  )
  if (applicantRecruitFormIndividualBody != null) return applicantRecruitFormIndividualBody

  const applicantRecruitFormInstitutionBody = renderApplicantRecruitFormInstitutionParagraphBody(
    p,
    applicantRecruitFormInstitution
  )
  if (applicantRecruitFormInstitutionBody != null) return applicantRecruitFormInstitutionBody

  const ujatRecruitFormInstitutionBody = renderUjatRecruitFormInstitutionParagraphBody(
    p,
    ujatRecruitFormInstitution
  )
  if (ujatRecruitFormInstitutionBody != null) return ujatRecruitFormInstitutionBody

  const recruitFormInstructorBody = renderRecruitFormInstructorParagraphBody(
    p,
    recruitFormInstructor
  )
  if (recruitFormInstructorBody != null) return recruitFormInstructorBody

  const recruitFormVolunteerBody = renderRecruitFormVolunteerParagraphBody(
    p,
    recruitFormVolunteer,
    programApplicationFormVolunteer
  )
  if (recruitFormVolunteerBody != null) return recruitFormVolunteerBody

  const ujatRecruitFormVolunteerBody = renderUjatRecruitFormVolunteerParagraphBody(
    p,
    ujatRecruitFormVolunteer,
    programApplicationFormVolunteer
  )
  if (ujatRecruitFormVolunteerBody != null) return ujatRecruitFormVolunteerBody

  const programApplicationFormInstitutionBody =
    renderProgramApplicationFormInstitutionParagraphBody(p, programApplicationFormInstitution)
  if (programApplicationFormInstitutionBody != null) return programApplicationFormInstitutionBody

  const ujatProgramApplicationFormInstitutionBody =
    renderUjatProgramApplicationFormInstitutionParagraphBody(
      p,
      ujatProgramApplicationFormInstitution,
      ujatProgramApplicationGradeInfo,
      ujatProgramApplicationGradeClassTime,
      paragraphInteractionMode
    )
  if (ujatProgramApplicationFormInstitutionBody != null)
    return ujatProgramApplicationFormInstitutionBody

  const ujatProgramApplicationFormVolunteerBody =
    renderUjatProgramApplicationFormVolunteerParagraphBody(p, ujatProgramApplicationFormVolunteer)
  if (ujatProgramApplicationFormVolunteerBody != null)
    return ujatProgramApplicationFormVolunteerBody

  const programApplicationFormInstructorBody = renderProgramApplicationFormInstructorParagraphBody(
    p,
    programApplicationFormInstructor
  )
  if (programApplicationFormInstructorBody != null) return programApplicationFormInstructorBody

  const programApplicationFormVolunteerBody = renderProgramApplicationFormVolunteerParagraphBody(
    p,
    programApplicationFormVolunteer
  )
  if (programApplicationFormVolunteerBody != null) return programApplicationFormVolunteerBody

  const paymentStatementBody = renderPaymentStatementIssuanceParagraphBody({
    paragraph: p,
    values: {
      basicInfo: paymentStatementBasicInfoValues,
      lectureFeeCalculation: lectureFeeCalculationValues,
      calculationLines: paymentStatementCalculationLines,
    },
    displayMode: paymentStatementDisplayMode,
    onlyPaymentPurposeLocked: paymentStatementBasicInfoOnlyPaymentPurposeLocked,
  })
  if (paymentStatementBody != null) return paymentStatementBody

  const { colCount, headers, rows } = layout

  const isHeaderRowSelected = () => activeSelection?.area === 'header'

  const isBodyRowSelected = (rowIdx: number) =>
    activeSelection?.area === 'body' && activeSelection.row === rowIdx

  const toggleHeaderRow = () => {
    setSelection(activeSelection?.area === 'header' ? null : { area: 'header' })
  }

  const toggleBodyCellSelection = (rowIdx: number, colIdx: number) => {
    if (activeSelection?.area === 'body' && activeSelection.row === rowIdx) {
      const curCol = Math.min(Math.max(activeSelection.col ?? 0, 0), colCount - 1)
      if (curCol === colIdx) {
        setSelection(null)
        return
      }
    }
    setSelection({ area: 'body', row: rowIdx, col: colIdx })
  }

  const focusBodyCell = (rowIdx: number, colIdx: number) => {
    setSelection({ area: 'body', row: rowIdx, col: colIdx })
  }

  const setHeaderValue = (col: number, value: string) => {
    const next = [...p.columnHeaders]
    while (next.length < colCount) next.push('')
    const slice = next.slice(0, colCount)
    slice[col] = value
    onChange({ ...p, columnHeaders: slice })
  }

  const setTextCellValue = (rowIdx: number, colIdx: number, value: string) => {
    const nextRows = p.dataRows.map(r => [...r])
    const row = [...(nextRows[rowIdx] ?? [])]
    while (row.length <= colIdx) row.push('')
    row[colIdx] = value
    nextRows[rowIdx] = row
    onChange({ ...p, dataRows: nextRows })
  }

  const isField = p.tableFlavor === 'field'
  const canvasInteractive = tableCanvasInteractive
  const effectiveEditMode = isEditMode && canvasInteractive
  const bottomConsentInteractive = effectiveEditMode || bottomConsentPreviewInAuthoring

  const isAgreementNoticeTable = p.id === 'agreement-notice-table'
  const isAgreementPortraitTable =
    p.id === 'agreement-portrait-personal-consent-table' ||
    p.id === 'agreement-portrait-delegated-consent-table' ||
    p.id === 'agreement-portrait-usage-table'
  const isPaymentStatementPreConsentP1 = p.id === PAYMENT_STATEMENT_PRE_CONSENT_IDS.p1Collection
  const isPaymentStatementPreConsentThirdPartyTable =
    p.id === PAYMENT_STATEMENT_PRE_CONSENT_IDS.p3ThirdParty ||
    p.id === PAYMENT_STATEMENT_PRE_CONSENT_IDS.p4RrnThirdParty
  const suppressPlaceholderText =
    isAgreementNoticeTable || isAgreementPortraitTable || isPaymentStatementPreConsentP1

  return (
    <div
      className={[
        'form-editor-body',
        'form-editor-horizontal-table-wrap',
        isPaymentStatementPreConsentP1
          ? 'form-editor-horizontal-table-wrap--payment-pre-consent-p1'
          : '',
        isPaymentStatementPreConsentThirdPartyTable
          ? 'form-editor-horizontal-table-wrap--payment-pre-consent-third-party'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="form-editor-horizontal-table" role="grid" aria-readonly={!effectiveEditMode}>
        <div
          className={[
            'form-editor-horizontal-table__row',
            'form-editor-horizontal-table__row--header',
            canvasInteractive && isHeaderRowSelected()
              ? 'form-editor-horizontal-table__row--selected'
              : '',
          ]
            .filter(Boolean)
            .join(' ')}
          role="row"
          aria-selected={canvasInteractive && isHeaderRowSelected()}
        >
          {headers.map((h, i) => {
            const headerFieldLocked =
              isField && getEffectiveHorizontalCellField(p, 0, i).kind !== 'text'
            const ph = suppressPlaceholderText ? '' : tableHeaderPlaceholder(i)
            return (
              <div
                key={`h-${i}`}
                className="form-editor-horizontal-table__th"
                role="columnheader"
                onClick={
                  canvasInteractive
                    ? e => {
                        if (isEventFromTableInteractive(e.target)) return
                        toggleHeaderRow()
                      }
                    : undefined
                }
              >
                {effectiveEditMode && !headerFieldLocked ? (
                  <div className="form-editor-horizontal-table__cell-input-shell form-editor-horizontal-table__cell-input-shell--header">
                    <Input
                      variant="borderless"
                      value={h ?? ''}
                      placeholder={ph}
                      onChange={e => setHeaderValue(i, e.target.value)}
                      onFocus={() => setSelection({ area: 'header' })}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') e.stopPropagation()
                      }}
                    />
                  </div>
                ) : (
                  <HorizontalTableCellText value={h ?? ''} placeholder={ph} variant="header" />
                )}
              </div>
            )
          })}
        </div>
        {rows.map((cells, rowIdx) => (
          <div
            key={`r-${rowIdx}`}
            className={[
              'form-editor-horizontal-table__row',
              canvasInteractive && isBodyRowSelected(rowIdx)
                ? 'form-editor-horizontal-table__row--selected'
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
            role="row"
            aria-selected={canvasInteractive && isBodyRowSelected(rowIdx)}
          >
            {Array.from({ length: colCount }, (_, colIdx) => {
              if (!isField) {
                const cell = cells[colIdx] ?? ''
                const ph = suppressPlaceholderText ? '' : tableCellPlaceholder(colIdx, rowIdx)
                return (
                  <div
                    key={`c-${rowIdx}-${colIdx}`}
                    className="form-editor-horizontal-table__td"
                    role="gridcell"
                    aria-selected={false}
                    onClick={
                      canvasInteractive
                        ? e => {
                            if (isEventFromTableInteractive(e.target)) return
                            toggleBodyCellSelection(rowIdx, colIdx)
                          }
                        : undefined
                    }
                  >
                    {effectiveEditMode ? (
                      <div className="form-editor-horizontal-table__cell-input-shell form-editor-horizontal-table__cell-input-shell--body">
                        <Input
                          variant="borderless"
                          value={cell}
                          placeholder={ph}
                          onChange={e => setTextCellValue(rowIdx, colIdx, e.target.value)}
                          onFocus={() => focusBodyCell(rowIdx, colIdx)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') e.stopPropagation()
                          }}
                        />
                      </div>
                    ) : (
                      <HorizontalTableCellText value={cell} placeholder={ph} variant="body" />
                    )}
                  </div>
                )
              }

              const field = getEffectiveHorizontalCellField(p, rowIdx, colIdx)
              const fieldRow = p.fieldDataRows?.[rowIdx] ?? []
              const cell = fieldRow[colIdx] ?? createEmptyFieldCellValue(field)
              const ph = suppressPlaceholderText
                ? ''
                : fieldNonEditCellPlaceholder(field, colIdx, rowIdx)
              const isChoiceField = field.kind === 'single' || field.kind === 'multiple'
              const isSubjectiveField = field.kind === 'subjective'
              return (
                <div
                  key={`cf-${rowIdx}-${colIdx}`}
                  className={[
                    'form-editor-horizontal-table__td',
                    'form-editor-horizontal-table__td--field',
                    effectiveEditMode &&
                      isChoiceField &&
                      'form-editor-horizontal-table__td--field-choices',
                    effectiveEditMode &&
                      isSubjectiveField &&
                      'form-editor-horizontal-table__td--field-subjective',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  role="gridcell"
                  aria-selected={false}
                  onClick={
                    canvasInteractive
                      ? e => {
                          if (isEventFromTableInteractive(e.target)) return
                          toggleBodyCellSelection(rowIdx, colIdx)
                        }
                      : undefined
                  }
                >
                  {effectiveEditMode ? (
                    <div
                      className={[
                        'form-editor-horizontal-table__cell-input-shell',
                        'form-editor-horizontal-table__cell-input-shell--body',
                        'form-editor-horizontal-table__cell-input-shell--field',
                        isChoiceField &&
                          'form-editor-horizontal-table__cell-input-shell--field-choices',
                        isSubjectiveField &&
                          'form-editor-horizontal-table__cell-input-shell--field-subjective',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <FieldTableBodyCell
                        field={field}
                        cell={cell}
                        rowIdx={rowIdx}
                        colIdx={colIdx}
                        isEditMode={effectiveEditMode}
                        ph={ph}
                        onFieldChange={v =>
                          onChange(horizontalTableSetFieldCellValue(p, rowIdx, colIdx, v))
                        }
                        onSelectBodyRow={() => focusBodyCell(rowIdx, colIdx)}
                      />
                    </div>
                  ) : (
                    <HorizontalTableCellText
                      value={fieldCellValueToPlainText(rehomeForDisplay(field, cell))}
                      placeholder={ph}
                      variant="body"
                    />
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {p.showBottomText || p.showBottomConsent || p.idTypeWithInput ? (
        <div className="form-editor-horizontal-table__bottom">
          {p.showBottomText ? (
            PERSONAL_INFO_HORIZONTAL_TABLE_DISCLAIMER_PARAGRAPH_IDS.has(p.id) ? (
              <div className="detail-info-form--text">{p.bottomText}</div>
            ) : (
              <ParagraphInput
                type="description"
                className="form-editor-horizontal-table__bottom-input"
                value={p.bottomText}
                isEditMode={effectiveEditMode}
                onChange={next => onChange({ ...p, bottomText: next })}
                placeholder="설명을 입력해 주세요"
              />
            )
          ) : null}
          {p.idTypeWithInput ? (
            <IdTypeWithInputBody
              paragraph={p.idTypeWithInput}
              onChange={next => onChange({ ...p, idTypeWithInput: next })}
              isEditMode={effectiveEditMode}
              documentMode={paymentStatementDisplayMode === 'document'}
            />
          ) : null}
          {p.showBottomConsent ? (
            <CmsRadioGroup
              className="form-editor-table-bottom-consent"
              size="large"
              value={p.bottomConsent ?? 'agree'}
              onChange={e => {
                if (!bottomConsentInteractive) return
                onChange({ ...p, bottomConsent: e.target.value as TableBottomConsent })
              }}
              style={bottomConsentInteractive ? undefined : { pointerEvents: 'none' }}
            >
              <CmsRadio value="agree">동의</CmsRadio>
              <CmsRadio value="disagree">동의하지 않음</CmsRadio>
            </CmsRadioGroup>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
