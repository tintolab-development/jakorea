import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getLoginApiErrorMessage,
  usePortalWithdrawalMutation,
} from '@/features/auth/sign-in'
import {
  clearAuthTokens,
  isRemoteApiConfigured,
  setDevAuthLoggedIn,
} from '@/shared/lib'
import { PFButton, PFInfoReview, PFText } from '@/shared/ui'
import pfInfoReviewStyles from '@/shared/ui/pf-info-review/pf-info-review.module.css'
import { EMPTY_SETTINGS_VALUE, SETTINGS_WITHDRAW_GUIDE, VOLUNTEER_1365_URL } from '../lib/constants'
import type { InstructorSharedProfileFormValues } from '@jakorea/domain/instructor/profile-form-values'
import type { SettingsGuardianView, SettingsInfoRow, SettingsProfileInput } from '../lib/map-view'
import type { InstructorSettingsSectionId } from '../lib/format-instructor-settings-display'
import { SettingsInstructorBasicEditForm } from './instructor-profile/basic-edit-form'
import { SettingsInstructorProfileSectionsView } from './instructor-profile/instructor-profile-sections-view'
import { SettingsChangePasswordModal } from './change-password-modal'
import { SettingsWithdrawGuideModal } from './withdraw-guide-modal'
import styles from './view.module.css'

export type InstructorSettingsEditTarget = 'basic' | InstructorSettingsSectionId

export type SettingsViewProps = {
  basicRows: SettingsInfoRow[]
  guardian: SettingsGuardianView | null
  onEditBasic?: () => void
  instructorProfileValues?: InstructorSharedProfileFormValues | null
  onEditInstructorSection?: (section: InstructorSettingsSectionId) => void
  /** 강사 — 인라인 수정 중인 영역 (null이면 전부 조회) */
  instructorEditingTarget?: InstructorSettingsEditTarget | null
  settingsProfile?: SettingsProfileInput
  onCancelInstructorEdit?: () => void
  onInstructorBasicSaved?: (next: InstructorSharedProfileFormValues) => void
  onInstructorSectionSaved?: (next: InstructorSharedProfileFormValues) => void
}

function EditButton({ onClick, disabled }: { onClick?: () => void; disabled?: boolean }) {
  return (
    <PFButton
      size="small"
      variant="primary"
      disabled={!onClick || disabled}
      className={styles.editButton}
      onClick={onClick}
    >
      수정하기
    </PFButton>
  )
}

function VolunteerIdValue({ value }: { value: string }) {
  const hasVolunteerId = Boolean(value.trim()) && value !== EMPTY_SETTINGS_VALUE

  return (
    <div className={styles.volunteerRow}>
      <PFText typo="bd-md-sb" color="black">
        {value}
      </PFText>
      <PFButton
        size="small"
        variant="tertiary"
        className={styles.volunteerShortcut}
        disabled={!hasVolunteerId}
        onClick={() => {
          window.open(VOLUNTEER_1365_URL, '_blank', 'noopener,noreferrer')
        }}
      >
        바로가기
      </PFButton>
    </div>
  )
}

function toReviewRows(rows: SettingsInfoRow[]) {
  return rows.map(row => ({
    label: row.label,
    value:
      row.action === '1365-shortcut'
        ? <VolunteerIdValue value={row.value} />
        : row.multiline
          ? (
              <PFText typo="bd-md-sb" color="black" className={styles.basicInfoValueMultiline}>
                {row.value}
              </PFText>
            )
          : row.value,
    dividerBefore: row.dividerBefore,
  }))
}

type ReviewRow = ReturnType<typeof toReviewRows>[number]

function SettingsBasicInfoReview({ rows }: { rows: ReviewRow[] }) {
  const hasDivider = rows.some(row => row.dividerBefore)
  if (!hasDivider) {
    return <PFInfoReview rows={rows} />
  }

  return (
    <div className={pfInfoReviewStyles.list}>
      {rows.map((row, index) => (
        <div
          key={row.label}
          className={[
            pfInfoReviewStyles.row,
            index === 0 ? pfInfoReviewStyles.rowFirst : undefined,
            row.dividerBefore ? styles.basicInfoRowDivider : undefined,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <PFText typo="bd-md-md" color="neutral-cool-500" className={pfInfoReviewStyles.label}>
            {row.label}
          </PFText>
          {typeof row.value === 'string' || typeof row.value === 'number' ? (
            <PFText typo="bd-md-sb" color="black" className={pfInfoReviewStyles.value}>
              {row.value}
            </PFText>
          ) : (
            <div className={pfInfoReviewStyles.value}>{row.value}</div>
          )}
        </div>
      ))}
    </div>
  )
}

export function SettingsView({
  basicRows,
  guardian,
  onEditBasic,
  instructorProfileValues,
  onEditInstructorSection,
  instructorEditingTarget = null,
  settingsProfile,
  onCancelInstructorEdit,
  onInstructorBasicSaved,
  onInstructorSectionSaved,
}: SettingsViewProps) {
  const instructorEditLocked = instructorEditingTarget != null
  const isEditingBasic = instructorEditingTarget === 'basic'
  const editingInstructorSection =
    instructorEditingTarget != null && instructorEditingTarget !== 'basic'
      ? instructorEditingTarget
      : null
  const navigate = useNavigate()
  const withdrawMutation = usePortalWithdrawalMutation()
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [isWithdrawGuideOpen, setIsWithdrawGuideOpen] = useState(false)
  const [withdrawPassword, setWithdrawPassword] = useState('')
  const [withdrawPasswordError, setWithdrawPasswordError] = useState<string | null>(null)
  const [withdrawFormError, setWithdrawFormError] = useState<string | null>(null)

  const closeWithdrawGuide = useCallback(() => {
    if (withdrawMutation.isPending) return
    setIsWithdrawGuideOpen(false)
    setWithdrawPassword('')
    setWithdrawPasswordError(null)
    setWithdrawFormError(null)
  }, [withdrawMutation.isPending])

  const handleWithdrawConfirm = useCallback(async () => {
    if (withdrawMutation.isPending) return

    setWithdrawFormError(null)

    const password = withdrawPassword.trim()
    if (!password) {
      setWithdrawPasswordError('비밀번호를 입력해 주세요.')
      return
    }
    setWithdrawPasswordError(null)

    if (!isRemoteApiConfigured()) {
      clearAuthTokens()
      setDevAuthLoggedIn(false)
      setIsWithdrawGuideOpen(false)
      navigate('/', { replace: true })
      return
    }

    try {
      await withdrawMutation.mutateAsync({
        currentPassword: password,
        reason: SETTINGS_WITHDRAW_GUIDE.reason,
      })
      clearAuthTokens()
      setDevAuthLoggedIn(false)
      setIsWithdrawGuideOpen(false)
      navigate('/', { replace: true })
    } catch (error) {
      setWithdrawFormError(
        getLoginApiErrorMessage(error, '회원 탈퇴에 실패했어요. 다시 시도해 주세요.'),
      )
    }
  }, [navigate, withdrawMutation, withdrawPassword])

  return (
    <div className={styles.page}>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <PFText as="h2" typo="form-section-title" color="black" className={styles.sectionTitle}>
            기본 정보
          </PFText>
          {isEditingBasic ? null : (
            <EditButton
              onClick={onEditBasic}
              disabled={instructorEditLocked && !isEditingBasic}
            />
          )}
        </div>
        {isEditingBasic && settingsProfile && instructorProfileValues && onCancelInstructorEdit && onInstructorBasicSaved ? (
          <SettingsInstructorBasicEditForm
            embedded
            profile={settingsProfile}
            initialValues={instructorProfileValues}
            onCancel={onCancelInstructorEdit}
            onSaved={onInstructorBasicSaved}
          />
        ) : (
          <SettingsBasicInfoReview rows={toReviewRows(basicRows)} />
        )}
      </section>

      {guardian ? (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <PFText as="h2" typo="form-section-title" color="black" className={styles.sectionTitle}>
              보호자 정보
            </PFText>
            <EditButton />
          </div>
          <PFInfoReview
            rows={[
              { label: '이름', value: guardian.name },
              { label: '휴대폰 번호', value: guardian.phone },
              { label: '가입자의 관계', value: guardian.relationship },
            ]}
          />
        </section>
      ) : null}

      {instructorProfileValues && onEditInstructorSection ? (
        <SettingsInstructorProfileSectionsView
          values={instructorProfileValues}
          onEditSection={onEditInstructorSection}
          editingSection={editingInstructorSection}
          editLocked={instructorEditLocked}
          onCancelSectionEdit={onCancelInstructorEdit}
          onSectionSaved={onInstructorSectionSaved}
        />
      ) : null}

      <div className={styles.actions}>
        <PFButton
          size="xlarge"
          width="100%"
          onClick={() => setIsChangePasswordOpen(true)}
        >
          비밀번호 변경하기
        </PFButton>
        <PFButton
          size="xlarge"
          variant="tertiary"
          width="100%"
          className={styles.withdrawAction}
          onClick={() => setIsWithdrawGuideOpen(true)}
        >
          회원 탈퇴하기
        </PFButton>
      </div>

      <SettingsChangePasswordModal
        open={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      <SettingsWithdrawGuideModal
        open={isWithdrawGuideOpen}
        password={withdrawPassword}
        passwordError={withdrawPasswordError}
        formError={withdrawFormError}
        confirmLoading={withdrawMutation.isPending}
        onClose={closeWithdrawGuide}
        onPasswordChange={next => {
          setWithdrawPassword(next)
          if (withdrawPasswordError) setWithdrawPasswordError(null)
          if (withdrawFormError) setWithdrawFormError(null)
        }}
        onConfirm={() => {
          void handleWithdrawConfirm()
        }}
      />
    </div>
  )
}
