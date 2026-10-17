import {
  MYPAGE_EDUCATION_PATH,
  MYPAGE_LECTURE_PATH,
  MYPAGE_SETTINGS_PATH,
  MYPAGE_VOLUNTEER_PATH,
} from '@/features/mypage/lib/constants'
import { PFButton, PFModal, PFText } from '@/shared/ui'
import type { ProgramApplyGateModalKind } from '../../lib/application-apply-gate'
import styles from './program-apply-gate-modals.module.css'

const PARTICIPATION_CONSENT_ITEM_LABELS = [
  '교육진행자 서약서',
  '행정정보 공동이용 동의서',
  '성범죄 경력 조회 동의서',
] as const

type ProgramApplyGateModalsProps = {
  kind: ProgramApplyGateModalKind | null
  onClose: () => void
  onEditMemberInfo: () => void
  onViewApplications: () => void
}

/** application-options `blockedReason` 기반 (대상 불일치·이미 신청) */
export function ProgramApplyGateModals({
  kind,
  onClose,
  onEditMemberInfo,
  onViewApplications,
}: ProgramApplyGateModalsProps) {
  return (
    <>
      <PFModal open={kind === 'not-eligible'} size="sm" onClose={onClose} mobilePlacement="bottom">
        <div className={styles.content}>
          <div className={styles.textBlock}>
            <PFText as="h2" typo="hl-lg" color="black" className={styles.title}>
              신청 대상이 아닙니다.
            </PFText>
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.description}>
              프로그램의 모집 대상을 확인해 주세요.
              <br />
              회원 정보가 정확하지 않다면 정보를 수정해 주세요.
            </PFText>
          </div>
          <div className={styles.actions}>
            <PFButton type="button" variant="secondary" size="xlarge" onClick={onClose}>
              닫기
            </PFButton>
            <PFButton type="button" variant="primary" size="xlarge" onClick={onEditMemberInfo}>
              회원 정보 수정하기
            </PFButton>
          </div>
        </div>
      </PFModal>

      <PFModal open={kind === 'already-applied'} size="sm" onClose={onClose} mobilePlacement="bottom">
        <div className={styles.content}>
          <div className={styles.textBlock}>
            <PFText as="h2" typo="hl-lg" color="black" className={styles.title}>
              이미 신청한 프로그램입니다
            </PFText>
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.description}>
              신청 내역은 마이페이지에서 확인할 수 있어요.
            </PFText>
          </div>
          <div className={styles.actions}>
            <PFButton type="button" variant="secondary" size="xlarge" onClick={onClose}>
              닫기
            </PFButton>
            <PFButton type="button" variant="primary" size="xlarge" onClick={onViewApplications}>
              신청 내역 보기
            </PFButton>
          </div>
        </div>
      </PFModal>
    </>
  )
}

type ProgramApplyRequiredConsentModalProps = {
  open: boolean
  onClose: () => void
  onOpenConsents: () => void
}

/**
 * 연간 참여 동의 3종 — application-options 와 무관.
 * GET /api/portal/me/consents 또는 배정 전 409 로 판별 후 호출.
 */
export function ProgramApplyRequiredConsentModal({
  open,
  onClose,
  onOpenConsents,
}: ProgramApplyRequiredConsentModalProps) {
  return (
    <PFModal open={open} size="sm" onClose={onClose} mobilePlacement="bottom">
      <div className={styles.content}>
        <div className={styles.textBlock}>
          <PFText as="h2" typo="hl-lg" color="black" className={styles.title}>
            필수 항목에 동의해 주세요.
          </PFText>
          <div className={styles.consentListWrap}>
            <ul className={styles.consentList}>
              {PARTICIPATION_CONSENT_ITEM_LABELS.map(label => (
                <li key={label} className={styles.consentListItem}>
                  <PFText as="span" typo="bd-md-rg" color="neutral-cool-700">
                    {label}
                  </PFText>
                </li>
              ))}
            </ul>
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.description}>
              이 프로그램은 해당 항목의 서약 및 동의가 필요해요.
              <br />
              신청하시려면 마이페이지에서 작성해 주세요.
            </PFText>
          </div>
        </div>
        <div className={styles.actions}>
          <PFButton type="button" variant="secondary" size="xlarge" onClick={onClose}>
            취소
          </PFButton>
          <PFButton type="button" variant="primary" size="xlarge" onClick={onOpenConsents}>
            서약 및 동의하기
          </PFButton>
        </div>
      </div>
    </PFModal>
  )
}

type ProgramApplyCompleteModalProps = {
  open: boolean
  onClose: () => void
  onViewApplications: () => void
}

export function ProgramApplyCompleteModal({
  open,
  onClose,
  onViewApplications,
}: ProgramApplyCompleteModalProps) {
  return (
    <PFModal open={open} size="sm" onClose={onClose} mobilePlacement="bottom">
      <div className={styles.content}>
        <div className={styles.textBlock}>
          <PFText as="h2" typo="hl-lg" color="black" className={styles.title}>
            신청이 완료되었어요
          </PFText>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.description}>
            신청 내역은 마이페이지에서 확인할 수 있어요.
          </PFText>
        </div>
        <div className={styles.actions}>
          <PFButton type="button" variant="secondary" size="xlarge" onClick={onClose}>
            닫기
          </PFButton>
          <PFButton type="button" variant="primary" size="xlarge" onClick={onViewApplications}>
            신청 내역 보기
          </PFButton>
        </div>
      </div>
    </PFModal>
  )
}

export const programApplyGateMemberSettingsPath = MYPAGE_SETTINGS_PATH
export const programApplyGateConsentsPath = `${MYPAGE_SETTINGS_PATH}?tab=consents`
export const programApplyGateApplicationsPath = MYPAGE_EDUCATION_PATH

/** 신청 유형에 맞는 마이페이지 신청 목록으로 이동한다. */
export function programApplyGateApplicationsPathForType(applicationType?: string): string {
  switch (applicationType?.trim().toUpperCase()) {
    case 'INSTRUCTOR':
      return MYPAGE_LECTURE_PATH
    case 'VOLUNTEER':
      return MYPAGE_VOLUNTEER_PATH
    default:
      return MYPAGE_EDUCATION_PATH
  }
}
