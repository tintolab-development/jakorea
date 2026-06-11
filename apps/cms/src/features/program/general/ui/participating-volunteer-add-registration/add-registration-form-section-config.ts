/**
 * 참여 봉사자 추가 등록 — 섹션 순서·메타 (UJAT 추가 등록 폼과 동일 패턴)
 */

import type { ComponentType } from 'react'
import { PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS } from '@/features/program/general/lib/participating-volunteer-add-registration-draft'
import type {
  ParticipatingVolunteerAddRegistrationSectionContext,
} from './add-registration-form-types'
import { ParticipatingVolunteerAddRegistrationBasicInfoParagraph } from './basic-info-paragraph'
import { ParticipatingVolunteerAddRegistrationPreviousJaProgramParagraph } from './previous-ja-program-paragraph'
import { ParticipatingVolunteerAddRegistrationFreeTextParagraph } from './free-text-paragraph'

export type { JaVolunteerExperience, ParticipatingVolunteerAddRegistrationSectionContext } from './add-registration-form-types'
export type ParticipatingVolunteerAddRegistrationPluginBodyKey =
  | 'basic-info'
  | 'previous-ja-program'
  | 'free-text'
export const PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_PLUGIN_BODIES: Record<
  ParticipatingVolunteerAddRegistrationPluginBodyKey,
  ComponentType<ParticipatingVolunteerAddRegistrationSectionContext>
> = {
  'basic-info': ParticipatingVolunteerAddRegistrationBasicInfoParagraph,
  'previous-ja-program': ParticipatingVolunteerAddRegistrationPreviousJaProgramParagraph,
  'free-text': ParticipatingVolunteerAddRegistrationFreeTextParagraph,
}

export type ParticipatingVolunteerAddRegistrationSectionDefinition =
  | {
      key: string
      kind: 'draft-paragraph'
      paragraphId: string
    }
  | {
      key: string
      kind: 'plugin'
      paragraphId?: string
      title: string
      required?: boolean
      staticDescription?: string
      fallbackDescription?: string
      body: ParticipatingVolunteerAddRegistrationPluginBodyKey
      isVisible?: (ctx: ParticipatingVolunteerAddRegistrationSectionContext) => boolean
    }

export const PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_SECTIONS: ParticipatingVolunteerAddRegistrationSectionDefinition[] =
  [
    {
      key: 'personal-info',
      kind: 'draft-paragraph',
      paragraphId: PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS.personalInfoCollection,
    },
    {
      key: 'third-party',
      kind: 'draft-paragraph',
      paragraphId: PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS.thirdPartyConsent,
    },
    {
      key: 'basic-info',
      kind: 'plugin',
      paragraphId: PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS.basicInfo,
      title: '기본 정보',
      required: true,
      body: 'basic-info',
      isVisible: ctx => !ctx.hideBasicInfoSection,
    },
    {
      key: 'ja-volunteer-experience',
      kind: 'draft-paragraph',
      paragraphId: PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS.jaVolunteerExperience,
    },
    {
      key: 'previous-ja-program',
      kind: 'plugin',
      paragraphId: PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS.previousJaProgram,
      title: '이전 참여 JA 봉사 프로그램',
      body: 'previous-ja-program',
      isVisible: ctx => ctx.jaVolunteerExperience === 'yes',
    },
    {
      key: 'free-text',
      kind: 'plugin',
      paragraphId: PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS.freeTextItems,
      title: '자유 작성 항목',
      fallbackDescription: '1~3번 문항은 자유롭게 작성 가능합니다.',
      body: 'free-text',
    },
  ]
