import type { CreateUserRequest } from '@/entities/user/api/user-service'
import type { AdminPreRegisterMemberRequest } from '@/shared/api/generated/members/schemas'

export function mapCreateUserRequestToPreRegister(
  request: CreateUserRequest
): AdminPreRegisterMemberRequest {
  const body: AdminPreRegisterMemberRequest = {
    name: request.name.trim(),
  }
  if (request.email?.trim()) body.email = request.email.trim()
  if (request.phone?.trim()) body.phone = request.phone.trim()
  if (request.gender?.trim()) body.gender = request.gender.trim()
  if (request.birthDate?.trim()) body.birthDate = request.birthDate.trim()
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
