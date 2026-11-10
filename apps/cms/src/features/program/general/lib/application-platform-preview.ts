import {
  PLATFORM_PROGRAM_APPLICATION_PREVIEW_MESSAGE_TYPE,
  type PlatformProgramApplicationPreviewMessage,
} from '@jakorea/domain/portal/program-detail'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import type { Program } from '@/types/domain'
import type { ProgramPreviewAudience } from '@/features/program/shared/lib/platform-preview/preview-audience'
import type { GeneralProgramRegistrationStepKey } from '@/features/program/general/model/registration-flow'
import { buildGeneralProgramPortalPreview } from '@/features/program/general/lib/platform-preview-payload'

type ApplicationStepPreviewSpec = {
  /** Portal applicationType */
  applicationType: string
  audience: ProgramPreviewAudience
  title: string
}

const APPLICATION_STEP_PREVIEW_SPECS: Partial<
  Record<GeneralProgramRegistrationStepKey, ApplicationStepPreviewSpec>
> = {
  'application-participant-school': {
    applicationType: 'ORGANIZATION',
    audience: 'institutions',
    title: '참여 기관 신청 정보 미리보기',
  },
  'application-participant-individual': {
    applicationType: 'INDIVIDUAL',
    audience: 'individuals',
    title: '참여자 신청 정보 미리보기',
  },
  'application-instructor': {
    applicationType: 'INSTRUCTOR',
    audience: 'instructors',
    title: '강사 신청 정보 미리보기',
  },
  'application-volunteer': {
    applicationType: 'VOLUNTEER',
    audience: 'volunteers',
    title: '봉사자 신청 정보 미리보기',
  },
}

/** 등록 신청 단계 → Platform 신청 화면 미리보기 스펙. 신청 단계가 아니면 null. */
export function resolveApplicationStepPreviewSpec(
  step: GeneralProgramRegistrationStepKey
): ApplicationStepPreviewSpec | null {
  return APPLICATION_STEP_PREVIEW_SPECS[step] ?? null
}

/** 작성 중 신청 양식 + 프로그램 스냅샷 → Platform 「프로그램 신청하기」 미리보기 메시지 */
export function buildApplicationPlatformPreviewMessage(input: {
  program: Program
  sponsorName?: string
  step: GeneralProgramRegistrationStepKey
  draft: WritingFormDraft
}): PlatformProgramApplicationPreviewMessage | null {
  const spec = resolveApplicationStepPreviewSpec(input.step)
  if (!spec) return null
  return {
    type: PLATFORM_PROGRAM_APPLICATION_PREVIEW_MESSAGE_TYPE,
    version: 1,
    detail: buildGeneralProgramPortalPreview({
      program: input.program,
      sponsorName: input.sponsorName,
      audience: spec.audience,
    }),
    applicationType: spec.applicationType,
    form: input.draft as unknown as Record<string, unknown>,
  }
}
