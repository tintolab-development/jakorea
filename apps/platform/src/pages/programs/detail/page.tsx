import {
  getProgramIdFromPath,
  programApplyPath,
  programApplyRequiredPath,
  PROGRAMS_PATH,
  readPortalRecruitmentFocus,
  useProgramDetail,
} from '@/features/program'
import { getDevAuthLoggedIn } from '@/shared/lib'
import { PFButton, PFText } from '@/shared/ui'
import shell from '../program-page-shell.module.css'
import styles from './page.module.css'
import { useLocation, useNavigate } from 'react-router-dom'
import { ProgramDetailView } from './detail-view'

export function ProgramDetailPage() {
  const navigate = useNavigate()
  const { search } = useLocation()
  const programId = getProgramIdFromPath()
  const focus = readPortalRecruitmentFocus(search)
  const { program, isLoading } = useProgramDetail(programId, { focus })
  const fromPath = new URLSearchParams(search).get('from')

  if (isLoading && !program) {
    return null
  }

  if (!program) {
    return (
      <section className={[shell.page, styles.page].join(' ')}>
        <div className={shell.inner}>
          <PFText as="p" typo="hd-md" color="black">
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
    const nextFocus =
      program.focusedRecruitmentIds?.length === 1
        ? {
            portalTab: focus?.portalTab,
            applicationTypes: program.focusedApplicationTypes,
            recruitmentIds: program.focusedRecruitmentIds,
          }
        : focus
    const applyPath = programApplyPath(program.id, nextFocus, fromPath ?? undefined)
    if (!getDevAuthLoggedIn()) {
      navigate(programApplyRequiredPath(program.id, nextFocus, fromPath ?? undefined))
      return
    }

    navigate(applyPath)
  }

  return (
    <ProgramDetailView program={program} onBackToList={handleBackToList} onApply={handleApply} />
  )
}
