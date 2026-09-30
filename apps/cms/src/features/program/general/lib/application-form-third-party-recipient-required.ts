import type { Program } from '@/types/domain'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import { hasIncompleteApplicationFormThirdPartyRecipient } from '@/features/template/model/application-form-third-party-recipient'
import { listVisibleOperationalFormSpecs } from '@/features/program/general/lib/operational-form-bindings'
import { createSeedDraftForOperationalCatalogId } from '@/features/program/general/lib/registration-operational-form-drafts'
import { peekRegistrationWizardSessionDrafts } from '@/features/program/general/lib/registration-wizard-session-drafts'

export type ApplicationFormDraftSnapshot = {
  templateCode: string
  draft: WritingFormDraft
}

function isApplicationTemplateCode(templateCode: string): boolean {
  return templateCode.startsWith('application-')
}

/**
 * 등록 위저드에 노출되는 신청 양식 draft.
 * 방문한 탭은 세션, 현재 탭은 current, 아직 안 연 탭은 시드.
 */
export function collectVisibleApplicationFormDrafts(args: {
  program: Program
  current?: ApplicationFormDraftSnapshot
}): ApplicationFormDraftSnapshot[] {
  const applicationCodes = listVisibleOperationalFormSpecs(args.program)
    .filter(spec => spec.formType === 'APPLICATION')
    .map(spec => spec.templateCode)

  const byCode = new Map<string, WritingFormDraft>()
  for (const entry of peekRegistrationWizardSessionDrafts()) {
    if (!applicationCodes.includes(entry.templateCode)) continue
    byCode.set(entry.templateCode, entry.draft)
  }
  if (args.current != null && isApplicationTemplateCode(args.current.templateCode)) {
    if (applicationCodes.includes(args.current.templateCode)) {
      byCode.set(args.current.templateCode, args.current.draft)
    }
  }

  const collected: ApplicationFormDraftSnapshot[] = []
  for (const templateCode of applicationCodes) {
    const draft = byCode.get(templateCode) ?? createSeedDraftForOperationalCatalogId(templateCode)
    if (draft == null) continue
    collected.push({ templateCode, draft })
  }
  return collected
}

export function describeIncompleteApplicationFormThirdPartyRecipient(args: {
  program: Program
  current?: ApplicationFormDraftSnapshot
}): string | null {
  for (const entry of collectVisibleApplicationFormDrafts(args)) {
    if (hasIncompleteApplicationFormThirdPartyRecipient(entry.draft)) {
      return `application.${entry.templateCode}.thirdPartyRecipient`
    }
  }
  return null
}

export function hasIncompleteApplicationFormThirdPartyRecipientForProgram(args: {
  program: Program
  current?: ApplicationFormDraftSnapshot
}): boolean {
  return describeIncompleteApplicationFormThirdPartyRecipient(args) != null
}
