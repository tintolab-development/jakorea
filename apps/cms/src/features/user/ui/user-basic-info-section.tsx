/**
 * 회원 상세 — 기본 정보 (개인·학교 / 강사 / 관리자 공통 테이블)
 */

import { useId, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppButton } from '@/shared/ui/app-button'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import {
  ADMIN_PERMISSION_TAG_LABEL,
  getAdminPermissionVariant,
} from '@/features/user/lib/admin-permission-display'
import type { DateValue } from '@/types'
import type { User, UserRole } from '@/types/user'
import { formatDate } from '@/shared/utils'
import './user-detail-section-head.css'
import './user-basic-info-section.css'
import './admin-permission-tag.css'

/** 기본 정보 테이블 본문 분기 (전체 회원 / 학교·교사 / 강사 / 관리자) */
export type UserBasicInfoEntrySource = 'all_users' | 'institution' | 'instructor' | 'admin'

/** URL 쿼리로 진입 맥락 전달 시 사용 (`?userDetailEntry=all_users` 등) */
export const USER_BASIC_INFO_ENTRY_QUERY_KEY = 'userDetailEntry' as const

const VALID_ENTRY_SOURCES: readonly UserBasicInfoEntrySource[] = [
  'all_users',
  'institution',
  'instructor',
  'admin',
] as const

function parseEntryQuery(value: string | null): UserBasicInfoEntrySource | undefined {
  if (!value) return undefined
  return VALID_ENTRY_SOURCES.includes(value as UserBasicInfoEntrySource)
    ? (value as UserBasicInfoEntrySource)
    : undefined
}

/**
 * props → URL 쿼리 → 역할 순으로 본문 키 결정.
 * - 전체 회원 목록: `entrySource="all_users"` 또는 쿼리 `userDetailEntry=all_users`
 * - 학교(교사) 회원: `entrySource="institution"` 또는 `userDetailEntry=institution`
 */
export function resolveUserBasicInfoBodyKey(
  entrySourceProp: UserBasicInfoEntrySource | undefined,
  entryFromQuery: UserBasicInfoEntrySource | undefined,
  role: UserRole
): UserBasicInfoEntrySource {
  if (entrySourceProp) return entrySourceProp
  if (entryFromQuery) return entryFromQuery
  if (role === 'INSTRUCTOR') return 'instructor'
  if (role === 'ADMIN') return 'admin'
  return 'all_users'
}

export interface UserBasicInfoExternalId1365 {
  maskedLabel: string
  /** 개인정보 상세보기(마스킹 해제) 시 표시할 전체 ID — 없으면 `maskedLabel`만 사용 */
  fullLabel?: string
  onOpen?: () => void
}

export interface UserBasicInfoSectionProps {
  user: Omit<User, 'password'>
  /**
   * 기본 정보 테이블 분기 — 미지정 시 URL `userDetailEntry` 또는 회원 역할로 도출
   * (`resolveUserBasicInfoBodyKey` 참고)
   */
  entrySource?: UserBasicInfoEntrySource
  /** 섹션 상단 회색 안내 (예: *관리자에 의해 등록된 회원입니다) */
  caption?: ReactNode
  /** 일정 변경&취소 이력 — 1 이상이면 한글 성명 옆 배지 */
  scheduleChangeCount?: number
  /** 1365 ID 마스킹 + 바로가기 */
  externalId1365?: UserBasicInfoExternalId1365 | null
  /**
   * true면 연락처·이메일·주소·계좌 등 원문 표시 (개인정보 상세보기 클릭 후)
   * @default false
   */
  personalInfoRevealed?: boolean
}

function ageFromBirthDate(birthDate: DateValue | undefined): number | null {
  if (!birthDate) return null
  const t = new Date(birthDate).getTime()
  if (Number.isNaN(t)) return null
  return Math.floor((Date.now() - t) / (365.25 * 24 * 60 * 60 * 1000))
}

function formatGenderBirthLine(user: Omit<User, 'password'>): string {
  const gender = user.gender ?? '-'
  if (!user.birthDate) return `${gender} | -`
  const d = formatDate(user.birthDate)
  const age = ageFromBirthDate(user.birthDate)
  const agePart = age != null ? ` (만 ${age}세)` : ''
  return `${gender} | ${d}${agePart}`
}

function affiliationLine(user: Omit<User, 'password'>): string {
  if (user.affiliation) return user.affiliation
  if (user.schoolInfo) {
    const { schoolName, position } = user.schoolInfo
    return position ? `${schoolName} | ${position}` : schoolName
  }
  return '-'
}

function addressLine(user: Omit<User, 'password'>): string {
  return user.schoolInfo?.address ?? user.detailAddress ?? '-'
}

function socialLine(user: Omit<User, 'password'>): string {
  return user.socialAccounts?.length ? user.socialAccounts.join(' | ') : '-'
}

function detailPhoneDisplay(user: Omit<User, 'password'>, revealed: boolean): string {
  const t = user.phone?.trim()
  if (!t) return '-'
  if (revealed) return user.phone ?? '-'
  return MASKING_POLICY.phone(t)
}

function detailEmailDisplay(user: Omit<User, 'password'>, revealed: boolean): string {
  const t = user.email?.trim()
  if (!t) return '-'
  if (revealed) return t
  return MASKING_POLICY.email(t)
}

function detailAddressDisplay(user: Omit<User, 'password'>, revealed: boolean): string {
  const raw = addressLine(user)
  if (raw === '-' || revealed) return raw
  return MASKING_POLICY.address(raw)
}

function instructorBankLine(user: Omit<User, 'password'>, revealed: boolean): string {
  const info = user.instructorInfo
  if (!info) return '-'
  const rawNum = info.accountNumber ?? ''
  const rawHolder = info.accountHolder ?? ''
  const bank = info.bankName ?? ''
  if (revealed) {
    const left = `${bank} ${rawNum}`.trim()
    const holder = rawHolder ? ` | ${rawHolder}` : ''
    return left || holder ? `${left}${holder}` : '-'
  }
  const maskedNum = rawNum ? MASKING_POLICY.accountNumber(rawNum) : ''
  const maskedHolder = rawHolder ? MASKING_POLICY.accountHolderName(rawHolder) : ''
  const left = `${bank} ${maskedNum}`.trim()
  const holder = maskedHolder ? ` | ${maskedHolder}` : ''
  return left || holder ? `${left}${holder}` : '-'
}

function ColGroup() {
  return (
    <colgroup>
      <col className="user-detail-modal__basic-table-col-label-left" />
      <col className="user-detail-modal__basic-table-col-name-sub" />
      <col className="user-detail-modal__basic-table-col-input-left" />
      <col className="user-detail-modal__basic-table-col-label-right" />
      <col className="user-detail-modal__basic-table-col-input-right" />
    </colgroup>
  )
}

function AllUsersBody({
  user,
  scheduleChangeCount,
  externalId1365,
  personalInfoRevealed,
}: {
  user: Omit<User, 'password'>
  scheduleChangeCount?: number
  externalId1365?: UserBasicInfoExternalId1365 | null
  personalInfoRevealed: boolean
}) {
  return (
    <tbody>
      <tr>
        <td
          rowSpan={2}
          className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--name"
        >
          <span className="user-detail-modal__basic-table-label">성명</span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--name-sub">
          <span className="user-detail-modal__basic-table-label">한글</span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input user-detail-modal__basic-table-cell--before-divider">
          <span className="user-basic-info-section__name-with-badge">
            {user.name}
            {scheduleChangeCount != null && scheduleChangeCount > 0 ? (
              <ScheduleChangeHistoryBadge count={scheduleChangeCount} />
            ) : null}
          </span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--label-right user-detail-modal__basic-table-cell--divider-left">
          <span className="user-detail-modal__basic-table-label">1365 ID</span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input">
          <span className="user-basic-info-section__id1365-cell">
            <span>
              {personalInfoRevealed && externalId1365?.fullLabel
                ? externalId1365.fullLabel
                : (externalId1365?.maskedLabel ?? '-')}
            </span>
            {externalId1365?.onOpen ? (
              <AppButton variant="primary" size="small" onClick={externalId1365.onOpen}>
                1365 바로가기
              </AppButton>
            ) : null}
          </span>
        </td>
      </tr>
      <tr>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--name-sub">
          <span className="user-detail-modal__basic-table-label">영문</span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input user-detail-modal__basic-table-cell--before-divider user-detail-modal__name-eng">
          {user.nameEn ?? '-'}
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--label-right user-detail-modal__basic-table-cell--divider-left">
          <span className="user-detail-modal__basic-table-label">성별 및 생년월일</span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input">
          {formatGenderBirthLine(user)}
        </td>
      </tr>
      <tr>
        <td
          colSpan={2}
          className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--row-label"
        >
          <span className="user-detail-modal__basic-table-label">연락처</span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input user-detail-modal__basic-table-cell--before-divider">
          {detailPhoneDisplay(user, personalInfoRevealed)}
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--label-right user-detail-modal__basic-table-cell--divider-left">
          <span className="user-detail-modal__basic-table-label">이메일</span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input">
          {detailEmailDisplay(user, personalInfoRevealed)}
        </td>
      </tr>
      <tr>
        <td
          colSpan={2}
          className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--row-label"
        >
          <span className="user-detail-modal__basic-table-label">자택 주소</span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input user-detail-modal__basic-table-cell--before-divider">
          {detailAddressDisplay(user, personalInfoRevealed)}
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--label-right user-detail-modal__basic-table-cell--divider-left">
          <span className="user-detail-modal__basic-table-label">소속</span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input">
          {affiliationLine(user)}
        </td>
      </tr>
      <tr>
        <td
          colSpan={2}
          className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--row-label"
        >
          <span className="user-detail-modal__basic-table-label">가입일</span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input user-detail-modal__basic-table-cell--before-divider">
          {formatDate(user.createdAt)}
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--label-right user-detail-modal__basic-table-cell--divider-left">
          <span className="user-detail-modal__basic-table-label">연동된 소셜 계정</span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input">
          {socialLine(user)}
        </td>
      </tr>
    </tbody>
  )
}

/** 학교(교사) 회원 전용 — 필드는 추후 API·시안에 맞춰 확장 */
function InstitutionBody({ user }: { user: Omit<User, 'password'> }) {
  const schoolName = user.schoolInfo?.schoolName ?? '-'
  return (
    <tbody>
      <tr>
        <td
          colSpan={2}
          className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--row-label"
        >
          <span className="user-detail-modal__basic-table-label">학교명</span>
        </td>
        <td
          colSpan={3}
          className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input"
        >
          {schoolName}
        </td>
      </tr>
      <tr>
        <td
          colSpan={5}
          className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input"
        >
          학교(교사) 회원 전용 필드는 추후 추가 예정입니다.
        </td>
      </tr>
    </tbody>
  )
}

function InstructorBody({
  user,
  scheduleChangeCount,
  externalId1365,
  personalInfoRevealed,
}: {
  user: Omit<User, 'password'>
  scheduleChangeCount?: number
  externalId1365?: UserBasicInfoExternalId1365 | null
  personalInfoRevealed: boolean
}) {
  const settlement = '-' // TODO: API — 정산 현황
  const education = '-' // TODO: API — 최종 학력
  const career = '-' // TODO: API — 소속 및 강사 경력
  const feeLabel = '특강 강사비' // placeholder
  const feeAmount = '915,000원' // placeholder
  const businessIncome =
    user.instructorInfo?.isBusinessIncome === true
      ? '해당'
      : user.instructorInfo?.isBusinessIncome === false
        ? '해당 없음'
        : '-'

  return (
    <tbody>
      <tr>
        <td
          rowSpan={2}
          className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--name"
        >
          <span className="user-detail-modal__basic-table-label">성명</span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--name-sub">
          <span className="user-detail-modal__basic-table-label">한글</span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input user-detail-modal__basic-table-cell--before-divider">
          <span className="user-basic-info-section__name-with-badge">
            {user.name}
            {scheduleChangeCount != null && scheduleChangeCount > 0 ? (
              <ScheduleChangeHistoryBadge count={scheduleChangeCount} />
            ) : null}
          </span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--label-right user-detail-modal__basic-table-cell--divider-left">
          <span className="user-detail-modal__basic-table-label">정산 현황</span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input user-basic-info-section__text-mint">
          {settlement}
        </td>
      </tr>
      <tr>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--name-sub">
          <span className="user-detail-modal__basic-table-label">영문</span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input user-detail-modal__basic-table-cell--before-divider user-detail-modal__name-eng">
          {user.nameEn ?? '-'}
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--label-right user-detail-modal__basic-table-cell--divider-left">
          <span className="user-detail-modal__basic-table-label">1365 ID</span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input">
          <span className="user-basic-info-section__id1365-cell">
            <span>
              {personalInfoRevealed && externalId1365?.fullLabel
                ? externalId1365.fullLabel
                : (externalId1365?.maskedLabel ?? '-')}
            </span>
            {externalId1365?.onOpen ? (
              <AppButton variant="primary" size="small" onClick={externalId1365.onOpen}>
                1365 바로가기
              </AppButton>
            ) : null}
          </span>
        </td>
      </tr>
      <tr>
        <td
          colSpan={2}
          className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--row-label"
        >
          <span className="user-detail-modal__basic-table-label">연락처</span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input user-detail-modal__basic-table-cell--before-divider">
          {detailPhoneDisplay(user, personalInfoRevealed)}
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--label-right user-detail-modal__basic-table-cell--divider-left">
          <span className="user-detail-modal__basic-table-label">성별 및 생년월일</span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input">
          {formatGenderBirthLine(user)}
        </td>
      </tr>
      <tr>
        <td
          colSpan={2}
          className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--row-label"
        >
          <span className="user-detail-modal__basic-table-label">자택 주소</span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input user-detail-modal__basic-table-cell--before-divider">
          {detailAddressDisplay(user, personalInfoRevealed)}
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--label-right user-detail-modal__basic-table-cell--divider-left">
          <span className="user-detail-modal__basic-table-label">이메일</span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input">
          {detailEmailDisplay(user, personalInfoRevealed)}
        </td>
      </tr>
      <tr>
        <td
          colSpan={2}
          className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--row-label"
        >
          <span className="user-detail-modal__basic-table-label">최종 학력</span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input user-detail-modal__basic-table-cell--before-divider">
          {education}
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--label-right user-detail-modal__basic-table-cell--divider-left">
          <span className="user-detail-modal__basic-table-label">정산 계좌 정보</span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input">
          {instructorBankLine(user, personalInfoRevealed)}
        </td>
      </tr>
      <tr>
        <td
          colSpan={2}
          className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--row-label"
        >
          <span className="user-detail-modal__basic-table-label">가입일</span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input user-detail-modal__basic-table-cell--before-divider">
          {formatDate(user.createdAt)}
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--label-right user-detail-modal__basic-table-cell--divider-left">
          <span className="user-detail-modal__basic-table-label">소속 및 강사 경력</span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input">
          {career}
        </td>
      </tr>
      <tr>
        <td
          colSpan={2}
          className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--row-label"
        >
          <span className="user-detail-modal__basic-table-label">연동된 소셜 계정</span>
        </td>
        <td
          colSpan={3}
          className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input"
        >
          {socialLine(user)}
        </td>
      </tr>
      <tr>
        <td
          colSpan={2}
          className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--row-label"
        >
          <span className="user-detail-modal__basic-table-label">강의비 책정 기준</span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--name-sub">
          <span className="user-detail-modal__basic-table-label">{feeLabel}</span>
        </td>
        <td
          colSpan={2}
          className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input"
        >
          {feeAmount}
        </td>
      </tr>
      <tr>
        <td
          colSpan={2}
          className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--row-label"
        >
          <span className="user-detail-modal__basic-table-label">사업소득자 여부</span>
        </td>
        <td
          colSpan={3}
          className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input"
        >
          {businessIncome}
        </td>
      </tr>
    </tbody>
  )
}

function AdminBody({
  user,
  personalInfoRevealed,
}: {
  user: Omit<User, 'password'>
  personalInfoRevealed: boolean
}) {
  const permVariant = getAdminPermissionVariant(user)

  return (
    <tbody>
      <tr>
        <td
          rowSpan={2}
          className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--name"
        >
          <span className="user-detail-modal__basic-table-label">성명</span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--name-sub">
          <span className="user-detail-modal__basic-table-label">한글</span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input user-detail-modal__basic-table-cell--before-divider">
          {user.name}
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--label-right user-detail-modal__basic-table-cell--divider-left">
          <span className="user-detail-modal__basic-table-label">권한 유형</span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input">
          <span className={`user-list-admin-perm-tag user-list-admin-perm-tag--${permVariant}`}>
            {ADMIN_PERMISSION_TAG_LABEL[permVariant]}
          </span>
        </td>
      </tr>
      <tr>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--name-sub">
          <span className="user-detail-modal__basic-table-label">영문</span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input user-detail-modal__basic-table-cell--before-divider">
          {user.nameEn ?? '-'}
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--label-right user-detail-modal__basic-table-cell--divider-left">
          <span className="user-detail-modal__basic-table-label">성별 및 생년월일</span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input">
          {formatGenderBirthLine(user)}
        </td>
      </tr>
      <tr>
        <td
          colSpan={2}
          className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--row-label"
        >
          <span className="user-detail-modal__basic-table-label">연락처</span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input user-detail-modal__basic-table-cell--before-divider">
          {detailPhoneDisplay(user, personalInfoRevealed)}
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--label-right user-detail-modal__basic-table-cell--divider-left">
          <span className="user-detail-modal__basic-table-label">이메일</span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input">
          {detailEmailDisplay(user, personalInfoRevealed)}
        </td>
      </tr>
      <tr>
        <td
          colSpan={2}
          className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--row-label"
        >
          <span className="user-detail-modal__basic-table-label">가입일</span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input user-detail-modal__basic-table-cell--before-divider">
          {formatDate(user.createdAt)}
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--label-right user-detail-modal__basic-table-cell--divider-left">
          <span className="user-detail-modal__basic-table-label">연동된 소셜 계정</span>
        </td>
        <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input">
          {socialLine(user)}
        </td>
      </tr>
    </tbody>
  )
}

export function UserBasicInfoSection({
  user,
  entrySource: entrySourceProp,
  caption,
  scheduleChangeCount,
  externalId1365,
  personalInfoRevealed = false,
}: UserBasicInfoSectionProps) {
  const [searchParams] = useSearchParams()
  const entryFromQuery = parseEntryQuery(searchParams.get(USER_BASIC_INFO_ENTRY_QUERY_KEY))
  const bodyKey = resolveUserBasicInfoBodyKey(entrySourceProp, entryFromQuery, user.role)
  const titleId = useId()

  return (
    <section className="user-basic-info-section" aria-labelledby={titleId}>
      <div className="user-detail-section__head">
        <div id={titleId} className="user-detail-section__title">
          기본 정보
        </div>
        {caption ? <p className="user-detail-section__caption">{caption}</p> : null}
      </div>
      <div className="user-detail-modal__basic-inner">
        <div className="user-detail-modal__basic-table-wrap">
          <table className="user-detail-modal__basic-table">
            <ColGroup />
            {bodyKey === 'all_users' ? (
              <AllUsersBody
                user={user}
                scheduleChangeCount={scheduleChangeCount}
                externalId1365={externalId1365}
                personalInfoRevealed={personalInfoRevealed}
              />
            ) : bodyKey === 'institution' ? (
              <InstitutionBody user={user} />
            ) : bodyKey === 'instructor' ? (
              <InstructorBody
                user={user}
                scheduleChangeCount={scheduleChangeCount}
                externalId1365={externalId1365}
                personalInfoRevealed={personalInfoRevealed}
              />
            ) : (
              <AdminBody user={user} personalInfoRevealed={personalInfoRevealed} />
            )}
          </table>
        </div>
      </div>
    </section>
  )
}
