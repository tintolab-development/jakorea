/** OpenAPI `PageResponse.items` 미정의 — 런타임 수동 타입 */
export interface MemberListItemResponse {
  memberId?: number
  uuid?: string
  email?: string
  name?: string
  phone?: string
  role?: string
  roles?: string[]
  memberStatus?: string
  status?: string
  instructorStatus?: string
  organizationName?: string
  organizationText?: string
  loginEnabled?: boolean
  preRegistered?: boolean
  createdAt?: string
  updatedAt?: string
  external1365Id?: string
  [key: string]: unknown
}

export function isMemberListItemResponse(value: unknown): value is MemberListItemResponse {
  return value != null && typeof value === 'object'
}
