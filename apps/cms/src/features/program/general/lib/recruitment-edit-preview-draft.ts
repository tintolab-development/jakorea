/**
 * 프로그램 상세 모집 수정 중 미리보기 — 저장 직전과 같은 RHF 스냅샷.
 * overlay store를 바꾸지 않는다. 미리보기 열 때 extraOverlay로만 덮는다.
 */

import { resolveInstructorRowRemarksNotApplicable } from '@/features/program/general/lib/instructor-remarks-not-applicable'
import type { Program } from '@/types/domain'
import {
  applyRecruitmentDetailInfoFields,
  type ProgramDetailRecruitmentAudience,
  type ProgramDetailRecruitmentNotesField,
} from '@/features/program/shared/lib/apply-recruitment-additional-content-html'
import {
  applyAudienceProgramOperationToRecruitmentWindows,
} from '@/features/program/general/lib/general-program-recruitment-operation-period'
import { isGeneralRecruitmentRowProgram } from '@/features/program/general/lib/is-general-recruitment-row-program'
import { recruitOverlayPatchFromDetailEditValues } from '@/features/program/general/lib/detail-operational-save-merge'
import { getRecruitDetailInfoRecord } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-form-rhf'
import {
  readRecruitDetailMediaFromOverlay,
  recruitDetailInfoPrefixesForPreviewAudience,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-media'
import type { GeneralRecruitTabKey } from '@/features/program/general/lib/recruitment-tabs'
import {
  detailEditValuesToProgramPatch,
  volunteerDocumentInterviewNestedPatch,
  type ProgramDetailEditFormValues,
} from '@/features/program/shared/model/program-detail-edit-schema'

export function recruitmentAudienceFromDetailTab(
  tab: GeneralRecruitTabKey
): ProgramDetailRecruitmentAudience {
  if (tab === 'instructors') return 'instructor'
  if (tab === 'volunteers') return 'volunteer'
  return 'participant'
}

export type RecruitmentEditPreviewDraft = {
  program: Program
  extraOverlay: Record<string, unknown>
}

function notesFieldForAudience(
  audience: ProgramDetailRecruitmentAudience,
  writesRowFields: boolean,
  recruitmentNotesField?: ProgramDetailRecruitmentNotesField
): ProgramDetailRecruitmentNotesField {
  if (recruitmentNotesField != null) return recruitmentNotesField
  if (audience === 'instructor') {
    return writesRowFields ? 'instructorRecruitmentRemarks' : 'otherNotes'
  }
  if (audience === 'volunteer') return 'oneLineIntroduction'
  return 'remarks'
}

function contactFromValues(
  values: ProgramDetailEditFormValues,
  audience: ProgramDetailRecruitmentAudience
): { contactName?: string; contactPhone?: string; contactEmail?: string } {
  if (audience === 'instructor') {
    return {
      contactName: values.instructorRecruitmentContactOrganizationName,
      contactPhone: values.instructorContactPhone,
      contactEmail: values.instructorContactEmail,
    }
  }
  if (audience === 'volunteer') {
    return {
      contactName: values.volunteerRecruitmentContactOrganizationName,
      contactPhone: values.volunteerContactPhone,
      contactEmail: values.volunteerContactEmail,
    }
  }
  return {
    contactName: values.recruitmentContactOrganizationName,
    contactPhone: values.contactPhone,
    contactEmail: values.contactEmail,
  }
}

/** 상세 모집 수정 폼의 현재 값으로 미리보기 Program을 만든다. 저장·overlay store는 건드리지 않는다. */
export function buildRecruitmentEditPreviewDraft(input: {
  program: Program
  values: ProgramDetailEditFormValues
  audience: ProgramDetailRecruitmentAudience
  recruitmentNotesField?: ProgramDetailRecruitmentNotesField
}): RecruitmentEditPreviewDraft {
  const { program, values, audience } = input
  const writesRowFields = isGeneralRecruitmentRowProgram(program)
  const notesField = notesFieldForAudience(
    audience,
    writesRowFields,
    input.recruitmentNotesField
  )
  const html =
    typeof values.additionalContentHtml === 'string' ? values.additionalContentHtml : ''
  const notesNotApplicable =
    audience === 'participant'
      ? values.participantRecruitmentNotesNotApplicable === 'not_applicable'
      : audience === 'volunteer'
        ? values.volunteerRecruitmentNotesNotApplicable === 'not_applicable'
        : audience === 'instructor' && writesRowFields
          ? values.instructorRecruitmentNotesNotApplicable === 'not_applicable'
          : undefined
  const instructorRowRemarksNotApplicable = resolveInstructorRowRemarksNotApplicable(
    values,
    audience,
    writesRowFields
  )
  const contact = contactFromValues(values, audience)

  let patch = detailEditValuesToProgramPatch(values, program, {
    recruitmentAudience: audience,
  })
  patch = {
    ...patch,
    ...applyAudienceProgramOperationToRecruitmentWindows(program, values, audience),
  }
  patch = applyRecruitmentDetailInfoFields(patch, program, audience, {
    description: values.description,
    recruitmentGuide: values.recruitmentGuide,
    applicationMethod: values.applicationMethod,
    learningSupportContent: values.learningSupportContent,
    additionalContentHtml: html,
    remarks:
      audience === 'instructor' && notesField !== 'otherNotes'
        ? values.instructorRecruitmentRemarks
        : values[notesField],
    notesNotApplicable,
    ...(instructorRowRemarksNotApplicable !== undefined
      ? { rowRemarksNotApplicable: instructorRowRemarksNotApplicable }
      : {}),
    ...(writesRowFields
      ? {
          contactName: contact.contactName ?? '',
          contactPhone: contact.contactPhone ?? '',
          contactEmail: contact.contactEmail ?? '',
          ...(audience !== 'participant' ? { otherMatters: values.otherNotes ?? '' } : {}),
        }
      : {}),
  })

  if (audience === 'volunteer') {
    const existingVolunteer = program.generalCommonInfo?.volunteerRecruitmentInfo as
      | {
          documentPassAnnouncementDate?: string
          documentPassAnnouncementMethod?: string
          interviewStartDate?: string
          interviewEndDate?: string
          interviewMethod?: string
        }
      | undefined
    const nestedInterview = volunteerDocumentInterviewNestedPatch(values, existingVolunteer)
    patch = {
      ...patch,
      generalCommonInfo: {
        ...patch.generalCommonInfo,
        volunteerRecruitmentInfo: {
          ...patch.generalCommonInfo?.volunteerRecruitmentInfo,
          ...nestedInterview,
        },
      },
    }
  }

  if (patch.generalCommonInfo) {
    patch = {
      ...patch,
      generalCommonInfo: {
        ...patch.generalCommonInfo,
        announcementTitle: program.generalCommonInfo?.announcementTitle,
      },
    }
  }

  const previewAudience =
    audience === 'instructor'
      ? 'instructors'
      : audience === 'volunteer'
        ? 'volunteers'
        : 'institutions'
  const mediaPrefixes = recruitDetailInfoPrefixesForPreviewAudience(previewAudience)
  const liveMediaOverlay = pickLiveRecruitmentMediaOverlay(
    getRecruitDetailInfoRecord(),
    mediaPrefixes
  )
  const extraOverlay = {
    ...(patch.registrationOverlay ?? {}),
    ...recruitOverlayPatchFromDetailEditValues(values, audience),
    ...liveMediaOverlay,
  }
  const liveThumbId = readRecruitDetailMediaFromOverlay(extraOverlay, mediaPrefixes)
    .thumbFileObjectId
  const recruitmentId = program.activeRecruitmentId
  const baseRows = patch.programRecruitments ?? program.programRecruitments
  const programRecruitments =
    liveThumbId != null && recruitmentId != null && Array.isArray(baseRows)
      ? baseRows.map(row =>
          row.id === recruitmentId ? { ...row, thumbnailFileObjectId: liveThumbId } : row
        )
      : patch.programRecruitments

  const draft: Program = {
    ...program,
    ...patch,
    ...(programRecruitments !== undefined ? { programRecruitments } : {}),
    generalCommonInfo: {
      ...program.generalCommonInfo,
      ...patch.generalCommonInfo,
    },
    registrationOverlay: {
      ...program.registrationOverlay,
      ...extraOverlay,
    },
  }

  return { program: draft, extraOverlay }
}

function pickLiveRecruitmentMediaOverlay(
  record: Record<string, unknown>,
  prefixes: readonly string[]
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    const inPrefix = prefixes.some(prefix => key === prefix || key.startsWith(`${prefix}.`))
    if (!inPrefix) continue
    if (
      key.endsWith('.thumbFileObjectId') ||
      key.endsWith('.thumbContentUrl') ||
      key.endsWith('.thumbFileName') ||
      key.endsWith('.thumbObjectUrl') ||
      key.endsWith('.attachmentFileNames') ||
      key.endsWith('.attachmentFileObjectIds')
    ) {
      out[key] = value
    }
  }
  return out
}
