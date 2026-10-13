import type { ConsentValue } from '@jakorea/domain/instructor/consent'
import {
  portraitPersonalConsentAffiliationState,
  portraitPersonalConsentNameValue,
  PORTRAIT_NO_AFFILIATION,
} from '@jakorea/form-schema/consent'
import type { TableBottomConsent, VerticalTableParagraph } from '@jakorea/form-schema/writing-form'
import {
  type FormUpdateParagraph,
  patchVerticalTableBottomConsent,
  patchVerticalTableCell,
} from '@jakorea/form-template-runtime'
import {
  PFCheckbox,
  PFFormControlCluster,
  PFFormField,
  PFFormFieldRow,
  PFFormFieldTable,
  PFText,
  PFTextInput,
} from '@/shared/ui'
import { ConsentWriteRadioGroup } from './consent-radio'
import styles from './consent-form.module.css'

function tableBottomConsentToChoice(value?: TableBottomConsent): ConsentValue | '' {
  if (value === 'agree') return 'agree'
  if (value === 'disagree') return 'disagree'
  return ''
}

export function PortraitVerticalTableBottom({
  paragraph,
  onUpdateParagraph,
}: {
  paragraph: VerticalTableParagraph
  onUpdateParagraph: FormUpdateParagraph
}) {
  if (!paragraph.showBottomText && !paragraph.showBottomConsent) {
    return null
  }

  return (
    <div className={styles.tableAfter}>
      {paragraph.showBottomText && paragraph.bottomText ? (
        <p className={styles.tableDescription}>{paragraph.bottomText}</p>
      ) : null}
      {paragraph.showBottomConsent ? (
        <ConsentWriteRadioGroup
          name={`consent-table-${paragraph.id}`}
          value={tableBottomConsentToChoice(paragraph.bottomConsent)}
          onChange={next =>
            onUpdateParagraph(paragraph.id, current =>
              current.kind === 'single_item' && current.variant === 'vertical_table'
                ? patchVerticalTableBottomConsent(current, next as TableBottomConsent)
                : current
            )
          }
        />
      ) : null}
    </div>
  )
}

type PortraitVerticalTableMobileBodyProps = {
  paragraph: VerticalTableParagraph
  onUpdateParagraph: FormUpdateParagraph
  /** 초상권 1번 표 — 1행 성명·소속 입력 */
  editableFirstRow?: boolean
}

export function PortraitVerticalTableMobileBody({
  paragraph,
  onUpdateParagraph,
  editableFirstRow = false,
}: PortraitVerticalTableMobileBodyProps) {
  const nameRaw = paragraph.rows[0]?.cells[0] ?? ''
  const affiliationRaw = paragraph.rows[0]?.cells[1] ?? ''
  const name = portraitPersonalConsentNameValue(nameRaw)
  const { noAffiliation, affiliation } = portraitPersonalConsentAffiliationState(affiliationRaw)

  const patchName = (value: string) => {
    onUpdateParagraph(paragraph.id, current =>
      current.kind === 'single_item' && current.variant === 'vertical_table'
        ? patchVerticalTableCell(current, 0, 0, value)
        : current
    )
  }

  const patchAffiliation = (value: string) => {
    onUpdateParagraph(paragraph.id, current =>
      current.kind === 'single_item' && current.variant === 'vertical_table'
        ? patchVerticalTableCell(current, 0, 1, value)
        : current
    )
  }

  const rowsToRender = editableFirstRow ? paragraph.rows.slice(1) : paragraph.rows

  return (
    <PFFormFieldTable>
      {editableFirstRow ? (
        <>
          <PFFormFieldRow>
            <PFFormField label="성명">
              <PFTextInput
                variant="formPage"
                size="large"
                value={name}
                placeholder="한글 성명"
                aria-label="성명"
                onValueChange={patchName}
              />
            </PFFormField>
          </PFFormFieldRow>
          <PFFormFieldRow>
            <PFFormField label="소속">
              <PFFormControlCluster className={styles.portraitAffiliationRow}>
                <PFTextInput
                  variant="formPage"
                  size="large"
                  value={noAffiliation ? '' : affiliation}
                  placeholder="소속"
                  disabled={noAffiliation}
                  aria-label="소속"
                  onValueChange={value => {
                    if (noAffiliation) return
                    patchAffiliation(value)
                  }}
                />
                <PFCheckbox
                  size="large"
                  checked={noAffiliation}
                  onCheckedChange={checked => {
                    patchAffiliation(checked ? PORTRAIT_NO_AFFILIATION : '')
                  }}
                >
                  {PORTRAIT_NO_AFFILIATION}
                </PFCheckbox>
              </PFFormControlCluster>
            </PFFormField>
          </PFFormFieldRow>
        </>
      ) : null}

      {rowsToRender.map((row, rowIndex) =>
        Array.from({ length: row.stageCount }, (_, stageIndex) => {
          const header = row.headers[stageIndex] ?? ''
          const cell = row.cells[stageIndex] ?? ''
          const key = editableFirstRow
            ? `portrait-mobile-rest-${rowIndex}-s-${stageIndex}`
            : `portrait-mobile-${rowIndex}-s-${stageIndex}`

          return (
            <PFFormFieldRow key={key}>
              <PFFormField label={header}>
                <PFText as="span" typo="bd-md-rg" color="black" className={styles.prose}>
                  {cell}
                </PFText>
              </PFFormField>
            </PFFormFieldRow>
          )
        })
      )}
    </PFFormFieldTable>
  )
}
