/**
 * 회원 상세 — 기본 정보 (DetailInfoForm.Field + DetailInfoForm.NameBlock)
 */

import { type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import {
  ADMIN_PERMISSION_TAG_LABEL,
  getAdminPermissionVariant,
} from '@/features/user/shared/lib/admin-permission-display'
import type { DateValue } from '@/types'
import type { User, UserRole } from '@/types/user'
import { formatDate } from '@/shared/utils'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { resolveInstructorMemberProfile } from '@/entities/user/lib/resolve-instructor-member-profile'
import { managedProgramCountDisplay } from '../lib/user-detail-fullpage-helpers'
import './user-basic-info-section.css'
import '@/features/user/shared/ui/admin-permission-tag.css'
import { CmsButton, CmsInput, CmsSelect } from '@/shared/ui'
import { getFormInputsWidth } from '@/shared/lib/form-inputs-width'
import type { AdminProvisionedMemberBasicInfoDraft } from '@/features/user/detail/lib/admin-provisioned-member-basic-info-draft'

const GENDER_EDIT_OPTIONS = [
  { value: '남성', label: '남성' },
  { value: '여성', label: '여성' },
]

/** 개인 회원 소속 학년 선택 (시안·프로그램 신청 탭 `GRADE_OPTIONS`와 동일 체계) */
const INDIVIDUAL_AFFILIATION_GRADE_OPTIONS: { value: string; label: string }[] = [
  { value: '1학년', label: '1학년' },
  { value: '2학년', label: '2학년' },
  { value: '3학년', label: '3학년' },
  { value: '4학년', label: '4학년' },
  { value: '5학년', label: '5학년' },
  { value: '6학년', label: '6학년' },
]

const INDIVIDUAL_AFFILIATION_FIELDS_WIDTH = getFormInputsWidth({ inputCount: 2 })

function individualAffiliationGradeSelectOptions(currentGrade: string | undefined) {
  const g = currentGrade?.trim()
  const opts = [...INDIVIDUAL_AFFILIATION_GRADE_OPTIONS]
  if (g && !opts.some(o => o.value === g)) opts.unshift({ value: g, label: g })
  return opts
}

export type UserBasicInfoEntrySource = 'all_users' | 'institution' | 'instructor' | 'admin'

export const USER_BASIC_INFO_ENTRY_QUERY_KEY = 'userDetailEntry' as const

const VALID_ENTRY_SOURCES: readonly UserBasicInfoEntrySource[] = [
  'all_users',
  'institution',
  'instructor',
  'admin',
] as const

export function parseUserBasicInfoEntryQuery(
  value: string | null
): UserBasicInfoEntrySource | undefined {
  if (!value) return undefined
  return VALID_ENTRY_SOURCES.includes(value as UserBasicInfoEntrySource)
    ? (value as UserBasicInfoEntrySource)
    : undefined
}

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
  fullLabel?: string
  onOpen?: () => void
}

export interface UserBasicInfoSectionProps {
  user: Omit<User, 'password'>
  entrySource?: UserBasicInfoEntrySource
  caption?: ReactNode
  scheduleChangeCount?: number
  externalId1365?: UserBasicInfoExternalId1365 | null
  personalInfoRevealed?: boolean
  /** 관리자 등록 회원 등 — 상세 폼 인라인 수정 */
  memberInfoEditing?: boolean
  memberInfoDraft?: AdminProvisionedMemberBasicInfoDraft | null
  onMemberInfoDraftChange?: (partial: Partial<AdminProvisionedMemberBasicInfoDraft>) => void
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

function affiliationAndGradeLine(user: Omit<User, 'password'>): string {
  const school = user.affiliatedSchoolName?.trim()
  const grade = user.listMetrics?.instructorAssignedGrade?.trim()
  if (school && grade) return `${school} | ${grade}`
  if (school) return school
  return affiliationLine(user)
}

function highestEducationLine(user: Omit<User, 'password'>): string {
  const t = user.listMetrics?.highestEducationLabel?.trim()
  return t && t.length > 0 ? t : '-'
}

/** 소속 및 강사 경력 — API 요약 우선, 없으면 학교(학년)·강사 유형·경력 연수·JA 등급 조합 */
function affiliationAndInstructorCareerLine(user: Omit<User, 'password'>): string {
  const summary = user.listMetrics?.instructorCareerSummaryLabel?.trim()
  if (summary) return summary

  const school = user.affiliatedSchoolName?.trim()
  const grade = user.listMetrics?.instructorAssignedGrade?.trim()
  const schoolPart = school && grade ? `${school}(${grade})` : school || affiliationLine(user)
  const typeLabel = user.listMetrics?.instructorTypeLabel?.trim()
  const years = user.listMetrics?.instructorCareerYearsLabel?.trim()
  const ja = user.listMetrics?.jaEvaluationGrade?.trim()
  const jaPart = ja ? `${ja}등급` : ''
  const tail = [typeLabel, years, jaPart].filter(Boolean).join(' | ')

  if (schoolPart && schoolPart !== '-' && tail) return `${schoolPart}, ${tail}`
  if (tail) return tail
  if (schoolPart && schoolPart !== '-') return schoolPart
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

/** 비공개 시 앞쪽 시·군·구(공백 기준 앞 2토큰)는 그대로, 나머지는 blur (별표 마스킹 미사용) */
function detailAddressView(user: Omit<User, 'password'>, revealed: boolean): ReactNode {
  const raw = addressLine(user)
  if (raw === '-' || revealed) return raw
  const parts = raw.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '-'
  if (parts.length === 1) {
    const [one] = parts
    const cut = Math.min(4, Math.ceil(one.length / 2))
    const head = one.slice(0, cut)
    const tail = one.slice(cut)
    return (
      <span className="user-basic-info-section__address-privacy">
        <span>{head}</span>
        {tail ? (
          <span className="user-basic-info-section__address-privacy__blur" aria-hidden>
            {tail}
          </span>
        ) : null}
      </span>
    )
  }
  const head = parts.slice(0, 2).join(' ')
  const tail = parts.slice(2).join(' ')
  return (
    <span className="user-basic-info-section__address-privacy">
      <span>{head}</span>
      {tail ? (
        <span className="user-basic-info-section__address-privacy__blur" aria-hidden>
          {' '}
          {tail}
        </span>
      ) : null}
    </span>
  )
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

function institutionTimesLabel(n: number | undefined): string {
  return n != null && !Number.isNaN(n) ? `${n}회` : '-'
}

const ID1365_NOT_REGISTERED_LABEL = '등록되지 않음'

function resolve1365DisplayText(
  personalInfoRevealed: boolean,
  externalId1365?: UserBasicInfoExternalId1365 | null
): string {
  if (!externalId1365) return ID1365_NOT_REGISTERED_LABEL
  if (personalInfoRevealed) {
    const full = externalId1365.fullLabel?.trim()
    if (full) return full
    return ID1365_NOT_REGISTERED_LABEL
  }
  const masked = externalId1365.maskedLabel?.trim()
  if (!masked || masked === '-') return ID1365_NOT_REGISTERED_LABEL
  return masked
}

function Id1365View({
  personalInfoRevealed,
  externalId1365,
}: {
  personalInfoRevealed: boolean
  externalId1365?: UserBasicInfoExternalId1365 | null
}) {
  const label1365 = resolve1365DisplayText(personalInfoRevealed, externalId1365)

  return (
    <span className="user-basic-info-section__id1365-cell">
      <span>{label1365}</span>
      <DetailInfoForm.InputsSeparator />
      {externalId1365?.onOpen ? (
        <CmsButton size="medium" onClick={externalId1365.onOpen}>
          1365 바로가기
        </CmsButton>
      ) : null}
    </span>
  )
}

function AllUsersFields({
  user,
  scheduleChangeCount,
  externalId1365,
  personalInfoRevealed,
  memberInfoEditing,
  memberInfoDraft,
  onMemberInfoDraftChange,
}: {
  user: Omit<User, 'password'>
  scheduleChangeCount?: number
  externalId1365?: UserBasicInfoExternalId1365 | null
  personalInfoRevealed: boolean
  memberInfoEditing?: boolean
  memberInfoDraft?: AdminProvisionedMemberBasicInfoDraft | null
  onMemberInfoDraftChange?: (partial: Partial<AdminProvisionedMemberBasicInfoDraft>) => void
}) {
  const editing = Boolean(memberInfoEditing && memberInfoDraft && onMemberInfoDraftChange)
  const d = memberInfoDraft

  return (
    <>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.NameBlock
          rows={[
            {
              subLabel: '한글',
              main: editing ? (
                <span className="user-basic-info-section__name-with-badge">
                  <CmsInput
                    value={d!.name}
                    onChange={e => onMemberInfoDraftChange!({ name: e.target.value })}
                    inputSize="medium"
                    width="100%"
                    aria-label="한글 성명"
                  />
                  {scheduleChangeCount != null && scheduleChangeCount > 0 ? (
                    <ScheduleChangeHistoryBadge count={scheduleChangeCount} />
                  ) : null}
                </span>
              ) : (
                <span className="user-basic-info-section__name-with-badge">
                  {user.name}
                  {scheduleChangeCount != null && scheduleChangeCount > 0 ? (
                    <ScheduleChangeHistoryBadge count={scheduleChangeCount} />
                  ) : null}
                </span>
              ),
              sideLabel: '1365 ID',
              side: (
                <Id1365View
                  personalInfoRevealed={personalInfoRevealed}
                  externalId1365={externalId1365}
                />
              ),
            },
            {
              subLabel: '영문',
              main: editing ? (
                <CmsInput
                  value={d!.nameEn}
                  onChange={e => onMemberInfoDraftChange!({ nameEn: e.target.value })}
                  inputSize="medium"
                  width="100%"
                  placeholder="영문 성명"
                />
              ) : (
                <span>{user.nameEn ?? '-'}</span>
              ),
              sideLabel: '성별 및 생년월일',
              side: editing ? (
                <span className="user-basic-info-section__inline-controls">
                  <CmsSelect
                    value={d!.gender || undefined}
                    onChange={v => onMemberInfoDraftChange!({ gender: v != null ? String(v) : '' })}
                    options={GENDER_EDIT_OPTIONS}
                    placeholder="성별"
                    inputSize="medium"
                    width={120}
                    allowClear
                  />
                  <CmsInput
                    value={d!.birthDate}
                    onChange={e => onMemberInfoDraftChange!({ birthDate: e.target.value })}
                    inputSize="medium"
                    width={160}
                    placeholder="YYYY-MM-DD"
                    aria-label="생년월일"
                  />
                </span>
              ) : (
                <span>{formatGenderBirthLine(user)}</span>
              ),
            },
          ]}
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="연락처"
          view={<span>{detailPhoneDisplay(user, personalInfoRevealed)}</span>}
          edit={
            <CmsInput
              value={d?.phone ?? ''}
              onChange={e => onMemberInfoDraftChange?.({ phone: e.target.value })}
              inputSize="medium"
              width="100%"
            />
          }
        />
        <DetailInfoForm.Field
          label="이메일"
          view={<span>{detailEmailDisplay(user, personalInfoRevealed)}</span>}
          edit={
            <CmsInput
              value={d?.email ?? ''}
              onChange={e => onMemberInfoDraftChange?.({ email: e.target.value })}
              inputSize="medium"
              width="100%"
            />
          }
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="자택 주소"
          view={<span>{detailAddressView(user, personalInfoRevealed)}</span>}
          edit={
            <CmsInput
              value={d?.detailAddress ?? ''}
              onChange={e => onMemberInfoDraftChange?.({ detailAddress: e.target.value })}
              inputSize="medium"
              width="100%"
            />
          }
        />
        <DetailInfoForm.Field
          label="소속"
          view={<span>{affiliationLine(user)}</span>}
          edit={
            <span className="detail-info-form-inputs-wrapper-no-gap">
              <CmsInput
                placeholder="학교명"
                value={d?.affiliationInstitution ?? ''}
                onChange={e =>
                  onMemberInfoDraftChange?.({ affiliationInstitution: e.target.value })
                }
                inputSize="medium"
                width={INDIVIDUAL_AFFILIATION_FIELDS_WIDTH}
                aria-label="소속 기관(학교명)"
              />
              <DetailInfoForm.InputsSeparator />
              <CmsSelect
                placeholder="학년"
                value={d?.affiliationGrade || undefined}
                onChange={v =>
                  onMemberInfoDraftChange?.({
                    affiliationGrade: v != null ? String(v) : '',
                  })
                }
                options={individualAffiliationGradeSelectOptions(d?.affiliationGrade)}
                inputSize="medium"
                width={INDIVIDUAL_AFFILIATION_FIELDS_WIDTH}
                allowClear
                aria-label="소속 학년"
              />
            </span>
          }
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field label="가입일" view={<span>{formatDate(user.createdAt)}</span>} />
        <DetailInfoForm.Field label="연동된 소셜 계정" view={<span>{socialLine(user)}</span>} />
      </DetailInfoForm.Row>
    </>
  )
}

function InstitutionFields({ user }: { user: Omit<User, 'password'> }) {
  const schoolName = user.schoolInfo?.schoolName ?? '-'
  const schoolAddress = user.schoolInfo?.address ?? '-'
  const applicationCount = institutionTimesLabel(
    user.listMetrics?.institutionProgramApplicationCount
  )
  const attendanceCount = institutionTimesLabel(user.listMetrics?.institutionProgramAttendanceCount)

  return (
    <>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field label="기관명" view={<span>{schoolName}</span>} />
        <DetailInfoForm.Field label="기관 소재지" view={<span>{schoolAddress}</span>} />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field label="프로그램 신청 횟수" view={<span>{applicationCount}</span>} />
        <DetailInfoForm.Field label="프로그램 수강 횟수" view={<span>{attendanceCount}</span>} />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field label="등록일" view={<span>{formatDate(user.createdAt)}</span>} />
      </DetailInfoForm.Row>
    </>
  )
}

function instructorFeeView(user: Omit<User, 'password'>) {
  const feeLabel = user.listMetrics?.instructorTypeLabel?.trim() || '특강 강사비'
  const feeAmount = '915,000원'
  return (
    <span className="basic-info-fee">
      <span>{feeLabel}</span>
      <span className="basic-info-fee__sep" aria-hidden>
        {' | '}
      </span>
      <span>{feeAmount}</span>
    </span>
  )
}

function instructorBusinessIncomeView(user: Omit<User, 'password'>) {
  const businessIncome =
    user.instructorInfo?.isBusinessIncome === true
      ? '해당'
      : user.instructorInfo?.isBusinessIncome === false
        ? '해당 없음'
        : '-'
  return <span>{businessIncome}</span>
}

function settlementStatusView(user: Omit<User, 'password'>) {
  const s = user.listMetrics?.settlementStatusLabel?.trim()
  return <span className="user-basic-info-section__text-blue">{s && s.length > 0 ? s : '-'}</span>
}

function SchoolTeacherFields({
  user,
  scheduleChangeCount,
  personalInfoRevealed,
}: {
  user: Omit<User, 'password'>
  scheduleChangeCount?: number
  personalInfoRevealed: boolean
}) {
  const employment = user.listMetrics?.employmentStatusLabel?.trim() || '-'
  return (
    <>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.NameBlock
          showGroupTitle={false}
          rows={[
            {
              subLabel: '성명(한글)',
              main: (
                <span className="user-basic-info-section__name-with-badge">
                  {user.name}
                  {scheduleChangeCount != null && scheduleChangeCount > 0 ? (
                    <ScheduleChangeHistoryBadge count={scheduleChangeCount} />
                  ) : null}
                </span>
              ),
              sideLabel: '재직 현황',
              side: <span>{employment}</span>,
            },
            {
              subLabel: '성명(영문)',
              main: <span>{user.nameEn ?? '-'}</span>,
              sideLabel: '성별 및 생년월일',
              side: <span>{formatGenderBirthLine(user)}</span>,
            },
          ]}
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="연락처"
          view={<span>{detailPhoneDisplay(user, personalInfoRevealed)}</span>}
        />
        <DetailInfoForm.Field
          label="이메일"
          view={<span>{detailEmailDisplay(user, personalInfoRevealed)}</span>}
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="자택 주소"
          view={<span>{detailAddressView(user, personalInfoRevealed)}</span>}
        />
        <DetailInfoForm.Field
          label="소속 및 담당 학년"
          view={<span>{affiliationAndGradeLine(user)}</span>}
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field label="가입일" view={<span>{formatDate(user.createdAt)}</span>} />
        <DetailInfoForm.Field label="연동된 소셜 계정" view={<span>{socialLine(user)}</span>} />
      </DetailInfoForm.Row>
    </>
  )
}

/** 겸직 강사·순수 강사 공통 — 기본 정보 6행 + 강의비는 별도 폼 */
function InstructorDualOrOnlyBasicFields({
  user,
  scheduleChangeCount,
  personalInfoRevealed,
}: {
  user: Omit<User, 'password'>
  scheduleChangeCount?: number
  personalInfoRevealed: boolean
}) {
  return (
    <>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.NameBlock
          showGroupTitle={false}
          rows={[
            {
              subLabel: '성명(한글)',
              main: (
                <span className="user-basic-info-section__name-with-badge">
                  {user.name}
                  {scheduleChangeCount != null && scheduleChangeCount > 0 ? (
                    <ScheduleChangeHistoryBadge count={scheduleChangeCount} />
                  ) : null}
                </span>
              ),
              sideLabel: '정산 현황',
              side: settlementStatusView(user),
            },
            {
              subLabel: '성명(영문)',
              main: <span>{user.nameEn ?? '-'}</span>,
              sideLabel: '성별 및 생년월일',
              side: <span>{formatGenderBirthLine(user)}</span>,
            },
          ]}
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="연락처"
          view={<span>{detailPhoneDisplay(user, personalInfoRevealed)}</span>}
        />
        <DetailInfoForm.Field
          label="이메일"
          view={<span>{detailEmailDisplay(user, personalInfoRevealed)}</span>}
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="자택 주소"
          view={<span>{detailAddressView(user, personalInfoRevealed)}</span>}
        />
        <DetailInfoForm.Field
          label="정산 계좌 정보"
          view={<span>{instructorBankLine(user, personalInfoRevealed)}</span>}
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field label="최종 학력" view={<span>{highestEducationLine(user)}</span>} />
        <DetailInfoForm.Field
          label="소속 및 강사 경력"
          view={<span>{affiliationAndInstructorCareerLine(user)}</span>}
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field label="가입일" view={<span>{formatDate(user.createdAt)}</span>} />
        <DetailInfoForm.Field label="연동된 소셜 계정" view={<span>{socialLine(user)}</span>} />
      </DetailInfoForm.Row>
    </>
  )
}

/** 강의비·사업소득 — 기본 정보와 분리(상단 16px 간격) */
function InstructorFeeDetailForm({ user }: { user: Omit<User, 'password'> }) {
  return (
    <DetailInfoForm
      title="강의비·사업소득"
      className="user-basic-info-section user-basic-info-section--instructor-fee-form"
    >
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field label="강의비 책정 기준" view={instructorFeeView(user)} />
        <DetailInfoForm.Field label="사업소득자 여부" view={instructorBusinessIncomeView(user)} />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}

function InstructorFieldsByProfile({
  user,
  scheduleChangeCount,
  personalInfoRevealed,
}: {
  user: Omit<User, 'password'>
  scheduleChangeCount?: number
  personalInfoRevealed: boolean
}) {
  const profile = resolveInstructorMemberProfile(user) ?? 'instructor_only'
  if (profile === 'school_teacher') {
    return (
      <SchoolTeacherFields
        user={user}
        scheduleChangeCount={scheduleChangeCount}
        personalInfoRevealed={personalInfoRevealed}
      />
    )
  }
  return (
    <InstructorDualOrOnlyBasicFields
      user={user}
      scheduleChangeCount={scheduleChangeCount}
      personalInfoRevealed={personalInfoRevealed}
    />
  )
}

function AdminFields({
  user,
  personalInfoRevealed,
}: {
  user: Omit<User, 'password'>
  personalInfoRevealed: boolean
}) {
  const permVariant = getAdminPermissionVariant(user)

  return (
    <>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.NameBlock
          className="user-basic-info-section__admin-name-block"
          rows={[
            {
              subLabel: '한글',
              main: <span>{user.name}</span>,
              sideLabel: '권한 유형',
              side: (
                <span
                  className={`user-list-admin-perm-tag user-list-admin-perm-tag--${permVariant}`}
                >
                  {ADMIN_PERMISSION_TAG_LABEL[permVariant]}
                </span>
              ),
            },
            {
              subLabel: '영문',
              main: <span>{user.nameEn ?? '-'}</span>,
              sideLabel: '담당 프로그램 수',
              side: <span>{managedProgramCountDisplay(user)}</span>,
            },
          ]}
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="연락처"
          view={<span>{detailPhoneDisplay(user, personalInfoRevealed)}</span>}
        />
        <DetailInfoForm.Field
          label="이메일"
          view={<span>{detailEmailDisplay(user, personalInfoRevealed)}</span>}
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="자택 주소"
          view={<span>{detailAddressView(user, personalInfoRevealed)}</span>}
        />
        <DetailInfoForm.Field
          label="소속 및 담당 학년"
          view={<span>{affiliationLine(user)}</span>}
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field label="가입일" view={<span>{formatDate(user.createdAt)}</span>} />
        <DetailInfoForm.Field label="연동된 소셜 계정" view={<span>{socialLine(user)}</span>} />
      </DetailInfoForm.Row>
    </>
  )
}

export function UserBasicInfoSection({
  user,
  entrySource: entrySourceProp,
  caption,
  scheduleChangeCount,
  externalId1365,
  personalInfoRevealed = false,
  memberInfoEditing = false,
  memberInfoDraft,
  onMemberInfoDraftChange,
}: UserBasicInfoSectionProps) {
  const [searchParams] = useSearchParams()
  const entryFromQuery = parseUserBasicInfoEntryQuery(
    searchParams.get(USER_BASIC_INFO_ENTRY_QUERY_KEY)
  )
  const bodyKey = resolveUserBasicInfoBodyKey(entrySourceProp, entryFromQuery, user.role)
  const instructorProfileForFee =
    bodyKey === 'instructor' && user.role === 'INSTRUCTOR'
      ? (resolveInstructorMemberProfile(user) ?? 'instructor_only')
      : null
  const showInstructorFeeForm =
    instructorProfileForFee === 'instructor_dual' || instructorProfileForFee === 'instructor_only'

  return (
    <div className="user-detail-modal__basic-inner">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
        <DetailInfoForm
          title="기본 정보"
          description={caption}
          className="user-basic-info-section"
          mode={memberInfoEditing ? 'edit' : 'view'}
        >
          {bodyKey === 'all_users' ? (
            <AllUsersFields
              user={user}
              scheduleChangeCount={scheduleChangeCount}
              externalId1365={externalId1365}
              personalInfoRevealed={personalInfoRevealed}
              memberInfoEditing={memberInfoEditing}
              memberInfoDraft={memberInfoDraft}
              onMemberInfoDraftChange={onMemberInfoDraftChange}
            />
          ) : bodyKey === 'institution' ? (
            <InstitutionFields user={user} />
          ) : bodyKey === 'instructor' ? (
            <InstructorFieldsByProfile
              user={user}
              scheduleChangeCount={scheduleChangeCount}
              personalInfoRevealed={personalInfoRevealed}
            />
          ) : (
            <AdminFields user={user} personalInfoRevealed={personalInfoRevealed} />
          )}
        </DetailInfoForm>
        {showInstructorFeeForm ? <InstructorFeeDetailForm user={user} /> : null}
      </div>
    </div>
  )
}
