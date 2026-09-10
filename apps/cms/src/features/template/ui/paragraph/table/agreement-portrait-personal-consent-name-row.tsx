import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { CmsSelect } from '@/shared/ui/cms-select'
import { DividerVertical } from '@/shared/components/divider-vertical'
import {
  portraitPersonalConsentAffiliationState,
  PORTRAIT_NO_AFFILIATION,
} from '@jakorea/form-schema/consent'
import '@/features/template/ui/paragraph/table/agreement-portrait-personal-consent-name-row.css'

const AFFILIATION_PLACEHOLDER = '소속'

type PortraitAffiliationBodyProps = {
  cell: string
  placeholder?: string
  interactive: boolean
  onChange: (value: string) => void
  onFocus?: () => void
}

/** 초상권 1번 표 소속 칸 — 셀렉트 + 소속 없음 (시안) */
export function PortraitAffiliationBody({
  cell,
  placeholder = AFFILIATION_PLACEHOLDER,
  interactive,
  onChange,
  onFocus,
}: PortraitAffiliationBodyProps) {
  const { noAffiliation, affiliation } = portraitPersonalConsentAffiliationState(cell)
  const selectPlaceholder =
    !placeholder.trim() || placeholder.trim() === '소속 기관명'
      ? AFFILIATION_PLACEHOLDER
      : placeholder.trim()
  const selectOptions =
    affiliation.trim() !== '' ? [{ label: affiliation, value: affiliation }] : []

  return (
    <div className="agreement-portrait-personal-consent-name-row__affiliation">
      <div className="agreement-portrait-personal-consent-name-row__affiliation-input-shell">
        <CmsSelect
          withAllOption={false}
          inputSize="medium"
          width="100%"
          placeholder={selectPlaceholder}
          options={selectOptions}
          value={noAffiliation ? undefined : affiliation || undefined}
          disabled={!interactive || noAffiliation}
          onChange={value => {
            if (!interactive || noAffiliation) return
            onChange(typeof value === 'string' ? value : '')
          }}
          onFocus={() => onFocus?.()}
          aria-label="소속"
        />
      </div>
      <DividerVertical />
      <CmsCheckbox
        checkboxSize="large"
        checked={noAffiliation}
        disabled={!interactive}
        onChange={e => {
          if (!interactive) return
          onFocus?.()
          onChange(e.target.checked ? PORTRAIT_NO_AFFILIATION : '')
        }}
      >
        {PORTRAIT_NO_AFFILIATION}
      </CmsCheckbox>
    </div>
  )
}
