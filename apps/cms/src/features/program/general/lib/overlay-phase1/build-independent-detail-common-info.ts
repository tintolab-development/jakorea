/**
 * 상세 공통정보 Independent 경로.
 * overlay maps로 되돌리지 않고 기존 nested RHF mapper를 재사용한다.
 */
import type { Program } from '@/types/domain'
import {
  generalCommonInfoEditValuesToProgramPatch,
  type GeneralProgramCommonInfoEditFormValues,
  type GeneralProgramSponsorEditContext,
} from '@/features/program/general/model/common-info-edit-schema'
import type { IndependentSessionAuthoring } from './common-info-form-values'
import { trimTrailingBlankRegularCurriculumSessions } from '@/features/program/general/lib/schedule-detail-form'
import {
  isEducationStructureChanged,
  nestedRowsEqual,
  preserveCurriculumSessionNos,
} from './independent-session-authoring'
import { buildIndependentCommonInfoPatch } from './build-independent-common-info-patch'
import type { IndependentCommonInfoPatchResult } from './build-independent-common-info-patch'

const EMPTY_SPONSOR_CONTEXT: GeneralProgramSponsorEditContext = {
  sponsors: [],
  contactsBySponsorId: {},
}

/**
 * 상세 RHF 값 → Independent PATCH.
 * 제품 저장 훅은 호출하지 않는다.
 * 교육구조가 바뀌면 비활성 nested 를 [] 로 초기화한다. 바뀌지 않으면 상대 nested 를 보존한다.
 */
export function buildIndependentDetailCommonInfoFromRhf(args: {
  values: GeneralProgramCommonInfoEditFormValues
  existing: Program
  context?: GeneralProgramSponsorEditContext
  detailedProgramCatalog?: readonly { id: string; name: string }[]
  paymentItemOptions?: Parameters<typeof generalCommonInfoEditValuesToProgramPatch>[4]
  sessionAuthoring?: IndependentSessionAuthoring
  changedFormKeys?: ReadonlySet<string>
}): {
  rhfPatch: Partial<Program>
  alignedPatch: IndependentCommonInfoPatchResult
  programDraft: Program
  structureChanged: boolean
} {
  const rhfPatch = generalCommonInfoEditValuesToProgramPatch(
    args.values,
    args.existing,
    args.context ?? EMPTY_SPONSOR_CONTEXT,
    args.detailedProgramCatalog ?? [],
    args.paymentItemOptions
  )
  const existingCommon = args.existing.generalCommonInfo
  const mappedCommon = rhfPatch.generalCommonInfo
  const nextStructure = args.values.educationStructure
  const structureChanged = isEducationStructureChanged(args.existing, nextStructure)

  const curriculumSessions =
    args.sessionAuthoring?.curriculum?.kind === 'clear'
      ? []
      : args.sessionAuthoring?.curriculum?.kind === 'replace'
        ? args.sessionAuthoring.curriculum.value
        : args.sessionAuthoring?.curriculum?.kind === 'omit'
          ? existingCommon?.curriculumSessions
          : structureChanged && nextStructure === 'schedule'
            ? []
            : nextStructure === 'schedule'
              ? existingCommon?.curriculumSessions
              : preserveCurriculumSessionNos(
                  trimTrailingBlankRegularCurriculumSessions(
                    mappedCommon?.curriculumSessions ?? []
                  ),
                  existingCommon?.curriculumSessions
                )

  const scheduleDetails =
    args.sessionAuthoring?.schedule?.kind === 'clear'
      ? []
      : args.sessionAuthoring?.schedule?.kind === 'replace'
        ? args.sessionAuthoring.schedule.value
        : args.sessionAuthoring?.schedule?.kind === 'omit'
          ? existingCommon?.scheduleDetails
          : structureChanged && nextStructure === 'curriculum'
            ? []
            : nextStructure !== 'schedule'
              ? existingCommon?.scheduleDetails
              : mappedCommon?.scheduleDetails

  const programDraft: Program = {
    ...args.existing,
    ...rhfPatch,
    generalCommonInfo: {
      ...existingCommon,
      ...mappedCommon,
      curriculumSessions,
      scheduleDetails,
      educationScheduleLines:
        mappedCommon?.educationScheduleLines ?? existingCommon?.educationScheduleLines,
    },
    schedules: args.existing.schedules,
  }

  const structureAuthoring: IndependentSessionAuthoring | undefined = structureChanged
    ? nextStructure === 'schedule'
      ? {
          curriculum: { kind: 'clear' },
          schedule: { kind: 'replace', value: scheduleDetails ?? [] },
        }
      : {
          curriculum: { kind: 'replace', value: curriculumSessions ?? [] },
          schedule: { kind: 'clear' },
        }
    : undefined

  const alignedPatch = buildIndependentCommonInfoPatch({
    draft: {
      applied: programDraft,
      programDraft,
      persistOverlay: {},
    },
    baseline: args.existing,
    sessionAuthoring: args.sessionAuthoring ?? structureAuthoring,
    changedFormKeys: args.changedFormKeys,
  })

  return { rhfPatch, alignedPatch, programDraft, structureChanged }
}

export function detailRhfMapperClearsSiblingNested(rhfPatch: Partial<Program>): boolean {
  const common = rhfPatch.generalCommonInfo
  if (!common) return false
  return (
    (Array.isArray(common.curriculumSessions) && common.curriculumSessions.length === 0) ||
    (Array.isArray(common.scheduleDetails) && common.scheduleDetails.length === 0)
  )
}

/** 구조 변경 시 Independent draft 의 비활성 nested 는 mapper 와 같이 [] 이다. */
export function independentAppliesExplicitStructureReset(
  aligned: Program,
  rhfPatch: Partial<Program>,
  nextStructure: 'curriculum' | 'schedule'
): boolean {
  if (nextStructure === 'schedule') {
    return nestedRowsEqual(aligned.generalCommonInfo?.curriculumSessions, [])
  }
  return nestedRowsEqual(
    aligned.generalCommonInfo?.scheduleDetails,
    rhfPatch.generalCommonInfo?.scheduleDetails ?? []
  )
}

/** 구조 미변경이면 제품 mapper 가 넣은 상대 [] 를 existing 으로 되돌린다. */
export function independentPreservesSiblingWhenStructureUnchanged(
  aligned: Program,
  existing: Program,
  nextStructure: 'curriculum' | 'schedule'
): boolean {
  if (nextStructure === 'schedule') {
    return nestedRowsEqual(
      aligned.generalCommonInfo?.curriculumSessions,
      existing.generalCommonInfo?.curriculumSessions
    )
  }
  return nestedRowsEqual(
    aligned.generalCommonInfo?.scheduleDetails,
    existing.generalCommonInfo?.scheduleDetails
  )
}
