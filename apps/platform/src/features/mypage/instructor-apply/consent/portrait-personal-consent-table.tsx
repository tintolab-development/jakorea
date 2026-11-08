import {
  portraitPersonalConsentAffiliationState,
  portraitPersonalConsentNameValue,
  PORTRAIT_NO_AFFILIATION,
} from '@jakorea/form-schema/consent'
import type { VerticalTableParagraph } from '@jakorea/form-schema/writing-form'
import {
  FormTemplateHost,
  type FormUpdateParagraph,
  patchVerticalTableCell,
} from '@jakorea/form-template-runtime'
import { PFCheckbox, PFFormControlCluster, PFTextInput } from '@/shared/ui'
import {
  PortraitVerticalTableBottom,
  PortraitVerticalTableMobileBody,
} from './portrait-vertical-table-mobile'
import previewTypography from '@/features/mypage/settings/ui/consent-document-preview-typography.module.css'
import styles from './consent-form.module.css'

/** 초상권 1번 표 — 성명·소속(+소속 없음) 입력 + 나머지 행(읽기 전용)·하단 동의 */
export function PlatformPortraitPersonalConsentTable({
  paragraph,
  onUpdateParagraph,
  readOnly = false,
}: {
  paragraph: VerticalTableParagraph
  onUpdateParagraph: FormUpdateParagraph
  readOnly?: boolean
}) {
  const nameRaw = paragraph.rows[0]?.cells[0] ?? ''
  const affiliationRaw = paragraph.rows[0]?.cells[1] ?? ''
  const name = portraitPersonalConsentNameValue(nameRaw)
  const { noAffiliation, affiliation } = portraitPersonalConsentAffiliationState(affiliationRaw)
  const restRows = paragraph.rows.slice(1)

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

  return (
    <div className={readOnly ? previewTypography.portraitTableBlock : styles.tableBlock}>
      <div className={readOnly ? previewTypography.portraitTableDesktop : styles.portraitTableDesktop}>
        <FormTemplateHost surface={readOnly ? 'cmsAdmin' : 'platformUser'}>
          <div className={styles.portraitPersonalVerticalTableWrap}>
            <div
              className={`form-template-vertical-table ${styles.portraitPersonalVerticalTable}`}
              role="grid"
            >
              <div
                className="form-template-vertical-table__row form-template-vertical-table__row--portrait-name-affiliation"
                role="row"
              >
                <div className="form-template-vertical-table__stage">
                  <div className="form-template-vertical-table__th" role="columnheader">
                    성명
                  </div>
                  <div className="form-template-vertical-table__td" role="gridcell">
                    {readOnly ? (
                      <span className={styles.cellText}>{name.trim() || '-'}</span>
                    ) : (
                      <PFTextInput
                        variant="formPage"
                        size="large"
                        value={name}
                        placeholder="한글 성명"
                        aria-label="성명"
                        onValueChange={patchName}
                      />
                    )}
                  </div>
                </div>
                <div className="form-template-vertical-table__stage">
                  <div className="form-template-vertical-table__th" role="columnheader">
                    소속
                  </div>
                  <div className="form-template-vertical-table__td" role="gridcell">
                    {readOnly ? (
                      <span className={styles.cellText}>
                        {noAffiliation ? PORTRAIT_NO_AFFILIATION : affiliation.trim() || '-'}
                      </span>
                    ) : (
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
                    )}
                  </div>
                </div>
              </div>

              {restRows.map((row, rowIndex) => (
                <div
                  key={`portrait-rest-${rowIndex}-sc${row.stageCount}`}
                  className="form-template-vertical-table__row"
                  role="row"
                >
                  {Array.from({ length: row.stageCount }, (_, stageIndex) => (
                    <div
                      key={`portrait-rest-${rowIndex}-s-${stageIndex}`}
                      className="form-template-vertical-table__stage"
                    >
                      <div className="form-template-vertical-table__th" role="columnheader">
                        {row.headers[stageIndex] ?? ''}
                      </div>
                      <div
                        className="form-template-vertical-table__td"
                        role="gridcell"
                        data-portrait-retention={
                          (row.headers[stageIndex] ?? '').trim() === '보유 기간' ? '' : undefined
                        }
                      >
                        <span className={styles.cellText}>{row.cells[stageIndex] ?? ''}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </FormTemplateHost>
      </div>

      {!readOnly ? (
        <div className={styles.portraitTableMobile}>
          <PortraitVerticalTableMobileBody
            paragraph={paragraph}
            onUpdateParagraph={onUpdateParagraph}
            editableFirstRow
          />
        </div>
      ) : null}

      <PortraitVerticalTableBottom
        paragraph={paragraph}
        onUpdateParagraph={onUpdateParagraph}
        documentPreview={readOnly}
      />
    </div>
  )
}
