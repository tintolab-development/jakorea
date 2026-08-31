import { useMemo, useState } from 'react'
import { DatePicker, Input, TimePicker } from 'antd'
import type { RadioChangeEvent } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import type {
  TableBottomConsent,
  VerticalTableParagraph,
  VerticalTableRow,
} from '@/features/template/model/writing-form-draft.schema'
import { resolveTableBottomConsentRadioValue } from '@/features/template/lib/resolve-table-bottom-consent-radio-value'
import {
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
  DEFAULT_VERTICAL_FILE_ATTACHMENT_HEADER_LABEL,
  DEFAULT_VERTICAL_SUBJECTIVE_CELL_PLACEHOLDER,
  effectiveVerticalCompositeTimeHint,
  effectiveVerticalRowDateTimeModes,
  effectiveVerticalStageKinds,
  normalizeVerticalChoiceOptions,
  normalizeVerticalTableParagraph,
  verticalTableHeaderPlaceholder,
} from '@/features/template/model/writing-form-draft.schema'
import { ParagraphInput } from '@/features/template/ui/shared/paragraph-input'
import { ParagraphFileUpload } from '@/features/template/ui/shared/paragraph-file-upload'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { AgreementPortraitPersonalConsentNameRow } from '@/features/template/ui/paragraph/table/agreement-portrait-personal-consent-name-row'
import '@/features/template/ui/form-editor/form-editor.css'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { DividerVertical } from '@/shared/components/divider-vertical'
import '@/features/template/ui/paragraph/table/vertical-table-paragraph-body.css'

const { TextArea } = Input

dayjs.extend(customParseFormat)

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
        '.paragraph-date-picker',
        '.paragraph-date-picker__backdrop',
        '.paragraph-date-picker__popover',
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

/** 텍스트형 세로 테이블 td 기본 안내(상수) */
const VERTICAL_TABLE_TEXT_CELL_PLACEHOLDER = DEFAULT_VERTICAL_SUBJECTIVE_CELL_PLACEHOLDER

const VT_DATE_PLACEHOLDER = '날짜를 선택해 주세요'
const VT_TIME_PLACEHOLDER = '시간을 선택해 주세요'

function verticalTableFieldPopupContainer(): HTMLElement {
  return document.body
}

const verticalTablePickerPopupStyles = {
  popup: {
    /** 편집기·모달 위에 패널이 보이도록(기본 토큰보다 높여 안전하게) */
    root: { minWidth: 300, zIndex: 3100 },
  },
} as const

function toDayjs(mode: 'date' | 'time', raw: string): Dayjs | null {
  if (!raw?.trim()) return null
  if (mode === 'date') {
    const d = dayjs(raw, 'YYYY-MM-DD', true)
    return d.isValid() ? d : null
  }
  const d = dayjs(raw, 'HH:mm', true)
  return d.isValid() ? d : null
}

function fromDayjs(mode: 'date' | 'time', d: Dayjs | null): string {
  if (!d || !d.isValid()) return ''
  if (mode === 'date') return d.format('YYYY-MM-DD')
  return d.format('HH:mm')
}

function VerticalTableCellText({
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
        'form-editor-vertical-table__cell-text',
        variant === 'header'
          ? 'form-editor-vertical-table__cell-text--header'
          : 'form-editor-vertical-table__cell-text--body',
        !filled ? 'form-editor-vertical-table__cell-text--placeholder' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {filled ? value : placeholder}
    </span>
  )
}

function replaceRowStage(
  rows: VerticalTableRow[],
  rowIdx: number,
  patch: (r: VerticalTableRow) => VerticalTableRow
): VerticalTableRow[] {
  return rows.map((r, i) => (i === rowIdx ? patch(r) : r))
}

/** 합성(날짜+시간)에서 시간 인풋에 바인딩할 HH:mm 문자열 */
function verticalCompositeTimeValue(r: VerticalTableRow, stageIdx: number): string {
  if (r.stageCount === 1) {
    return r.dateTimeStage0AuxTime ?? r.dateTimeStage1Time ?? ''
  }
  return stageIdx === 0 ? (r.dateTimeStage0AuxTime ?? '') : (r.dateTimeStage1Time ?? '')
}

export function VerticalTableParagraphBody({
  paragraph,
  onChange,
  isEditMode,
  dateTimeCellsInteractive: dateTimeCellsInteractiveProp,
  /** false: 미리보기(user) 등 — 행 클릭·민트 강조 비활성, 셀 입력은 `isEditMode`/`dateTimeCellsInteractive` 유지 */
  tableCanvasInteractive = true,
  tableRowSelection: controlledRow,
  onTableRowSelectionChange,
  portraitConsentResponseFieldsInteractive = false,
  bottomConsentInteractive: bottomConsentInteractiveProp,
  consentFillMode = false,
}: {
  paragraph: VerticalTableParagraph
  onChange: (next: VerticalTableParagraph) => void
  isEditMode: boolean
  /**
   * 날짜·시간 셀(DatePicker/TimePicker)만 별도 활성화.
   * 구조 잠금 작성 모드에서 행 라벨(th)은 읽기 전용으로 두고 값만 고를 때 사용.
   */
  dateTimeCellsInteractive?: boolean
  tableCanvasInteractive?: boolean
  /** 있으면 상위와 본문 행 선택 동기화(다른 위젯 th/td 선택 시 단일 포커스) */
  tableRowSelection?: number | null
  onTableRowSelectionChange?: (row: number | null) => void
  /** preview fill — 초상권 1번 표 성명·소속만 입력 허용 */
  portraitConsentResponseFieldsInteractive?: boolean
  /** preview fill — 하단 동의 라디오만 조작 허용 */
  bottomConsentInteractive?: boolean
  /** 동의서 작성(fill) — bottomConsent 미선택 시 agree 폴백 금지 */
  consentFillMode?: boolean
}) {
  const bottomConsentInteractive = bottomConsentInteractiveProp ?? isEditMode
  const dtCellsInteractive = dateTimeCellsInteractiveProp ?? isEditMode
  const canvasInteractive = tableCanvasInteractive
  const p = useMemo(() => normalizeVerticalTableParagraph(paragraph), [paragraph])
  const choiceOpts = useMemo(
    () => normalizeVerticalChoiceOptions(p.verticalChoiceOptions),
    [p.verticalChoiceOptions]
  )
  const [internalRow, setInternalRow] = useState<number | null>(null)
  const isControlled = onTableRowSelectionChange != null
  const selectedRow = isControlled ? (controlledRow ?? null) : internalRow
  const setSelectedRow = (next: number | null) => {
    if (isControlled) onTableRowSelectionChange(next)
    else setInternalRow(next)
  }

  const setHeader = (rowIdx: number, stageIdx: number, value: string) => {
    onChange({
      ...p,
      rows: replaceRowStage(p.rows, rowIdx, r => {
        if (r.stageCount === 1) {
          return { ...r, headers: [value] }
        }
        const headers: [string, string] = [...r.headers]
        headers[stageIdx] = value
        return { ...r, headers }
      }),
    })
  }

  const setCell = (rowIdx: number, stageIdx: number, value: string) => {
    onChange({
      ...p,
      rows: replaceRowStage(p.rows, rowIdx, r => {
        if (r.stageCount === 1) {
          return { ...r, cells: [value] }
        }
        const cells: [string, string] = [...r.cells]
        cells[stageIdx] = value
        return { ...r, cells }
      }),
    })
  }

  /** 합성(날짜+시간) 모드에서 시간(HH:mm) — 1단은 레거시 `dateTimeStage1Time`와 호환 */
  const setVerticalCompositeTime = (rowIdx: number, stageIdx: number, value: string) => {
    onChange({
      ...p,
      rows: replaceRowStage(p.rows, rowIdx, r => {
        if (r.stageCount === 1) {
          return { ...r, dateTimeStage0AuxTime: value, dateTimeStage1Time: value }
        }
        if (stageIdx === 0) {
          return { ...r, dateTimeStage0AuxTime: value }
        }
        return { ...r, dateTimeStage1Time: value }
      }),
    })
  }

  const setMultipleChoiceStage = (rowIdx: number, stageIdx: number, values: string[]) => {
    onChange({
      ...p,
      rows: replaceRowStage(p.rows, rowIdx, r => {
        if (r.stageCount === 1) {
          return { ...r, choiceMultipleSelections: [values] as [string[]] }
        }
        const cur0 = r.choiceMultipleSelections?.[0] ?? []
        const cur1 = r.choiceMultipleSelections?.[1] ?? []
        if (stageIdx === 0) {
          return { ...r, choiceMultipleSelections: [values, cur1] as [string[], string[]] }
        }
        return { ...r, choiceMultipleSelections: [cur0, values] as [string[], string[]] }
      }),
    })
  }

  const toggleRow = (rowIdx: number) => {
    if (!canvasInteractive) return
    setSelectedRow(selectedRow === rowIdx ? null : rowIdx)
  }

  /** onFocus 타이밍에 행 선택 state를 갱신하면 리렌더로 피커가 닫히거나 패널이 열리지 않을 수 있어, 패널 open 이후 동기화 */
  const notifyPickerRowFocused = (rowIdxFocus: number) => (pickerOpen: boolean) => {
    if (pickerOpen && canvasInteractive) setSelectedRow(rowIdxFocus)
  }

  const isPortraitPersonalConsent =
    p.id === AGREEMENT_PORTRAIT_PARAGRAPH_IDS.personalConsentTable
  const isPortraitDelegatedConsent =
    p.id === AGREEMENT_PORTRAIT_PARAGRAPH_IDS.delegatedConsentTable
  /** 위탁·고정 안내 표 — 작성/편집 모두 스크린샷처럼 테두리 없는 본문 텍스트 */
  const isPortraitStaticConsentTable = isPortraitDelegatedConsent

  const renderStage = (
    row: VerticalTableRow,
    rowIdx: number,
    stageIdx: number,
    /** 초상권 1번 표 고정 문구 행 등 — 헤더·본문 모두 읽기 전용 텍스트 */
    forceStatic = false
  ) => {
    const rowEditMode = forceStatic ? false : isEditMode
    const header = row.headers[stageIdx] ?? ''
    const cell = row.cells[stageIdx] ?? ''
    const hPh = verticalTableHeaderPlaceholder(rowIdx, stageIdx, row.stageCount)
    const hint = row.placeholderHints?.[stageIdx] ?? ''
    const stageKind = effectiveVerticalStageKinds(row, p.verticalTableFlavor)[stageIdx as 0 | 1]
    const cPh =
      stageKind === 'subjective'
        ? hint.trim() !== ''
          ? hint
          : DEFAULT_VERTICAL_SUBJECTIVE_CELL_PLACEHOLDER
        : VERTICAL_TABLE_TEXT_CELL_PLACEHOLDER

    const isDateTime = stageKind === 'date_time'
    const isSingleChoice = stageKind === 'single_choice'
    const isMultipleChoice = stageKind === 'multiple_choice'
    const dtModes = isDateTime ? effectiveVerticalRowDateTimeModes(row) : null
    const dtModeAtStage = dtModes ? (dtModes[stageIdx as 0 | 1] ?? 'date') : 'date'
    const defaultDatePlaceholder =
      p.verticalTableFlavor === 'date_time' ? '일정 선택' : VT_DATE_PLACEHOLDER

    const renderDateSingleStageBody = (
      pickerKeySuffix: string,
      datePlaceholder: string,
      timeValForComposite: string,
      timePlaceholder: string
    ) => (
      <div className="form-editor-vertical-table__dt-composite">
        <DatePicker
          key={`vt-dt-d-${rowIdx}-${stageIdx}-${pickerKeySuffix}`}
          rootClassName="form-editor-vertical-table__field-box form-editor-vertical-table__field-box--picker form-editor-vertical-table__dt-picker--fixed"
          className="form-editor-vertical-table__dt-picker-inner"
          needConfirm={false}
          styles={verticalTablePickerPopupStyles}
          getPopupContainer={verticalTableFieldPopupContainer}
          value={toDayjs('date', cell)}
          onChange={dtCellsInteractive ? d => setCell(rowIdx, stageIdx, fromDayjs('date', d)) : undefined}
          onOpenChange={notifyPickerRowFocused(rowIdx)}
          format="YYYY-MM-DD"
          placeholder={datePlaceholder}
          disabled={!dtCellsInteractive}
        />
        <div className="form-editor-vertical-table__dt-divider-wrap">
          <DividerVertical />
        </div>
        <TimePicker
          key={`vt-dt-t-${rowIdx}-${stageIdx}-${pickerKeySuffix}`}
          rootClassName="form-editor-vertical-table__field-box form-editor-vertical-table__field-box--picker form-editor-vertical-table__dt-picker--fixed"
          className="form-editor-vertical-table__dt-picker-inner"
          needConfirm={false}
          styles={verticalTablePickerPopupStyles}
          getPopupContainer={verticalTableFieldPopupContainer}
          value={toDayjs('time', timeValForComposite)}
          onChange={
            dtCellsInteractive
              ? d => setVerticalCompositeTime(rowIdx, stageIdx, fromDayjs('time', d))
              : undefined
          }
          onOpenChange={notifyPickerRowFocused(rowIdx)}
          format="HH:mm"
          minuteStep={5}
          placeholder={timePlaceholder}
          disabled={!dtCellsInteractive}
        />
      </div>
    )

    const renderDateTimeBody = () => {
      if (!isDateTime || !dtModes) return null

      const hintDateOrTime =
        hint.trim() !== ''
          ? hint
          : dtModeAtStage === 'time'
            ? VT_TIME_PLACEHOLDER
            : VT_DATE_PLACEHOLDER
      const timePlaceholderComposite = effectiveVerticalCompositeTimeHint(
        row,
        stageIdx as 0 | 1
      )

      if (dtModeAtStage === 'time') {
        return (
          <TimePicker
            key={`vt-dt-${rowIdx}-${stageIdx}-t`}
            rootClassName="form-editor-vertical-table__field-box form-editor-vertical-table__field-box--picker form-editor-vertical-table__dt-picker--full"
            className="form-editor-vertical-table__dt-picker-inner"
            needConfirm={false}
            styles={verticalTablePickerPopupStyles}
            getPopupContainer={verticalTableFieldPopupContainer}
            value={toDayjs('time', cell)}
            onChange={
              dtCellsInteractive ? d => setCell(rowIdx, stageIdx, fromDayjs('time', d)) : undefined
            }
            onOpenChange={notifyPickerRowFocused(rowIdx)}
            format="HH:mm"
            minuteStep={5}
            placeholder={hintDateOrTime}
            disabled={!dtCellsInteractive}
          />
        )
      }

      if (dtModeAtStage === 'date_time') {
        const timeVal = verticalCompositeTimeValue(row, stageIdx)
        const datePlaceholder = hint.trim() !== '' ? hint : defaultDatePlaceholder
        return renderDateSingleStageBody(
          `composite-${stageIdx}`,
          datePlaceholder,
          timeVal,
          timePlaceholderComposite
        )
      }

      const datePlaceholder = hint.trim() !== '' ? hint : defaultDatePlaceholder
      return (
        <ParagraphDatePicker
          key={`vt-dt-${rowIdx}-${stageIdx}`}
          mode="single"
          presetMode="date"
          customizable={false}
          className={[
            'form-editor-vertical-table__dt-paragraph-date-picker',
            'form-editor-vertical-table__field-box',
            'form-editor-vertical-table__field-box--picker',
            'form-editor-vertical-table__dt-picker--full',
          ].join(' ')}
          value={toDayjs('date', cell)}
          onChange={
            dtCellsInteractive
              ? next => setCell(rowIdx, stageIdx, fromDayjs('date', next))
              : () => {}
          }
          onOpenChange={notifyPickerRowFocused(rowIdx)}
          placeholder={datePlaceholder}
          disabled={!dtCellsInteractive}
          suppressAutoTodayWhenEmpty
          width="100%"
        />
      )
    }

    const subjectiveShell =
      stageKind === 'subjective'
        ? 'form-editor-vertical-table__cell-input-shell--body-subjective'
        : ''

    const isDateTimeCompositeShell = isDateTime && dtModeAtStage === 'date_time'

    return (
      <div key={`${rowIdx}-s-${stageIdx}`} className="form-editor-vertical-table__stage">
        <div
          className="form-editor-vertical-table__th"
          role="columnheader"
          onClick={
            canvasInteractive
              ? e => {
                  if (isEventFromTableInteractive(e.target)) return
                  toggleRow(rowIdx)
                }
              : undefined
          }
        >
          {rowEditMode ? (
            <div className="form-editor-vertical-table__cell-input-shell form-editor-vertical-table__cell-input-shell--header">
              <Input
                variant="borderless"
                value={header}
                placeholder={hPh}
                onChange={e => setHeader(rowIdx, stageIdx, e.target.value)}
                onFocus={() => {
                  if (canvasInteractive) setSelectedRow(rowIdx)
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') e.stopPropagation()
                }}
              />
            </div>
          ) : (
            <VerticalTableCellText value={header} placeholder={hPh} variant="header" />
          )}
        </div>
        <div
          className="form-editor-vertical-table__td"
          role="gridcell"
          onClick={
            canvasInteractive
              ? e => {
                  if (isEventFromTableInteractive(e.target)) return
                  toggleRow(rowIdx)
                }
              : undefined
          }
        >
          {isDateTime ? (
            <div
              className={[
                'form-editor-vertical-table__cell-input-shell',
                'form-editor-vertical-table__cell-input-shell--body',
                isDateTimeCompositeShell
                  ? 'form-editor-vertical-table__cell-input-shell--body-dt-composite'
                  : 'form-editor-vertical-table__cell-input-shell--body-dt-full',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={e => e.stopPropagation()}
            >
              {renderDateTimeBody()}
            </div>
          ) : isSingleChoice ? (
            <div
              className="form-editor-vertical-table__cell-input-shell form-editor-vertical-table__cell-input-shell--body form-editor-vertical-table__cell-input-shell--body-choice"
            >
              <CmsRadioGroup
                className="form-editor-horizontal-table__field-radios"
                size="large"
                value={cell.trim() !== '' ? cell : undefined}
                onChange={(e: RadioChangeEvent) => {
                  if (!rowEditMode) return
                  setCell(rowIdx, stageIdx, e.target.value)
                }}
                onFocus={() => {
                  if (canvasInteractive) setSelectedRow(rowIdx)
                }}
                disabled={!rowEditMode}
              >
                {choiceOpts.map((o, i) => (
                  <CmsRadio key={`${rowIdx}-${stageIdx}-${i}`} size="large" value={o}>
                    {o}
                  </CmsRadio>
                ))}
              </CmsRadioGroup>
            </div>
          ) : isMultipleChoice ? (
            <div
              className="form-editor-vertical-table__cell-input-shell form-editor-vertical-table__cell-input-shell--body form-editor-vertical-table__cell-input-shell--body-choice"
            >
              <div
                className="form-editor-horizontal-table__field-checks"
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') e.stopPropagation()
                }}
              >
                {choiceOpts.map((o, i) => {
                  const checked = (row.choiceMultipleSelections?.[stageIdx] ?? []).includes(o)
                  return (
                    <CmsCheckbox
                      key={`${rowIdx}-${stageIdx}-${i}`}
                      checkboxSize="large"
                      className="form-editor-horizontal-table__field-check-label"
                      checked={checked}
                      disabled={!rowEditMode}
                      onChange={e => {
                        if (!rowEditMode) return
                        const cur = row.choiceMultipleSelections?.[stageIdx] ?? []
                        const s = new Set(cur)
                        if (e.target.checked) s.add(o)
                        else s.delete(o)
                        setMultipleChoiceStage(rowIdx, stageIdx, [...s])
                      }}
                      onFocus={() => {
                        if (canvasInteractive) setSelectedRow(rowIdx)
                      }}
                    >
                      {o}
                    </CmsCheckbox>
                  )
                })}
              </div>
            </div>
          ) : rowEditMode ? (
            <div
              className={[
                'form-editor-vertical-table__cell-input-shell',
                'form-editor-vertical-table__cell-input-shell--body',
                subjectiveShell,
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <TextArea
                variant="borderless"
                className="form-editor-vertical-table__cell-textarea"
                autoSize={{ minRows: 1 }}
                value={cell}
                placeholder={cPh}
                onChange={e => setCell(rowIdx, stageIdx, e.target.value)}
                onFocus={() => {
                  if (canvasInteractive) setSelectedRow(rowIdx)
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') e.stopPropagation()
                }}
              />
            </div>
          ) : (
            <>
              {stageKind === 'subjective' ? (
                <div className="form-editor-vertical-table__cell-input-shell form-editor-vertical-table__cell-input-shell--body form-editor-vertical-table__cell-input-shell--body-subjective">
                  <VerticalTableCellText value={cell} placeholder={cPh} variant="body" />
                </div>
              ) : (
                <VerticalTableCellText value={cell} placeholder={cPh} variant="body" />
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  const fileAttachmentHeaderLabel =
    (p.verticalFileAttachmentHeaderLabel ?? '').trim() || DEFAULT_VERTICAL_FILE_ATTACHMENT_HEADER_LABEL

  const bottomSection =
    p.showBottomText || p.showBottomConsent ? (
      <div className="form-editor-vertical-table__bottom">
        {p.showBottomText ? (
          canvasInteractive ? (
            <ParagraphInput
              type="description"
              className="form-editor-vertical-table__bottom-input"
              value={p.bottomText}
              isEditMode={isEditMode}
              onChange={next => onChange({ ...p, bottomText: next })}
              placeholder="설명을 입력해 주세요"
            />
          ) : (
            <div className="detail-info-form--text form-editor-vertical-table__bottom-static">
              {p.bottomText}
            </div>
          )
        ) : null}
        {p.showBottomConsent ? (
          <CmsRadioGroup
            className="form-editor-table-bottom-consent"
            size="large"
            value={resolveTableBottomConsentRadioValue(
              consentFillMode ? paragraph.bottomConsent : p.bottomConsent,
              {
                consentFillMode,
                interactive: bottomConsentInteractive,
              }
            )}
            onChange={e => {
              if (!bottomConsentInteractive) return
              onChange({ ...p, bottomConsent: e.target.value as TableBottomConsent })
            }}
            disabled={!bottomConsentInteractive}
            style={bottomConsentInteractive ? undefined : { pointerEvents: 'none' }}
          >
            <CmsRadio value="agree">동의</CmsRadio>
            <CmsRadio value="disagree">동의하지 않음</CmsRadio>
          </CmsRadioGroup>
        ) : null}
      </div>
    ) : null

  if (p.verticalTableFlavor === 'file_attachment') {
    return (
      <div
        className={[
          'form-editor-body',
          'form-editor-vertical-table-wrap',
          canvasInteractive ? 'form-editor-vertical-table-wrap--canvas-interactive' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="form-editor-vertical-table" role="grid" aria-readonly={!isEditMode}>
          <div
            className={[
              'form-editor-vertical-table__row',
              'form-editor-vertical-table__row--file-attachment',
              canvasInteractive && selectedRow === 0
                ? 'form-editor-vertical-table__row--selected'
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
            role="row"
            aria-selected={canvasInteractive && selectedRow === 0}
          >
            <div className="form-editor-vertical-table__stage">
              <div
                className="form-editor-vertical-table__th"
                role="columnheader"
                onClick={
                  canvasInteractive
                    ? e => {
                        if (isEventFromTableInteractive(e.target)) return
                        toggleRow(0)
                      }
                    : undefined
                }
              >
                <VerticalTableCellText
                  value={fileAttachmentHeaderLabel}
                  placeholder={DEFAULT_VERTICAL_FILE_ATTACHMENT_HEADER_LABEL}
                  variant="header"
                />
              </div>
              <div
                className="form-editor-vertical-table__td form-editor-vertical-table__td--file-upload"
                role="gridcell"
                onClick={
                  canvasInteractive
                    ? e => {
                        if (isEventFromTableInteractive(e.target)) return
                        toggleRow(0)
                      }
                    : undefined
                }
              >
                <div
                  className="form-editor-vertical-table__cell-input-shell form-editor-vertical-table__cell-input-shell--body"
                  onClick={e => e.stopPropagation()}
                >
                  <ParagraphFileUpload
                    accept=".jpg,.jpeg,.png"
                    multiple
                    disabled={!isEditMode}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        {bottomSection}
      </div>
    )
  }

  return (
    <div
      className={[
        'form-editor-body',
        'form-editor-vertical-table-wrap',
        canvasInteractive ? 'form-editor-vertical-table-wrap--canvas-interactive' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="form-editor-vertical-table" role="grid" aria-readonly={!isEditMode}>
        {p.rows.map((row, rowIdx) => {
          if (isPortraitPersonalConsent && rowIdx === 0) {
            return (
              <AgreementPortraitPersonalConsentNameRow
                key={`vr-${rowIdx}-portrait-name`}
                row={row}
                interactive={isEditMode || portraitConsentResponseFieldsInteractive}
                onNameChange={value => setCell(0, 0, value)}
                onAffiliationChange={value => setCell(0, 1, value)}
                onSelectRow={() => {
                  if (canvasInteractive) setSelectedRow(0)
                }}
              />
            )
          }

          const forceStatic =
            (isPortraitPersonalConsent && rowIdx > 0) || isPortraitStaticConsentTable
          return (
            <div
              key={`vr-${rowIdx}-sc${row.stageCount}`}
              className={[
                'form-editor-vertical-table__row',
                canvasInteractive && selectedRow === rowIdx
                  ? 'form-editor-vertical-table__row--selected'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
              role="row"
              aria-selected={canvasInteractive && selectedRow === rowIdx}
            >
              {row.stageCount === 1
                ? renderStage(row, rowIdx, 0, forceStatic)
                : [0, 1].map(si => renderStage(row, rowIdx, si, forceStatic))}
            </div>
          )
        })}
      </div>

      {bottomSection}
    </div>
  )
}
