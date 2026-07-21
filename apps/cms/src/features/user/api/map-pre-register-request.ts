import type { CreateUserRequest } from '@/entities/user/api/user-service'
import type { AdminPreRegisterMemberRequest } from '@/shared/api/generated/members/schemas'
import { toApiBirthDate, toApiGender } from '@/features/user/api/map-member-gender-birth'

export function mapCreateUserRequestToPreRegister(
  request: CreateUserRequest
): AdminPreRegisterMemberRequest {
  const body: AdminPreRegisterMemberRequest = {
    name: request.name.trim(),
  }
  if (request.email?.trim()) body.email = request.email.trim()
  if (request.phone?.trim()) body.phone = request.phone.trim()

  const gender = toApiGender(request.gender)
  if (gender) body.gender = gender

  const birthDate = toApiBirthDate(request.birthDate)
  if (birthDate) body.birthDate = birthDate

  if (request.id1365?.trim()) body.external1365Id = request.id1365.trim()
  if (request.affiliation?.trim()) body.organizationText = request.affiliation.trim()

  if (request.role === 'SCHOOL' && request.schoolInfo?.schoolName?.trim()) {
    body.organizationText = request.schoolInfo.schoolName.trim()
    body.name = request.schoolInfo.schoolName.trim()
  }

  if (request.role === 'INSTRUCTOR' && request.instructorInfo) {
    body.oneLineIntro = request.instructorInfo.accountHolder?.trim() || undefined
  }

  return body
}
