import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { INSTRUCTOR_FORM_SECTION_BASE_TITLES } from '@jakorea/domain/instructor/form-layout'
import type { InstructorSharedProfileFormValues } from '@jakorea/domain/instructor/profile-form-values'
import { collectInstructorRegisterValidation } from '@jakorea/domain/instructor/validate-register'
import { clearMypagePhoneIdentityConfirmPending } from '@/features/auth/identity-verification'
import {
  getLoginApiErrorMessage,
  usePortalProfileUpdateMutation,
  type PortalProfileResponse,
} from '@/features/auth/sign-in'
import type { SelectedSchool } from '@/features/auth/sign-up'
import {
  InstructorAwardProfileFields,
  InstructorCareerProfileFields,
  InstructorEducationProfileFields,
  InstructorFreeWriteProfileFields,
  InstructorJaProfileFields,
  InstructorLicenseProfileFields,
  type InstructorProfileFieldPlaceholders,
} from '@/features/mypage/instructor-apply/instructor-profile-fields'
import { toInstructorFormEmploymentStatus } from '@/features/mypage/instructor-apply/map-locked-basic-info'
import { isRemoteApiConfigured } from '@/shared/lib'
import { PFAlertModal, PFButton, PFText } from '@/shared/ui'
import {
  INSTRUCTOR_SETTINGS_ESSAY_SECTIONS,
  type InstructorSettingsSectionId,
} from '../../lib/format-instructor-settings-display'
import {
  mapInstructorBasicSettingsToPortalProfileUpdate,
  type InstructorBasicSettingsAddressMeta,
} from '../../lib/map-instructor-basic-profile-update'
import { buildInstructorSettingsFormValues } from '../../lib/map-instructor-settings-form'
import type { SettingsProfileInput } from '../../lib/map-view'
import { ConsentWithdrawConfirm } from '../consent-withdraw-confirm'
import editStyles from '../edit-form.module.css'
import { SettingsInstructorBasicFields } from './basic-edit-form'
import styles from './full-edit-form.module.css'

const REQUIRED_INCOMPLETE = '필수 항목을 모두 작성해주세요'

/** 설정 화면 전용 표기 — 조회 화면과 동일 */
const SETTINGS_CAREER_SECTION_TITLE = '경력 사항'
/** 시안(수정 11199:20878) — 섹션 타이틀 `수상 및 수료` (필드 라벨은 `수상 및 수료 내역` 유지) */
const SETTINGS_AWARD_SECTION_TITLE = '수상 및 수료'

/**
 * 시안(수정 11199:20878) 문장형 placeholder — 설정 화면에서만 전달.
 * 연월/일자 피커(입사·퇴사·활동 기간)는 도메인 기본 짧은 표기 유지.
 */
const SETTINGS_INSTRUCTOR_FIELD_PLACEHOLDERS: InstructorProfileFieldPlaceholders = {
  eduSchoolType: '학교를 선택해 주세요',
  eduStatus: '상태를 선택해 주세요',
  admitYear: '입학년도를 선택해 주세요',
  gradYear: '졸업년도를 선택해 주세요',
  educationSchoolName: '학교명을 입력해 주세요',
  major: '전공을 입력해 주세요',
  degree: '학위를 선택해 주세요',
  companyName: '회사명을 입력해 주세요',
  roleName: '담당 업무를 입력해 주세요',
  jaProgramName: '프로그램명을 입력해 주세요',
  jaNote: '비고를 입력해 주세요',
  licenseYear: '취득연도를 선택해 주세요',
  licenseTitle: '자격증/면허명을 입력해 주세요',
  licenseIssuer: '발행처를 입력해 주세요',
  awardYear: '수상/수료연도를 선택해 주세요',
  awardTitle: '수상/수료명을 입력해 주세요',
  awardIssuer: '발행처를 입력해 주세요',
}

export type InstructorFullEditScrollTarget = 'basic' | InstructorSettingsSectionId

export function resolveInstructorFullEditSectionDomId(target: InstructorFullEditScrollTarget) {
  return `settings-instructor-full-edit-${target}`
}

function validateInstructorFullEdit(values: InstructorSharedProfileFormValues): string | null {
  const result = collectInstructorRegisterValidation(
    values,
    {},
    {
      requiredConsentAgreeKeys: [],
      requireEducation: true,
      requireCareer: true,
      requireFreeWrite: false,
    }
  )
  if (result.missingRequired) return REQUIRED_INCOMPLETE
  if (result.formatMessages[0]) return result.formatMessages[0]
  return null
}

/**
 * 교사 겸 강사 — 항상 교사 가입 + 강사 신청이므로 교사 회원과 동일하게 다룸
 * (`memberType=school_teacher`, 강사 프로필에 학교가 없으면 포털 교사 소속으로 채움)
 */
function buildInitialValues(
  profile: SettingsProfileInput,
  initialValues: InstructorSharedProfileFormValues,
  isDual: boolean
): InstructorSharedProfileFormValues {
  if (!isDual) return initialValues
  return {
    ...initialValues,
    memberType: 'school_teacher',
    schoolName: initialValues.schoolName.trim() || profile.schoolName?.trim() || '',
    employmentStatus:
      initialValues.employmentStatus ||
      toInstructorFormEmploymentStatus(profile.teacherEmploymentStatus),
  }
}

/** 휴대폰은 재인증 즉시 저장되므로 변경 여부 비교에서 제외 */
function snapshotForDirtyCheck(values: InstructorSharedProfileFormValues) {
  return JSON.stringify({ ...values, contact: '' })
}

/** 시안 11199:20878 섹션 헤더 — 24px SemiBold · 좌 8px · 밑줄/필수 * 없음 */
function SectionHeader({ title }: { title: string }) {
  return (
    <div className={styles.header}>
      <PFText as="h2" typo="hl-lg" color="black" className={styles.title}>
        {title}
      </PFText>
    </div>
  )
}

function FullEditSection({
  target,
  title,
  children,
}: {
  target: InstructorFullEditScrollTarget
  title: string
  children: ReactNode
}) {
  return (
    <section id={resolveInstructorFullEditSectionDomId(target)} className={styles.section}>
      <SectionHeader title={title} />
      {children}
    </section>
  )
}

export type SettingsInstructorFullEditFormProps = {
  profile: SettingsProfileInput
  initialValues: InstructorSharedProfileFormValues
  /** 교사 겸 강사 — 기본 정보에 소속/학교 검색·재직 현황 */
  isDual?: boolean
  /** 진입한 `수정하기` 섹션 — 마운트 시 스크롤 */
  scrollTarget?: InstructorFullEditScrollTarget
  onCancel: () => void
  onSaved: (next: InstructorSharedProfileFormValues) => void
}

/** 강사 회원정보 설정 — 전체 수정 (기본 정보 → 학력 → 경력 → JA → 자격 → 수상 → 서술형 4문항) */
export function SettingsInstructorFullEditForm({
  profile,
  initialValues,
  isDual = false,
  scrollTarget = 'basic',
  onCancel,
  onSaved,
}: SettingsInstructorFullEditFormProps) {
  const [initialSnapshot] = useState(() =>
    snapshotForDirtyCheck(buildInitialValues(profile, initialValues, isDual))
  )
  const [values, setValues] = useState(() => buildInitialValues(profile, initialValues, isDual))
  const [addressMeta, setAddressMeta] = useState<InstructorBasicSettingsAddressMeta>({
    postalCode: profile.postalCode?.trim() ?? '',
    regionSido: profile.regionSido?.trim() ?? '',
    regionSigungu: profile.regionSigungu?.trim() ?? '',
  })
  const [selectedSchool, setSelectedSchool] = useState<SelectedSchool | null>(null)
  const [isReverifying, setIsReverifying] = useState(false)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false)
  const profileUpdateMutation = usePortalProfileUpdateMutation()
  const didScrollRef = useRef(false)

  const patch = useCallback((partial: Partial<InstructorSharedProfileFormValues>) => {
    setValues(prev => ({ ...prev, ...partial }))
  }, [])

  useEffect(() => {
    if (didScrollRef.current) return
    didScrollRef.current = true
    if (scrollTarget === 'basic') {
      window.scrollTo({ top: 0 })
      return
    }
    document
      .getElementById(resolveInstructorFullEditSectionDomId(scrollTarget))
      ?.scrollIntoView({ block: 'start' })
  }, [scrollTarget])

  const isDirty = useMemo(
    () => snapshotForDirtyCheck(values) !== initialSnapshot,
    [initialSnapshot, values]
  )
  const isBusy = profileUpdateMutation.isPending || isReverifying

  const handleSave = async () => {
    if (isBusy) return
    setSubmitError(null)
    const validationError = validateInstructorFullEdit(values)
    if (validationError) {
      setAlertMessage(validationError)
      return
    }

    if (!isRemoteApiConfigured()) {
      onSaved(values)
      return
    }

    try {
      const updated = await profileUpdateMutation.mutateAsync(
        mapInstructorBasicSettingsToPortalProfileUpdate(
          values,
          addressMeta,
          isDual ? { dualTeacher: { selectedSchool } } : undefined
        )
      )
      onSaved(buildInstructorSettingsFormValues(updated as PortalProfileResponse))
    } catch (error) {
      setSubmitError(
        getLoginApiErrorMessage(
          error,
          '회원 정보를 수정하지 못했습니다. 잠시 후 다시 시도해 주세요.'
        )
      )
    }
  }

  const leave = () => {
    clearMypagePhoneIdentityConfirmPending()
    setIsLeaveConfirmOpen(false)
    onCancel()
  }

  const handleBack = () => {
    if (profileUpdateMutation.isPending) return
    if (isDirty) {
      setIsLeaveConfirmOpen(true)
      return
    }
    leave()
  }

  return (
    <div className={styles.page}>
      <FullEditSection target="basic" title="기본 정보">
        <SettingsInstructorBasicFields
          profile={profile}
          values={values}
          onPatch={patch}
          onAddressMetaChange={setAddressMeta}
          onReverifyingChange={setIsReverifying}
          isDual={isDual}
          onSchoolSelect={setSelectedSchool}
        />
      </FullEditSection>

      <FullEditSection target="education" title={INSTRUCTOR_FORM_SECTION_BASE_TITLES.education}>
        <InstructorEducationProfileFields
          surface="settings"
          placeholders={SETTINGS_INSTRUCTOR_FIELD_PLACEHOLDERS}
          values={values}
          onValuesChange={setValues}
        />
      </FullEditSection>

      <FullEditSection target="career" title={SETTINGS_CAREER_SECTION_TITLE}>
        <InstructorCareerProfileFields
          surface="settings"
          placeholders={SETTINGS_INSTRUCTOR_FIELD_PLACEHOLDERS}
          values={values}
          onValuesChange={setValues}
        />
      </FullEditSection>

      <FullEditSection target="ja" title={INSTRUCTOR_FORM_SECTION_BASE_TITLES.ja}>
        <InstructorJaProfileFields
          surface="settings"
          placeholders={SETTINGS_INSTRUCTOR_FIELD_PLACEHOLDERS}
          values={values}
          onValuesChange={setValues}
        />
      </FullEditSection>

      <FullEditSection target="license" title={INSTRUCTOR_FORM_SECTION_BASE_TITLES.license}>
        <InstructorLicenseProfileFields
          surface="settings"
          placeholders={SETTINGS_INSTRUCTOR_FIELD_PLACEHOLDERS}
          values={values}
          onValuesChange={setValues}
        />
      </FullEditSection>

      <FullEditSection target="award" title={SETTINGS_AWARD_SECTION_TITLE}>
        <InstructorAwardProfileFields
          surface="settings"
          placeholders={SETTINGS_INSTRUCTOR_FIELD_PLACEHOLDERS}
          values={values}
          onValuesChange={setValues}
        />
      </FullEditSection>

      {INSTRUCTOR_SETTINGS_ESSAY_SECTIONS.map(essay => (
        <FullEditSection key={essay.id} target={essay.id} title={essay.title}>
          <InstructorFreeWriteProfileFields
            surface="settings"
            values={values}
            onValuesChange={setValues}
            onlyField={essay.id}
          />
        </FullEditSection>
      ))}

      <div className={styles.footer}>
        {submitError ? (
          <PFText
            as="p"
            typo="bd-sm-md"
            color="error"
            className={editStyles.submitError}
            role="alert"
          >
            {submitError}
          </PFText>
        ) : null}
        <PFButton
          size="xlarge"
          width="100%"
          disabled={isBusy}
          onClick={() => {
            void handleSave()
          }}
        >
          {profileUpdateMutation.isPending ? '수정 중…' : '수정 완료하기'}
        </PFButton>
        <PFButton
          size="xlarge"
          variant="tertiary"
          width="100%"
          disabled={profileUpdateMutation.isPending}
          onClick={handleBack}
        >
          이전
        </PFButton>
      </div>

      <PFAlertModal
        open={alertMessage != null}
        title="안내"
        description={alertMessage ?? undefined}
        onConfirm={() => setAlertMessage(null)}
      />

      <ConsentWithdrawConfirm
        open={isLeaveConfirmOpen}
        title="수정을 취소하시겠어요?"
        description="수정한 내용이 저장되지 않습니다."
        cancelLabel="계속 수정하기"
        confirmLabel="나가기"
        onCancel={() => setIsLeaveConfirmOpen(false)}
        onConfirm={leave}
      />
    </div>
  )
}
