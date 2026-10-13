import type { ConsentValue } from '@jakorea/domain/instructor/consent'
import { applyKoreanPhoneInputChange } from '@jakorea/domain/shared/korean-phone'
import {
  applyConsentShortEssayItemInput,
  type PlatformConsentFillOptions,
} from '@jakorea/form-schema/consent'
import {
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  AGREEMENT_NOTICE_SUBJECT_ITEM_IDS,
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
  type HorizontalTableParagraph,
  type MultipleChoiceParagraph,
  type TableBottomConsent,
  type WritingFormParagraph,
  isEducatorFacilitatorPledgeClauseParagraphId,
  resolveMultipleChoiceBodyDescriptionText,
} from '@jakorea/form-schema/writing-form'
import {
  PFFormField,
  PFFormFieldRow,
  PFFormFieldTable,
  PFText,
  PFTextInput,
} from '@/shared/ui'
import {
  FormTemplateHost,
  HorizontalTablePreviewBody,
  type FormUpdateParagraph,
  VerticalTablePreviewBody,
  patchVerticalTableBottomConsent,
  patchVerticalTableCell,
  patchVerticalTableCompositeTime,
  patchVerticalTableFileNames,
  patchVerticalTableMultipleChoice,
} from '@jakorea/form-template-runtime'
import { ConsentWriteRadioGroup } from './consent-radio'
import { ConsentInfoTable } from './info-table'
import { AgreementNoticeSubjectFillFields } from './agreement-notice-subject-fill-fields'
import { PlatformIdTypeWithInputFields } from './id-type-with-input-fields'
import { PlatformPortraitLockedVerticalTable } from './platform-portrait-locked-vertical-table'
import { PlatformPortraitPersonalConsentTable } from './portrait-personal-consent-table'
import { resolveHorizontalTablePlatformView } from './horizontal-table-from-schema'
import previewTypography from '@/features/mypage/settings/ui/consent-document-preview-typography.module.css'
import { NOTICE_CONFIRMATION } from './copy'
import styles from './consent-form.module.css'

function tableBottomConsentToChoice(value?: TableBottomConsent): ConsentValue | '' {
  if (value === 'agree') return 'agree'
  if (value === 'disagree') return 'disagree'
  return ''
}

function resolveMultipleChoiceConsent(paragraph: MultipleChoiceParagraph): ConsentValue | '' {
  const selectedId = paragraph.selectedPreviewSingleId
  if (selectedId == null || selectedId === '') return ''
  if (selectedId.includes('-disagree')) return 'disagree'
  const item = paragraph.items.find(entry => entry.id === selectedId)
  if (item != null && (item.label === '동의하지 않음' || item.label.includes('동의하지 않'))) {
    return 'disagree'
  }
  return 'agree'
}

function applyMultipleChoiceConsent(
  paragraph: MultipleChoiceParagraph,
  next: ConsentValue,
  onUpdateParagraph: FormUpdateParagraph,
): void {
  onUpdateParagraph(paragraph.id, current => {
    if (current.kind !== 'single_item' || current.variant !== 'multiple_choice') {
      return current
    }
    const suffix = next === 'agree' ? '-agree' : '-disagree'
    const item =
      current.items.find(entry => entry.id.endsWith(suffix)) ??
      current.items.find(entry =>
        next === 'agree' ? entry.label === '동의' : entry.label.includes('동의하지 않'),
      )
    return { ...current, selectedPreviewSingleId: item?.id ?? null }
  })
}

function noticeTablePreviewParagraph(paragraph: HorizontalTableParagraph): HorizontalTableParagraph {
  return {
    ...paragraph,
    idTypeWithInput: undefined,
    showBottomText: false,
    showBottomConsent: false,
  }
}

function PlatformAgreementNoticeTableBody({
  paragraph,
  onUpdateParagraph,
}: {
  paragraph: HorizontalTableParagraph
  onUpdateParagraph: FormUpdateParagraph
}) {
  const idType = paragraph.idTypeWithInput

  return (
    <div className={styles.tableBlock} data-paragraph-id={paragraph.id}>
      <FormTemplateHost surface="platformUser">
        <HorizontalTablePreviewBody
          paragraph={noticeTablePreviewParagraph(paragraph)}
          interactionMode="user"
        />
      </FormTemplateHost>
      {paragraph.showBottomText || idType != null ? (
        <div className={styles.tableAfter}>
          {paragraph.showBottomText && paragraph.bottomText ? (
            <p className={styles.tableDescription}>{paragraph.bottomText}</p>
          ) : null}
          {idType != null ? (
            <PlatformIdTypeWithInputFields
              paragraph={idType}
              lockResidentIdType
              onChange={next =>
                onUpdateParagraph(paragraph.id, current =>
                  current.kind === 'single_item' && current.variant === 'horizontal_table'
                    ? { ...current, idTypeWithInput: next }
                    : current
                )
              }
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function PlatformHorizontalTableBody({
  paragraph,
  onUpdateParagraph,
}: {
  paragraph: HorizontalTableParagraph
  onUpdateParagraph: FormUpdateParagraph
}) {
  if (paragraph.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.table) {
    return (
      <PlatformAgreementNoticeTableBody paragraph={paragraph} onUpdateParagraph={onUpdateParagraph} />
    )
  }

  const { headers, rows, emphasizedColumns } = resolveHorizontalTablePlatformView(paragraph)
  const idType = paragraph.idTypeWithInput

  return (
    <div className={styles.tableBlock}>
      <ConsentInfoTable
        headers={headers}
        rows={rows}
        emphasizedColumns={emphasizedColumns}
        hideEmptyPairs={false}
      />
      {paragraph.showBottomText || paragraph.showBottomConsent || idType != null ? (
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
                  current.kind === 'single_item' && current.variant === 'horizontal_table'
                    ? { ...current, bottomConsent: next as TableBottomConsent }
                    : current
                )
              }
            />
          ) : null}
          {idType != null ? (
            <PlatformIdTypeWithInputFields
              paragraph={idType}
              lockResidentIdType={paragraph.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.table}
              onChange={next =>
                onUpdateParagraph(paragraph.id, current =>
                  current.kind === 'single_item' && current.variant === 'horizontal_table'
                    ? { ...current, idTypeWithInput: next }
                    : current
                )
              }
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function isExplanationInteractive(
  paragraphId: string,
  fillOptions?: PlatformConsentFillOptions
): boolean {
  if (fillOptions?.interactiveExplanationIds?.has(paragraphId)) return true
  return fillOptions?.consentFillReadOnlyBody !== true
}

export function PlatformConsentParagraphBody({
  paragraph,
  onUpdateParagraph,
  fillOptions,
  documentPreview = false,
}: {
  paragraph: WritingFormParagraph
  onUpdateParagraph: FormUpdateParagraph
  fillOptions?: PlatformConsentFillOptions
  documentPreview?: boolean
}) {
  if (paragraph.kind === 'single_item' && paragraph.variant === 'horizontal_table') {
    return (
      <PlatformHorizontalTableBody paragraph={paragraph} onUpdateParagraph={onUpdateParagraph} />
    )
  }

  if (paragraph.kind === 'single_item' && paragraph.variant === 'vertical_table') {
    if (paragraph.id === AGREEMENT_PORTRAIT_PARAGRAPH_IDS.personalConsentTable) {
      return (
        <PlatformPortraitPersonalConsentTable
          paragraph={paragraph}
          onUpdateParagraph={onUpdateParagraph}
        />
      )
    }

    if (
      paragraph.id === AGREEMENT_PORTRAIT_PARAGRAPH_IDS.delegatedConsentTable ||
      paragraph.id === AGREEMENT_PORTRAIT_PARAGRAPH_IDS.portraitUsageTable
    ) {
      return (
        <PlatformPortraitLockedVerticalTable
          paragraph={paragraph}
          onUpdateParagraph={onUpdateParagraph}
        />
      )
    }

    return (
      <div className={styles.tableBlock}>
        <FormTemplateHost surface="platformUser">
          <VerticalTablePreviewBody
            paragraph={paragraph}
            interactionMode="user"
            onBottomConsentChange={value =>
              onUpdateParagraph(paragraph.id, current =>
                current.kind === 'single_item' && current.variant === 'vertical_table'
                  ? patchVerticalTableBottomConsent(current, value)
                  : current
              )
            }
            onCellChange={(rowIndex, stageIndex, value) =>
              onUpdateParagraph(paragraph.id, current =>
                current.kind === 'single_item' && current.variant === 'vertical_table'
                  ? patchVerticalTableCell(current, rowIndex, stageIndex, value)
                  : current
              )
            }
            onCompositeTimeChange={(rowIndex, stageIndex, value) =>
              onUpdateParagraph(paragraph.id, current =>
                current.kind === 'single_item' && current.variant === 'vertical_table'
                  ? patchVerticalTableCompositeTime(current, rowIndex, stageIndex, value)
                  : current
              )
            }
            onMultipleChoiceChange={(rowIndex, stageIndex, values) =>
              onUpdateParagraph(paragraph.id, current =>
                current.kind === 'single_item' && current.variant === 'vertical_table'
                  ? patchVerticalTableMultipleChoice(current, rowIndex, stageIndex, values)
                  : current
              )
            }
            onFileNamesChange={(rowIndex, stageIndex, fileNames) =>
              onUpdateParagraph(paragraph.id, current =>
                current.kind === 'single_item' && current.variant === 'vertical_table'
                  ? patchVerticalTableFileNames(current, rowIndex, stageIndex, fileNames)
                  : current
              )
            }
          />
        </FormTemplateHost>
      </div>
    )
  }

  if (paragraph.kind === 'single_item' && paragraph.variant === 'multiple_choice') {
    const bodyDescription =
      resolveMultipleChoiceBodyDescriptionText(paragraph) ||
      paragraph.paragraphDescription?.trim() ||
      ''
    const consentValue = resolveMultipleChoiceConsent(paragraph)
    const radioGroup = (
      <ConsentWriteRadioGroup
        name={`consent-mc-${paragraph.id}`}
        value={consentValue}
        onChange={(next: ConsentValue) =>
          applyMultipleChoiceConsent(paragraph, next, onUpdateParagraph)
        }
      />
    )

    if (isEducatorFacilitatorPledgeClauseParagraphId(paragraph.id)) {
      return (
        <div className={styles.tableAfter}>
          {bodyDescription ? <p className={styles.tableDescription}>{bodyDescription}</p> : null}
          {radioGroup}
        </div>
      )
    }

    return (
      <>
        {bodyDescription ? (
          <PFText as="p" typo="bd-md-rg" color="black" className={styles.prose}>
            {bodyDescription}
          </PFText>
        ) : null}
        <PFFormFieldTable>
          <PFFormFieldRow type="single">
            <PFFormField label="동의 여부" required>
              {radioGroup}
            </PFFormField>
          </PFFormFieldRow>
        </PFFormFieldTable>
      </>
    )
  }

  if (paragraph.kind === 'single_item' && paragraph.variant === 'agreement_explanation_text') {
    const interactive = isExplanationInteractive(paragraph.id, fillOptions)
    if (interactive) {
      const isNoticeExplanationPlain =
        paragraph.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.institution ||
        paragraph.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.purpose
      return (
        <PFTextInput
          variant="formPage"
          appearance={isNoticeExplanationPlain ? 'plain' : 'boxed'}
          size="large"
          inputClassName={
            isNoticeExplanationPlain ? styles.noticeExplanationParagraphBody : undefined
          }
          value={paragraph.bodyText}
          placeholder={paragraph.bodyPlaceholder || '내용을 입력해 주세요'}
          onValueChange={value =>
            onUpdateParagraph(paragraph.id, current =>
              current.kind === 'single_item' && current.variant === 'agreement_explanation_text'
                ? { ...current, bodyText: value }
                : current
            )
          }
        />
      )
    }
    if (documentPreview) {
      return <p className={previewTypography.explanationText}>{paragraph.bodyText}</p>
    }
    return (
      <PFText as="p" typo="bd-md-rg" color="black" className={styles.prose}>
        {paragraph.bodyText}
      </PFText>
    )
  }

  if (
    paragraph.kind === 'single_item' &&
    (paragraph.variant === 'short_essay' || paragraph.variant === 'session_plan_short_essay')
  ) {
    if (
      paragraph.variant === 'short_essay' &&
      paragraph.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.subject
    ) {
      return (
        <AgreementNoticeSubjectFillFields
          paragraph={paragraph}
          onUpdateParagraph={onUpdateParagraph}
        />
      )
    }

    const items = paragraph.items ?? []
    if (items.length === 0) {
      return (
        <PFTextInput
          variant="formPage"
          size="large"
          value={paragraph.bodyText}
          placeholder={paragraph.bodyPlaceholder || '답변을 입력해 주세요'}
          onValueChange={value =>
            onUpdateParagraph(paragraph.id, current =>
              current.kind === 'single_item' &&
              (current.variant === 'short_essay' || current.variant === 'session_plan_short_essay')
                ? { ...current, bodyText: value }
                : current
            )
          }
        />
      )
    }

    return (
      <PFFormFieldTable>
        {items.map(item => (
          <PFFormFieldRow key={item.id} type="single">
            <PFFormField label={item.label || '입력'} required={paragraph.answerRequired}>
              <PFTextInput
                variant="formPage"
                size="large"
                value={item.bodyText}
                placeholder={item.placeholder || paragraph.bodyPlaceholder || '답변을 입력해 주세요'}
                inputMode={
                  item.id === AGREEMENT_NOTICE_SUBJECT_ITEM_IDS.birth ||
                  item.id === AGREEMENT_NOTICE_SUBJECT_ITEM_IDS.phone
                    ? 'numeric'
                    : undefined
                }
                maxLength={
                  item.id === AGREEMENT_NOTICE_SUBJECT_ITEM_IDS.birth
                    ? 10
                    : item.id === AGREEMENT_NOTICE_SUBJECT_ITEM_IDS.phone
                      ? 13
                      : undefined
                }
                type={item.id === AGREEMENT_NOTICE_SUBJECT_ITEM_IDS.phone ? 'tel' : undefined}
                autoComplete={
                  item.id === AGREEMENT_NOTICE_SUBJECT_ITEM_IDS.phone ? 'tel' : undefined
                }
                onChange={event => {
                  const nextValue =
                    item.id === AGREEMENT_NOTICE_SUBJECT_ITEM_IDS.phone
                      ? applyKoreanPhoneInputChange(
                          item.bodyText,
                          event.target.value,
                          event.target.selectionStart
                        ).formatted
                      : applyConsentShortEssayItemInput(item.id, event.target.value)
                  event.target.value = nextValue
                  onUpdateParagraph(paragraph.id, current => {
                    if (
                      current.kind !== 'single_item' ||
                      (current.variant !== 'short_essay' &&
                        current.variant !== 'session_plan_short_essay')
                    ) {
                      return current
                    }
                    return {
                      ...current,
                      items: (current.items ?? []).map(entry =>
                        entry.id === item.id ? { ...entry, bodyText: nextValue } : entry
                      ),
                    }
                  })
                }}
              />
            </PFFormField>
          </PFFormFieldRow>
        ))}
      </PFFormFieldTable>
    )
  }

  if (paragraph.kind === 'description' && paragraph.variant === 'static_description_lines') {
    return (
      <ul className={styles.proseList}>
        {paragraph.lines.map(line => (
          <li key={line}>
            <PFText as="p" typo="bd-md-rg" color="black" className={styles.prose}>
              {line}
            </PFText>
          </li>
        ))}
      </ul>
    )
  }

  if (paragraph.kind === 'description' && paragraph.variant === 'closing') {
    if (paragraph.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.confirmationClosing) {
      const text = paragraph.body.trim() || NOTICE_CONFIRMATION
      if (documentPreview) {
        return <p className={previewTypography.closingText}>{text}</p>
      }
      return <p className={styles.noticeClosingStatement}>{text}</p>
    }
    if (documentPreview) {
      return <p className={previewTypography.closingText}>{paragraph.body}</p>
    }
    return (
      <div className={styles.closingRecipient}>
        <p className={styles.closingRecipientText}>{paragraph.body}</p>
      </div>
    )
  }

  return null
}

export function resolvePlatformConsentSectionTitle(
  paragraph: WritingFormParagraph,
  titleIndex: number
): string {
  if (
    paragraph.kind === 'description' &&
    paragraph.variant === 'survey_title_with_period' &&
    'surveyTitle' in paragraph
  ) {
    return String(paragraph.surveyTitle ?? '').trim()
  }
  const base = paragraph.paragraphTitle?.trim() ?? ''
  if (!base) return ''
  return paragraph.participatesInTitleNumbering ? `${titleIndex + 1}. ${base}` : base
}

export function resolvePlatformConsentSectionRequired(paragraph: WritingFormParagraph): boolean {
  if (paragraph.kind === 'single_item') {
    if (paragraph.variant === 'horizontal_table' || paragraph.variant === 'vertical_table') {
      return paragraph.answerRequired
    }
    return paragraph.answerRequired ?? paragraph.requiredMark
  }
  return paragraph.requiredMark
}
