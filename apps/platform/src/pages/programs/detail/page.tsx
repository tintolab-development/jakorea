import {
  getProgramIdFromPath,
  programApplyPath,
  programApplyRequiredPath,
  PROGRAMS_PATH,
  ProgramApplyGateModals,
  programApplyGateApplicationsPathForType,
  programApplyGateMemberSettingsPath,
  readPortalRecruitmentFocus,
  usePortalApplicationOption,
  useProgramApplyGate,
  useProgramDetail,
} from '@/features/program'
import { getDevAuthLoggedIn } from '@/shared/lib'
import { PFAlertModal, PFButton, PFLoadingSpinner, PFText } from '@/shared/ui'
import shell from '../program-page-shell.module.css'
import styles from './page.module.css'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ProgramDetailView } from './detail-view'

type ApplyBlockedAlert = {
  title: string
  description: string
}

function applyBlockedAlertFor(
  blockedReason: string | null,
  blockedMessage: string
): ApplyBlockedAlert {
  if (blockedReason === 'RECRUITMENT_CLOSED' || blockedReason === 'RECRUITMENT_ENDED') {
    return {
      title: '프로그램 모집기간이 종료되었어요.',
      description: '모집기간이 종료된 프로그램은 신청서를 제출할 수 없어요.',
    }
  }
  if (blockedReason === 'RECRUITMENT_NOT_STARTED') {
    return {
      title: '프로그램 모집기간이 시작되지 않았어요.',
      description: '모집기간이 시작되지 않은 프로그램은\n신청서를 제출할 수 없어요.',
    }
  }
  return { title: '안내', description: blockedMessage }
}

function ProgramDetailLoading() {
  return (
    <section className={[shell.page, styles.page].join(' ')} aria-busy="true">
      <div className={shell.inner}>
        <PFLoadingSpinner className={styles.loadingStatus} label="프로그램을 불러오는 중" />
        <div className={styles.back}>
          <span className={[styles.skeleton, styles.skeletonBack].join(' ')} />
        </div>
        <div className={styles.loadingBody}>
          <div className={styles.loadingMain}>
            <span className={[styles.skeleton, styles.skeletonCategory].join(' ')} />
            <span className={[styles.skeleton, styles.skeletonTitle].join(' ')} />
            <span className={[styles.skeleton, styles.skeletonTitleShort].join(' ')} />
            <span className={[styles.skeleton, styles.skeletonMeta].join(' ')} />
            <span className={[styles.skeleton, styles.skeletonBadges].join(' ')} />
            <span className={[styles.skeleton, styles.skeletonSummary].join(' ')} />
          </div>
          <div className={styles.loadingAside}>
            <span className={[styles.skeleton, styles.skeletonBanner].join(' ')} />
            <span className={[styles.skeleton, styles.skeletonApply].join(' ')} />
          </div>
        </div>
      </div>
    </section>
  )
}

export function ProgramDetailPage() {
  const navigate = useNavigate()
  const { search } = useLocation()
  const [applyBlockedAlert, setApplyBlockedAlert] = useState<ApplyBlockedAlert | null>(null)
  const programId = getProgramIdFromPath()
  const focus = readPortalRecruitmentFocus(search)
  const { program, isLoading } = useProgramDetail(programId, { focus })
  const fromPath = new URLSearchParams(search).get('from')
  const applySelection =
    program?.focusedRecruitmentIds?.length === 1
      ? {
          portalTab: focus?.portalTab,
          applicationTypes: program.focusedApplicationTypes,
          recruitmentIds: program.focusedRecruitmentIds,
          programType: program.programType,
        }
      : {
          ...focus,
          programType: program?.programType,
        }
  const { gateModal, closeGateModal, isChecking, runApplyGate } = useProgramApplyGate(
    programId,
    applySelection
  )
  const applyOptionQuery = usePortalApplicationOption(programId, applySelection)

  if (isLoading && !program) {
    return <ProgramDetailLoading />
  }

  if (!program) {
    return (
      <section className={[shell.page, styles.emptyPage].join(' ')}>
        <div className={[shell.inner, styles.emptyInner].join(' ')}>
          <PFText as="p" typo="hd-md" color="black" className={styles.emptyTitle}>
            프로그램을 찾을 수 없어요
          </PFText>
          <PFButton variant="secondary" onClick={() => navigate(PROGRAMS_PATH)}>
            목록으로
          </PFButton>
        </div>
      </section>
    )
  }

  const handleBackToList = () => {
    navigate(fromPath ?? PROGRAMS_PATH)
  }

  const handleApply = () => {
    if (program.recruitmentSelectionAmbiguous) {
      setApplyBlockedAlert({
        title: '신청 대상을 확인해 주세요.',
        description: '프로그램의 모집 대상을 선택한 뒤 신청해 주세요.',
      })
      return
    }
    if (applyOptionQuery.blockedMessage) {
      setApplyBlockedAlert(
        applyBlockedAlertFor(applyOptionQuery.blockedReason, applyOptionQuery.blockedMessage)
      )
      return
    }
    const nextFocus = applySelection
    const applyPath = programApplyPath(program.id, nextFocus, fromPath ?? undefined)
    if (!getDevAuthLoggedIn()) {
      navigate(programApplyRequiredPath(program.id, nextFocus, fromPath ?? undefined))
      return
    }

    void runApplyGate(() => {
      navigate(applyPath)
    })
  }

  return (
    <>
      <ProgramDetailView
        program={program}
        onBackToList={handleBackToList}
        onApply={handleApply}
        applyChecking={isChecking || applyOptionQuery.isLoading}
      />
      <ProgramApplyGateModals
        kind={gateModal}
        onClose={closeGateModal}
        onEditMemberInfo={() => {
          closeGateModal()
          navigate(programApplyGateMemberSettingsPath)
        }}
        onViewApplications={() => {
          closeGateModal()
          const applicationType =
            applySelection?.applicationTypes?.length === 1
              ? applySelection.applicationTypes[0]
              : program.applicationType
          navigate(programApplyGateApplicationsPathForType(applicationType))
        }}
      />
      <PFAlertModal
        open={applyBlockedAlert != null}
        title={applyBlockedAlert?.title ?? ''}
        description={applyBlockedAlert?.description}
        onConfirm={() => setApplyBlockedAlert(null)}
      />
    </>
  )
}
