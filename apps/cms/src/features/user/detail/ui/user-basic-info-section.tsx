/**
 * 회원 상세 — 기본 정보 (DetailInfoForm.Field + DetailInfoForm.NameBlock)
 */

import { useState, type ReactNode } from 'react'
import { Space } from 'antd'
import { useSearchParams } from 'react-router-dom'
import { AppStatusBadge } from '@/shared/components'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_160_CLASSNAME,
} from '@/shared/components/status-dropdown-cell'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import {
  ADMIN_PERMISSION_TAG_LABEL,
  type AdminPermissionTagVariant,
  getAdminPermissionVariant,
} from '@/features/user/shared/lib/admin-permission-display'
import type { DateValue } from '@/types'
import type { User, UserRole } from '@/types/user'
import { formatDate } from '@/shared/utils'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { resolveInstructorMemberProfile } from '@/entities/user/lib/resolve-instructor-member-profile'
import { ManagedProgramCountDisplay } from '../lib/user-detail-fullpage-helpers'
import {
  resolveBasicInfoLayout,
  type BasicInfoBodyKey,
} from './user-basic-info-layout-resolver'
import { BasicInfoLayoutRenderer } from './user-basic-info-layout-renderer'
import type { BasicInfoSectionRenderContext } from './user-basic-info-section-renderer'
import './user-basic-info-section.css'
import '@/features/user/shared/ui/admin-permission-tag.css'
import { AddressSearch, CmsButton, CmsInput, CmsSelect } from '@/shared/ui'
import { getFormInputsWidth } from '@/shared/lib/form-inputs-width'
import type { AdminProvisionedMemberBasicInfoDraft } from '@/features/user/detail/lib/admin-provisioned-member-basic-info-draft'
import { shouldShowCmsMemberInfoEditButton } from '@/features/user/shared/lib/admin-provisioned-member-policy'
import { INSTRUCTOR_FEE_GRADE_OPTIONS } from '@/data/mock/program-wage-info'

const GENDER_EDIT_OPTIONS = [
  { value: '남성', label: '남성' },
  { value: '여성', label: '여성' },
]

const JA_EVALUATION_GRADE_OPTIONS = ['A', 'B', 'C', 'D'].map(v => ({ value: v, label: v }))

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
  /** 관리자(ADMIN) 상세 — 뷰 모드에서 권한 유형만 즉시 저장 */
  adminPermissionVariantPatching?: boolean
  onPatchAdminPermissionVariantFromDetailView?: (
    nextPermission: AdminPermissionTagVariant
  ) => void | Promise<void>
  /**
   * 관리자 회원 상세 — [정보 수정] 중 성명·연락처·이메일 편집 허용 여부(마스터+관리자 등록일 때만 true).
   */
  adminMemberProfileFieldsEditableWhenEditing?: boolean
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

/** 소속 및 강사 경력 — API 요약 우선, 없으면 학교(학년)·강사 유형·경력 연수 조합 */
function affiliationAndInstructorCareerLine(user: Omit<User, 'password'>): string {
  const summary = user.listMetrics?.instructorCareerSummaryLabel?.trim()
  if (summary) return summary

  const school = user.affiliatedSchoolName?.trim()
  const grade = user.listMetrics?.instructorAssignedGrade?.trim()
  const schoolPart = school && grade ? `${school}(${grade})` : school || affiliationLine(user)
  const typeLabel = user.listMetrics?.instructorTypeLabel?.trim()
  const years = user.listMetrics?.instructorCareerYearsLabel?.trim()
  const tail = [typeLabel, years].filter(Boolean).join(' | ')

  if (schoolPart && schoolPart !== '-' && tail) return `${schoolPart}, ${tail}`
  if (tail) return tail
  if (schoolPart && schoolPart !== '-') return schoolPart
  return '-'
}

function jaEvaluationGradeLine(user: Omit<User, 'password'>): string {
  const grade = user.listMetrics?.jaEvaluationGrade?.trim()
  if (!grade) return '-'
  return grade.endsWith('등급') ? grade : `${grade}등급`
}

function instructorFeeGradeLine(user: Omit<User, 'password'>): string {
  const grade = user.listMetrics?.instructorTypeLabel?.trim()
  return grade && grade.length > 0 ? grade : '-'
}

function oneLineIntroLine(user: Omit<User, 'password'>): string {
  const bio = user.bio?.trim()
  return bio && bio.length > 0 ? bio : '-'
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

/** 일반 교사 기본 정보 — 재직 현황 배지 톤 (소속 교사 목록과 유사) */
function schoolTeacherEmploymentBadgeModifier(label: string): 'active' | 'muted' {
  const t = label.trim()
  if (!t || t === '-') return 'muted'
  if (/휴직|전근|탈퇴/.test(t)) return 'muted'
  if (/재직/.test(t)) return 'active'
  return 'muted'
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

function AddressSearchDetailInputs({
  searchValue,
  onSearchChange,
  detailValue,
  onDetailChange,
  searchWidth,
  detailWidth,
  detailAriaLabel,
}: {
  searchValue: string
  onSearchChange: (next: string) => void
  detailValue: string
  onDetailChange: (next: string) => void
  searchWidth: string | number
  detailWidth: string | number
  detailAriaLabel: string
}) {
  return (
    <>
      <AddressSearch
        value={searchValue}
        onChange={onSearchChange}
        placeholder="건물명, 도로명 또는 지번"
        inputSize="medium"
        width={searchWidth}
      />
      <DetailInfoForm.InputsSeparator />
      <CmsInput
        placeholder="상세 주소"
        value={detailValue}
        onChange={e => onDetailChange(e.target.value)}
        inputSize="medium"
        width={detailWidth}
        aria-label={detailAriaLabel}
      />
    </>
  )
}

function ContactInfoFieldsRow({
  user,
  personalInfoRevealed,
  readOnlyDisplay,
  phoneValue,
  emailValue,
  onPhoneChange,
  onEmailChange,
  phonePlaceholder,
  emailPlaceholder,
}: {
  user: Omit<User, 'password'>
  personalInfoRevealed: boolean
  readOnlyDisplay?: boolean
  phoneValue: string
  emailValue: string
  onPhoneChange: (next: string) => void
  onEmailChange: (next: string) => void
  phonePlaceholder?: string
  emailPlaceholder?: string
}) {
  return (
    <DetailInfoForm.Row type="double">
      <DetailInfoForm.Field
        label="연락처"
        readOnlyDisplay={readOnlyDisplay}
        view={<span>{detailPhoneDisplay(user, personalInfoRevealed)}</span>}
        edit={
          <CmsInput
            value={phoneValue}
            onChange={e => onPhoneChange(e.target.value)}
            inputSize="medium"
            width="100%"
            placeholder={phonePlaceholder}
          />
        }
      />
      <DetailInfoForm.Field
        label="이메일"
        readOnlyDisplay={readOnlyDisplay}
        view={<span>{detailEmailDisplay(user, personalInfoRevealed)}</span>}
        edit={
          <CmsInput
            value={emailValue}
            onChange={e => onEmailChange(e.target.value)}
            inputSize="medium"
            width="100%"
            placeholder={emailPlaceholder}
          />
        }
      />
    </DetailInfoForm.Row>
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
  cmsMayEditBasicProfileFields,
}: {
  user: Omit<User, 'password'>
  scheduleChangeCount?: number
  externalId1365?: UserBasicInfoExternalId1365 | null
  personalInfoRevealed: boolean
  memberInfoEditing?: boolean
  memberInfoDraft?: AdminProvisionedMemberBasicInfoDraft | null
  onMemberInfoDraftChange?: (partial: Partial<AdminProvisionedMemberBasicInfoDraft>) => void
  /** 관리자 등록(직접 가입 미완료)일 때만 기본정보 필드 편집 가능 */
  cmsMayEditBasicProfileFields: boolean
}) {
  const sessionEditing = Boolean(memberInfoEditing && memberInfoDraft && onMemberInfoDraftChange)
  const basicEditing = sessionEditing && cmsMayEditBasicProfileFields
  const d = memberInfoDraft

  return (
    <>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.NameBlock
          rows={[
            {
              subLabel: '한글',
              main: basicEditing ? (
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
              main: basicEditing ? (
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
              side: basicEditing ? (
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
      <ContactInfoFieldsRow
        user={user}
        personalInfoRevealed={personalInfoRevealed}
        readOnlyDisplay={sessionEditing && !cmsMayEditBasicProfileFields}
        phoneValue={d?.phone ?? ''}
        emailValue={d?.email ?? ''}
        onPhoneChange={next => onMemberInfoDraftChange?.({ phone: next })}
        onEmailChange={next => onMemberInfoDraftChange?.({ email: next })}
      />
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="자택 주소"
          readOnlyDisplay={sessionEditing && !cmsMayEditBasicProfileFields}
          view={<span>{detailAddressView(user, personalInfoRevealed)}</span>}
          edit={
            <Space.Compact style={{ width: '100%' }}>
              <AddressSearchDetailInputs
                searchValue={d?.detailAddressSearch ?? ''}
                onSearchChange={next => onMemberInfoDraftChange?.({ detailAddressSearch: next })}
                detailValue={d?.detailAddressDetail ?? ''}
                onDetailChange={next => onMemberInfoDraftChange?.({ detailAddressDetail: next })}
                searchWidth="100%"
                detailWidth="100%"
                detailAriaLabel="자택 주소 상세"
              />
            </Space.Compact>
          }
        />
        <DetailInfoForm.Field
          label="소속"
          readOnlyDisplay={sessionEditing && !cmsMayEditBasicProfileFields}
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
      <CreatedAtAndSocialRow user={user} />
    </>
  )
}

function InstitutionFields({
  user,
  memberInfoDraft,
  onMemberInfoDraftChange,
  memberInfoEditing,
  cmsMayEditBasicProfileFields,
}: {
  user: Omit<User, 'password'>
  memberInfoDraft?: AdminProvisionedMemberBasicInfoDraft | null
  onMemberInfoDraftChange?: (partial: Partial<AdminProvisionedMemberBasicInfoDraft>) => void
  memberInfoEditing?: boolean
  cmsMayEditBasicProfileFields: boolean
}) {
  const d = memberInfoDraft
  const sessionEditing = Boolean(memberInfoEditing && memberInfoDraft && onMemberInfoDraftChange)
  const lockInstitutionBasics = sessionEditing && !cmsMayEditBasicProfileFields
  const schoolName = user.schoolInfo?.schoolName ?? '-'
  const schoolAddress = user.schoolInfo?.address ?? '-'
  const applicationCount = institutionTimesLabel(
    user.listMetrics?.institutionProgramApplicationCount
  )
  const attendanceCount = institutionTimesLabel(user.listMetrics?.institutionProgramAttendanceCount)

  return (
    <>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="기관명"
          readOnlyDisplay={lockInstitutionBasics}
          view={<span>{schoolName}</span>}
          edit={
            <CmsInput
              value={d?.schoolName ?? ''}
              onChange={e => onMemberInfoDraftChange?.({ schoolName: e.target.value })}
              inputSize="medium"
              width="100%"
              aria-label="기관명"
            />
          }
        />
        <DetailInfoForm.Field
          label="기관 소재지"
          readOnlyDisplay={lockInstitutionBasics}
          view={<span>{schoolAddress}</span>}
          edit={
            <Space.Compact style={{ width: '100%' }}>
              <AddressSearchDetailInputs
                searchValue={d?.institutionAddressSearch ?? ''}
                onSearchChange={next =>
                  onMemberInfoDraftChange?.({
                    institutionAddressSearch: next,
                  })
                }
                detailValue={d?.institutionAddressDetail ?? ''}
                onDetailChange={next =>
                  onMemberInfoDraftChange?.({
                    institutionAddressDetail: next,
                  })
                }
                searchWidth="100%"
                detailWidth="100%"
                detailAriaLabel="기관 소재지 상세"
              />
            </Space.Compact>
          }
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="프로그램 신청 횟수"
          readOnlyDisplay
          view={<span>{applicationCount}</span>}
        />
        <DetailInfoForm.Field
          label="프로그램 수강 횟수"
          readOnlyDisplay
          view={<span>{attendanceCount}</span>}
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="등록일"
          readOnlyDisplay
          view={<span>{formatDate(user.createdAt)}</span>}
        />
      </DetailInfoForm.Row>
    </>
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

function settlementStatusTextClass(statusLabel?: string) {
  const normalized = statusLabel?.trim()
  switch (normalized) {
    case '확인 대기 중':
      return 'user-basic-info-section__settlement-status user-basic-info-section__settlement-status--awaiting-confirmation'
    case '일부 확인 완료':
      return 'user-basic-info-section__settlement-status user-basic-info-section__settlement-status--partially-confirmed'
    case '지급조서 확인 완료':
      return 'user-basic-info-section__settlement-status user-basic-info-section__settlement-status--payment-statement-verified'
    case '계좌 지급 완료':
      return 'user-basic-info-section__settlement-status user-basic-info-section__settlement-status--account-paid'
    case '해당 없음':
      return 'user-basic-info-section__settlement-status user-basic-info-section__settlement-status--none'
    case '신청 반려':
      return 'user-basic-info-section__settlement-status user-basic-info-section__settlement-status--application-rejected'
    case '지급 정정 요청':
      return 'user-basic-info-section__settlement-status user-basic-info-section__settlement-status--payment-correction-requested'
    default:
      return 'user-basic-info-section__settlement-status'
  }
}

function settlementStatusView(user: Omit<User, 'password'>) {
  const s = user.listMetrics?.settlementStatusLabel?.trim()
  return <span className={settlementStatusTextClass(s)}>{s && s.length > 0 ? s : '-'}</span>
}

function CreatedAtAndSocialRow({ user }: { user: Omit<User, 'password'> }) {
  return (
    <DetailInfoForm.Row type="double">
      <DetailInfoForm.Field
        label="가입일"
        readOnlyDisplay
        view={<span>{formatDate(user.createdAt)}</span>}
      />
      <DetailInfoForm.Field
        label="연동된 소셜 계정"
        readOnlyDisplay
        view={<span>{socialLine(user)}</span>}
      />
    </DetailInfoForm.Row>
  )
}

/** 일반 교사 — 가입일·소셜만 (상단 별도 카드 `DetailInfoForm` 본문용) */
function SchoolTeacherMetaFields({ user }: { user: Omit<User, 'password'> }) {
  return <CreatedAtAndSocialRow user={user} />
}

/** 강사(겸직/순수) — 가입일·소셜만 (상단 별도 카드 `DetailInfoForm` 본문용) */
function InstructorMetaFields({ user }: { user: Omit<User, 'password'> }) {
  return <CreatedAtAndSocialRow user={user} />
}

/** 일반 교사 — 성명 블록 이하 (하단 별도 카드 `DetailInfoForm` 본문용) */
function SchoolTeacherProfileFields({
  user,
  scheduleChangeCount,
  personalInfoRevealed,
}: {
  user: Omit<User, 'password'>
  scheduleChangeCount?: number
  personalInfoRevealed: boolean
}) {
  const employment = user.listMetrics?.employmentStatusLabel?.trim() || '-'
  const employmentSide =
    employment === '-' ? (
      <span>-</span>
    ) : (
      <AppStatusBadge
        label={employment}
        className={`user-basic-info-section__teacher-employment-badge user-basic-info-section__teacher-employment-badge--${schoolTeacherEmploymentBadgeModifier(employment)}`}
      />
    )

  return (
    <>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.NameBlock
          rows={[
            {
              subLabel: '한글',
              main: (
                <span className="user-basic-info-section__name-with-badge">
                  {user.name}
                  {scheduleChangeCount != null && scheduleChangeCount > 0 ? (
                    <ScheduleChangeHistoryBadge count={scheduleChangeCount} />
                  ) : null}
                </span>
              ),
              sideLabel: '재직 현황',
              side: employmentSide,
            },
            {
              subLabel: '영문',
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
    </>
  )
}

/** 겸직 강사·순수 강사 공통 — 기본 정보(성명~한 줄 소개) */
function InstructorDualOrOnlyBasicFields({
  user,
  scheduleChangeCount,
  personalInfoRevealed,
  memberInfoEditing,
  memberInfoDraft,
  onMemberInfoDraftChange,
  cmsMayEditBasicProfileFields,
}: {
  user: Omit<User, 'password'>
  scheduleChangeCount?: number
  personalInfoRevealed: boolean
  memberInfoEditing?: boolean
  memberInfoDraft?: AdminProvisionedMemberBasicInfoDraft | null
  onMemberInfoDraftChange?: (partial: Partial<AdminProvisionedMemberBasicInfoDraft>) => void
  cmsMayEditBasicProfileFields: boolean
}) {
  const sessionEditing = Boolean(memberInfoEditing && memberInfoDraft && onMemberInfoDraftChange)
  const basicEditing = sessionEditing && cmsMayEditBasicProfileFields
  const basicLockedInSession = sessionEditing && !cmsMayEditBasicProfileFields
  const d = memberInfoDraft
  return (
    <>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.NameBlock
          rows={[
            {
              subLabel: '한글',
              main: basicEditing ? (
                <span className="user-basic-info-section__name-with-badge">
                  <CmsInput
                    value={d?.name ?? ''}
                    onChange={e => onMemberInfoDraftChange?.({ name: e.target.value })}
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
              sideLabel: '정산 현황',
              side: settlementStatusView(user),
            },
            {
              subLabel: '영문',
              main: basicEditing ? (
                <CmsInput
                  value={d?.nameEn ?? ''}
                  onChange={e => onMemberInfoDraftChange?.({ nameEn: e.target.value })}
                  inputSize="medium"
                  width="100%"
                  placeholder="영문 성명"
                />
              ) : (
                <span>{user.nameEn ?? '-'}</span>
              ),
              sideLabel: '성별 및 생년월일',
              side: basicEditing ? (
                <span className="user-basic-info-section__inline-controls">
                  <CmsSelect
                    value={d?.gender || undefined}
                    onChange={v =>
                      onMemberInfoDraftChange?.({ gender: v != null ? String(v) : '' })
                    }
                    options={GENDER_EDIT_OPTIONS}
                    placeholder="성별"
                    inputSize="medium"
                    width={120}
                    allowClear
                  />
                  <CmsInput
                    value={d?.birthDate ?? ''}
                    onChange={e => onMemberInfoDraftChange?.({ birthDate: e.target.value })}
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
      <ContactInfoFieldsRow
        user={user}
        personalInfoRevealed={personalInfoRevealed}
        readOnlyDisplay={basicLockedInSession}
        phoneValue={d?.phone ?? ''}
        emailValue={d?.email ?? ''}
        onPhoneChange={next => onMemberInfoDraftChange?.({ phone: next })}
        onEmailChange={next => onMemberInfoDraftChange?.({ email: next })}
      />
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="자택 주소"
          readOnlyDisplay={basicLockedInSession}
          view={<span>{detailAddressView(user, personalInfoRevealed)}</span>}
          edit={
            <span className="detail-info-form-inputs-wrapper-no-gap">
              <AddressSearchDetailInputs
                searchValue={d?.detailAddressSearch ?? ''}
                onSearchChange={next => onMemberInfoDraftChange?.({ detailAddressSearch: next })}
                detailValue={d?.detailAddressDetail ?? ''}
                onDetailChange={next => onMemberInfoDraftChange?.({ detailAddressDetail: next })}
                searchWidth={INDIVIDUAL_AFFILIATION_FIELDS_WIDTH}
                detailWidth={INDIVIDUAL_AFFILIATION_FIELDS_WIDTH}
                detailAriaLabel="자택 주소 상세"
              />
            </span>
          }
        />
        <DetailInfoForm.Field
          label="정산 계좌 정보"
          readOnlyDisplay={basicLockedInSession}
          view={<span>{instructorBankLine(user, personalInfoRevealed)}</span>}
          edit={
            <span className="detail-info-form-inputs-wrapper-no-gap">
              <CmsInput
                value={d?.instructorBankName ?? ''}
                onChange={e => onMemberInfoDraftChange?.({ instructorBankName: e.target.value })}
                inputSize="medium"
                width={INDIVIDUAL_AFFILIATION_FIELDS_WIDTH}
                placeholder="은행명"
              />
              <DetailInfoForm.InputsSeparator />
              <CmsInput
                value={d?.instructorAccountNumber ?? ''}
                onChange={e =>
                  onMemberInfoDraftChange?.({ instructorAccountNumber: e.target.value })
                }
                inputSize="medium"
                width={INDIVIDUAL_AFFILIATION_FIELDS_WIDTH}
                placeholder="계좌번호"
              />
              <DetailInfoForm.InputsSeparator />
              <CmsInput
                value={d?.instructorAccountHolder ?? ''}
                onChange={e =>
                  onMemberInfoDraftChange?.({ instructorAccountHolder: e.target.value })
                }
                inputSize="medium"
                width={INDIVIDUAL_AFFILIATION_FIELDS_WIDTH}
                placeholder="예금주"
              />
            </span>
          }
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="최종 학력"
          readOnlyDisplay={basicLockedInSession}
          view={<span>{highestEducationLine(user)}</span>}
          edit={
            <span className="detail-info-form-inputs-wrapper-no-gap">
              <CmsInput
                value={d?.highestEducationLevel ?? ''}
                onChange={e => onMemberInfoDraftChange?.({ highestEducationLevel: e.target.value })}
                inputSize="medium"
                width={INDIVIDUAL_AFFILIATION_FIELDS_WIDTH}
                placeholder="최종 학력"
              />
              <DetailInfoForm.InputsSeparator />
              <CmsInput
                value={d?.highestEducationSchoolName ?? ''}
                onChange={e =>
                  onMemberInfoDraftChange?.({ highestEducationSchoolName: e.target.value })
                }
                inputSize="medium"
                width={INDIVIDUAL_AFFILIATION_FIELDS_WIDTH}
                placeholder="최종 졸업 학교명"
              />
            </span>
          }
        />
        <DetailInfoForm.Field
          label="소속 및 강사 경력"
          readOnlyDisplay={basicLockedInSession}
          view={<span>{affiliationAndInstructorCareerLine(user)}</span>}
          edit={
            <span className="detail-info-form-inputs-wrapper-no-gap">
              <CmsInput
                placeholder="소속"
                value={d?.affiliationInstitution ?? ''}
                onChange={e =>
                  onMemberInfoDraftChange?.({ affiliationInstitution: e.target.value })
                }
                inputSize="medium"
                width={INDIVIDUAL_AFFILIATION_FIELDS_WIDTH}
              />
              <DetailInfoForm.InputsSeparator />
              <CmsInput
                placeholder="강사 경력 요약"
                value={d?.instructorCareerSummaryLabel ?? ''}
                onChange={e =>
                  onMemberInfoDraftChange?.({
                    instructorCareerSummaryLabel: e.target.value,
                  })
                }
                inputSize="medium"
                width={INDIVIDUAL_AFFILIATION_FIELDS_WIDTH}
              />
            </span>
          }
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="JA 평가 등급"
          readOnlyDisplay={basicLockedInSession}
          view={<span>{jaEvaluationGradeLine(user)}</span>}
          edit={
            <CmsSelect
              value={d?.jaEvaluationGrade || undefined}
              onChange={v =>
                onMemberInfoDraftChange?.({
                  jaEvaluationGrade: v != null ? String(v) : '',
                })
              }
              options={JA_EVALUATION_GRADE_OPTIONS}
              placeholder="선택"
              inputSize="medium"
              width="100%"
              allowClear
              aria-label="JA 평가 등급"
            />
          }
        />
        <DetailInfoForm.Field
          label="강사비 등급"
          view={<span>{instructorFeeGradeLine(user)}</span>}
          edit={
            sessionEditing ? (
              <CmsSelect
                value={memberInfoDraft?.instructorFeeGrade || undefined}
                onChange={v =>
                  onMemberInfoDraftChange?.({
                    instructorFeeGrade: v != null ? String(v) : '',
                  })
                }
                options={INSTRUCTOR_FEE_GRADE_OPTIONS}
                placeholder="선택"
                inputSize="medium"
                width="100%"
                allowClear
                aria-label="강사비 등급"
              />
            ) : undefined
          }
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="사업소득자 여부"
          readOnlyDisplay={basicLockedInSession}
          view={instructorBusinessIncomeView(user)}
          edit={
            <CmsSelect
              value={d?.instructorBusinessIncome || undefined}
              onChange={v =>
                onMemberInfoDraftChange?.({
                  instructorBusinessIncome: v != null ? (String(v) as '해당' | '해당 없음') : '',
                })
              }
              options={[
                { value: '해당', label: '해당' },
                { value: '해당 없음', label: '해당 없음' },
              ]}
              placeholder="선택"
              inputSize="medium"
              width="100%"
              allowClear
            />
          }
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="한 줄 소개"
          readOnlyDisplay={basicLockedInSession}
          view={<span>{oneLineIntroLine(user)}</span>}
          edit={
            <CmsInput
              value={d?.bio ?? ''}
              onChange={e => onMemberInfoDraftChange?.({ bio: e.target.value })}
              inputSize="medium"
              width="100%"
            />
          }
        />
      </DetailInfoForm.Row>
    </>
  )
}

function InstructorFieldsByProfile({
  user,
  scheduleChangeCount,
  personalInfoRevealed,
  memberInfoEditing,
  memberInfoDraft,
  onMemberInfoDraftChange,
  cmsMayEditBasicProfileFields,
}: {
  user: Omit<User, 'password'>
  scheduleChangeCount?: number
  personalInfoRevealed: boolean
  memberInfoEditing?: boolean
  memberInfoDraft?: AdminProvisionedMemberBasicInfoDraft | null
  onMemberInfoDraftChange?: (partial: Partial<AdminProvisionedMemberBasicInfoDraft>) => void
  cmsMayEditBasicProfileFields: boolean
}) {
  return (
    <InstructorDualOrOnlyBasicFields
      user={user}
      scheduleChangeCount={scheduleChangeCount}
      personalInfoRevealed={personalInfoRevealed}
      memberInfoEditing={memberInfoEditing}
      memberInfoDraft={memberInfoDraft}
      onMemberInfoDraftChange={onMemberInfoDraftChange}
      cmsMayEditBasicProfileFields={cmsMayEditBasicProfileFields}
    />
  )
}

function AdminFields({
  user,
  personalInfoRevealed,
  memberInfoEditing,
  memberInfoDraft,
  onMemberInfoDraftChange,
  adminPermissionVariantPatching = false,
  onPatchAdminPermissionVariantFromDetailView,
  adminMemberProfileFieldsEditableWhenEditing = true,
}: {
  user: Omit<User, 'password'>
  personalInfoRevealed: boolean
  memberInfoEditing?: boolean
  memberInfoDraft?: AdminProvisionedMemberBasicInfoDraft | null
  onMemberInfoDraftChange?: (partial: Partial<AdminProvisionedMemberBasicInfoDraft>) => void
  adminPermissionVariantPatching?: boolean
  onPatchAdminPermissionVariantFromDetailView?: (
    nextPermission: AdminPermissionTagVariant
  ) => void | Promise<void>
  adminMemberProfileFieldsEditableWhenEditing?: boolean
}) {
  const [adminPermissionOpen, setAdminPermissionOpen] = useState(false)
  const editing = Boolean(memberInfoEditing && memberInfoDraft && onMemberInfoDraftChange)
  const sensitiveProfileEditable = editing && adminMemberProfileFieldsEditableWhenEditing
  const permDropdownInView = Boolean(onPatchAdminPermissionVariantFromDetailView) && !editing
  const permEditorActive = editing || permDropdownInView
  const permVariant = getAdminPermissionVariant(user)
  const selectedPerm =
    memberInfoDraft?.adminPermissionVariant === 'manager' ||
    memberInfoDraft?.adminPermissionVariant === 'partner' ||
    memberInfoDraft?.adminPermissionVariant === 'viewer'
      ? memberInfoDraft.adminPermissionVariant
      : permVariant
  const statusForPermDropdown: AdminPermissionTagVariant = editing ? selectedPerm : permVariant
  const renderAdminPermBadge = (variant: AdminPermissionTagVariant) => (
    <AppStatusBadge
      label={ADMIN_PERMISSION_TAG_LABEL[variant]}
      className={`user-list-admin-perm-badge user-list-admin-perm-badge--${variant}`}
    />
  )

  return (
    <>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.NameBlock
          className="user-basic-info-section__admin-name-block"
          rows={[
            {
              subLabel: '한글',
              main: sensitiveProfileEditable ? (
                <CmsInput
                  value={memberInfoDraft?.name ?? ''}
                  onChange={e => onMemberInfoDraftChange?.({ name: e.target.value })}
                  inputSize="medium"
                  width="100%"
                  aria-label="한글 성명"
                />
              ) : (
                <span>{user.name}</span>
              ),
              sideLabel: '권한 유형',
              side: (
                <span
                  className={
                    permEditorActive
                      ? `${STATUS_DROPDOWN_CELL_CLASSNAME} ${STATUS_DROPDOWN_CELL_TAG_160_CLASSNAME}`
                      : undefined
                  }
                >
                  {permEditorActive ? (
                    <StatusDropdownCell<AdminPermissionTagVariant>
                      status={statusForPermDropdown}
                      statusOptions={['manager', 'partner', 'viewer']}
                      renderBadge={renderAdminPermBadge}
                      isItemDisabled={(cur, option) => cur === option}
                      onChange={async next => {
                        if (editing) {
                          onMemberInfoDraftChange?.({ adminPermissionVariant: next })
                          return
                        }
                        await onPatchAdminPermissionVariantFromDetailView?.(next)
                      }}
                      isUpdating={permDropdownInView && adminPermissionVariantPatching}
                      isOpen={adminPermissionOpen}
                      onOpenChange={setAdminPermissionOpen}
                      tagLayout="tag160"
                      emptyPlaceholder="-"
                    />
                  ) : (
                    <span
                      className={`user-list-admin-perm-tag user-list-admin-perm-tag--${permVariant}`}
                    >
                      {ADMIN_PERMISSION_TAG_LABEL[permVariant]}
                    </span>
                  )}
                </span>
              ),
            },
            {
              subLabel: '영문',
              main: sensitiveProfileEditable ? (
                <CmsInput
                  value={memberInfoDraft?.nameEn ?? ''}
                  onChange={e => onMemberInfoDraftChange?.({ nameEn: e.target.value })}
                  inputSize="medium"
                  width="100%"
                  placeholder="영문 성명"
                />
              ) : (
                <span>{user.nameEn ?? '-'}</span>
              ),
              sideLabel: '담당 프로그램 수',
              side: (
                <span className="user-basic-info-section__admin-managed-programs">
                  <ManagedProgramCountDisplay user={user} />
                </span>
              ),
            },
          ]}
        />
      </DetailInfoForm.Row>
      <ContactInfoFieldsRow
        user={user}
        personalInfoRevealed={personalInfoRevealed}
        readOnlyDisplay={editing && !adminMemberProfileFieldsEditableWhenEditing}
        phoneValue={memberInfoDraft?.phone ?? ''}
        emailValue={memberInfoDraft?.email ?? ''}
        onPhoneChange={next => onMemberInfoDraftChange?.({ phone: next })}
        onEmailChange={next => onMemberInfoDraftChange?.({ email: next })}
        phonePlaceholder="연락처"
        emailPlaceholder="이메일"
      />
      <CreatedAtAndSocialRow user={user} />
    </>
  )
}

/** 레이아웃·단일 섹션에 공통으로 넘기는 props (필드 컴포넌트와 분리) */
type BasicInfoBodySharedProps = BasicInfoSectionRenderContext

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
  adminPermissionVariantPatching = false,
  onPatchAdminPermissionVariantFromDetailView,
  adminMemberProfileFieldsEditableWhenEditing = true,
}: UserBasicInfoSectionProps) {
  const [searchParams] = useSearchParams()
  const entryFromQuery = parseUserBasicInfoEntryQuery(
    searchParams.get(USER_BASIC_INFO_ENTRY_QUERY_KEY)
  )
  const bodyKey = resolveUserBasicInfoBodyKey(entrySourceProp, entryFromQuery, user.role)
  const instructorProfile = resolveInstructorMemberProfile(user)
  const resolvedLayout = resolveBasicInfoLayout({
    bodyKey: bodyKey as BasicInfoBodyKey,
    instructorProfile,
  })
  /** 관리자 등록(직접 가입 미완료)일 때만 기본정보 필드 일괄 편집 — 직접 등록은 코멘트(·강사비 등급)만 예외 */
  const cmsMayEditBasicProfileFields = shouldShowCmsMemberInfoEditButton(user)
  /** 정책: 편집 모드 진입 시 기본 폼은 edit 모드로 전환(필드별 edit 슬롯·readOnlyDisplay로 실제 편집 범위 제어) */
  const basicFormMemberEditing = memberInfoEditing
  const detailInfoFormMode: 'view' | 'edit' = basicFormMemberEditing ? 'edit' : 'view'

  const sectionContext: BasicInfoBodySharedProps = {
    user,
    scheduleChangeCount,
    externalId1365,
    personalInfoRevealed,
    basicFormMemberEditing,
    memberInfoDraft,
    onMemberInfoDraftChange,
    cmsMayEditBasicProfileFields,
    adminPermissionVariantPatching,
    onPatchAdminPermissionVariantFromDetailView,
    adminMemberProfileFieldsEditableWhenEditing,
  }

  return (
    <div className="user-detail-modal__basic-inner">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
        <BasicInfoLayoutRenderer
          resolution={resolvedLayout}
          caption={caption}
          mode={detailInfoFormMode}
          shared={sectionContext}
          renderers={{
            SchoolTeacherMetaFields,
            InstructorMetaFields,
            SchoolTeacherProfileFields,
            InstructorFieldsByProfile,
            AllUsersFields,
            InstitutionFields,
            AdminFields,
          }}
        />
      </div>
    </div>
  )
}
