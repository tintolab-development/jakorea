import { useCallback, useEffect, useState } from 'react'
import type { WritingFormDraft, WritingFormParagraph } from '@jakorea/form-schema/writing-form'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import {
  getMockApplyFormDraft,
  getProgramIdFromPath,
  ProgramBackButton,
  programApplyCompletePath,
  programDetailPath,
  useMockProgramById,
} from '@/features/program'
import {
  isApplyScheduleChoiceParagraphId,
  shouldShowApplyPreferredSchedule,
} from '@/features/program/lib/apply-form-schedule'
import { ApplyPreferredSchedule } from '@/features/program/ui/apply-preferred-schedule/apply-preferred-schedule'
import { FormTemplateHost, FormTemplateRenderer } from '@/features/form-template'
import { getDevAuthLoggedIn, resolveLoginRequiredPath, shouldUsePlatformMockData } from '@/shared/lib'
import { PFButton, PFCheckbox, PFText, PFTextarea, PFTextInput } from '@/shared/ui'
import shell from '../program-page-shell.module.css'
import styles from './page.module.css'
import { useNavigate } from 'react-router-dom'

export function ProgramApplyPage() {
  const navigate = useNavigate()
  const [isReady, setIsReady] = useState(false)
  const programId = getProgramIdFromPath()
  const { program, isLoading } = useMockProgramById(programId)

  useEffect(() => {
    if (!programId) {
      return
    }

    if (!getDevAuthLoggedIn()) {
      navigate(resolveLoginRequiredPath(`/programs/${programId}/apply`))
      return
    }

    setIsReady(true)
  }, [navigate, programId])

  const [draft, setDraft] = useState<WritingFormDraft | null>(null)

  useEffect(() => {
    if (!program || !shouldUsePlatformMockData()) {
      setDraft(null)
      return
    }
    setDraft(getMockApplyFormDraft(program))
  }, [program])

  const updateParagraph = useCallback<FormUpdateParagraph>((id, updater) => {
    setDraft(prev => {
      if (prev == null) return prev
      return {
        ...prev,
        paragraphs: prev.paragraphs.map(paragraph =>
          paragraph.id === id ? updater(paragraph) : paragraph
        ),
      }
    })
  }, [])

  const renderParagraphSlot = useCallback(
    (paragraph: WritingFormParagraph) => {
      if (program == null) return undefined

      if (
        program.detailCase === 'general' &&
        isApplyScheduleChoiceParagraphId(paragraph.id) &&
        shouldShowApplyPreferredSchedule(program)
      ) {
        return <ApplyPreferredSchedule maxBlocks={program.maxPreferredScheduleCount} />
      }

      if (
        paragraph.kind === 'single_item' &&
        paragraph.variant === 'multiple_choice' &&
        paragraph.allowMultiple
      ) {
        const selectedIds = paragraph.selectedPreviewMultipleIds ?? []
        if (paragraph.items.length === 0) {
          return (
            <PFText as="p" typo="bd-md-md" color="neutral-cool-600">
              선택 가능한 교육 일정이 없습니다.
            </PFText>
          )
        }
        return (
          <div className={styles.multipleChoice}>
            {paragraph.items.map(item => (
              <PFCheckbox
                key={item.id}
                className={styles.multipleChoiceItem}
                size="large"
                checked={selectedIds.includes(item.id)}
                onCheckedChange={checked => {
                  updateParagraph(paragraph.id, current => {
                    if (current.kind !== 'single_item' || current.variant !== 'multiple_choice') {
                      return current
                    }
                    const prev = current.selectedPreviewMultipleIds ?? []
                    const next = checked
                      ? [...prev.filter(id => id !== item.id), item.id]
                      : prev.filter(id => id !== item.id)
                    return { ...current, selectedPreviewMultipleIds: next }
                  })
                }}
              >
                {item.label}
              </PFCheckbox>
            ))}
          </div>
        )
      }

      if (paragraph.kind !== 'single_item' || paragraph.variant !== 'short_essay') {
        return undefined
      }

      const isSingleLine = paragraph.itemInputRows === 1
      const items = paragraph.items ?? []
      const placeholder = paragraph.bodyPlaceholder || '답변을 입력해 주세요'

      const commitBody = (next: string) => {
        updateParagraph(paragraph.id, current =>
          current.kind === 'single_item' && current.variant === 'short_essay'
            ? { ...current, bodyText: next }
            : current
        )
      }

      if (items.length === 0) {
        if (isSingleLine) {
          return (
            <PFTextInput
              variant="formPage"
              value={paragraph.bodyText}
              placeholder={placeholder}
              onValueChange={commitBody}
            />
          )
        }
        return (
          <PFTextarea
            variant="formPage"
            value={paragraph.bodyText}
            placeholder={placeholder}
            onValueChange={commitBody}
          />
        )
      }

      return (
        <div className={styles.shortEssayItems}>
          {items.map(item => {
            const onItemChange = (nextValue: string) => {
              updateParagraph(paragraph.id, current => {
                if (current.kind !== 'single_item' || current.variant !== 'short_essay') {
                  return current
                }
                return {
                  ...current,
                  bodyText: current.items?.[0]?.id === item.id ? nextValue : current.bodyText,
                  items: (current.items ?? []).map(entry =>
                    entry.id === item.id ? { ...entry, bodyText: nextValue } : entry
                  ),
                }
              })
            }

            const control = isSingleLine ? (
              <PFTextInput
                variant="formPage"
                label={paragraph.showItemTitle ? item.label?.trim() || undefined : undefined}
                value={item.bodyText}
                placeholder={item.placeholder || placeholder}
                onValueChange={onItemChange}
              />
            ) : (
              <PFTextarea
                variant="formPage"
                label={paragraph.showItemTitle ? item.label?.trim() || undefined : undefined}
                value={item.bodyText}
                placeholder={item.placeholder || placeholder}
                onValueChange={onItemChange}
              />
            )

            return (
              <div key={item.id} className={styles.shortEssayItem}>
                {control}
              </div>
            )
          })}
        </div>
      )
    },
    [program, updateParagraph]
  )

  if (!isReady || isLoading || !program || !draft) {
    return null
  }

  const handleBack = () => {
    navigate(programDetailPath(program.id))
  }

  const handleSubmit = () => {
    // TODO: CMS 등록 신청 폼 draft 기준 검증 · POST program application API
    navigate(programApplyCompletePath(program.id))
  }

  return (
    <section className={[shell.page, styles.page].join(' ')}>
      <div className={shell.inner}>
        <div className={styles.back}>
          <ProgramBackButton size="large" label="이전으로" onClick={handleBack} />
        </div>

        <PFText as="h1" typo="hd-lg" color="black" className={styles.pageTitle}>
          프로그램 신청하기
        </PFText>

        <div className={styles.summary}>
          <PFText as="h2" typo="hl-sm" color="black">
            {program.title}
          </PFText>
          <PFText as="p" typo="bd-md-md" color="primary-500">
            {program.applicationPeriodLabel}
          </PFText>
        </div>

        <div className={styles.form}>
          <FormTemplateHost surface="platformUser">
            <FormTemplateRenderer
              draft={draft}
              interactionMode="user"
              surface="platformUser"
              onUpdateParagraph={updateParagraph}
              renderParagraphSlot={renderParagraphSlot}
            />
          </FormTemplateHost>

          <div className={styles.actions}>
            <PFButton size="xlarge" width={240} type="button" onClick={handleSubmit}>
              신청하기
            </PFButton>
          </div>
        </div>
      </div>
    </section>
  )
}
