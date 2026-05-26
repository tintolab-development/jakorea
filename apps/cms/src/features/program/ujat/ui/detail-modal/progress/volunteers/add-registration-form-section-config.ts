/**
 * 교육 진행 > 참여 봉사자 — 추가 등록 폼 섹션 순서·메타
 * (로컬 전용 — fullpage-modal·다른 UJAT 탭 미의존)
 */

import type { ComponentType } from 'react'
import { UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@/features/template/model/ujat-program-application-form-volunteer-draft'
import type { ProgramParticipantApplicationEditorViewModel } from '@/features/template/hooks/use-program-participant-application-editor'
import { UjatProgramApplicationVolunteerPreviousTermParagraph } from '@/features/template/ui/form-set/application-form/UJAT-volunteer/paragraphs/ujat-program-application-volunteer-previous-term-paragraph'
import { UjatProgramApplicationVolunteerPreferredRegionParagraph } from '@/features/template/ui/form-set/application-form/UJAT-volunteer/paragraphs/ujat-program-application-volunteer-preferred-region-paragraph'
import { UjatProgramApplicationVolunteerEducationExperienceParagraph } from '@/features/template/ui/form-set/application-form/UJAT-volunteer/paragraphs/ujat-program-application-volunteer-education-experience-paragraph'
import { UjatProgramApplicationVolunteerFreeTextParagraph } from '@/features/template/ui/form-set/application-form/UJAT-volunteer/paragraphs/ujat-program-application-volunteer-free-text-paragraph'

export type UjatVolunteerAddRegistrationPluginBodyKey =
  | 'previous-term'
  | 'preferred-region'
  | 'education-experience'
  | 'free-text'

export const UJAT_VOLUNTEER_ADD_REGISTRATION_PLUGIN_BODIES: Record<
  UjatVolunteerAddRegistrationPluginBodyKey,
  ComponentType
> = {
  'previous-term': UjatProgramApplicationVolunteerPreviousTermParagraph,
  'preferred-region': UjatProgramApplicationVolunteerPreferredRegionParagraph,
  'education-experience': UjatProgramApplicationVolunteerEducationExperienceParagraph,
  'free-text': UjatProgramApplicationVolunteerFreeTextParagraph,
}

export type UjatVolunteerAddRegistrationSectionDefinition =
  | {
      key: 'basic-info'
      kind: 'basic-info'
      paragraphId: typeof UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.basicInfo
      fallbackDescription: string
    }
  | {
      key: string
      kind: 'draft-paragraph'
      paragraphId: string
    }
  | {
      key: 'terms-consent'
      kind: 'terms-consent'
    }
  | {
      key: string
      kind: 'plugin'
      paragraphId?: string
      title: string
      required?: boolean
      staticDescription?: string
      fallbackDescription?: string
      body: UjatVolunteerAddRegistrationPluginBodyKey
      isVisible?: (vm: ProgramParticipantApplicationEditorViewModel) => boolean
    }
  | {
      key: 'activity-term'
      kind: 'activity-term'
    }

/** 추가 등록 폼 — 섹션 표시 순서 */
export const UJAT_VOLUNTEER_ADD_REGISTRATION_SECTIONS: UjatVolunteerAddRegistrationSectionDefinition[] =
  [
    {
      key: 'basic-info',
      kind: 'basic-info',
      paragraphId: UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.basicInfo,
      fallbackDescription: '학년은 2024년 1학기 기준으로 기재해 주세요.',
    },
    {
      key: 'personal-info',
      kind: 'draft-paragraph',
      paragraphId: UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.personalInfoCollection,
    },
    {
      key: 'third-party',
      kind: 'draft-paragraph',
      paragraphId: UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.thirdPartyConsent,
    },
    { key: 'terms-consent', kind: 'terms-consent' },
    {
      key: 'previous-term',
      kind: 'plugin',
      paragraphId: UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.previousTerm,
      title: '이전 UJAT 활동 기수',
      body: 'previous-term',
      isVisible: vm => vm.ujatVolunteerApplicationType === 'ujat-graduate',
    },
    {
      key: 'preferred-region',
      kind: 'plugin',
      title: '희망 교육 활동 지역',
      required: true,
      staticDescription: '활동이 직접 가능한 지역을 선택해 주세요.',
      body: 'preferred-region',
    },
    {
      key: 'education-experience',
      kind: 'plugin',
      title: '교육 진행 경험 여부',
      required: true,
      staticDescription:
        '교육봉사, 강사 아르바이트 등 교육 진행 경험 여부를 선택해 주세요.',
      body: 'education-experience',
    },
    {
      key: 'free-text',
      kind: 'plugin',
      paragraphId: UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.freeTextItems,
      title: '자유 작성 항목',
      fallbackDescription: '1~4번 문항은 자유롭게 작성 가능합니다.',
      body: 'free-text',
    },
    { key: 'activity-term', kind: 'activity-term' },
  ]

export function findVolunteerAddRegistrationParagraph(
  vm: ProgramParticipantApplicationEditorViewModel,
  paragraphId: string
) {
  return vm.draft.paragraphs.find(p => p.id === paragraphId)
}
