import { useCallback, useState } from 'react'
import {
  shouldShowInstitutionApplicationGuidanceParagraph,
  useInstitutionApplicationProgramBridge,
} from '@/features/program/general/lib/institution-application-program-bridge'
import { INSTITUTION_GUIDANCE_FIELDS } from '@/features/template/lib/institution-guidance-field-definitions'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { InstitutionGuidanceFieldCard } from '@/features/template/ui/form-set/application-form/institution/paragraphs/institution-guidance-field-card'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

function createInitialGuidanceAnswers(): Record<string, string> {
  return Object.fromEntries(INSTITUTION_GUIDANCE_FIELDS.map(field => [field.id, '']))
}

function readGuidanceAnswerFromParagraph(
  paragraph: HorizontalTableParagraph | undefined,
  rowIndex: number
): string {
  const cell = paragraph?.fieldDataRows?.[rowIndex]?.[1]
  if (cell == null) return ''
  if (cell.kind === 'subjective' || cell.kind === 'text') return cell.value ?? ''
  return ''
}

function writeGuidanceAnswerToParagraph(
  paragraph: HorizontalTableParagraph,
  rowIndex: number,
  value: string
): HorizontalTableParagraph {
  const fieldDataRows = (paragraph.fieldDataRows ?? []).map((row, index) => {
    if (index !== rowIndex) return row.map(cell => ({ ...cell }))
    const nextRow = row.map(cell => ({ ...cell }))
    const answerCell = nextRow[1]
    nextRow[1] =
      answerCell?.kind === 'subjective' || answerCell?.kind === 'text'
        ? { kind: 'subjective', value }
        : { kind: 'subjective', value }
    return nextRow
  })
  return { ...paragraph, fieldDataRows }
}

function ProgramApplicationFormInstitutionGuidanceParagraphBody({
  paragraph,
  onParagraphChange,
}: {
  paragraph?: HorizontalTableParagraph
  onParagraphChange?: (next: HorizontalTableParagraph) => void
}) {
  const [localAnswers, setLocalAnswers] = useState(createInitialGuidanceAnswers)
  const usesParagraphState = paragraph != null && onParagraphChange != null

  const readAnswer = useCallback(
    (fieldIndex: number, fieldId: string) => {
      if (usesParagraphState) {
        return readGuidanceAnswerFromParagraph(paragraph, fieldIndex)
      }
      return localAnswers[fieldId] ?? ''
    },
    [localAnswers, paragraph, usesParagraphState]
  )

  const writeAnswer = useCallback(
    (fieldIndex: number, fieldId: string, value: string) => {
      if (usesParagraphState && paragraph != null && onParagraphChange != null) {
        onParagraphChange(writeGuidanceAnswerToParagraph(paragraph, fieldIndex, value))
        return
      }
      setLocalAnswers(current => ({
        ...current,
        [fieldId]: value,
      }))
    },
    [onParagraphChange, paragraph, usesParagraphState]
  )

  return (
    <div
      className="program-application-form-institution__paragraph program-application-form-institution__guidance"
    >
      <div className="institution-guidance-fields">
        {INSTITUTION_GUIDANCE_FIELDS.map((field, index) => (
          <InstitutionGuidanceFieldCard
            key={field.id}
            field={field}
            value={readAnswer(index, field.id)}
            onChange={next => writeAnswer(index, field.id, next)}
          />
        ))}
      </div>
    </div>
  )
}

/** 프로그램 참여자 신청 폼 (학교) — 안내 사항 단락 */
export function ProgramApplicationFormInstitutionGuidanceParagraph({
  paragraph,
  onParagraphChange,
}: {
  paragraph?: HorizontalTableParagraph
  onParagraphChange?: (next: HorizontalTableParagraph) => void
}) {
  const bridge = useInstitutionApplicationProgramBridge()
  if (!shouldShowInstitutionApplicationGuidanceParagraph(bridge)) {
    return null
  }
  return (
    <ProgramApplicationFormInstitutionGuidanceParagraphBody
      paragraph={paragraph}
      onParagraphChange={onParagraphChange}
    />
  )
}
