import {
  createContext,
  useContext,
  useId,
  useMemo,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { useOptionalFieldValidationHighlight } from './field-validation-highlight-context.js'
import './detail-info-form.css'

export type DetailInfoFormMode = 'view' | 'edit'

type DetailInfoFormContextValue = {
  mode: DetailInfoFormMode
  fieldIncompleteHighlight?: (validationKey: string | readonly string[]) => boolean
  /** 미입력 강조 attempt — Field가 context 변경 시 재계산하도록 */
  fieldHighlightEpoch?: number
}

const DetailInfoFormContext = createContext<DetailInfoFormContextValue>({
  mode: 'view',
})

export type DetailInfoFormProps = {
  title: string
  /** 타이틀(`h2`) 직후·`description`과 같은 헤더 행에 노출 (민트 강조 문구 등) */
  headerNote?: ReactNode
  /** 타이틀(`h2`) 우측에 붙는 보조 문구·뱃지 등 */
  titleTrailing?: ReactNode
  description?: ReactNode
  descriptionPlacement?: 'inline' | 'below'
  /**
   * true면 섹션 헤더 없이 본문 격자만 렌더합니다.
   * 상위에 이미 제목(h2 등)이 있을 때 — `title`은 접근용 aria-label 등에만 쓰입니다.
   */
  hideHeader?: boolean
  mode?: DetailInfoFormMode
  children: ReactNode
  className?: string
  style?: CSSProperties
  /** 등록 위저드 등 — `DetailInfoForm.Field`의 `validationKey` 미입력 강조 */
  fieldIncompleteHighlight?: (validationKey: string | readonly string[]) => boolean
  /** `fieldIncompleteHighlight`와 함께 — 검증 실패 attempt(0이면 강조 비활성) */
  fieldHighlightEpoch?: number
}

function DetailInfoFormRoot({
  title,
  headerNote,
  titleTrailing,
  description,
  descriptionPlacement = 'inline',
  hideHeader = false,
  mode = 'view',
  children,
  className,
  style,
  fieldIncompleteHighlight,
  fieldHighlightEpoch,
}: DetailInfoFormProps) {
  const titleId = useId()
  const rootClass = ['detail-info-form', className].filter(Boolean).join(' ')
  const body = <div className="detail-info-form__body">{children}</div>
  const contextValue = useMemo(
    (): DetailInfoFormContextValue => ({ mode, fieldIncompleteHighlight, fieldHighlightEpoch }),
    [fieldHighlightEpoch, fieldIncompleteHighlight, mode]
  )

  if (hideHeader) {
    return (
      <DetailInfoFormContext.Provider value={contextValue}>
        <div className={rootClass} role="group" aria-label={title} style={style}>
          {body}
        </div>
      </DetailInfoFormContext.Provider>
    )
  }

  return (
    <DetailInfoFormContext.Provider value={contextValue}>
      <section className={rootClass} aria-labelledby={titleId} style={style}>
        <header className="detail-info-form__header">
          <div className="detail-info-form__header-lead">
            <h2 id={titleId} className="detail-info-form__title">
              {title}
            </h2>
            {headerNote ? (
              <div className="detail-info-form__header-note">{headerNote}</div>
            ) : null}
            {description ? (
              <div
                className={
                  descriptionPlacement === 'below'
                    ? 'detail-info-form__description detail-info-form__description--below'
                    : 'detail-info-form__description'
                }
              >
                {description}
              </div>
            ) : null}
          </div>
          {titleTrailing ? (
            <div className="detail-info-form__header-trailing">{titleTrailing}</div>
          ) : null}
        </header>
        {body}
      </section>
    </DetailInfoFormContext.Provider>
  )
}

export type DetailInfoFormRowProps = {
  type?: 'single' | 'double' | 'custom'
  className?: string
  children: ReactNode
}

function DetailInfoFormRow({ type = 'single', className, children }: DetailInfoFormRowProps) {
  if (type === 'custom') {
    const customClass = ['detail-info-form__row', 'detail-info-form__row--custom', className]
      .filter(Boolean)
      .join(' ')
    return <div className={customClass}>{children}</div>
  }
  const rowClass = [
    'detail-info-form__row',
    type === 'double' ? 'detail-info-form__row--double' : 'detail-info-form__row--single',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return <div className={rowClass}>{children}</div>
}

export type DetailInfoFormFieldProps = {
  label: ReactNode
  required?: boolean
  labelWidth?: 180 | 200 | 220 | 240
  fullRow?: boolean
  colSpan?: 2
  view: ReactNode
  edit?: ReactNode
  mode?: DetailInfoFormMode
  /**
   * 부모 `DetailInfoForm`이 `edit`여도 이 필드는 항상 읽기 전용(값은 `view`만, 편집 슬롯 미사용).
   * `mode="view"`만으로 컨텍스트가 이기는 경우를 막기 위해 사용한다.
   */
  readOnlyDisplay?: boolean
  /** `fieldIncompleteHighlight`와 함께 — 미입력 강조 대상 키(복수 시 하나라도 미입력이면 라벨 강조) */
  validationKey?: string | readonly string[]
}

function DetailInfoFormField({
  label,
  required,
  labelWidth = 180,
  fullRow,
  colSpan,
  view,
  edit,
  mode: modeProp,
  readOnlyDisplay = false,
  validationKey,
}: DetailInfoFormFieldProps) {
  const { mode: contextMode, fieldIncompleteHighlight, fieldHighlightEpoch } =
    useContext(DetailInfoFormContext)
  const wizardFieldHighlight = useOptionalFieldValidationHighlight()
  const effectiveMode: DetailInfoFormMode = readOnlyDisplay
    ? 'view'
    : (modeProp ?? contextMode ?? 'view')
  const showRequired = Boolean(required && effectiveMode === 'edit')
  const useEditSlot = !readOnlyDisplay && effectiveMode === 'edit' && edit != null
  const content = useEditSlot ? edit : view

  const style = {
    '--detail-info-label-w': `${labelWidth}px` } as CSSProperties

  const isFull = Boolean(fullRow || colSpan === 2)
  const isEditSlot = useEditSlot

  const highlightEpoch = Math.max(fieldHighlightEpoch ?? 0, wizardFieldHighlight?.epoch ?? 0)
  const isValidationKeyIncomplete = (key: string | readonly string[]): boolean => {
    if (fieldIncompleteHighlight?.(key) === true) return true
    if (wizardFieldHighlight?.isFieldIncomplete(key) === true) return true
    return false
  }
  const highlightActive = highlightEpoch > 0
  const labelIncomplete =
    highlightActive &&
    validationKey != null &&
    (Array.isArray(validationKey)
      ? validationKey.some(key => isValidationKeyIncomplete(key))
      : isValidationKeyIncomplete(validationKey))

  const fieldClass = [
    'detail-info-form__field',
    isFull ? 'detail-info-form__field--full-row' : '',
    isEditSlot ? 'detail-info-form__field--edit' : '',
    labelIncomplete ? 'detail-info-form__field--required-incomplete' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const contentClass = [
    'detail-info-form__field-content',
    isEditSlot ? 'detail-info-form__field-content--edit' : 'detail-info-form__field-content--view',
  ].join(' ')
  const labelClass = [
    'detail-info-form__field-label',
    labelIncomplete ? 'detail-info-form__field-label--required-incomplete' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const wizardFieldKeyAttr =
    validationKey == null
      ? undefined
      : Array.isArray(validationKey)
        ? validationKey.join('|')
        : validationKey

  return (
    <div className={fieldClass} style={style} data-wizard-field-key={wizardFieldKeyAttr}>
      <div className={labelClass}>
        <span className="detail-info-form__field-label-text">{label}</span>
        {showRequired ? (
          <span className="detail-info-form__field-required" aria-hidden>
            *
          </span>
        ) : null}
      </div>
      <div className={contentClass}>{content}</div>
    </div>
  )
}

/** 성명 2행 × 5열 — 우측 라벨 열 180px(Field 기본과 정렬), 셀 border로 세로·가로 구분 */
export type DetailInfoFormNameBlockRow = {
  subLabel: string
  main: ReactNode
  sideLabel: string
  side: ReactNode
  /** edit 모드에서 우측 라벨에 필수 `*` 표시 */
  sideRequired?: boolean
}

export type DetailInfoFormNameBlockProps = {
  title?: string
  /** edit 모드에서 좌측 그룹 타이틀에 필수 `*` 표시 */
  required?: boolean
  /** false: 좌측 '성명' 통합 셀 없이 첫 열을 subLabel 전용(예: 성명(한글))으로 넓게 사용 */
  showGroupTitle?: boolean
  rows: readonly [DetailInfoFormNameBlockRow, DetailInfoFormNameBlockRow]
  className?: string
}

function DetailInfoFormNameBlock({
  title = '성명',
  required,
  showGroupTitle = true,
  rows,
  className }: DetailInfoFormNameBlockProps) {
  const { mode: contextMode } = useContext(DetailInfoFormContext)
  const showRequired = Boolean(required && contextMode === 'edit')
  const [r0, r1] = rows
  const rootClass = [
    'detail-info-form__name-block',
    !showGroupTitle ? 'detail-info-form__name-block--no-group-title' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const ariaLabel = showGroupTitle ? title : '성명'

  return (
    <div className={rootClass} role="group" aria-label={ariaLabel}>
      {showGroupTitle ? (
        <div className="detail-info-form__name-block-cell detail-info-form__name-block-cell--t detail-info-form__name-block-cell--label">
          <span className="detail-info-form__field-label-text">{title}</span>
          {showRequired ? (
            <span className="detail-info-form__field-required" aria-hidden>
              *
            </span>
          ) : null}
        </div>
      ) : null}
      <div className="detail-info-form__name-block-cell detail-info-form__name-block-cell--s1 detail-info-form__name-block-cell--label">
        {r0.subLabel}
      </div>
      <div className="detail-info-form__name-block-cell detail-info-form__name-block-cell--v1 detail-info-form__name-block-cell--value">
        {r0.main}
      </div>
      <div className="detail-info-form__name-block-cell detail-info-form__name-block-cell--l1 detail-info-form__name-block-cell--label">
        <span className="detail-info-form__field-label-text">{r0.sideLabel}</span>
        {r0.sideRequired && contextMode === 'edit' ? (
          <span className="detail-info-form__field-required" aria-hidden>
            *
          </span>
        ) : null}
      </div>
      <div className="detail-info-form__name-block-cell detail-info-form__name-block-cell--r1 detail-info-form__name-block-cell--value">
        {r0.side}
      </div>
      <div className="detail-info-form__name-block-cell detail-info-form__name-block-cell--s2 detail-info-form__name-block-cell--label">
        {r1.subLabel}
      </div>
      <div className="detail-info-form__name-block-cell detail-info-form__name-block-cell--v2 detail-info-form__name-block-cell--value">
        {r1.main}
      </div>
      <div className="detail-info-form__name-block-cell detail-info-form__name-block-cell--l2 detail-info-form__name-block-cell--label">
        <span className="detail-info-form__field-label-text">{r1.sideLabel}</span>
        {r1.sideRequired && contextMode === 'edit' ? (
          <span className="detail-info-form__field-required" aria-hidden>
            *
          </span>
        ) : null}
      </div>
      <div className="detail-info-form__name-block-cell detail-info-form__name-block-cell--r2 detail-info-form__name-block-cell--value">
        {r1.side}
      </div>
    </div>
  )
}

/**
 * 테이블 td·Field 값 영역 인라인 구분 — 세로 1×13px, default-BK 50%, 양옆 12px 간격
 * (문자 `|` 대신 스크린 리더 무시용 막대)
 */
export function DetailInfoFormTdDivider() {
  return <span className="detail-info-form-inputs-separator" aria-hidden />
}

function DetailInfoFormInputsSeparator() {
  return <DetailInfoFormTdDivider />
}

/** `InputsSeparator`와 동일 — 읽기 전용 값 줄 등에서 짧게 쓸 때 */
const DetailInfoFormSeparator = DetailInfoFormInputsSeparator

DetailInfoFormRoot.Row = DetailInfoFormRow
DetailInfoFormRoot.Field = DetailInfoFormField
DetailInfoFormRoot.NameBlock = DetailInfoFormNameBlock
DetailInfoFormRoot.TdDivider = DetailInfoFormTdDivider
DetailInfoFormRoot.InputsSeparator = DetailInfoFormInputsSeparator
DetailInfoFormRoot.Separator = DetailInfoFormSeparator

type DetailInfoFormCompound = typeof DetailInfoFormRoot & {
  Row: typeof DetailInfoFormRow
  Field: typeof DetailInfoFormField
  NameBlock: typeof DetailInfoFormNameBlock
  TdDivider: typeof DetailInfoFormTdDivider
  InputsSeparator: typeof DetailInfoFormInputsSeparator
  Separator: typeof DetailInfoFormSeparator
}

export const DetailInfoForm = DetailInfoFormRoot as DetailInfoFormCompound
