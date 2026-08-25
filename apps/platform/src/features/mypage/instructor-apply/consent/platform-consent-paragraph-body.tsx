import type { ConsentValue } from '@jakorea/domain/instructor/consent'
import {
  type PlatformConsentFillOptions,
} from '@jakorea/form-schema/consent'
import type {
  HorizontalTableParagraph,
  IdTypeWithInputParagraph,
  MultipleChoiceParagraph,
  TableBottomConsent,
  WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'
import {
  PFFormField,
  PFFormFieldRow,
  PFFormFieldTable,
  PFSelect,
  PFText,
  PFTextInput,
} from '@/shared/ui'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import { ConsentWriteRadioGroup } from './consent-radio'
import { ConsentInfoTable } from './info-table'
import { resolveHorizontalTablePlatformView } from './horizontal-table-from-schema'
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

function resolveIdTypePlaceholder(paragraph: IdTypeWithInputParagraph, selectedId: string | null): string {
  const placeholders: Record<string, string> = {
    'agreement-notice-id-resident': '주민등록번호를 입력해 주세요',
    'agreement-notice-id-passport': '여권번호를 입력해 주세요',
    'agreement-notice-id-driver': '운전면허번호를 입력해 주세요',
    'agreement-notice-id-alien': '외국인등록번호를 입력해 주세요',
  }
  if (selectedId != null && placeholders[selectedId]) return placeholders[selectedId]
  return paragraph.inputPlaceholder.trim() || '번호를 입력해 주세요'
}

function PlatformIdTypeWithInput({
  paragraph,
  onChange,
}: {
  paragraph: IdTypeWithInputParagraph
  onChange: (next: IdTypeWithInputParagraph) => void
}) {
  const options = paragraph.options?.length ? paragraph.options : []
  const selectedId =
    paragraph.selectedOptionId != null && options.some(o => o.id === paragraph.selectedOptionId)
      ? paragraph.selectedOptionId
      : (options[0]?.id ?? '')
  const selectOptions = options.map(opt => ({ value: opt.id, label: opt.label }))
  const placeholder = resolveIdTypePlaceholder(paragraph, selectedId)

  return (
    <PFFormFieldTable>
      <PFFormFieldRow type="double">
        <PFFormField label="식별번호 종류" required>
          <PFSelect
            variant="formPage"
            size="large"
            options={selectOptions}
            value={selectedId}
            onValueChange={value => {
              onChange({
                ...paragraph,
                selectedOptionId: value,
                inputPlaceholder: resolveIdTypePlaceholder(paragraph, value),
                inputValue: '',
              })
            }}
          />
        </PFFormField>
        <PFFormField label="식별번호" required>
          <PFTextInput
            variant="formPage"
            size="large"
            placeholder={placeholder}
            value={paragraph.inputValue}
            onValueChange={value =>
              onChange({ ...paragraph, inputValue: value, inputPlaceholder: placeholder })
            }
          />
        </PFFormField>
      </PFFormFieldRow>
    </PFFormFieldTable>
  )
}

function PlatformHorizontalTableBody({
  paragraph,
  onUpdateParagraph,
}: {
  paragraph: HorizontalTableParagraph
  onUpdateParagraph: FormUpdateParagraph
}) {
  const { headers, rows, emphasizedColumns } = resolveHorizontalTablePlatformView(paragraph)
  const idType = paragraph.idTypeWithInput

  return (
    <div className={styles.tableBlock}>
      <ConsentInfoTable headers={headers} rows={rows} emphasizedColumns={emphasizedColumns} />
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
            <PlatformIdTypeWithInput
              paragraph={idType}
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
}: {
  paragraph: WritingFormParagraph
  onUpdateParagraph: FormUpdateParagraph
  fillOptions?: PlatformConsentFillOptions
}) {
  if (paragraph.kind === 'single_item' && paragraph.variant === 'horizontal_table') {
    return (
      <PlatformHorizontalTableBody paragraph={paragraph} onUpdateParagraph={onUpdateParagraph} />
    )
  }

  if (paragraph.kind === 'single_item' && paragraph.variant === 'multiple_choice') {
    return (
      <>
        {paragraph.paragraphDescription?.trim() ? (
          <PFText as="p" typo="bd-md-rg" color="black" className={styles.prose}>
            {paragraph.paragraphDescription}
          </PFText>
        ) : null}
        <PFFormFieldTable>
          <PFFormFieldRow type="single">
            <PFFormField label="동의 여부" required>
              <ConsentWriteRadioGroup
                name={`consent-mc-${paragraph.id}`}
                value={resolveMultipleChoiceConsent(paragraph)}
                onChange={(next: ConsentValue) => {
                  onUpdateParagraph(paragraph.id, current => {
                    if (current.kind !== 'single_item' || current.variant !== 'multiple_choice') {
                      return current
                    }
                    const suffix = next === 'agree' ? '-agree' : '-disagree'
                    const item =
                      current.items.find(entry => entry.id.endsWith(suffix)) ??
                      current.items.find(entry =>
                        next === 'agree'
                          ? entry.label === '동의'
                          : entry.label.includes('동의하지 않')
                      )
                    return { ...current, selectedPreviewSingleId: item?.id ?? null }
                  })
                }}
              />
            </PFFormField>
          </PFFormFieldRow>
        </PFFormFieldTable>
      </>
    )
  }

  if (paragraph.kind === 'single_item' && paragraph.variant === 'agreement_explanation_text') {
    const interactive = isExplanationInteractive(paragraph.id, fillOptions)
    if (interactive) {
      return (
        <PFTextInput
          variant="formPage"
          size="large"
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
                onValueChange={value =>
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
                        entry.id === item.id ? { ...entry, bodyText: value } : entry
                      ),
                    }
                  })
                }
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
    return (
      <div className={styles.closingCard}>
        <PFText as="p" typo="bd-md-rg" color="black" className={styles.prose}>
          {paragraph.body}
        </PFText>
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
