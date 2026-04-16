/**
 * 사용자 관리 API 서비스 (Mock)
 * Phase 5.1.2: 사용자 관리 페이지
 */

import type { AdminLevel, ProgramRole, User, UserRole } from '@/types/user'
import {
  getAdminPermissionVariant,
  type AdminPermissionTagVariant,
} from '@/features/user/shared/lib/admin-permission-display'
import { matchesUserInstitutionLocation } from '@/entities/user/lib/matches-institution-location'
import {
  matchesInstructorSettlementFilter,
  matchesInstructorTypeFilter,
} from '@/entities/user/lib/matches-instructor-list-filters'
import { resolveInstructorMemberProfile } from '@/entities/user/lib/resolve-instructor-member-profile'
import {
  canAssignUserProgramRoleForProgram,
  PROGRAM_PM_ROLE_LIMIT_MESSAGE,
} from '@/entities/program/lib/program-pm-role-policy'
import { mockUsers } from '@/data/mock/users'
import { mockUserHistories } from '@/data/mock/mypage'
import type { UUID } from '@/types/index'

/**
 * 사용자 목록 조회
 */
export async function getUsers(filters?: {
  role?: UserRole
  search?: string
  isActive?: boolean
  createdAtFrom?: string
  createdAtTo?: string
  institutionLocation?: string
  instructorType?: string
  settlementStatus?: string
  adminPermissionVariant?: AdminPermissionTagVariant
  /** 강사 회원 관리(`kind=instructors`) — 순수 강사만, 교사·교사 및 강사 제외 */
  instructorListPureOnly?: boolean
}): Promise<Omit<User, 'password'>[]> {
  await new Promise(resolve => setTimeout(resolve, 300))

  let users = [...mockUsers]

  // 권한 필터
  if (filters?.role) {
    users = users.filter(user => user.role === filters.role)
  }

  if (filters?.instructorListPureOnly) {
    users = users.filter(
      user =>
        user.role !== 'INSTRUCTOR' || resolveInstructorMemberProfile(user) === 'instructor_only'
    )
  }

  // 검색 필터 (이름, 이메일)
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase()
    users = users.filter(
      user =>
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
    )
  }

  // 활성화 상태 필터
  if (filters?.isActive !== undefined) {
    users = users.filter(user => user.isActive === filters.isActive)
  }

  // 가입일 필터
  if (filters?.createdAtFrom || filters?.createdAtTo) {
    users = users.filter(user => {
      const created = user.createdAt ? new Date(user.createdAt).toISOString().slice(0, 10) : ''
      if (filters.createdAtFrom && created < filters.createdAtFrom) return false
      if (filters.createdAtTo && created > filters.createdAtTo) return false
      return true
    })
  }

  if (filters?.institutionLocation?.trim()) {
    users = users.filter(user => matchesUserInstitutionLocation(user, filters.institutionLocation!))
  }

  if (filters?.instructorType?.trim()) {
    users = users.filter(user => matchesInstructorTypeFilter(user, filters.instructorType!))
  }

  if (filters?.settlementStatus?.trim()) {
    users = users.filter(user => matchesInstructorSettlementFilter(user, filters.settlementStatus!))
  }

  if (filters?.adminPermissionVariant) {
    const v = filters.adminPermissionVariant
    users = users.filter(
      user => user.role === 'ADMIN' && getAdminPermissionVariant(user) === v
    )
  }

  // 비밀번호 제외하고 반환, participationHistory 계산
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return users.map(({ password, ...user }) => {
    // 실제 참여이력 데이터에서 계산
    const userHistories = mockUserHistories.filter(
      h => h.userId === user.id && h.finalStatus !== 'CANCELLED'
    )
    return {
      ...user,
      participationHistory: userHistories.length,
    }
  })
}

export interface GetUsersPageParams {
  role?: UserRole
  search?: string
  isActive?: boolean
  createdAtFrom?: string
  createdAtTo?: string
  institutionLocation?: string
  instructorType?: string
  settlementStatus?: string
  adminPermissionVariant?: AdminPermissionTagVariant
  instructorListPureOnly?: boolean
}

export interface GetUsersPageResult {
  users: Omit<User, 'password'>[]
  total: number
  hasMore: boolean
}

const PAGE_SIZE = 15

/**
 * 사용자 목록 페이지 조회 (무한 스크롤용)
 * 필터 적용 후 offset/limit 슬라이스 반환
 */
export async function getUsersPage(
  filters: GetUsersPageParams | undefined,
  page: number
): Promise<GetUsersPageResult> {
  const all = await getUsers(filters)
  const offset = page * PAGE_SIZE
  const users = all.slice(offset, offset + PAGE_SIZE)
  return {
    users,
    total: all.length,
    hasMore: offset + users.length < all.length,
  }
}

/**
 * 사용자 상세 조회
 */
export type PatchUserBasicInfoInput = Partial<
  Pick<
    User,
    | 'name'
    | 'nameEn'
    | 'phone'
    | 'email'
    | 'detailAddress'
    | 'affiliation'
    | 'gender'
    | 'birthDate'
    | 'socialAccounts'
    | 'adminComment'
    | 'schoolInfo'
    | 'instructorInfo'
    | 'listMetrics'
  >
>

/** CMS: 관리자 등록 회원 등 기본 정보 일부 수정 (Mock — mockUsers 반영) */
export async function patchUserBasicInfo(
  userId: UUID,
  patch: PatchUserBasicInfoInput
): Promise<Omit<User, 'password'>> {
  await new Promise(resolve => setTimeout(resolve, 300))

  const userIndex = mockUsers.findIndex(u => u.id === userId)
  if (userIndex === -1) {
    throw new Error('사용자를 찾을 수 없습니다.')
  }

  const user = mockUsers[userIndex]
  if (patch.name !== undefined) user.name = patch.name
  if (patch.nameEn !== undefined) user.nameEn = patch.nameEn
  if (patch.phone !== undefined) user.phone = patch.phone
  if (patch.email !== undefined) user.email = patch.email
  if (patch.detailAddress !== undefined) user.detailAddress = patch.detailAddress
  if (patch.affiliation !== undefined) user.affiliation = patch.affiliation
  if (patch.gender !== undefined) user.gender = patch.gender
  if (patch.birthDate !== undefined) user.birthDate = patch.birthDate
  if (patch.socialAccounts !== undefined) user.socialAccounts = patch.socialAccounts
  if (Object.prototype.hasOwnProperty.call(patch, 'adminComment')) {
    user.adminComment = patch.adminComment
  }
  if (patch.schoolInfo != null && user.role === 'SCHOOL') {
    const base = user.schoolInfo ?? { schoolName: user.name, address: '' }
    const p = patch.schoolInfo
    user.schoolInfo = {
      ...base,
      ...(p.schoolName !== undefined ? { schoolName: p.schoolName } : {}),
      ...(p.address !== undefined ? { address: p.address } : {}),
      ...(p.position !== undefined ? { position: p.position } : {}),
      ...(p.affiliatedTeachers !== undefined ? { affiliatedTeachers: p.affiliatedTeachers } : {}),
    }
    if (p.schoolName !== undefined && String(p.schoolName).trim() !== '') {
      user.name = String(p.schoolName).trim()
    }
  }
  if (patch.instructorInfo != null && user.role === 'INSTRUCTOR') {
    const base = user.instructorInfo ?? {
      bankName: '',
      accountNumber: '',
      accountHolder: '',
      isBusinessIncome: false,
    }
    const p = patch.instructorInfo
    user.instructorInfo = {
      ...base,
      ...(p.bankName !== undefined ? { bankName: p.bankName } : {}),
      ...(p.accountNumber !== undefined ? { accountNumber: p.accountNumber } : {}),
      ...(p.accountHolder !== undefined ? { accountHolder: p.accountHolder } : {}),
      ...(p.isBusinessIncome !== undefined ? { isBusinessIncome: p.isBusinessIncome } : {}),
    }
  }
  if (patch.listMetrics != null) {
    const prev = user.listMetrics ?? {}
    user.listMetrics = {
      ...prev,
      ...Object.fromEntries(
        Object.entries(patch.listMetrics).filter(([, v]) => v !== undefined)
      ),
    }
  }
  user.updatedAt = new Date().toISOString()

  const refreshed = await getUserById(userId)
  if (!refreshed) {
    throw new Error('사용자를 찾을 수 없습니다.')
  }
  return refreshed
}

export async function getUserById(userId: UUID): Promise<Omit<User, 'password'> | null> {
  await new Promise(resolve => setTimeout(resolve, 200))

  const user = mockUsers.find(u => u.id === userId)
  if (!user) {
    return null
  }

  // 실제 참여이력 데이터에서 계산
  const userHistories = mockUserHistories.filter(
    h => h.userId === user.id && h.finalStatus !== 'CANCELLED'
  )

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user
  return {
    ...userWithoutPassword,
    participationHistory: userHistories.length,
  }
}

/**
 * 사용자 권한 변경
 */
export async function updateUserRole(
  userId: UUID,
  newRole: UserRole,
  adminLevel?: AdminLevel,
  programRole?: ProgramRole
): Promise<Omit<User, 'password'>> {
  await new Promise(resolve => setTimeout(resolve, 300))

  const userIndex = mockUsers.findIndex(u => u.id === userId)
  if (userIndex === -1) {
    throw new Error('사용자를 찾을 수 없습니다.')
  }

  const user = mockUsers[userIndex]
  user.role = newRole

  if (newRole === 'ADMIN') {
    const effectiveAdminLevel = adminLevel || user.adminLevel || 'ADMIN'
    const effectiveProgramRole = programRole || user.programRoles?.['program-1'] || 'ASSISTANT'

    user.adminLevel = effectiveAdminLevel
    user.programRoles = { 'program-1': effectiveProgramRole }
  } else {
    user.adminLevel = undefined
    user.programRoles = undefined
  }

  user.updatedAt = new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user
  return userWithoutPassword
}

/**
 * 사용자 활성화 상태 변경
 */
export async function updateUserStatus(
  userId: UUID,
  isActive: boolean
): Promise<Omit<User, 'password'>> {
  await new Promise(resolve => setTimeout(resolve, 300))

  const userIndex = mockUsers.findIndex(u => u.id === userId)
  if (userIndex === -1) {
    throw new Error('사용자를 찾을 수 없습니다.')
  }

  const user = mockUsers[userIndex]
  user.isActive = isActive
  user.updatedAt = new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user
  return userWithoutPassword
}

/**
 * 사용자 생성 (관리자용)
 */
export interface CreateUserRequest {
  email: string
  password: string
  name: string
  nameEn?: string
  phone?: string
  gender?: string
  birthDate?: string
  role: UserRole
  adminLevel?: AdminLevel
  programRole?: ProgramRole
  schoolInfo?: {
    schoolName: string
    address: string
    position?: string
  }
  instructorInfo?: {
    bankName: string
    accountNumber: string
    accountHolder: string
    isBusinessIncome: boolean
  }
  isActive?: boolean
}

export async function createUser(request: CreateUserRequest): Promise<Omit<User, 'password'>> {
  await new Promise(resolve => setTimeout(resolve, 300))

  // 이메일 중복 체크
  const existingUser = mockUsers.find(u => u.email === request.email)
  if (existingUser) {
    throw new Error('이미 사용 중인 이메일입니다.')
  }

  // UUID 생성
  function generateUUID(): string {
    return `user-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`
  }

  const now = new Date().toISOString()

  const newUser: User = {
    id: generateUUID(),
    email: request.email,
    password: request.password, // 실제로는 해시된 값이어야 함
    name: request.name,
    nameEn: request.nameEn,
    phone: request.phone,
    gender: request.gender,
    birthDate: request.birthDate,
    role: request.role,
    isActive: request.isActive ?? true,
    createdAt: now,
    updatedAt: now,
    /** CMS 관리자 회원 등록 플로우에서 생성 */
    registeredByAdmin: true,
  }

  // 관리자 권한 설정
  if (request.role === 'ADMIN') {
    newUser.adminLevel = request.adminLevel || 'ADMIN'
    newUser.programRoles = request.programRole
      ? { 'program-1': request.programRole }
      : { 'program-1': 'ASSISTANT' }
  }

  // 학교 정보 설정
  if (request.role === 'SCHOOL' && request.schoolInfo) {
    newUser.schoolInfo = request.schoolInfo
  }

  // 강사 정보 설정
  if (request.role === 'INSTRUCTOR' && request.instructorInfo) {
    newUser.instructorInfo = request.instructorInfo
  }

  // 최신 등록 사용자가 목록 첫 페이지에 보이도록 앞에 추가
  mockUsers.unshift(newUser)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = newUser
  return userWithoutPassword
}

/**
 * 사용자 프로그램 역할 업데이트
 * 프로그램 생성 시 자동으로 OWNER 권한 부여
 */
export async function updateUserProgramRole(
  userId: UUID,
  programId: string,
  programRole: ProgramRole
): Promise<Omit<User, 'password'>> {
  await new Promise(resolve => setTimeout(resolve, 200))

  const userIndex = mockUsers.findIndex(u => u.id === userId)
  if (userIndex === -1) {
    throw new Error('사용자를 찾을 수 없습니다.')
  }

  const user = mockUsers[userIndex]

  // 관리자가 아니면 프로그램 역할 설정 불가
  if (user.role !== 'ADMIN') {
    throw new Error('관리자만 프로그램 역할을 가질 수 있습니다.')
  }

  if (!canAssignUserProgramRoleForProgram(mockUsers, programId, userId, programRole)) {
    throw new Error(PROGRAM_PM_ROLE_LIMIT_MESSAGE)
  }

  // programRoles가 없으면 초기화
  if (!user.programRoles) {
    user.programRoles = {}
  }

  // 해당 프로그램에 역할 부여
  user.programRoles[programId] = programRole
  user.updatedAt = new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user
  return userWithoutPassword
}

/**
 * 사용자 삭제
 */
export async function deleteUser(userId: UUID): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 300))

  const userIndex = mockUsers.findIndex(u => u.id === userId)
  if (userIndex === -1) {
    throw new Error('사용자를 찾을 수 없습니다.')
  }

  mockUsers.splice(userIndex, 1)
}
