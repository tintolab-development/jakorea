/**
 * 일반 프로그램 상세 공통정보 Independent 저장 조각.
 * 제품 훅이 overlay apply 없이 이 결과를 persist 한다.
 */
import type { Program } from '@/types/domain'
import type { GeneralProgramUpdateSerializeOptions } from '@/features/program/general/api/adapters/general-program-adapters'
import {
  educationPlaceRegistrationOverlayFromEditValues,
  type GeneralProgramCommonInfoEditFormValues,
  type GeneralProgramSponsorEditContext,
} from '@/features/program/general/model/common-info-edit-schema'
import { resolvePersistedProgramTargetLevels } from '@/features/program/shared/lib/program-detail-info-constants'
import { buildRegistrationOverlayForPersist } from '@/features/program/shared/lib/public-program-title'
import { buildIndependentDetailCommonInfoFromRhf } from './build-independent-detail-common-info'
import type { IndependentSessionAuthoring } from './common-info-form-values'

export const GENERAL_COMMON_INFO_INDEPENDENT_SERIALIZE_OPTIONS = {
  overlayMerge: 'nested-ssot',
} as const satisfies GeneralProgramUpdateSerializeOptions

export function createGeneralProgramCommonInfoIndependentSave(args: {
  values: GeneralProgramCommonInfoEditFormValues
  program: Program
  context?: GeneralProgramSponsorEditContext
  detailedProgramCatalog?: readonly { id: string; name: string }[]
  paymentItemOptions?: Parameters<
    typeof buildIndependentDetailCommonInfoFromRhf
  >[0]['paymentItemOptions']
  sessionAuthoring?: IndependentSessionAuthoring
  changedFormKeys?: ReadonlySet<string>
}): {
  programDraft: Program
  patch: Partial<Program>
  structureChanged: boolean
  serializeOptions: GeneralProgramUpdateSerializeOptions
} {
  const built = buildIndependentDetailCommonInfoFromRhf({
    values: args.values,
    existing: args.program,
    context: args.context,
    detailedProgramCatalog: args.detailedProgramCatalog,
    paymentItemOptions: args.paymentItemOptions,
    sessionAuthoring: args.sessionAuthoring,
    changedFormKeys: args.changedFormKeys,
  })
  const persistedTargetLevels = resolvePersistedProgramTargetLevels(args.program)
  const targetLevelsPatch =
    persistedTargetLevels.length > 0 ? { targetLevels: persistedTargetLevels } : {}
  // 교육 진행 장소 — BE 전용 필드 전까지 overlay sidecar. 변경 시에만 patch 에 싣는다.
  const educationPlaceOverlay = educationPlaceRegistrationOverlayFromEditValues(
    args.values,
    args.program
  )
  const educationPlacePatch = educationPlaceOverlay
    ? { registrationOverlay: educationPlaceOverlay }
    : {}
  // 공고용 프로그램명을 바꿨으면 draft overlay 의 publicProgramTitle 도 새 값으로 맞춘다.
  // 저장 후 캐시는 draft overlay 를 쓰고 표시는 overlay 우선이라, 그대로 두면 이전 공고명이 보인다.
  const announcementTitleChanged =
    built.alignedPatch.patch.generalCommonInfo?.announcementTitle !== undefined
  const announcementOverlayPatch = announcementTitleChanged
    ? {
        registrationOverlay: buildRegistrationOverlayForPersist({
          ...built.programDraft,
          registrationOverlay: educationPlaceOverlay ?? built.programDraft.registrationOverlay,
        }),
      }
    : educationPlacePatch
  return {
    programDraft: {
      ...built.programDraft,
      ...announcementOverlayPatch,
      ...(persistedTargetLevels.length > 0
        ? { targetLevels: persistedTargetLevels, targetLevel: persistedTargetLevels[0] }
        : {}),
      updatedAt: new Date().toISOString(),
    },
    patch: {
      ...built.alignedPatch.patch,
      ...targetLevelsPatch,
      ...(educationPlaceOverlay ? announcementOverlayPatch : {}),
    },
    structureChanged: built.structureChanged,
    serializeOptions: GENERAL_COMMON_INFO_INDEPENDENT_SERIALIZE_OPTIONS,
  }
}
