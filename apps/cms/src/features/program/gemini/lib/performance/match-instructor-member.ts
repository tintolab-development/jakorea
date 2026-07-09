import { getUsers } from '@/entities/user/api/user-service'

function normalizePhone(raw: string | undefined): string {
  if (!raw) return ''
  return raw.replace(/\D/g, '')
}

/** 강사명 + 연락처 기준 회원 매핑 */
export async function matchInstructorMemberId(
  instructorName: string,
  contact: string
): Promise<string | undefined> {
  const name = instructorName.trim()
  const phone = normalizePhone(contact)
  if (!name || !phone) return undefined

  const users = await getUsers({ role: 'INSTRUCTOR', instructorListPureOnly: true })
  const matched = users.find(
    user => user.name.trim() === name && normalizePhone(user.phone) === phone
  )
  return matched?.id
}
