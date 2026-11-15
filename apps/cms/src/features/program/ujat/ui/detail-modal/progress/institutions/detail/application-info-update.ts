/**
 * UJAT 교육 진행 · 참여 기관 상세 [정보 수정] → PATCH /api/admin/organization-applications/{id}
 * 상세 주소·담당 교사 Tel/M/이메일 중 바뀐 키만 보낸다. 담당 교사는 PATCH 계약상
 * teacherMemberId로만 바뀌므로(teacherName 저장 컬럼 없음) 기관 소속 교사를 고른 경우에만
 * teacherMemberId를 넣는다. 교사를 바꾸고 M/이메일을 따로 고치지 않으면 서버가 새 교사 회원 값으로 갱신한다.
 */
import type { OrganizationApplicationUpdateWire } from '@/features/program/general/api/applications-api-client'
import { buildOrganizationApplicationTeacherContactPatch } from '@/features/program/general/lib/organization-application-teacher-contact-patch'
import type { UjatInstitutionApplicationTeacherContact } from '../../../application-institution/detail/detail-types'

/** BE PATCH는 명시적 null을 「지움」으로 받는다(present 추적). generated 타입은 null을 빠뜨린다. */
export type UjatInstitutionInfoUpdateRequest = Omit<
  OrganizationApplicationUpdateWire,
  'organizationAddressDetail'
> & {
  organizationAddressDetail?: string | null
}

function toFormTeacherContact(contact: UjatInstitutionApplicationTeacherContact) {
  // 폼 teacherPhone = API teacherTel(일반전화), 폼 teacherMobile = API teacherPhone(휴대전화)
  return {
    teacherPhone: contact.tel,
    teacherMobile: contact.mobile,
    teacherEmail: contact.email,
  }
}

export function buildUjatInstitutionInfoUpdateRequest(input: {
  addressDetailDraft: string
  addressDetailBaseline: string
  teacherContactDraft: UjatInstitutionApplicationTeacherContact
  teacherContactBaseline: UjatInstitutionApplicationTeacherContact
  /** 소속 교사 선택으로 바뀐 담당 교사 회원 ID. 바뀌지 않았으면 생략 */
  teacherMemberId?: number
}): UjatInstitutionInfoUpdateRequest {
  const body: UjatInstitutionInfoUpdateRequest = {
    ...(input.teacherMemberId != null ? { teacherMemberId: input.teacherMemberId } : {}),
    ...buildOrganizationApplicationTeacherContactPatch(
      toFormTeacherContact(input.teacherContactDraft),
      toFormTeacherContact(input.teacherContactBaseline)
    ),
  }
  const nextAddress = input.addressDetailDraft.trim()
  const prevAddress = input.addressDetailBaseline.trim()
  if (nextAddress !== prevAddress) {
    body.organizationAddressDetail = nextAddress || null
  }
  return body
}

export function hasUjatInstitutionInfoUpdateFields(body: UjatInstitutionInfoUpdateRequest): boolean {
  return Object.keys(body).length > 0
}
