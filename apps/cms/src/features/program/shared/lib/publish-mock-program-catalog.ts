/**
 * CMS mock 세션 등록 프로그램을 Platform 공유 mock 카탈로그에 발행.
 * DEV + mock JWT 일 때만 — 실패해도 등록 UX는 유지.
 */

import type { Program } from '@/types/domain'
import { isMockAdminSession } from '@/entities/user/api/auth-service'

/** tools/mock-program-catalog/constants 와 동일 (browser bundle이 tools 를 끌어오지 않도록 인라인) */
const MOCK_PROGRAM_CATALOG_API_PATH = '/__dev__/mock-program-catalog'

function toIso(value: Program['startDate'] | undefined): string | undefined {
  if (value == null) return undefined
  if (typeof value === 'string') return value
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

/** Platform `CmsProgramLike` 호환 최소 페이로드 */
export function mapProgramToMockCatalogEntry(program: Program): Record<string, unknown> {
  const common = program.generalCommonInfo
  return {
    id: program.id,
    title: program.title,
    mainTitle: program.mainTitle,
    description: program.description,
    type: program.type,
    category: program.category,
    startDate: toIso(program.startDate),
    endDate: toIso(program.endDate),
    applicationStartDate: toIso(program.applicationStartDate),
    applicationEndDate: toIso(program.applicationEndDate),
    lifecycleStatus: program.lifecycleStatus,
    businessArea: program.businessArea,
    targetLevel: program.targetLevel,
    district: program.district,
    generalParticipantTypes: program.generalParticipantTypes,
    generalProgramAudience: program.generalProgramAudience,
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    generalProgramSessionRound: program.generalProgramSessionRound,
    applicationMethod: program.applicationMethod,
    recruitmentGuide: program.recruitmentGuide,
    otherNotes: program.otherNotes,
    attachmentFileNames: program.attachmentFileNames,
    registrationKind:
      program.id.startsWith('company-school-local-')
        ? 'economy'
        : program.id.startsWith('trained-teachers-local-')
          ? 'trainedTeachers'
          : 'general',
    generalCommonInfo: common
      ? {
          announcementTitle: common.announcementTitle,
          educationFormLabel: common.educationFormLabel,
          sponsorDisplayName: common.sponsorDisplayName,
          curriculumSessions: common.curriculumSessions,
          educationScheduleLines: common.educationScheduleLines,
        }
      : undefined,
    rounds: program.rounds?.map(round => ({
      id: round.id,
      roundNumber: round.roundNumber,
      startDate: toIso(round.startDate),
      endDate: toIso(round.endDate),
      curriculum: round.curriculum,
      deliveryType: round.deliveryType,
    })),
  }
}

/**
 * mock 로그인 세션에서 등록된 프로그램을 Platform mock 목록 연동용 카탈로그에 upsert.
 * remote 등록 경로에서는 호출하지 말 것.
 */
export async function publishRegisteredProgramToMockCatalog(
  program: Program
): Promise<void> {
  if (!import.meta.env.DEV) return
  if (!isMockAdminSession()) return
  if (!program?.id) return

  try {
    const response = await fetch(MOCK_PROGRAM_CATALOG_API_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ program: mapProgramToMockCatalogEntry(program) }),
    })
    if (!response.ok) {
      console.warn(
        '[mock-program-catalog] publish failed',
        response.status,
        await response.text().catch(() => '')
      )
    }
  } catch (error) {
    console.warn('[mock-program-catalog] publish error', error)
  }
}
