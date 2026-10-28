import {
  MYPAGE_EDUCATION_PATH,
  MYPAGE_LECTURE_PATH,
  MYPAGE_SETTINGS_PATH,
  MYPAGE_VOLUNTEER_PATH,
} from '@/features/mypage/lib/constants'
import { PFButton, PFModal, PFText } from '@/shared/ui'
import type { ProgramApplyGateModalKind } from '../../lib/application-apply-gate'
import {
  requiredApplyConsentLabels,
  type RequiredApplyConsentType,
} from '../../lib/application-consent-guard'
import styles from './program-apply-gate-modals.module.css'

type ProgramApplyGateModalsProps = {
  kind: ProgramApplyGateModalKind | null
  onClose: () => void
  onEditMemberInfo: () => void
  onViewApplications: () => void
  /** `required-consent` — 아직 완료되지 않은 필수 동의 항목만 */
  missingConsentTypes?: readonly RequiredApplyConsentType[]
  onOpenConsents?: () => void
}

/** application-options `blockedReason` 기반 (대상 불일치·이미 신청) + 필수 동의 가드 */
export function ProgramApplyGateModals({
  kind,
  onClose,
  onEditMemberInfo,
  onViewApplications,
  missingConsentTypes = [],
  onOpenConsents,
}: ProgramApplyGateModalsProps) {
  return (
    <>
      <ProgramApplyRequiredConsentModal
        open={kind === 'required-consent'}
        onClose={onClose}
        onOpenConsents={onOpenConsents ?? onClose}
        missingConsentTypes={missingConsentTypes}
      />

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
  /** 미완료 항목만 표시 */
  missingConsentTypes: readonly RequiredApplyConsentType[]
}

/**
 * 필수 동의(초상권, UJAT 는 서약·동의 4종) — application-options 와 무관.
 * GET /api/portal/me/consents 로 판별한 미완료 항목만 보여 준다.
 */
export function ProgramApplyRequiredConsentModal({
  open,
  onClose,
  onOpenConsents,
  missingConsentTypes,
}: ProgramApplyRequiredConsentModalProps) {
  // 시안: 서약서가 섞이면 '서약 및 동의' 문구, 동의서만이면 '동의' 문구
  const includesPledge = missingConsentTypes.includes('FACILITATOR_PLEDGE')
  return (
    <PFModal
      open={open}
      size="sm"
      onClose={onClose}
      mobilePlacement="bottom"
      showCloseButton={false}
    >
      <div className={`${styles.content} ${styles.requiredConsentContent}`}>
        <div className={styles.textBlock}>
          <PFText as="h2" typo="hl-lg" color="black" className={styles.title}>
            필수 항목에 동의해 주세요.
          </PFText>
          <div className={styles.consentListWrap}>
            <ul className={styles.consentList}>
              {requiredApplyConsentLabels(missingConsentTypes).map(label => (
                <li key={label} className={styles.consentListItem}>
                  <PFText as="span" typo="bd-sm-md" color="black">
                    {label}
                  </PFText>
                </li>
              ))}
            </ul>
            <PFText as="p" typo="bd-md-rg" color="neutral-warm-600" className={styles.description}>
              {includesPledge
                ? '이 프로그램은 해당 항목의 서약 및 동의가 필요해요.'
                : '이 프로그램은 해당 항목의 동의가 필요해요.'}
              <br />
              {includesPledge
                ? '신청하시려면 서약서 및 동의서를 작성해 주세요.'
                : '신청하시려면 동의서를 작성해 주세요.'}
            </PFText>
          </div>
        </div>
        <div className={styles.actions}>
          <PFButton type="button" variant="tertiary" size="xlarge" onClick={onClose}>
            취소
          </PFButton>
          <PFButton type="button" variant="primary" size="xlarge" onClick={onOpenConsents}>
            {includesPledge ? '서약 및 동의하기' : '동의서 작성하기'}
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
