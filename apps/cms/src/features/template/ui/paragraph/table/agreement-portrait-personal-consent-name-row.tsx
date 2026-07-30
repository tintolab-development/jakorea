import { Input } from 'antd'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { CmsSelect } from '@/shared/ui/cms-select'
import { DividerVertical } from '@/shared/components/divider-vertical'
import type { VerticalTableRow } from '@/features/template/model/writing-form-draft.schema'
import { resolvePortraitAffiliationSelectOptions } from '@/features/template/ui/paragraph/table/agreement-portrait-personal-consent-affiliation-options'
import '@/features/template/ui/paragraph/table/agreement-portrait-personal-consent-name-row.css'

const NAME_PLACEHOLDER = '한글 성명'
const AFFILIATION_PLACEHOLDER = '소속'
const NO_AFFILIATION = '소속 없음'
/** 구 시드·저장본 셀 문구 — 빈 입력(placeholder)으로 취급 */
const LEGACY_NAME_CELL = '한글 성명'
const LEGACY_AFFILIATION_CELL = '소속 / 소속 없음'

export function portraitPersonalConsentNameValue(raw: string): string {
  const t = raw.trim()
  if (t === '' || t === LEGACY_NAME_CELL) return ''
  return raw
}

export function portraitPersonalConsentAffiliationState(raw: string): {
  noAffiliation: boolean
  affiliation: string
} {
  const t = raw.trim()
  if (t === '' || t === LEGACY_AFFILIATION_CELL || t === AFFILIATION_PLACEHOLDER) {
    return { noAffiliation: false, affiliation: '' }
  }
  if (t === NO_AFFILIATION) {
    return { noAffiliation: true, affiliation: '' }
  }
  return { noAffiliation: false, affiliation: raw }
}

type Props = {
  row: VerticalTableRow
  interactive: boolean
  affiliationSelectOptions?: ReadonlyArray<{ value: string; label: string }>
  onNameChange: (value: string) => void
  onAffiliationChange: (value: string) => void
  onSelectRow?: () => void
}

/** 초상권 동의서 1번 표 첫 행 — 성명 인풋 + 소속 셀렉트·소속 없음 */
export function AgreementPortraitPersonalConsentNameRow({
  row,
  interactive,
  affiliationSelectOptions,
  onNameChange,
  onAffiliationChange,
  onSelectRow,
}: Props) {
  const nameValue = portraitPersonalConsentNameValue(row.cells[0] ?? '')
  const { noAffiliation, affiliation } = portraitPersonalConsentAffiliationState(
    row.cells[1] ?? ''
  )
  const affiliationOptions = resolvePortraitAffiliationSelectOptions(
    affiliation,
    affiliationSelectOptions
  )

  return (
    <div
      className={[
        'form-editor-vertical-table__row',
        'agreement-portrait-personal-consent-name-row',
        !interactive ? 'agreement-portrait-personal-consent-name-row--readonly' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="row"
    >
      <div className="form-editor-vertical-table__stage">
        <div className="form-editor-vertical-table__th" role="columnheader">
          <span className="form-editor-vertical-table__cell-text form-editor-vertical-table__cell-text--header">
            {row.headers[0] || '성명'}
          </span>
        </div>
        <div className="form-editor-vertical-table__td" role="gridcell">
          <div className="form-editor-vertical-table__cell-input-shell form-editor-vertical-table__cell-input-shell--body form-editor-vertical-table__cell-input-shell--body-subjective agreement-portrait-personal-consent-name-row__name-shell">
            <Input
              variant="borderless"
              value={nameValue}
              placeholder={NAME_PLACEHOLDER}
              readOnly={!interactive}
              onChange={e => {
                if (!interactive) return
                onNameChange(e.target.value)
              }}
              onFocus={() => onSelectRow?.()}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') e.stopPropagation()
              }}
            />
          </div>
        </div>
      </div>

      <div className="form-editor-vertical-table__stage">
        <div className="form-editor-vertical-table__th" role="columnheader">
          <span className="form-editor-vertical-table__cell-text form-editor-vertical-table__cell-text--header">
            {row.headers[1] || '소속'}
          </span>
        </div>
        <div
          className="form-editor-vertical-table__td agreement-portrait-personal-consent-name-row__affiliation-td"
          role="gridcell"
        >
          <div className="agreement-portrait-personal-consent-name-row__affiliation">
            <CmsSelect
              className="agreement-portrait-personal-consent-name-row__affiliation-select"
              inputSize="large"
              width="100%"
              placeholder={AFFILIATION_PLACEHOLDER}
              withAllOption={false}
              allowClear
              options={affiliationOptions}
              value={noAffiliation ? undefined : affiliation || undefined}
              onChange={v => {
                if (!interactive) return
                onAffiliationChange(String(v ?? ''))
              }}
              onClick={() => onSelectRow?.()}
            />
            <DividerVertical />
            <CmsCheckbox
              checkboxSize="large"
              checked={noAffiliation}
              onChange={e => {
                if (!interactive) return
                onAffiliationChange(e.target.checked ? NO_AFFILIATION : '')
              }}
            >
              {NO_AFFILIATION}
            </CmsCheckbox>
          </div>
        </div>
      </div>
    </div>
  )
}
