import { useState } from 'react'
import { PFButton, PFInfoReview, PFText } from '@/shared/ui'
import { EMPTY_SETTINGS_VALUE, VOLUNTEER_1365_URL } from '../lib/constants'
import type { SettingsGuardianView, SettingsInfoRow } from '../lib/map-view'
import { SettingsChangePasswordModal } from './change-password-modal'
import styles from './view.module.css'

export type SettingsViewProps = {
  basicRows: SettingsInfoRow[]
  guardian: SettingsGuardianView | null
  onEditBasic?: () => void
}

function EditButton({ onClick }: { onClick?: () => void }) {
  return (
    <PFButton
      size="small"
      variant="primary"
      disabled={!onClick}
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
    value: row.action === '1365-shortcut' ? <VolunteerIdValue value={row.value} /> : row.value,
  }))
}

export function SettingsView({ basicRows, guardian, onEditBasic }: SettingsViewProps) {
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)

  return (
    <div className={styles.page}>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <PFText as="h2" typo="form-section-title" color="black" className={styles.sectionTitle}>
            기본 정보
          </PFText>
          <EditButton onClick={onEditBasic} />
        </div>
        <PFInfoReview rows={toReviewRows(basicRows)} />
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
          disabled
          className={styles.withdrawAction}
        >
          회원 탈퇴하기
        </PFButton>
      </div>

      <SettingsChangePasswordModal
        open={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  )
}
