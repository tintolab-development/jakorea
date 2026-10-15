import {
  getProgramIdFromPath,
  programApplyPath,
  programApplyRequiredPath,
  PROGRAMS_PATH,
  ProgramApplyGateModals,
  programApplyGateApplicationsPathForType,
  programApplyGateMemberSettingsPath,
  readPortalRecruitmentFocus,
  useProgramApplyGate,
  useProgramDetail,
} from '@/features/program'
import { getDevAuthLoggedIn } from '@/shared/lib'
import { PFButton, PFLoadingSpinner, PFText } from '@/shared/ui'
import shell from '../program-page-shell.module.css'
import styles from './page.module.css'
import { useLocation, useNavigate } from 'react-router-dom'
import { ProgramDetailView } from './detail-view'

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
        }
      : focus
  const { gateModal, closeGateModal, isChecking, runApplyGate } = useProgramApplyGate(
    programId,
    applySelection,
  )

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
        applyChecking={isChecking}
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
    </>
  )
}
