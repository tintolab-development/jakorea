import type {
  GeneralIndividualApplicantDetail,
  GeneralIndividualApplicantRow,
} from '@/features/program/general/model/individual-applicant'
import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'

/**
 * 참여자 상세 저장 응답의 detail 중 개인정보 필드.
 * 저장 응답은 원문 오버레이가 섞인 화면 행을 기준으로 병합되므로, 이 값들은 로컬 상태에 남기지 않는다.
 * (저장 API는 교재·팀 정보만 바꾸므로 이 필드들은 저장으로 변하지 않는다.)
 */
export const PARTICIPANT_DETAIL_PII_KEYS = [
  'gender',
  'birthDate',
  'contact',
  'email',
  'homeAddressFull',
  'id1365',
  'affiliationSchool',
] as const satisfies readonly (keyof GeneralIndividualApplicantDetail)[]

function withoutPii(detail: GeneralIndividualApplicantDetail | undefined) {
  if (!detail) return {}
  const next: GeneralIndividualApplicantDetail = { ...detail }
  for (const key of PARTICIPANT_DETAIL_PII_KEYS) delete next[key]
  return next
}

/**
 * 저장 성공 후 로컬 패치. 개인정보는 기존 마스킹 값(prev·목록 행)을 그대로 두고,
 * 저장으로 바뀐 비개인정보만 반영한다. 마스킹 재조회가 늦거나 실패해도 원문으로 되돌아가지 않는다.
 */
export function buildParticipantSavedPatch(
  prev: Partial<ParticipatingIndividualParticipantRow>,
  updatedRow: GeneralIndividualApplicantRow
): Partial<ParticipatingIndividualParticipantRow> {
  return {
    ...prev,
    adminComment: updatedRow.adminComment,
    textbookId: updatedRow.textbookId,
    textbookName: updatedRow.textbookName,
    textbookKits: updatedRow.textbookKits,
    textbookQuantity: updatedRow.textbookQuantity,
    textbookStatus: updatedRow.textbookStatus,
    detail: { ...prev.detail, ...withoutPii(updatedRow.detail) },
  }
}
