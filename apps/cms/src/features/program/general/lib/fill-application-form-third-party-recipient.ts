import type { GeneralProgramParticipantType, Program } from '@/types/domain'
import { listVisibleOperationalFormSpecs } from '@/features/program/general/lib/operational-form-bindings'
import { createSeedDraftForOperationalCatalogId } from '@/features/program/general/lib/registration-operational-form-drafts'
import { registrationPendingSnapshotId } from '@/features/program/general/lib/registration-local-save'
import { publishRegistrationWizardApplicationDraft } from '@/features/program/general/lib/registration-wizard-session-drafts'
import {
  APPLICATION_FORM_THIRD_PARTY_RECIPIENT_HEADER,
  isApplicationFormThirdPartyConsentParagraph,
  isBlankApplicationFormThirdPartyRecipientValue,
} from '@/features/template/model/application-form-third-party-recipient'
import type { ProgramRegistrationFormVariant } from '@/features/template/model/program-registration-draft'
import {
  fieldCellValueToPlainText,
  horizontalTableSetFieldCellValue,
  type HorizontalTableParagraph,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'

const DEV_AUTOFILL_THIRD_PARTY_RECIPIENT = 'JA코리아'

function recipientColumnIndex(columnHeaders: readonly string[] | undefined): number {
  const headerIndex = columnHeaders?.findIndex(
    header => header.trim() === APPLICATION_FORM_THIRD_PARTY_RECIPIENT_HEADER
  )
  return headerIndex != null && headerIndex >= 0 ? headerIndex : 0
}

/** 신청 양식 제3자 동의 표의 빈 「제공받는 곳」칸을 채운다. */
export function fillBlankApplicationFormThirdPartyRecipients(
  draft: WritingFormDraft,
  value: string
): WritingFormDraft {
  const trimmed = value.trim()
  if (!trimmed || isBlankApplicationFormThirdPartyRecipientValue(trimmed)) return draft

  let changed = false
  const paragraphs = draft.paragraphs.map(paragraph => {
    if (paragraph.variant !== 'horizontal_table') return paragraph
    if (!isApplicationFormThirdPartyConsentParagraph(paragraph.id)) return paragraph
    const table = paragraph as HorizontalTableParagraph
    const columnIndex = recipientColumnIndex(table.columnHeaders)
    const rowCount = Math.max(table.dataRows.length, table.fieldDataRows?.length ?? 0, 1)
    let next = table
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      const fieldCell = next.fieldDataRows?.[rowIndex]?.[columnIndex]
      const text =
        fieldCell != null
          ? fieldCellValueToPlainText(fieldCell)
          : (next.dataRows[rowIndex]?.[columnIndex] ?? '')
      if (!isBlankApplicationFormThirdPartyRecipientValue(text)) continue
      next = horizontalTableSetFieldCellValue(next, rowIndex, columnIndex, {
        kind: 'text',
        value: trimmed,
      })
      changed = true
    }
    return next
  })
  return changed ? { ...draft, paragraphs } : draft
}

export function applyDevAutofillThirdPartyRecipient(draft: WritingFormDraft): WritingFormDraft {
  return fillBlankApplicationFormThirdPartyRecipients(draft, DEV_AUTOFILL_THIRD_PARTY_RECIPIENT)
}

type DevAutofillParticipant = {
  individual: boolean
  organization: boolean
  teacherInstructor: boolean
  volunteer: boolean
}

type DevAutofillApplicationLayout = {
  participantOrganization: boolean
  participant?: DevAutofillParticipant
}

function participantTypesForDevAutofill(
  variant: ProgramRegistrationFormVariant,
  layout: DevAutofillApplicationLayout
): GeneralProgramParticipantType[] {
  if (variant === 'trainedTeachers') return ['school_institution']
  if (variant === 'economy') return ['school_institution', 'teacher_instructor']
  const types: GeneralProgramParticipantType[] = []
  if (layout.participant?.individual) types.push('individual')
  if (layout.participant?.organization || layout.participantOrganization) {
    types.push('school_institution')
  }
  if (layout.participant?.teacherInstructor) types.push('teacher_instructor')
  if (layout.participant?.volunteer) types.push('volunteer')
  return types.length > 0 ? types : ['individual']
}

/**
 * 개발용 자동입력 — 등록 완료 검사가 보는 신청 양식의 「제공받는 곳」을 채운다.
 * 열려 있는 신청 편집기에도 같은 draft를 반영한다.
 */
export function seedDevAutofillApplicationThirdPartyRecipients(
  variant: ProgramRegistrationFormVariant,
  layout: DevAutofillApplicationLayout
): void {
  const program = {
    id: registrationPendingSnapshotId(variant),
    generalParticipantTypes: participantTypesForDevAutofill(variant, layout),
  } as Program
  seedDevAutofillApplicationThirdPartyRecipientsForProgram(program)
}

/** UJAT처럼 등록 유형별 pending id 규칙이 다른 플로우의 신청 양식 시드. */
export function seedDevAutofillApplicationThirdPartyRecipientsForProgram(
  program: Program
): void {
  for (const spec of listVisibleOperationalFormSpecs(program)) {
    if (spec.formType !== 'APPLICATION') continue
    const seed = createSeedDraftForOperationalCatalogId(spec.templateCode)
    if (seed == null) continue
    publishRegistrationWizardApplicationDraft({
      templateCode: spec.templateCode,
      draft: fillBlankApplicationFormThirdPartyRecipients(
        seed,
        DEV_AUTOFILL_THIRD_PARTY_RECIPIENT
      ),
    })
  }
}
