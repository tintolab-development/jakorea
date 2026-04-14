import { createContext, useContext, useId, type CSSProperties, type ReactNode } from 'react'
import './detail-info-form.css'

export type DetailInfoFormMode = 'view' | 'edit'

type DetailInfoFormContextValue = {
  mode: DetailInfoFormMode
}

const DetailInfoFormContext = createContext<DetailInfoFormContextValue>({
  mode: 'view',
})

export type DetailInfoFormProps = {
  title: string
  description?: ReactNode
  /**
   * true면 섹션 헤더 없이 본문 격자만 렌더합니다.
   * 상위에 이미 제목(h2 등)이 있을 때 — `title`은 접근용 aria-label 등에만 쓰입니다.
   */
  hideHeader?: boolean
  mode?: DetailInfoFormMode
  children: ReactNode
  className?: string
  style?: CSSProperties
}

function DetailInfoFormRoot({
  title,
  description,
  hideHeader = false,
  mode = 'view',
  children,
  className,
  style,
}: DetailInfoFormProps) {
  const titleId = useId()
  const rootClass = ['detail-info-form', className].filter(Boolean).join(' ')
  const body = <div className="detail-info-form__body">{children}</div>

  if (hideHeader) {
    return (
      <DetailInfoFormContext.Provider value={{ mode }}>
        <div className={rootClass} role="group" aria-label={title} style={style}>
          {body}
        </div>
      </DetailInfoFormContext.Provider>
    )
  }

  return (
    <DetailInfoFormContext.Provider value={{ mode }}>
      <section className={rootClass} aria-labelledby={titleId} style={style}>
        <header className="detail-info-form__header">
          <div className="detail-info-form__header-lead">
            <h2 id={titleId} className="detail-info-form__title">
              {title}
            </h2>
            {description ? (
              <div className="detail-info-form__description">{description}</div>
            ) : null}
          </div>
        </header>
        {body}
      </section>
    </DetailInfoFormContext.Provider>
  )
}

export type DetailInfoFormRowProps = {
  type?: 'single' | 'double' | 'custom'
  children: ReactNode
}

function DetailInfoFormRow({ type = 'single', children }: DetailInfoFormRowProps) {
  if (type === 'custom') {
    return <div className="detail-info-form__row detail-info-form__row--custom">{children}</div>
  }
  const rowClass =
    type === 'double'
      ? 'detail-info-form__row detail-info-form__row--double'
      : 'detail-info-form__row detail-info-form__row--single'
  return <div className={rowClass}>{children}</div>
}

export type DetailInfoFormFieldProps = {
  label: string
  required?: boolean
  labelWidth?: 200 | 240
  fullRow?: boolean
  colSpan?: 2
  view: ReactNode
  edit?: ReactNode
  mode?: DetailInfoFormMode
}

function DetailInfoFormField({
  label,
  required,
  labelWidth = 200,
  fullRow,
  colSpan,
  view,
  edit,
  mode: modeProp,
}: DetailInfoFormFieldProps) {
  const { mode: contextMode } = useContext(DetailInfoFormContext)
  const effectiveMode: DetailInfoFormMode = modeProp ?? contextMode ?? 'view'
  const showRequired = Boolean(required && effectiveMode === 'edit')
  const content = effectiveMode === 'edit' && edit != null ? edit : view

  const style = {
    '--detail-info-label-w': `${labelWidth}px`,
  } as CSSProperties

  const isFull = Boolean(fullRow || colSpan === 2)
  const fieldClass = ['detail-info-form__field', isFull ? 'detail-info-form__field--full-row' : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={fieldClass} style={style}>
      <div className="detail-info-form__field-label">
        <span className="detail-info-form__field-label-text">{label}</span>
        {showRequired ? (
          <span className="detail-info-form__field-required" aria-hidden>
            *
          </span>
        ) : null}
      </div>
      <div className="detail-info-form__field-content">{content}</div>
    </div>
  )
}

/** 성명 2행 × 5열 — 우측 라벨 열 200px(Field 기본과 정렬), 셀 border로 세로·가로 구분 */
export type DetailInfoFormNameBlockRow = {
  subLabel: string
  main: ReactNode
  sideLabel: string
  side: ReactNode
}

export type DetailInfoFormNameBlockProps = {
  title?: string
  /** false: 좌측 '성명' 통합 셀 없이 첫 열을 subLabel 전용(예: 성명(한글))으로 넓게 사용 */
  showGroupTitle?: boolean
  rows: readonly [DetailInfoFormNameBlockRow, DetailInfoFormNameBlockRow]
  className?: string
}

function DetailInfoFormNameBlock({
  title = '성명',
  showGroupTitle = true,
  rows,
  className,
}: DetailInfoFormNameBlockProps) {
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
          {title}
        </div>
      ) : null}
      <div className="detail-info-form__name-block-cell detail-info-form__name-block-cell--s1 detail-info-form__name-block-cell--label">
        {r0.subLabel}
      </div>
      <div className="detail-info-form__name-block-cell detail-info-form__name-block-cell--v1 detail-info-form__name-block-cell--value">
        {r0.main}
      </div>
      <div className="detail-info-form__name-block-cell detail-info-form__name-block-cell--l1 detail-info-form__name-block-cell--label">
        {r0.sideLabel}
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
        {r1.sideLabel}
      </div>
      <div className="detail-info-form__name-block-cell detail-info-form__name-block-cell--r2 detail-info-form__name-block-cell--value">
        {r1.side}
      </div>
    </div>
  )
}

function DetailInfoFormInputsSeparator() {
  return <span className="detail-info-form-inputs-separator"> | </span>
}

DetailInfoFormRoot.Row = DetailInfoFormRow
DetailInfoFormRoot.Field = DetailInfoFormField
DetailInfoFormRoot.NameBlock = DetailInfoFormNameBlock
DetailInfoFormRoot.InputsSeparator = DetailInfoFormInputsSeparator

type DetailInfoFormCompound = typeof DetailInfoFormRoot & {
  Row: typeof DetailInfoFormRow
  Field: typeof DetailInfoFormField
  NameBlock: typeof DetailInfoFormNameBlock
  InputsSeparator: typeof DetailInfoFormInputsSeparator
}

export const DetailInfoForm = DetailInfoFormRoot as DetailInfoFormCompound
