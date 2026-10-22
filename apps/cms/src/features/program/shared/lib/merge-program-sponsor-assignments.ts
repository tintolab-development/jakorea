import type { Program } from '@/types/domain'
import type { AdminProgramSponsorAssignmentDto } from '@/features/program/general/api/programs-api-client'
import { encodeSponsorManagerContactRef } from '@/features/program/general/model/common-info-edit-schema'
import {
  SPONSOR_CONTACT_UNSELECTED_LABEL,
  SPONSOR_CONTACT_UNSELECTED_VALUE,
} from '@/features/program/shared/lib/sponsor-contact-unselected-option'


const SPONSOR_COMMON_INFO_KEYS = [
  'sponsorManagementIds',
  'sponsorManagementId',
  'sponsorManagerContactIds',
  'sponsorManagerContactId',
  'sponsorManagerLine',
  'sponsorManagerContactNames',
  'sponsorDisplayName',
] as const

/** PATCH에 후원사·담당자 관련 키가 있을 때만 `sponsors[]`를 실어 full replace 한다. */
export function patchTouchesProgramSponsors(patch: Partial<Program>): boolean {
  if (Object.prototype.hasOwnProperty.call(patch, 'sponsorId')) return true
  if (!Object.prototype.hasOwnProperty.call(patch, 'generalCommonInfo')) return false
  const common = patch.generalCommonInfo
  if (common == null || typeof common !== 'object') return false
  return SPONSOR_COMMON_INFO_KEYS.some(key => Object.prototype.hasOwnProperty.call(common, key))
}

/**
 * GET `/api/admin/programs/{id}/sponsors` 배정을 Program 후원·담당자 필드로 병합.
 * `assignments` 빈 배열 = 서버 SSOT 해제(전체 clear). fetch 실패 시에는 호출측에서 merge를 건너뛴다.
 *
 * BE handoff 2026-09-29: contact 없으면 managerName null / 「미선택」, stale nested로 primary를 되살리지 않음.
 */
export function mergeProgramSponsorAssignments(
  program: Program,
  assignments: readonly AdminProgramSponsorAssignmentDto[]
): Program {
  const valid = assignments.filter(
    row => row.sponsorId != null && String(row.sponsorId).trim() !== ''
  )
  if (valid.length === 0) {
    // top-level sponsorId 는 Program 타입상 필수. 런타임 clear 후 unknown 단언.
    return {
      ...program,
      sponsorId: undefined,
      managerName: undefined,
      generalCommonInfo: {
        ...program.generalCommonInfo,
        sponsorManagementIds: [],
        sponsorManagementId: undefined,
        sponsorManagerContactIds: [],
        sponsorManagerContactId: undefined,
        sponsorManagerContactNames: {},
        sponsorManagerLine: undefined,
      },
    } as unknown as Program
  }

  const sponsorManagementIds = [
    ...new Set(valid.map(row => String(row.sponsorId).trim())),
  ]
  const sponsorManagerContactIds: string[] = []
  const sponsorManagerContactNames: Record<string, string> = {}
  for (const row of valid) {
    const sponsorId = String(row.sponsorId).trim()
    const nestedContacts =
      row.sponsorContacts?.map(contact => ({
        id: contact.sponsorContactId != null ? String(contact.sponsorContactId).trim() : '',
        name: contact.sponsorContactName?.trim() ?? '',
      })) ?? []
    const contacts =
      nestedContacts.length > 0
        ? nestedContacts
        : [
            {
              id: row.sponsorContactId != null ? String(row.sponsorContactId).trim() : '',
              name: row.sponsorContactName?.trim() ?? '',
            },
          ]
    for (const contact of contacts) {
      if (!contact.id) continue
      const ref = encodeSponsorManagerContactRef(sponsorId, contact.id)
      if (!sponsorManagerContactIds.includes(ref)) sponsorManagerContactIds.push(ref)
      if (contact.name) sponsorManagerContactNames[ref] = contact.name
    }
  }
  const hasContact = sponsorManagerContactIds.length > 0
  const managerName = hasContact
    ? Object.values(sponsorManagerContactNames)[0]
    : SPONSOR_CONTACT_UNSELECTED_LABEL

  return {
    ...program,
    sponsorId: sponsorManagementIds[0] ?? program.sponsorId,
    managerName,
    generalCommonInfo: {
      ...program.generalCommonInfo,
      sponsorManagementIds,
      sponsorManagementId: sponsorManagementIds[0],
      sponsorManagerContactIds: hasContact
        ? sponsorManagerContactIds
        : [SPONSOR_CONTACT_UNSELECTED_VALUE],
      sponsorManagerContactId: hasContact
        ? sponsorManagerContactIds[0]
        : SPONSOR_CONTACT_UNSELECTED_VALUE,
      sponsorManagerContactNames: hasContact ? sponsorManagerContactNames : {},
      sponsorManagerLine: hasContact ? undefined : SPONSOR_CONTACT_UNSELECTED_LABEL,
    },
  }
}

/** GET /sponsors 성공 시에만 merge. 실패면 원본(빈 배열 clear 오인 방지). */
export async function withFetchedProgramSponsorAssignments(
  program: Program,
  programId: string,
  fetchSponsors: (id: string) => Promise<AdminProgramSponsorAssignmentDto[]>
): Promise<Program> {
  try {
    const assignments = await fetchSponsors(programId)
    return mergeProgramSponsorAssignments(program, assignments)
  } catch {
    return program
  }
}
