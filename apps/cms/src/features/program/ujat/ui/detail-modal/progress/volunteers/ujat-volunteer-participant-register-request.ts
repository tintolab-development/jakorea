import type { VolunteerParticipantRegisterRequest } from '@/shared/api/generated/program-progress/schemas/volunteerParticipantRegisterRequest'
import { VolunteerParticipantRegisterRequestRecruitHalf } from '@/shared/api/generated/program-progress/schemas/volunteerParticipantRegisterRequestRecruitHalf'
import { VolunteerParticipantRegisterRequestVolunteerKind } from '@/shared/api/generated/program-progress/schemas/volunteerParticipantRegisterRequestVolunteerKind'
import type { UjatVolunteerRecruitHalf } from '@/features/program/ujat/ui/detail-modal/info/ujat-recruit-paragraph-props'
import { toUjatRecruitHalfApi } from '@/features/program/ujat/api/ujat-recruit-half'

const REGISTER_REASON = 'CMS UJAT 참여 봉사자 추가 등록'

/** UJAT CMS_PROGRESS_ADD 422 VOLUNTEER_1365_REQUIRED — 시안에 1365 단락이 없어 후보에서 안내 */
export const UJAT_PROGRESS_VOLUNTEER_1365_REQUIRED_MESSAGE =
  '이 회원은 1365 ID가 없어 추가 등록할 수 없습니다. 회원 프로필에 1365 ID를 등록한 뒤 다시 시도해 주세요.'

export function isUjatProgressVolunteerMissingId1365(
  hasRegisteredId1365: boolean | undefined
): boolean {
  return hasRegisteredId1365 === false
}

function omitBlankWireValue(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed || trimmed === '-') return undefined
  return trimmed
}

/** Figma 추가 등록 폼 body + UJAT 진행 탭 반기. 사용자 홈 전용 필드는 보내지 않는다. */
export function attachUjatProgressVolunteerRegisterContext(
  request: VolunteerParticipantRegisterRequest,
  volunteerHalf: UjatVolunteerRecruitHalf
): VolunteerParticipantRegisterRequest {
  const recruitHalf =
    toUjatRecruitHalfApi(volunteerHalf) === 'SECOND_HALF'
      ? VolunteerParticipantRegisterRequestRecruitHalf.SECOND_HALF
      : VolunteerParticipantRegisterRequestRecruitHalf.FIRST_HALF
  const {
    previousUjatTerm: _previousUjatTerm,
    educationRegionCode: _educationRegionCode,
    applicationType: _applicationType,
    id1365: _id1365,
    thirdPartyRecipient,
    ...rest
  } = request
  const recipient = omitBlankWireValue(thirdPartyRecipient)
  return {
    ...rest,
    volunteerKind: VolunteerParticipantRegisterRequestVolunteerKind.GENERAL,
    reason: REGISTER_REASON,
    recruitHalf,
    ...(recipient ? { thirdPartyRecipient: recipient } : {}),
  }
}
