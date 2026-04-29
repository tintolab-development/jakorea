/**
 * 정산 항목 설정 — 카드 클릭 시 항목 상세(산정 기준·금액·자격·비고)
 */

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DependencyList,
  type KeyboardEvent,
  type MutableRefObject,
} from 'react'
import { message } from 'antd'
import type { SettlementItemSettingRow } from '@/data/mock/settlement-item-settings'
import {
  getSettlementItemSettingDetail,
  parseEditableLines,
  parseWonStringToNumber,
  saveSettlementItemSettingDetail,
  type SettlementItemEvidenceSubmission,
  type SettlementItemSettingDetail,
  type SettlementItemTransportCommuteMode,
} from '@/data/mock/settlement-item-setting-detail.mock'
import { ContentModal } from '@/shared/ui/content-modal'
import { AppButton } from '@/shared/ui/app-button'
import {
  SettlementItemSettingDescriptionEditIcon,
  SettlementItemSettingIcon,
  SettlementItemSettingTitleEditIcon,
} from './settlement-item-setting-icons'
import { SettlementItemTossfaceIconPickerTrigger } from './settlement-item-tossface-icon-picker'
import './settlement-item-setting-detail-modal.css'
import { AppInput } from '@/shared/ui/app-input'
import { AppSelect } from '@/shared/ui/app-select'
import {
  ModalSpecTable,
  ModalSpecTableRadioCell,
  ModalSpecTableRow,
  type ModalSpecTableRadioOption,
} from '@/shared/ui/modal-spec-table/modal-spec-table'

const BASIS_UNIT_OPTIONS_SIMPLE = [{ value: '전체', label: '전체' }]

const SIMPLE_LABOR_EVIDENCE_RADIO_OPTIONS: ModalSpecTableRadioOption<SettlementItemEvidenceSubmission>[] =
  [
    { value: 'required', label: '필요' },
    { value: 'not_required', label: '불필요' },
  ]

const TRANSPORT_COMMUTE_RADIO_OPTIONS: ModalSpecTableRadioOption<SettlementItemTransportCommuteMode>[] =
  [
    { value: 'private_car', label: '자차' },
    { value: 'public_transit', label: '대중교통' },
    { value: 'user_choice', label: '사용자 선택' },
  ]

function formatWonDisplay(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return ''
  return Math.round(n).toLocaleString('ko-KR')
}

function parseWonInput(s: string): string {
  const digits = s.replace(/[^\d]/g, '')
  if (digits === '') return ''
  return Number(digits).toLocaleString('ko-KR')
}

function formatPercentField(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return ''
  return String(n)
}

function sanitizePercentInput(s: string): string {
  const raw = s.replace(/[^\d.]/g, '')
  const parts = raw.split('.')
  if (parts.length <= 1) return parts[0] ?? ''
  return `${parts[0]}.${parts.slice(1).join('')}`
}

function parsePercentToNullableNumber(s: string): number | null {
  const t = s.trim()
  if (t === '') return null
  const n = Number.parseFloat(t)
  return Number.isFinite(n) ? n : null
}

function linesToEditableText(lines: string[]): string {
  return lines.map(line => `• ${line}`).join('\n')
}

/** 정산 항목 설정: textarea 제외 입력란 — 키 입력은 숫자만(붙여넣기는 onChange에서 정제) */
const SETTLEMENT_NUMERIC_NAV_KEYS = new Set([
  'Backspace',
  'Delete',
  'Tab',
  'Escape',
  'Enter',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
])

function onSettlementIntegerNumericKeyDown(e: KeyboardEvent<HTMLInputElement>) {
  if (e.nativeEvent.isComposing) return
  if (e.ctrlKey || e.metaKey || e.altKey) return
  if (SETTLEMENT_NUMERIC_NAV_KEYS.has(e.key)) return
  if (e.key === 'Process' || e.key.length !== 1) return
  if (/^\d$/.test(e.key)) return
  e.preventDefault()
}

function onSettlementDecimalNumericKeyDown(e: KeyboardEvent<HTMLInputElement>) {
  if (e.nativeEvent.isComposing) return
  if (e.ctrlKey || e.metaKey || e.altKey) return
  if (SETTLEMENT_NUMERIC_NAV_KEYS.has(e.key)) return
  if (e.key === 'Process' || e.key.length !== 1) return
  if (/^\d$/.test(e.key)) return
  if (e.key === '.') {
    const el = e.currentTarget
    const val = el.value
    const start = el.selectionStart ?? val.length
    const end = el.selectionEnd ?? start
    const withoutSelection = val.slice(0, start) + val.slice(end)
    if (!withoutSelection.includes('.')) return
    e.preventDefault()
    return
  }
  e.preventDefault()
}

const settlementInputIntegerKeyDownProps = {
  onKeyDown: onSettlementIntegerNumericKeyDown,
} as const

const settlementInputDecimalKeyDownProps = {
  onKeyDown: onSettlementDecimalNumericKeyDown,
} as const

const SettlementDetailSnapshotRefContext =
  createContext<MutableRefObject<(() => SettlementItemSettingDetail) | null> | null>(null)

function useRegisterSettlementDetailSnapshot(
  build: () => SettlementItemSettingDetail,
  deps: DependencyList
): void {
  const ref = useContext(SettlementDetailSnapshotRefContext)
  useEffect(() => {
    if (!ref) return
    ref.current = build
    return () => {
      ref.current = null
    }
  }, [ref, ...deps])
}

function SettlementItemSettingDetailModalHeaderTitle({
  value,
  editing,
  onChange,
  onRequestEdit,
  onCommitEdit,
  restoreValueIfEmptyOnBlur,
}: {
  value: string
  editing: boolean
  onChange: (next: string) => void
  onRequestEdit: () => void
  onCommitEdit: () => void
  /** 편집 종료(blur) 시 값이 비어 있으면 복구할 문자열 */
  restoreValueIfEmptyOnBlur: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) return
    const id = window.setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true })
    }, 0)
    return () => window.clearTimeout(id)
  }, [editing])

  const handleBlur = () => {
    if (value.trim() === '' && restoreValueIfEmptyOnBlur !== '') {
      onChange(restoreValueIfEmptyOnBlur)
    }
    onCommitEdit()
  }

  return (
    <div className="settlement-item-setting-detail-modal__header-title-row">
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          className="settlement-item-setting-detail-modal__header-title-field settlement-item-setting-detail-modal__header-title-field--editing"
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleBlur()
            }
          }}
          aria-label="항목명"
        />
      ) : (
        <span className="settlement-item-setting-detail-modal__header-title-text">{value}</span>
      )}
      <button
        type="button"
        className="settlement-item-setting-detail-modal__title-edit-btn"
        onClick={onRequestEdit}
        aria-label="항목명 수정"
        aria-disabled={editing}
        tabIndex={editing ? -1 : 0}
        style={editing ? { pointerEvents: 'none' } : undefined}
      >
        <SettlementItemSettingTitleEditIcon />
      </button>
    </div>
  )
}

function SettlementItemSettingDetailModalHeaderDescription({
  value,
  editing,
  onChange,
  onRequestEdit,
  onCommitEdit,
  restoreValueIfEmptyOnBlur,
}: {
  value: string
  editing: boolean
  onChange: (next: string) => void
  onRequestEdit: () => void
  onCommitEdit: () => void
  restoreValueIfEmptyOnBlur: string
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  /** value 반영 직후 커서 복원( cols·높이 조정 등으로 선택이 초기화되는 것 방지 ) */
  const pendingCaretRef = useRef<{ start: number; end: number } | null>(null)
  const wasEditingRef = useRef(false)

  useLayoutEffect(() => {
    if (!editing) {
      wasEditingRef.current = false
      return
    }
    const el = textareaRef.current
    if (!el) return

    const entering = !wasEditingRef.current
    wasEditingRef.current = true

    const pending = pendingCaretRef.current
    if (pending) {
      pendingCaretRef.current = null
      const max = el.value.length
      el.setSelectionRange(
        Math.min(Math.max(0, pending.start), max),
        Math.min(Math.max(0, pending.end), max)
      )
    } else if (entering) {
      el.focus({ preventScroll: true })
      const len = el.value.length
      el.setSelectionRange(len, len)
    }
  }, [editing, value])

  const handleDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target
    pendingCaretRef.current = {
      start: el.selectionStart ?? 0,
      end: el.selectionEnd ?? 0,
    }
    onChange(el.value)
  }

  const handleBlur = () => {
    if (value.trim() === '' && restoreValueIfEmptyOnBlur !== '') {
      onChange(restoreValueIfEmptyOnBlur)
    }
    onCommitEdit()
  }

  const display = value.trim() !== '' ? value : '—'

  return (
    <span className="settlement-item-setting-detail-modal__header-description-row">
      {editing ? (
        <textarea
          ref={textareaRef}
          className="settlement-item-setting-detail-modal__header-description-field settlement-item-setting-detail-modal__header-description-field--editing"
          value={value}
          onChange={handleDescriptionChange}
          onBlur={handleBlur}
          rows={1}
          aria-label="항목 설명"
        />
      ) : (
        <span className="settlement-item-setting-detail-modal__header-description-text">{display}</span>
      )}
      <button
        type="button"
        className="settlement-item-setting-detail-modal__description-edit-btn"
        onClick={onRequestEdit}
        aria-label="항목 설명 수정"
        aria-disabled={editing}
        tabIndex={editing ? -1 : 0}
        style={editing ? { pointerEvents: 'none' } : undefined}
      >
        <SettlementItemSettingDescriptionEditIcon />
      </button>
    </span>
  )
}

function buildInitialFormState(itemId: string) {
  const d = getSettlementItemSettingDetail(itemId)
  return {
    basisUnit: d.basisUnit,
    basisHoursStr: String(d.basisHours),
    compareKind: d.compareKind,
    maxLimitStr: formatWonDisplay(d.maxLimitWon),
    basicFeeStr: d.basicFeeWon != null ? formatWonDisplay(d.basicFeeWon) : '',
    longDistanceFeeStr: d.longDistanceFeeWon != null ? formatWonDisplay(d.longDistanceFeeWon) : '',
    evidenceSubmission: (d.evidenceSubmission ??
      'not_required') as SettlementItemEvidenceSubmission,
  }
}

/** tier1(1급 강사비 등): 조건 표 + 산정 기준 표 */
function SettlementItemSettingDetailTier1Body({ itemId }: { itemId: string }) {
  const detail = getSettlementItemSettingDetail(itemId)
  const initial = buildInitialFormState(itemId)

  const [qualificationText, setQualificationText] = useState(() =>
    linesToEditableText(detail.qualificationLines)
  )
  const [remarkText, setRemarkText] = useState(() => linesToEditableText(detail.remarkLines))
  const [basisHoursStr, setBasisHoursStr] = useState(initial.basisHoursStr)
  const [maxLimitStr, setMaxLimitStr] = useState(initial.maxLimitStr)

  const handleHoursChange = (v: string) => {
    if (v === '') {
      setBasisHoursStr('')
      return
    }
    const digits = v.replace(/[^\d]/g, '')
    if (digits === '') {
      setBasisHoursStr('')
      return
    }
    setBasisHoursStr(String(Number.parseInt(digits, 10) || 0))
  }

  useRegisterSettlementDetailSnapshot(
    () => ({
      layout: 'tier1',
      basisUnit: '시간',
      basisHours: Number.parseInt(basisHoursStr, 10) || 0,
      compareKind: 'standard',
      maxLimitWon: parseWonStringToNumber(maxLimitStr),
      basicFeeWon: null,
      longDistanceFeeWon: null,
      qualificationLines: parseEditableLines(qualificationText),
      remarkLines: parseEditableLines(remarkText),
    }),
    [qualificationText, remarkText, basisHoursStr, maxLimitStr]
  )

  return (
    <div className="settlement-item-setting-detail-modal__section-stack settlement-item-setting-detail-modal__section-stack--tier1">
      <section aria-labelledby="settlement-detail-condition-label">
        <h3
          id="settlement-detail-condition-label"
          className="settlement-item-setting-detail-modal__section-label"
        >
          조건
        </h3>
        <ModalSpecTable aria-label="조건">
          <ModalSpecTableRow label="지급 요건" labelVariant="paymentRequirement">
            <textarea
              className="modal-spec-table__textarea"
              rows={6}
              value={qualificationText}
              onChange={e => setQualificationText(e.target.value)}
              aria-label="지급 요건"
            />
          </ModalSpecTableRow>
          <ModalSpecTableRow label="비고" labelVariant="remark">
            <textarea
              className="modal-spec-table__textarea"
              rows={5}
              value={remarkText}
              onChange={e => setRemarkText(e.target.value)}
              aria-label="비고"
            />
          </ModalSpecTableRow>
        </ModalSpecTable>
      </section>

      <section aria-labelledby="settlement-detail-basis-label">
        <h3
          id="settlement-detail-basis-label"
          className="settlement-item-setting-detail-modal__section-label"
        >
          산정 기준
        </h3>
        <ModalSpecTable aria-label="산정 기준">
          <ModalSpecTableRow label="산정 기준 단위" labelVariant="basis">
            <div className="modal-spec-table__field-row">
              <div className="modal-spec-table__input-wrap">
                <AppInput
                  {...settlementInputIntegerKeyDownProps}
                  value={basisHoursStr}
                  onChange={e => handleHoursChange(e.target.value)}
                  inputMode="numeric"
                />
              </div>
              <span className="modal-spec-table__suffix-text">시간 기준</span>
            </div>
          </ModalSpecTableRow>
          <ModalSpecTableRow label="최대 한도 금액" labelVariant="basis">
            <div className="modal-spec-table__field-row">
              <div className="modal-spec-table__input-wrap">
                <AppInput
                  {...settlementInputIntegerKeyDownProps}
                  suffix="원"
                  value={maxLimitStr}
                  onChange={e => setMaxLimitStr(parseWonInput(e.target.value))}
                  inputMode="numeric"
                />
              </div>
            </div>
          </ModalSpecTableRow>
        </ModalSpecTable>
      </section>
    </div>
  )
}

/** 특강 강사비(w-4): 조건 표만 — 지급 요건 80px·비고 128px */
function SettlementItemSettingDetailSpecialLectureBody({ itemId }: { itemId: string }) {
  const detail = getSettlementItemSettingDetail(itemId)

  const [qualificationText, setQualificationText] = useState(() =>
    linesToEditableText(detail.qualificationLines)
  )
  const [remarkText, setRemarkText] = useState(() => linesToEditableText(detail.remarkLines))

  useRegisterSettlementDetailSnapshot(
    () => ({
      ...getSettlementItemSettingDetail(itemId),
      layout: 'specialLecture',
      qualificationLines: parseEditableLines(qualificationText),
      remarkLines: parseEditableLines(remarkText),
    }),
    [itemId, qualificationText, remarkText]
  )

  return (
    <div className="settlement-item-setting-detail-modal__section-stack settlement-item-setting-detail-modal__section-stack--special-lecture">
      <section aria-labelledby="settlement-detail-condition-label">
        <h3
          id="settlement-detail-condition-label"
          className="settlement-item-setting-detail-modal__section-label"
        >
          조건
        </h3>
        <ModalSpecTable aria-label="조건">
          <ModalSpecTableRow label="지급 요건" labelVariant="paymentRequirementShort">
            <textarea
              className="modal-spec-table__textarea"
              rows={3}
              value={qualificationText}
              onChange={e => setQualificationText(e.target.value)}
              aria-label="지급 요건"
            />
          </ModalSpecTableRow>
          <ModalSpecTableRow label="비고" labelVariant="remark">
            <textarea
              className="modal-spec-table__textarea"
              rows={5}
              value={remarkText}
              onChange={e => setRemarkText(e.target.value)}
              aria-label="비고"
            />
          </ModalSpecTableRow>
        </ModalSpecTable>
      </section>
    </div>
  )
}

/** 보조 강사비(w-5): 조건(지급 요건 80px·비고 128px) + 산정 기준(1급과 동일) */
function SettlementItemSettingDetailAssistantBody({ itemId }: { itemId: string }) {
  const detail = getSettlementItemSettingDetail(itemId)
  const initial = buildInitialFormState(itemId)

  const [qualificationText, setQualificationText] = useState(() =>
    linesToEditableText(detail.qualificationLines)
  )
  const [remarkText, setRemarkText] = useState(() => linesToEditableText(detail.remarkLines))
  const [basisHoursStr, setBasisHoursStr] = useState(initial.basisHoursStr)
  const [maxLimitStr, setMaxLimitStr] = useState(initial.maxLimitStr)

  const handleHoursChange = (v: string) => {
    if (v === '') {
      setBasisHoursStr('')
      return
    }
    const digits = v.replace(/[^\d]/g, '')
    if (digits === '') {
      setBasisHoursStr('')
      return
    }
    setBasisHoursStr(String(Number.parseInt(digits, 10) || 0))
  }

  useRegisterSettlementDetailSnapshot(
    () => ({
      layout: 'assistantInstructor',
      basisUnit: '시간',
      basisHours: Number.parseInt(basisHoursStr, 10) || 0,
      compareKind: 'standard',
      maxLimitWon: parseWonStringToNumber(maxLimitStr),
      basicFeeWon: null,
      longDistanceFeeWon: null,
      qualificationLines: parseEditableLines(qualificationText),
      remarkLines: parseEditableLines(remarkText),
    }),
    [qualificationText, remarkText, basisHoursStr, maxLimitStr]
  )

  return (
    <div className="settlement-item-setting-detail-modal__section-stack settlement-item-setting-detail-modal__section-stack--tier1">
      <section aria-labelledby="settlement-detail-condition-label">
        <h3
          id="settlement-detail-condition-label"
          className="settlement-item-setting-detail-modal__section-label"
        >
          조건
        </h3>
        <ModalSpecTable aria-label="조건">
          <ModalSpecTableRow label="지급 요건" labelVariant="paymentRequirementShort">
            <textarea
              className="modal-spec-table__textarea"
              rows={3}
              value={qualificationText}
              onChange={e => setQualificationText(e.target.value)}
              aria-label="지급 요건"
            />
          </ModalSpecTableRow>
          <ModalSpecTableRow label="비고" labelVariant="remark">
            <textarea
              className="modal-spec-table__textarea"
              rows={5}
              value={remarkText}
              onChange={e => setRemarkText(e.target.value)}
              aria-label="비고"
            />
          </ModalSpecTableRow>
        </ModalSpecTable>
      </section>

      <section aria-labelledby="settlement-detail-basis-label">
        <h3
          id="settlement-detail-basis-label"
          className="settlement-item-setting-detail-modal__section-label"
        >
          산정 기준
        </h3>
        <ModalSpecTable aria-label="산정 기준">
          <ModalSpecTableRow label="산정 기준 단위" labelVariant="basis">
            <div className="modal-spec-table__field-row">
              <div className="modal-spec-table__input-wrap">
                <AppInput
                  {...settlementInputIntegerKeyDownProps}
                  value={basisHoursStr}
                  onChange={e => handleHoursChange(e.target.value)}
                  inputMode="numeric"
                />
              </div>
              <span className="modal-spec-table__suffix-text">시간 기준</span>
            </div>
          </ModalSpecTableRow>
          <ModalSpecTableRow label="최대 한도 금액" labelVariant="basis">
            <div className="modal-spec-table__field-row">
              <div className="modal-spec-table__input-wrap">
                <AppInput
                  {...settlementInputIntegerKeyDownProps}
                  suffix="원"
                  value={maxLimitStr}
                  onChange={e => setMaxLimitStr(parseWonInput(e.target.value))}
                  inputMode="numeric"
                />
              </div>
            </div>
          </ModalSpecTableRow>
        </ModalSpecTable>
      </section>
    </div>
  )
}

/** 다수인출강비(w-6): 산정 기준 01·02 (원 입력 160px) */
function SettlementItemSettingDetailMultiInstructorBody({ itemId }: { itemId: string }) {
  const detail = getSettlementItemSettingDetail(itemId)

  const [m01BasisStr, setM01BasisStr] = useState(() =>
    String(detail.multiInstructor01Basis ?? 1)
  )
  const [m01Max5Str, setM01Max5Str] = useState(() =>
    formatWonDisplay(detail.multiInstructor01MaxUnder5 ?? null)
  )
  const [m01Max610Str, setM01Max610Str] = useState(() =>
    formatWonDisplay(detail.multiInstructor01Max6to10 ?? null)
  )
  const [m01Max11Str, setM01Max11Str] = useState(() =>
    formatWonDisplay(detail.multiInstructor01Max11plus ?? null)
  )
  const [m02HoursStr, setM02HoursStr] = useState(() =>
    String(detail.multiInstructor02BasisHours ?? 1)
  )
  const [m02Max5Str, setM02Max5Str] = useState(() =>
    formatWonDisplay(detail.multiInstructor02MaxUnder5 ?? null)
  )
  const [m02Max610Str, setM02Max610Str] = useState(() =>
    formatWonDisplay(detail.multiInstructor02Max6to10 ?? null)
  )
  const [m02Max11Str, setM02Max11Str] = useState(() =>
    formatWonDisplay(detail.multiInstructor02Max11plus ?? null)
  )

  const handleIntOnly = (v: string) => {
    if (v === '') return ''
    const digits = v.replace(/[^\d]/g, '')
    if (digits === '') return ''
    return String(Number.parseInt(digits, 10) || 0)
  }

  useRegisterSettlementDetailSnapshot(
    () => ({
      layout: 'multiInstructor',
      basisUnit: '전체',
      basisHours: 1,
      compareKind: 'standard',
      maxLimitWon: null,
      basicFeeWon: null,
      longDistanceFeeWon: null,
      qualificationLines: [],
      remarkLines: [],
      multiInstructor01Basis: Number.parseInt(m01BasisStr, 10) || 0,
      multiInstructor01MaxUnder5: parseWonStringToNumber(m01Max5Str),
      multiInstructor01Max6to10: parseWonStringToNumber(m01Max610Str),
      multiInstructor01Max11plus: parseWonStringToNumber(m01Max11Str),
      multiInstructor02BasisHours: Number.parseInt(m02HoursStr, 10) || 0,
      multiInstructor02MaxUnder5: parseWonStringToNumber(m02Max5Str),
      multiInstructor02Max6to10: parseWonStringToNumber(m02Max610Str),
      multiInstructor02Max11plus: parseWonStringToNumber(m02Max11Str),
    }),
    [
      m01BasisStr,
      m01Max5Str,
      m01Max610Str,
      m01Max11Str,
      m02HoursStr,
      m02Max5Str,
      m02Max610Str,
      m02Max11Str,
    ]
  )

  const wonRow = (
    label: string,
    value: string,
    onChange: (s: string) => void
  ) => (
    <ModalSpecTableRow key={label} label={label} labelVariant="basis">
      <div className="modal-spec-table__field-row">
        <div className="modal-spec-table__input-wrap modal-spec-table__input-wrap--w160">
          <AppInput
            {...settlementInputIntegerKeyDownProps}
            suffix="원"
            value={value}
            onChange={e => onChange(parseWonInput(e.target.value))}
            inputMode="numeric"
          />
        </div>
      </div>
    </ModalSpecTableRow>
  )

  return (
    <div className="settlement-item-setting-detail-modal__section-stack settlement-item-setting-detail-modal__section-stack--tier1">
      <section aria-labelledby="settlement-multi-basis-01-label">
        <h3
          id="settlement-multi-basis-01-label"
          className="settlement-item-setting-detail-modal__section-label"
        >
          산정 기준 01
        </h3>
        <ModalSpecTable aria-label="산정 기준 01">
          <ModalSpecTableRow label="기준 항목" labelVariant="basis">
            <div className="modal-spec-table__field-row">
              <div className="modal-spec-table__input-wrap">
                <AppInput
                  {...settlementInputIntegerKeyDownProps}
                  value={m01BasisStr}
                  onChange={e => setM01BasisStr(handleIntOnly(e.target.value))}
                  inputMode="numeric"
                />
              </div>
              <span className="modal-spec-table__suffix-text">시간 당</span>
            </div>
          </ModalSpecTableRow>
          {wonRow('5인 이하 최대 한도', m01Max5Str, setM01Max5Str)}
          {wonRow('6~10인 최대 한도', m01Max610Str, setM01Max610Str)}
          {wonRow('11인 이상 최대 한도', m01Max11Str, setM01Max11Str)}
        </ModalSpecTable>
      </section>

      <section aria-labelledby="settlement-multi-basis-02-label">
        <h3
          id="settlement-multi-basis-02-label"
          className="settlement-item-setting-detail-modal__section-label"
        >
          산정 기준 02
        </h3>
        <ModalSpecTable aria-label="산정 기준 02">
          <ModalSpecTableRow label="산정 기준 단위" labelVariant="basis">
            <div className="modal-spec-table__field-row">
              <div className="modal-spec-table__input-wrap">
                <AppInput
                  {...settlementInputIntegerKeyDownProps}
                  value={m02HoursStr}
                  onChange={e => setM02HoursStr(handleIntOnly(e.target.value))}
                  inputMode="numeric"
                />
              </div>
              <span className="modal-spec-table__suffix-text">시간 기준</span>
            </div>
          </ModalSpecTableRow>
          {wonRow('5인 이하 최대 한도', m02Max5Str, setM02Max5Str)}
          {wonRow('6~10인 최대 한도', m02Max610Str, setM02Max610Str)}
          {wonRow('11인 이상 최대 한도', m02Max11Str, setM02Max11Str)}
        </ModalSpecTable>
      </section>
    </div>
  )
}

/** 단순인건비(w-7): 조건 + 산정(단순인건비·주휴·증빙 라디오 TD) */
function SettlementItemSettingDetailSimpleLaborBody({ itemId }: { itemId: string }) {
  const detail = getSettlementItemSettingDetail(itemId)
  const initial = buildInitialFormState(itemId)

  const [qualificationText, setQualificationText] = useState(() =>
    linesToEditableText(detail.qualificationLines)
  )
  const [remarkText, setRemarkText] = useState(() => linesToEditableText(detail.remarkLines))
  const [basisHoursStr, setBasisHoursStr] = useState(initial.basisHoursStr)
  const [simpleLaborStr, setSimpleLaborStr] = useState(() =>
    formatWonDisplay(detail.simpleLaborWon ?? null)
  )
  const [weeklyHolidayStr, setWeeklyHolidayStr] = useState(() =>
    formatWonDisplay(detail.weeklyHolidayAllowanceWon ?? null)
  )
  const [evidenceSubmission, setEvidenceSubmission] = useState<SettlementItemEvidenceSubmission>(
    (detail.evidenceSubmission ?? 'not_required') as SettlementItemEvidenceSubmission
  )

  const handleHoursChange = (v: string) => {
    if (v === '') {
      setBasisHoursStr('')
      return
    }
    const digits = v.replace(/[^\d]/g, '')
    if (digits === '') {
      setBasisHoursStr('')
      return
    }
    setBasisHoursStr(String(Number.parseInt(digits, 10) || 0))
  }

  useRegisterSettlementDetailSnapshot(
    () => ({
      layout: 'simpleLabor',
      basisUnit: '시간',
      basisHours: Number.parseInt(basisHoursStr, 10) || 0,
      compareKind: 'standard',
      maxLimitWon: null,
      basicFeeWon: null,
      longDistanceFeeWon: null,
      simpleLaborWon: parseWonStringToNumber(simpleLaborStr),
      weeklyHolidayAllowanceWon: parseWonStringToNumber(weeklyHolidayStr),
      qualificationLines: parseEditableLines(qualificationText),
      remarkLines: parseEditableLines(remarkText),
      evidenceSubmission,
    }),
    [
      qualificationText,
      remarkText,
      basisHoursStr,
      simpleLaborStr,
      weeklyHolidayStr,
      evidenceSubmission,
    ]
  )

  return (
    <div className="settlement-item-setting-detail-modal__section-stack settlement-item-setting-detail-modal__section-stack--tier1">
      <section aria-labelledby="settlement-detail-condition-label">
        <h3
          id="settlement-detail-condition-label"
          className="settlement-item-setting-detail-modal__section-label"
        >
          조건
        </h3>
        <ModalSpecTable aria-label="조건">
          <ModalSpecTableRow label="지급 요건" labelVariant="paymentRequirementShort">
            <textarea
              className="modal-spec-table__textarea"
              rows={3}
              value={qualificationText}
              onChange={e => setQualificationText(e.target.value)}
              aria-label="지급 요건"
            />
          </ModalSpecTableRow>
          <ModalSpecTableRow label="비고" labelVariant="remark">
            <textarea
              className="modal-spec-table__textarea"
              rows={5}
              value={remarkText}
              onChange={e => setRemarkText(e.target.value)}
              aria-label="비고"
            />
          </ModalSpecTableRow>
        </ModalSpecTable>
      </section>

      <section aria-labelledby="settlement-detail-basis-label">
        <h3
          id="settlement-detail-basis-label"
          className="settlement-item-setting-detail-modal__section-label"
        >
          산정 기준
        </h3>
        <ModalSpecTable aria-label="산정 기준">
          <ModalSpecTableRow label="산정 기준 단위" labelVariant="basis">
            <div className="modal-spec-table__field-row">
              <div className="modal-spec-table__input-wrap">
                <AppInput
                  {...settlementInputIntegerKeyDownProps}
                  value={basisHoursStr}
                  onChange={e => handleHoursChange(e.target.value)}
                  inputMode="numeric"
                />
              </div>
              <span className="modal-spec-table__suffix-text">시간 기준</span>
            </div>
          </ModalSpecTableRow>
          <ModalSpecTableRow label="단순인건비" labelVariant="basis">
            <div className="modal-spec-table__field-row">
              <div className="modal-spec-table__input-wrap modal-spec-table__input-wrap--w160">
                <AppInput
                  {...settlementInputIntegerKeyDownProps}
                  suffix="원"
                  value={simpleLaborStr}
                  onChange={e => setSimpleLaborStr(parseWonInput(e.target.value))}
                  inputMode="numeric"
                />
              </div>
            </div>
          </ModalSpecTableRow>
          <ModalSpecTableRow label="주휴수당" labelVariant="basis">
            <div className="modal-spec-table__field-row">
              <div className="modal-spec-table__input-wrap modal-spec-table__input-wrap--w160">
                <AppInput
                  {...settlementInputIntegerKeyDownProps}
                  suffix="원"
                  value={weeklyHolidayStr}
                  onChange={e => setWeeklyHolidayStr(parseWonInput(e.target.value))}
                  inputMode="numeric"
                />
              </div>
            </div>
          </ModalSpecTableRow>
          <ModalSpecTableRow label="증빙 자료 제출 여부" labelVariant="basis">
            <ModalSpecTableRadioCell
              value={evidenceSubmission}
              onChange={setEvidenceSubmission}
              options={SIMPLE_LABOR_EVIDENCE_RADIO_OPTIONS}
              aria-label="증빙 자료 제출 여부"
            />
          </ModalSpecTableRow>
        </ModalSpecTable>
      </section>
    </div>
  )
}

/** 숙박비(p-3·p-7): 조건(104px) + 산정(일·금액·증빙). p-7만 산정 금액 라벨「지급액」 */
function SettlementItemSettingDetailLodgingBody({ itemId }: { itemId: string }) {
  const detail = getSettlementItemSettingDetail(itemId)
  const isLodgingOneToOne = itemId === 'p-7'

  const [qualificationText, setQualificationText] = useState(() =>
    linesToEditableText(detail.qualificationLines)
  )
  const [remarkText, setRemarkText] = useState(() => linesToEditableText(detail.remarkLines))
  const [basisDaysStr, setBasisDaysStr] = useState(() => String(detail.basisHours))
  const [maxLimitStr, setMaxLimitStr] = useState(() =>
    formatWonDisplay(detail.maxLimitWon ?? null)
  )
  const [evidenceSubmission, setEvidenceSubmission] = useState<SettlementItemEvidenceSubmission>(
    () => (detail.evidenceSubmission ?? 'required') as SettlementItemEvidenceSubmission
  )

  const handleBasisDaysChange = (v: string) => {
    if (v === '') {
      setBasisDaysStr('')
      return
    }
    const digits = v.replace(/[^\d]/g, '')
    if (digits === '') {
      setBasisDaysStr('')
      return
    }
    setBasisDaysStr(String(Number.parseInt(digits, 10) || 0))
  }

  useRegisterSettlementDetailSnapshot(
    () => {
      const merged = getSettlementItemSettingDetail(itemId)
      return {
        ...merged,
        layout: 'lodging' as const,
        basisUnit: '일',
        basisHours: Number.parseInt(basisDaysStr, 10) || 0,
        compareKind: 'standard',
        maxLimitWon: parseWonStringToNumber(maxLimitStr),
        basicFeeWon: null,
        longDistanceFeeWon: null,
        qualificationLines: parseEditableLines(qualificationText),
        remarkLines: parseEditableLines(remarkText),
        evidenceSubmission,
      }
    },
    [itemId, qualificationText, remarkText, basisDaysStr, maxLimitStr, evidenceSubmission]
  )

  return (
    <div className="settlement-item-setting-detail-modal__section-stack settlement-item-setting-detail-modal__section-stack--tier1">
      <section aria-labelledby="settlement-detail-condition-label">
        <h3
          id="settlement-detail-condition-label"
          className="settlement-item-setting-detail-modal__section-label"
        >
          조건
        </h3>
        <ModalSpecTable
          aria-label="조건"
          className="modal-spec-table--lodging-condition"
        >
          <ModalSpecTableRow label="지급 요건" labelVariant="paymentRequirement">
            <textarea
              className="modal-spec-table__textarea"
              rows={3}
              value={qualificationText}
              onChange={e => setQualificationText(e.target.value)}
              aria-label="지급 요건"
            />
          </ModalSpecTableRow>
          <ModalSpecTableRow label="비고" labelVariant="remark">
            <textarea
              className="modal-spec-table__textarea"
              rows={3}
              value={remarkText}
              onChange={e => setRemarkText(e.target.value)}
              aria-label="비고"
            />
          </ModalSpecTableRow>
        </ModalSpecTable>
      </section>

      <section aria-labelledby="settlement-detail-basis-label">
        <h3
          id="settlement-detail-basis-label"
          className="settlement-item-setting-detail-modal__section-label"
        >
          산정 기준
        </h3>
        <ModalSpecTable aria-label="산정 기준">
          <ModalSpecTableRow label="산정 기준 단위" labelVariant="basis">
            <div className="modal-spec-table__field-row">
              <div className="modal-spec-table__input-wrap modal-spec-table__input-wrap--lodging-basis-days">
                <AppInput
                  {...settlementInputIntegerKeyDownProps}
                  value={basisDaysStr}
                  onChange={e => handleBasisDaysChange(e.target.value)}
                  inputMode="numeric"
                />
              </div>
              <span className="modal-spec-table__suffix-text">일 기준</span>
            </div>
          </ModalSpecTableRow>
          <ModalSpecTableRow
            label={isLodgingOneToOne ? '지급액' : '최대 한도 금액'}
            labelVariant="basis"
          >
            <div className="modal-spec-table__field-row">
              <div className="modal-spec-table__input-wrap modal-spec-table__input-wrap--w160">
                <AppInput
                  {...settlementInputIntegerKeyDownProps}
                  suffix="원"
                  value={maxLimitStr}
                  onChange={e => setMaxLimitStr(parseWonInput(e.target.value))}
                  inputMode="numeric"
                  aria-label={isLodgingOneToOne ? '지급액' : '최대 한도 금액'}
                />
              </div>
            </div>
          </ModalSpecTableRow>
          <ModalSpecTableRow label="증빙 자료 제출 여부" labelVariant="basis">
            <ModalSpecTableRadioCell
              value={evidenceSubmission}
              onChange={setEvidenceSubmission}
              options={SIMPLE_LABOR_EVIDENCE_RADIO_OPTIONS}
              aria-label="증빙 자료 제출 여부"
            />
          </ModalSpecTableRow>
        </ModalSpecTable>
      </section>
    </div>
  )
}

/** 식사비(p-4): 조건(104px) + 산정(시간 기준·최대 한도·증빙) */
function SettlementItemSettingDetailMealBody({ itemId }: { itemId: string }) {
  const detail = getSettlementItemSettingDetail(itemId)

  const [qualificationText, setQualificationText] = useState(() =>
    linesToEditableText(detail.qualificationLines)
  )
  const [remarkText, setRemarkText] = useState(() => linesToEditableText(detail.remarkLines))
  const [basisHoursStr, setBasisHoursStr] = useState(() => String(detail.basisHours))
  const [maxLimitStr, setMaxLimitStr] = useState(() =>
    formatWonDisplay(detail.maxLimitWon ?? null)
  )
  const [evidenceSubmission, setEvidenceSubmission] = useState<SettlementItemEvidenceSubmission>(
    () => (detail.evidenceSubmission ?? 'required') as SettlementItemEvidenceSubmission
  )

  const handleBasisHoursChange = (v: string) => {
    if (v === '') {
      setBasisHoursStr('')
      return
    }
    const digits = v.replace(/[^\d]/g, '')
    if (digits === '') {
      setBasisHoursStr('')
      return
    }
    setBasisHoursStr(String(Number.parseInt(digits, 10) || 0))
  }

  useRegisterSettlementDetailSnapshot(
    () => {
      const merged = getSettlementItemSettingDetail(itemId)
      return {
        ...merged,
        layout: 'meal' as const,
        basisUnit: '시간',
        basisHours: Number.parseInt(basisHoursStr, 10) || 0,
        compareKind: 'standard',
        maxLimitWon: parseWonStringToNumber(maxLimitStr),
        basicFeeWon: null,
        longDistanceFeeWon: null,
        qualificationLines: parseEditableLines(qualificationText),
        remarkLines: parseEditableLines(remarkText),
        evidenceSubmission,
      }
    },
    [itemId, qualificationText, remarkText, basisHoursStr, maxLimitStr, evidenceSubmission]
  )

  return (
    <div className="settlement-item-setting-detail-modal__section-stack settlement-item-setting-detail-modal__section-stack--tier1">
      <section aria-labelledby="settlement-detail-condition-label">
        <h3
          id="settlement-detail-condition-label"
          className="settlement-item-setting-detail-modal__section-label"
        >
          조건
        </h3>
        <ModalSpecTable aria-label="조건" className="modal-spec-table--meal-condition">
          <ModalSpecTableRow label="지급 요건" labelVariant="paymentRequirement">
            <textarea
              className="modal-spec-table__textarea"
              rows={3}
              value={qualificationText}
              onChange={e => setQualificationText(e.target.value)}
              aria-label="지급 요건"
            />
          </ModalSpecTableRow>
          <ModalSpecTableRow label="비고" labelVariant="remark">
            <textarea
              className="modal-spec-table__textarea"
              rows={3}
              value={remarkText}
              onChange={e => setRemarkText(e.target.value)}
              aria-label="비고"
            />
          </ModalSpecTableRow>
        </ModalSpecTable>
      </section>

      <section aria-labelledby="settlement-detail-basis-label">
        <h3
          id="settlement-detail-basis-label"
          className="settlement-item-setting-detail-modal__section-label"
        >
          산정 기준
        </h3>
        <ModalSpecTable aria-label="산정 기준">
          <ModalSpecTableRow label="산정 기준 단위" labelVariant="basis">
            <div className="modal-spec-table__field-row">
              <div className="modal-spec-table__input-wrap modal-spec-table__input-wrap--meal-basis-hours">
                <AppInput
                  {...settlementInputIntegerKeyDownProps}
                  value={basisHoursStr}
                  onChange={e => handleBasisHoursChange(e.target.value)}
                  inputMode="numeric"
                />
              </div>
              <span className="modal-spec-table__suffix-text">시간 기준</span>
            </div>
          </ModalSpecTableRow>
          <ModalSpecTableRow label="최대 한도 금액" labelVariant="basis">
            <div className="modal-spec-table__field-row">
              <div className="modal-spec-table__input-wrap modal-spec-table__input-wrap--w160">
                <AppInput
                  {...settlementInputIntegerKeyDownProps}
                  suffix="원"
                  value={maxLimitStr}
                  onChange={e => setMaxLimitStr(parseWonInput(e.target.value))}
                  inputMode="numeric"
                  aria-label="최대 한도 금액"
                />
              </div>
            </div>
          </ModalSpecTableRow>
          <ModalSpecTableRow label="증빙 자료 제출 여부" labelVariant="basis">
            <ModalSpecTableRadioCell
              value={evidenceSubmission}
              onChange={setEvidenceSubmission}
              options={SIMPLE_LABOR_EVIDENCE_RADIO_OPTIONS}
              aria-label="증빙 자료 제출 여부"
            />
          </ModalSpecTableRow>
        </ModalSpecTable>
      </section>
    </div>
  )
}

/** 자원봉사자 활동비(p-6): 조건(104px) + 산정(시간 기준·최대 한도·증빙) */
function SettlementItemSettingDetailVolunteerActivityBody({ itemId }: { itemId: string }) {
  const detail = getSettlementItemSettingDetail(itemId)

  const [qualificationText, setQualificationText] = useState(() =>
    linesToEditableText(detail.qualificationLines)
  )
  const [remarkText, setRemarkText] = useState(() => linesToEditableText(detail.remarkLines))
  const [basisHoursStr, setBasisHoursStr] = useState(() => String(detail.basisHours))
  const [maxLimitStr, setMaxLimitStr] = useState(() =>
    formatWonDisplay(detail.maxLimitWon ?? null)
  )
  const [evidenceSubmission, setEvidenceSubmission] = useState<SettlementItemEvidenceSubmission>(
    () => (detail.evidenceSubmission ?? 'required') as SettlementItemEvidenceSubmission
  )

  const handleBasisHoursChange = (v: string) => {
    if (v === '') {
      setBasisHoursStr('')
      return
    }
    const digits = v.replace(/[^\d]/g, '')
    if (digits === '') {
      setBasisHoursStr('')
      return
    }
    setBasisHoursStr(String(Number.parseInt(digits, 10) || 0))
  }

  useRegisterSettlementDetailSnapshot(
    () => {
      const merged = getSettlementItemSettingDetail(itemId)
      return {
        ...merged,
        layout: 'volunteerActivity' as const,
        basisUnit: '시간',
        basisHours: Number.parseInt(basisHoursStr, 10) || 0,
        compareKind: 'standard',
        maxLimitWon: parseWonStringToNumber(maxLimitStr),
        basicFeeWon: null,
        longDistanceFeeWon: null,
        qualificationLines: parseEditableLines(qualificationText),
        remarkLines: parseEditableLines(remarkText),
        evidenceSubmission,
      }
    },
    [itemId, qualificationText, remarkText, basisHoursStr, maxLimitStr, evidenceSubmission]
  )

  return (
    <div className="settlement-item-setting-detail-modal__section-stack settlement-item-setting-detail-modal__section-stack--tier1">
      <section aria-labelledby="settlement-detail-condition-label">
        <h3
          id="settlement-detail-condition-label"
          className="settlement-item-setting-detail-modal__section-label"
        >
          조건
        </h3>
        <ModalSpecTable
          aria-label="조건"
          className="modal-spec-table--volunteer-activity-condition"
        >
          <ModalSpecTableRow label="지급 요건" labelVariant="paymentRequirement">
            <textarea
              className="modal-spec-table__textarea"
              rows={3}
              value={qualificationText}
              onChange={e => setQualificationText(e.target.value)}
              aria-label="지급 요건"
            />
          </ModalSpecTableRow>
          <ModalSpecTableRow label="비고" labelVariant="remark">
            <textarea
              className="modal-spec-table__textarea"
              rows={3}
              value={remarkText}
              onChange={e => setRemarkText(e.target.value)}
              aria-label="비고"
            />
          </ModalSpecTableRow>
        </ModalSpecTable>
      </section>

      <section aria-labelledby="settlement-detail-basis-label">
        <h3
          id="settlement-detail-basis-label"
          className="settlement-item-setting-detail-modal__section-label"
        >
          산정 기준
        </h3>
        <ModalSpecTable aria-label="산정 기준">
          <ModalSpecTableRow label="산정 기준 단위" labelVariant="basis">
            <div className="modal-spec-table__field-row">
              <div className="modal-spec-table__input-wrap modal-spec-table__input-wrap--volunteer-activity-basis-hours">
                <AppInput
                  {...settlementInputIntegerKeyDownProps}
                  value={basisHoursStr}
                  onChange={e => handleBasisHoursChange(e.target.value)}
                  inputMode="numeric"
                />
              </div>
              <span className="modal-spec-table__suffix-text">시간 기준</span>
            </div>
          </ModalSpecTableRow>
          <ModalSpecTableRow label="최대 한도 금액" labelVariant="basis">
            <div className="modal-spec-table__field-row">
              <div className="modal-spec-table__input-wrap modal-spec-table__input-wrap--w160">
                <AppInput
                  {...settlementInputIntegerKeyDownProps}
                  suffix="원"
                  value={maxLimitStr}
                  onChange={e => setMaxLimitStr(parseWonInput(e.target.value))}
                  inputMode="numeric"
                  aria-label="최대 한도 금액"
                />
              </div>
            </div>
          </ModalSpecTableRow>
          <ModalSpecTableRow label="증빙 자료 제출 여부" labelVariant="basis">
            <ModalSpecTableRadioCell
              value={evidenceSubmission}
              onChange={setEvidenceSubmission}
              options={SIMPLE_LABOR_EVIDENCE_RADIO_OPTIONS}
              aria-label="증빙 자료 제출 여부"
            />
          </ModalSpecTableRow>
        </ModalSpecTable>
      </section>
    </div>
  )
}

/** 회의참석비(p-5): 산정 기준 01·02(시간 이하/초과·각 최대 한도) */
function SettlementItemSettingDetailMeetingAttendanceBody({ itemId }: { itemId: string }) {
  const detail = getSettlementItemSettingDetail(itemId)

  const [m01HoursStr, setM01HoursStr] = useState(() =>
    String(detail.meetingAttendance01BasisHours ?? 2)
  )
  const [m01MaxStr, setM01MaxStr] = useState(() =>
    formatWonDisplay(detail.meetingAttendance01MaxLimitWon ?? null)
  )
  const [m02HoursStr, setM02HoursStr] = useState(() =>
    String(detail.meetingAttendance02BasisHours ?? 2)
  )
  const [m02MaxStr, setM02MaxStr] = useState(() =>
    formatWonDisplay(detail.meetingAttendance02MaxLimitWon ?? null)
  )

  const handleIntOnly = (v: string) => {
    if (v === '') return ''
    const digits = v.replace(/[^\d]/g, '')
    if (digits === '') return ''
    return String(Number.parseInt(digits, 10) || 0)
  }

  useRegisterSettlementDetailSnapshot(
    () => {
      const merged = getSettlementItemSettingDetail(itemId)
      return {
        ...merged,
        layout: 'meetingAttendance' as const,
        basisUnit: '전체',
        basisHours: 1,
        compareKind: 'standard',
        maxLimitWon: null,
        basicFeeWon: null,
        longDistanceFeeWon: null,
        qualificationLines: [],
        remarkLines: [],
        meetingAttendance01BasisHours: Number.parseInt(m01HoursStr, 10) || 0,
        meetingAttendance01MaxLimitWon: parseWonStringToNumber(m01MaxStr),
        meetingAttendance02BasisHours: Number.parseInt(m02HoursStr, 10) || 0,
        meetingAttendance02MaxLimitWon: parseWonStringToNumber(m02MaxStr),
      }
    },
    [itemId, m01HoursStr, m01MaxStr, m02HoursStr, m02MaxStr]
  )

  return (
    <div className="settlement-item-setting-detail-modal__section-stack settlement-item-setting-detail-modal__section-stack--tier1">
      <section aria-labelledby="settlement-meeting-basis-01-label">
        <h3
          id="settlement-meeting-basis-01-label"
          className="settlement-item-setting-detail-modal__section-label"
        >
          산정 기준 01
        </h3>
        <ModalSpecTable aria-label="산정 기준 01">
          <ModalSpecTableRow label="산정 기준 단위" labelVariant="basis">
            <div className="modal-spec-table__field-row">
              <div className="modal-spec-table__input-wrap modal-spec-table__input-wrap--meeting-attendance-hours">
                <AppInput
                  {...settlementInputIntegerKeyDownProps}
                  value={m01HoursStr}
                  onChange={e => setM01HoursStr(handleIntOnly(e.target.value))}
                  inputMode="numeric"
                  aria-label="산정 기준 01 시간"
                />
              </div>
              <span className="modal-spec-table__suffix-text">시간 이하</span>
            </div>
          </ModalSpecTableRow>
          <ModalSpecTableRow label="최대 한도 금액" labelVariant="basis">
            <div className="modal-spec-table__field-row">
              <div className="modal-spec-table__input-wrap modal-spec-table__input-wrap--w160">
                <AppInput
                  {...settlementInputIntegerKeyDownProps}
                  suffix="원"
                  value={m01MaxStr}
                  onChange={e => setM01MaxStr(parseWonInput(e.target.value))}
                  inputMode="numeric"
                  aria-label="산정 기준 01 최대 한도 금액"
                />
              </div>
            </div>
          </ModalSpecTableRow>
        </ModalSpecTable>
      </section>

      <section aria-labelledby="settlement-meeting-basis-02-label">
        <h3
          id="settlement-meeting-basis-02-label"
          className="settlement-item-setting-detail-modal__section-label"
        >
          산정 기준 02
        </h3>
        <ModalSpecTable aria-label="산정 기준 02">
          <ModalSpecTableRow label="산정 기준 단위" labelVariant="basis">
            <div className="modal-spec-table__field-row">
              <div className="modal-spec-table__input-wrap modal-spec-table__input-wrap--meeting-attendance-hours">
                <AppInput
                  {...settlementInputIntegerKeyDownProps}
                  value={m02HoursStr}
                  onChange={e => setM02HoursStr(handleIntOnly(e.target.value))}
                  inputMode="numeric"
                  aria-label="산정 기준 02 시간"
                />
              </div>
              <span className="modal-spec-table__suffix-text">시간 초과</span>
            </div>
          </ModalSpecTableRow>
          <ModalSpecTableRow label="최대 한도 금액" labelVariant="basis">
            <div className="modal-spec-table__field-row">
              <div className="modal-spec-table__input-wrap modal-spec-table__input-wrap--w160">
                <AppInput
                  {...settlementInputIntegerKeyDownProps}
                  suffix="원"
                  value={m02MaxStr}
                  onChange={e => setM02MaxStr(parseWonInput(e.target.value))}
                  inputMode="numeric"
                  aria-label="산정 기준 02 최대 한도 금액"
                />
              </div>
            </div>
          </ModalSpecTableRow>
        </ModalSpecTable>
      </section>
    </div>
  )
}

/** 일용근로자 원천징수세액(d-1): 조건·근로소득공제·소득세율 */
function SettlementItemSettingDetailWithholdingDailyWorkerBody({ itemId }: { itemId: string }) {
  const detail = getSettlementItemSettingDetail(itemId)

  const [qualificationText, setQualificationText] = useState(() =>
    linesToEditableText(detail.qualificationLines)
  )
  const [exclusionMaxStr, setExclusionMaxStr] = useState(() =>
    formatWonDisplay(detail.withholdingExclusionMaxWon ?? null)
  )
  const [earnedDeductionStr, setEarnedDeductionStr] = useState(() =>
    formatWonDisplay(detail.withholdingEarnedIncomeDeductionWon ?? null)
  )
  const [rateBusinessStr, setRateBusinessStr] = useState(() =>
    formatPercentField(detail.withholdingTaxRateBusiness ?? null)
  )
  const [rateOtherStr, setRateOtherStr] = useState(() =>
    formatPercentField(detail.withholdingTaxRateOther ?? null)
  )
  const [ratePrizeStr, setRatePrizeStr] = useState(() =>
    formatPercentField(detail.withholdingTaxRatePrize ?? null)
  )
  const [rateInterviewStr, setRateInterviewStr] = useState(() =>
    formatPercentField(detail.withholdingTaxRateInterview ?? null)
  )

  useRegisterSettlementDetailSnapshot(
    () => {
      const merged = getSettlementItemSettingDetail(itemId)
      return {
        ...merged,
        layout: 'withholdingDailyWorker' as const,
        basisUnit: '전체',
        basisHours: 1,
        compareKind: 'standard',
        maxLimitWon: null,
        basicFeeWon: null,
        longDistanceFeeWon: null,
        qualificationLines: parseEditableLines(qualificationText),
        remarkLines: merged.remarkLines,
        withholdingExclusionMaxWon: parseWonStringToNumber(exclusionMaxStr),
        withholdingEarnedIncomeDeductionWon: parseWonStringToNumber(earnedDeductionStr),
        withholdingTaxRateBusiness: parsePercentToNullableNumber(rateBusinessStr),
        withholdingTaxRateOther: parsePercentToNullableNumber(rateOtherStr),
        withholdingTaxRatePrize: parsePercentToNullableNumber(ratePrizeStr),
        withholdingTaxRateInterview: parsePercentToNullableNumber(rateInterviewStr),
      }
    },
    [
      itemId,
      qualificationText,
      exclusionMaxStr,
      earnedDeductionStr,
      rateBusinessStr,
      rateOtherStr,
      ratePrizeStr,
      rateInterviewStr,
    ]
  )

  return (
    <div className="settlement-item-setting-detail-modal__section-stack settlement-item-setting-detail-modal__section-stack--tier1">
      <section aria-labelledby="settlement-withholding-condition-label">
        <h3
          id="settlement-withholding-condition-label"
          className="settlement-item-setting-detail-modal__section-label"
        >
          조건
        </h3>
        <ModalSpecTable aria-label="조건">
          <ModalSpecTableRow label="공제 요건" labelVariant="paymentRequirementShort">
            <textarea
              className="modal-spec-table__textarea"
              rows={3}
              value={qualificationText}
              onChange={e => setQualificationText(e.target.value)}
              aria-label="공제 요건"
            />
          </ModalSpecTableRow>
          <ModalSpecTableRow label="수익 제외 범위" labelVariant="basis">
            <div className="modal-spec-table__field-row modal-spec-table__field-row--withholding-inline">
              <span className="modal-spec-table__suffix-text">원천징수세액이</span>
              <div className="modal-spec-table__input-wrap modal-spec-table__input-wrap--w160">
                <AppInput
                  {...settlementInputIntegerKeyDownProps}
                  value={exclusionMaxStr}
                  onChange={e => setExclusionMaxStr(parseWonInput(e.target.value))}
                  inputMode="numeric"
                  aria-label="수익 제외 원천징수세액 한도(원)"
                />
              </div>
              <span className="modal-spec-table__suffix-text">원 이하인 경우, 미징수</span>
            </div>
          </ModalSpecTableRow>
        </ModalSpecTable>
      </section>

      <section aria-labelledby="settlement-withholding-earned-label">
        <h3
          id="settlement-withholding-earned-label"
          className="settlement-item-setting-detail-modal__section-label"
        >
          근로소득공제
        </h3>
        <ModalSpecTable aria-label="근로소득공제">
          <ModalSpecTableRow label="근로소득공제비용" labelVariant="basis">
            <div className="modal-spec-table__field-row">
              <div className="modal-spec-table__input-wrap modal-spec-table__input-wrap--w160">
                <AppInput
                  {...settlementInputIntegerKeyDownProps}
                  suffix="원"
                  value={earnedDeductionStr}
                  onChange={e => setEarnedDeductionStr(parseWonInput(e.target.value))}
                  inputMode="numeric"
                  aria-label="근로소득공제비용"
                />
              </div>
            </div>
          </ModalSpecTableRow>
        </ModalSpecTable>
      </section>

      <section aria-labelledby="settlement-withholding-rates-label">
        <h3
          id="settlement-withholding-rates-label"
          className="settlement-item-setting-detail-modal__section-label"
        >
          소득세율
        </h3>
        <ModalSpecTable aria-label="소득세율">
          <ModalSpecTableRow label="사업소득" labelVariant="basis">
            <div className="modal-spec-table__field-row">
              <div className="modal-spec-table__input-wrap">
                <AppInput
                  {...settlementInputDecimalKeyDownProps}
                  suffix="%"
                  value={rateBusinessStr}
                  onChange={e => setRateBusinessStr(sanitizePercentInput(e.target.value))}
                  inputMode="decimal"
                  aria-label="사업소득 세율"
                />
              </div>
            </div>
          </ModalSpecTableRow>
          <ModalSpecTableRow label="기타소득" labelVariant="basis">
            <div className="modal-spec-table__field-row">
              <div className="modal-spec-table__input-wrap">
                <AppInput
                  {...settlementInputDecimalKeyDownProps}
                  suffix="%"
                  value={rateOtherStr}
                  onChange={e => setRateOtherStr(sanitizePercentInput(e.target.value))}
                  inputMode="decimal"
                  aria-label="기타소득 세율"
                />
              </div>
            </div>
          </ModalSpecTableRow>
          <ModalSpecTableRow label="상금 (기타소득)" labelVariant="basis">
            <div className="modal-spec-table__field-row">
              <div className="modal-spec-table__input-wrap">
                <AppInput
                  {...settlementInputDecimalKeyDownProps}
                  suffix="%"
                  value={ratePrizeStr}
                  onChange={e => setRatePrizeStr(sanitizePercentInput(e.target.value))}
                  inputMode="decimal"
                  aria-label="상금 기타소득 세율"
                />
              </div>
            </div>
          </ModalSpecTableRow>
          <ModalSpecTableRow
            label={
              <>
                면접비, 지원금, 경품
                <br />
                (기타소득)
              </>
            }
            labelVariant="basis"
          >
            <div className="modal-spec-table__field-row">
              <div className="modal-spec-table__input-wrap">
                <AppInput
                  {...settlementInputDecimalKeyDownProps}
                  suffix="%"
                  value={rateInterviewStr}
                  onChange={e => setRateInterviewStr(sanitizePercentInput(e.target.value))}
                  inputMode="decimal"
                  aria-label="면접비·지원금·경품 기타소득 세율"
                />
              </div>
            </div>
          </ModalSpecTableRow>
        </ModalSpecTable>
      </section>
    </div>
  )
}

/** 교통비(p-1·p-2): 조건(지급 요건·비고 textarea) + 산정(km·자차/대중교통·증빙). p-2는 조건 행 최소 104px */
function SettlementItemSettingDetailTransportBody({ itemId }: { itemId: string }) {
  const detail = getSettlementItemSettingDetail(itemId)
  const isTransportOneToOne = itemId === 'p-2'

  const [qualificationText, setQualificationText] = useState(() =>
    linesToEditableText(detail.qualificationLines)
  )
  const [remarkText, setRemarkText] = useState(() => linesToEditableText(detail.remarkLines))
  const [distanceKmStr, setDistanceKmStr] = useState(() => String(detail.basisHours))
  const [commuteMode, setCommuteMode] = useState<SettlementItemTransportCommuteMode>(
    () => detail.transportCommuteMode ?? 'user_choice'
  )
  const [evidenceSubmission, setEvidenceSubmission] = useState<SettlementItemEvidenceSubmission>(
    () => (detail.evidenceSubmission ?? 'required') as SettlementItemEvidenceSubmission
  )

  const handleDistanceKmChange = (v: string) => {
    if (v === '') {
      setDistanceKmStr('')
      return
    }
    const digits = v.replace(/[^\d]/g, '')
    if (digits === '') {
      setDistanceKmStr('')
      return
    }
    setDistanceKmStr(String(Number.parseInt(digits, 10) || 0))
  }

  useRegisterSettlementDetailSnapshot(
    () => {
      const merged = getSettlementItemSettingDetail(itemId)
      return {
        ...merged,
        layout: 'transport' as const,
        basisUnit: '거리',
        basisHours: Number.parseInt(distanceKmStr, 10) || 0,
        compareKind: merged.compareKind,
        maxLimitWon: null,
        basicFeeWon: null,
        longDistanceFeeWon: null,
        qualificationLines: parseEditableLines(qualificationText),
        remarkLines: parseEditableLines(remarkText),
        transportCommuteMode: commuteMode,
        evidenceSubmission,
      }
    },
    [itemId, qualificationText, remarkText, distanceKmStr, commuteMode, evidenceSubmission]
  )

  return (
    <div className="settlement-item-setting-detail-modal__section-stack settlement-item-setting-detail-modal__section-stack--tier1">
      <section aria-labelledby="settlement-detail-condition-label">
        <h3
          id="settlement-detail-condition-label"
          className="settlement-item-setting-detail-modal__section-label"
        >
          조건
        </h3>
        <ModalSpecTable
          aria-label="조건"
          className={
            isTransportOneToOne ? 'modal-spec-table--transport-1s1g-condition' : undefined
          }
        >
          <ModalSpecTableRow label="지급 요건" labelVariant="paymentRequirement">
            <textarea
              className="modal-spec-table__textarea"
              rows={isTransportOneToOne ? 3 : 6}
              value={qualificationText}
              onChange={e => setQualificationText(e.target.value)}
              aria-label="지급 요건"
            />
          </ModalSpecTableRow>
          <ModalSpecTableRow label="비고" labelVariant="remark">
            <textarea
              className="modal-spec-table__textarea"
              rows={isTransportOneToOne ? 3 : 5}
              value={remarkText}
              onChange={e => setRemarkText(e.target.value)}
              aria-label="비고"
            />
          </ModalSpecTableRow>
        </ModalSpecTable>
      </section>

      <section aria-labelledby="settlement-detail-basis-label">
        <h3
          id="settlement-detail-basis-label"
          className="settlement-item-setting-detail-modal__section-label"
        >
          산정 기준
        </h3>
        <ModalSpecTable aria-label="산정 기준">
          <ModalSpecTableRow label="산정 기준 단위" labelVariant="basis">
            <div className="modal-spec-table__field-row">
              <div className="modal-spec-table__input-wrap modal-spec-table__input-wrap--transport-km">
                <AppInput
                  {...settlementInputIntegerKeyDownProps}
                  value={distanceKmStr}
                  onChange={e => handleDistanceKmChange(e.target.value)}
                  inputMode="numeric"
                />
              </div>
              <span className="modal-spec-table__suffix-text">km(편도) 초과 시</span>
            </div>
          </ModalSpecTableRow>
          <ModalSpecTableRow label="자차/대중교통" labelVariant="basis">
            <ModalSpecTableRadioCell
              value={commuteMode}
              onChange={setCommuteMode}
              options={TRANSPORT_COMMUTE_RADIO_OPTIONS}
              aria-label="자차 또는 대중교통"
            />
          </ModalSpecTableRow>
          <ModalSpecTableRow label="증빙 자료 제출 여부" labelVariant="basis">
            <ModalSpecTableRadioCell
              value={evidenceSubmission}
              onChange={setEvidenceSubmission}
              options={SIMPLE_LABOR_EVIDENCE_RADIO_OPTIONS}
              aria-label="증빙 자료 제출 여부"
            />
          </ModalSpecTableRow>
        </ModalSpecTable>
      </section>
    </div>
  )
}

/** layout `simple` — p-2 등 기본 카드 */
function SettlementItemSettingDetailSimpleLayoutBody({ itemId }: { itemId: string }) {
  const detail = getSettlementItemSettingDetail(itemId)
  const initial = buildInitialFormState(itemId)
  const [basisUnit, setBasisUnit] = useState(initial.basisUnit)
  const [maxLimitStr, setMaxLimitStr] = useState(initial.maxLimitStr)

  useRegisterSettlementDetailSnapshot(
    () => {
      const merged = getSettlementItemSettingDetail(itemId)
      return {
        ...merged,
        basisUnit,
        maxLimitWon: parseWonStringToNumber(maxLimitStr),
      }
    },
    [itemId, basisUnit, maxLimitStr]
  )

  return (
    <>
      <section aria-labelledby="settlement-detail-basis-label">
        <h3
          id="settlement-detail-basis-label"
          className="settlement-item-setting-detail-modal__section-label"
        >
          산정 기준
        </h3>
        <div className="settlement-item-setting-detail-modal__basis-row settlement-item-setting-detail-modal__basis-row--simple">
          <AppSelect
            value={basisUnit}
            onChange={v => setBasisUnit(v)}
            options={BASIS_UNIT_OPTIONS_SIMPLE}
          />
        </div>
      </section>

      <section aria-label="최대 한도 금액">
        <div className="settlement-item-setting-detail-modal__fee-row settlement-item-setting-detail-modal__fee-row--simple">
          <div className="settlement-item-setting-detail-modal__fee-col">
            <AppInput
              {...settlementInputIntegerKeyDownProps}
              label="최대 한도 금액"
              suffix="원"
              placeholder="직접 입력"
              value={maxLimitStr}
              onChange={e => setMaxLimitStr(parseWonInput(e.target.value))}
              inputMode="numeric"
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="settlement-detail-qual-label">
        <h3
          id="settlement-detail-qual-label"
          className="settlement-item-setting-detail-modal__section-label"
        >
          자격 요건
        </h3>
        <div
          className="settlement-item-setting-detail-modal__richtext settlement-item-setting-detail-modal__richtext--qual56"
          role="region"
          aria-label="자격 요건"
        >
          {detail.qualificationLines.length > 0 ? (
            <ul>
              {detail.qualificationLines.map(line => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : (
            <span className="settlement-item-setting-detail-modal__basis-unit-text">—</span>
          )}
        </div>
      </section>

      <section aria-labelledby="settlement-detail-remark-label">
        <h3
          id="settlement-detail-remark-label"
          className="settlement-item-setting-detail-modal__section-label"
        >
          비고
        </h3>
        <div
          className="settlement-item-setting-detail-modal__richtext settlement-item-setting-detail-modal__richtext--remark"
          role="region"
          aria-label="비고"
        >
          {detail.remarkLines.length > 0 ? (
            <ul>
              {detail.remarkLines.map(line => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : (
            <span className="settlement-item-setting-detail-modal__basis-unit-text">—</span>
          )}
        </div>
      </section>
    </>
  )
}

/** item.id 가 바뀔 때마다 key 로 리마운트되어 목업 기준으로 초기화됨 */
function SettlementItemSettingDetailModalBody({ itemId }: { itemId: string }) {
  const detail = getSettlementItemSettingDetail(itemId)
  const isTier1 = detail.layout === 'tier1'

  if (isTier1) {
    return <SettlementItemSettingDetailTier1Body itemId={itemId} />
  }

  if (detail.layout === 'specialLecture') {
    return <SettlementItemSettingDetailSpecialLectureBody itemId={itemId} />
  }

  if (detail.layout === 'assistantInstructor') {
    return <SettlementItemSettingDetailAssistantBody itemId={itemId} />
  }

  if (detail.layout === 'multiInstructor') {
    return <SettlementItemSettingDetailMultiInstructorBody itemId={itemId} />
  }

  if (detail.layout === 'simpleLabor') {
    return <SettlementItemSettingDetailSimpleLaborBody itemId={itemId} />
  }

  if (detail.layout === 'transport') {
    return <SettlementItemSettingDetailTransportBody itemId={itemId} />
  }

  if (detail.layout === 'lodging') {
    return <SettlementItemSettingDetailLodgingBody itemId={itemId} />
  }

  if (detail.layout === 'meal') {
    return <SettlementItemSettingDetailMealBody itemId={itemId} />
  }

  if (detail.layout === 'volunteerActivity') {
    return <SettlementItemSettingDetailVolunteerActivityBody itemId={itemId} />
  }

  if (detail.layout === 'meetingAttendance') {
    return <SettlementItemSettingDetailMeetingAttendanceBody itemId={itemId} />
  }

  if (detail.layout === 'withholdingDailyWorker') {
    return <SettlementItemSettingDetailWithholdingDailyWorkerBody itemId={itemId} />
  }

  return <SettlementItemSettingDetailSimpleLayoutBody itemId={itemId} />
}

export interface SettlementItemSettingDetailModalProps {
  open: boolean
  onCancel: () => void
  /** 저장 시 현재 항목 id 전달(연동용) */
  onSave?: (itemId: string) => void
  /** 저장 시 카드 목록의 제목·설명·이모지(임시) 갱신 */
  onSaveItemMeta?: (
    itemId: string,
    meta: { title: string; description: string; emojiOverride?: string | null }
  ) => void
  item: SettlementItemSettingRow | null
}

export function SettlementItemSettingDetailModal({
  open,
  onCancel,
  onSave,
  onSaveItemMeta,
  item,
}: SettlementItemSettingDetailModalProps) {
  const show = open && item !== null
  const snapshotRef = useRef<(() => SettlementItemSettingDetail) | null>(null)

  const [headerTitle, setHeaderTitle] = useState('')
  const [headerDescription, setHeaderDescription] = useState('')
  const [headerEmoji, setHeaderEmoji] = useState<string | null>(null)
  const [titleEditing, setTitleEditing] = useState(false)
  const [descriptionEditing, setDescriptionEditing] = useState(false)

  useEffect(() => {
    if (!show || item == null) return
    setHeaderTitle(item.title)
    setHeaderDescription(item.description)
    setHeaderEmoji(item.emojiOverride ?? null)
    setTitleEditing(false)
    setDescriptionEditing(false)
  }, [show, item?.id, item?.title, item?.description, item?.emojiOverride])

  const handleSave = () => {
    if (!item) return
    const snap = snapshotRef.current?.()
    if (snap) {
      saveSettlementItemSettingDetail(item.id, snap)
    }
    const titleToSave = headerTitle.trim() !== '' ? headerTitle.trim() : item.title
    onSaveItemMeta?.(item.id, {
      title: titleToSave,
      description: headerDescription,
      emojiOverride: headerEmoji,
    })
    onSave?.(item.id)
    void message.success('저장되었습니다.')
    onCancel()
  }

  const modalTitleForAria =
    item != null ? (headerTitle.trim() !== '' ? headerTitle : item.title) : ''

  return (
    <ContentModal
      open={show}
      onCancel={onCancel}
      title={modalTitleForAria}
      titleContent={
        item ? (
          <SettlementItemSettingDetailModalHeaderTitle
            value={headerTitle}
            editing={titleEditing}
            onChange={setHeaderTitle}
            onRequestEdit={() => setTitleEditing(true)}
            onCommitEdit={() => setTitleEditing(false)}
            restoreValueIfEmptyOnBlur={item.title}
          />
        ) : undefined
      }
      titlePrefix={
        item ? (
          <SettlementItemTossfaceIconPickerTrigger onPickEmoji={setHeaderEmoji}>
            <span className="settlement-item-setting-detail-modal__header-icon">
              {headerEmoji ? (
                <span
                  className="tossface settlement-item-setting-detail-modal__header-tossface"
                  aria-hidden
                >
                  {headerEmoji}
                </span>
              ) : (
                <SettlementItemSettingIcon iconKey={item.iconKey} />
              )}
            </span>
          </SettlementItemTossfaceIconPickerTrigger>
        ) : undefined
      }
      description={
        item ? (
          <SettlementItemSettingDetailModalHeaderDescription
            value={headerDescription}
            editing={descriptionEditing}
            onChange={setHeaderDescription}
            onRequestEdit={() => setDescriptionEditing(true)}
            onCommitEdit={() => setDescriptionEditing(false)}
            restoreValueIfEmptyOnBlur={item.description}
          />
        ) : undefined
      }
      descriptionGap="compact"
      width={800}
      className={[
        'settlement-item-setting-detail-modal',
        item?.id === 'w-4' ? 'settlement-item-setting-detail-modal--special-lecture' : '',
        item?.id === 'p-1' || item?.id === 'p-2'
          ? 'settlement-item-setting-detail-modal--transport'
          : '',
        item?.id === 'p-3' || item?.id === 'p-7'
          ? 'settlement-item-setting-detail-modal--lodging'
          : '',
        item?.id === 'p-4' ? 'settlement-item-setting-detail-modal--meal' : '',
        item?.id === 'p-5' ? 'settlement-item-setting-detail-modal--meeting-attendance' : '',
        item?.id === 'p-6' ? 'settlement-item-setting-detail-modal--volunteer-activity' : '',
        item?.id === 'd-1' ? 'settlement-item-setting-detail-modal--withholding-daily-worker' : '',
        item &&
        [
          'tier1',
          'assistantInstructor',
          'simpleLabor',
          'multiInstructor',
          'transport',
          'lodging',
          'meal',
          'volunteerActivity',
          'meetingAttendance',
          'withholdingDailyWorker',
        ].includes(getSettlementItemSettingDetail(item.id).layout)
          ? 'settlement-item-setting-detail-modal--tier1'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
      footer={
        <>
          <AppButton variant="cancel" size="large" onClick={onCancel}>
            취소
          </AppButton>
          <AppButton variant="primary" size="tableAction" modalTeal onClick={handleSave}>
            저장
          </AppButton>
        </>
      }
    >
      <SettlementDetailSnapshotRefContext.Provider value={snapshotRef}>
        {item ? <SettlementItemSettingDetailModalBody key={item.id} itemId={item.id} /> : null}
      </SettlementDetailSnapshotRefContext.Provider>
    </ContentModal>
  )
}
