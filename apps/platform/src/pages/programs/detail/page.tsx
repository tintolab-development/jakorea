import {
  getProgramIdFromPath,
  ProgramBackButton,
  ProgramInfoBody,
  ProgramStatusBadges,
  programApplyPath,
  programApplyRequiredPath,
  PROGRAMS_PATH,
  useMockProgramById,
} from '@/features/program'
import { getDevAuthLoggedIn } from '@/shared/lib'
import { PFButton, PFText } from '@/shared/ui'
import shell from '../program-page-shell.module.css'
import styles from './page.module.css'
import { useNavigate } from 'react-router-dom'

export function ProgramDetailPage() {
  const navigate = useNavigate()
  const programId = getProgramIdFromPath()
  const { program, isLoading } = useMockProgramById(programId)
  const searchParams = new URLSearchParams(window.location.search)
  const fromPath = searchParams.get('from')

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
    const applyPath = programApplyPath(program.id)
    if (!getDevAuthLoggedIn()) {
      navigate(programApplyRequiredPath(program.id))
      return
    }

    navigate(applyPath)
  }

  return (
    <section className={[shell.page, styles.page].join(' ')}>
      <div className={shell.inner}>
        <div className={styles.back}>
          <ProgramBackButton label="목록으로" onClick={handleBackToList} />
        </div>

        <ProgramInfoBody
          program={program}
          showApplyCta
          onApply={handleApply}
          header={
            <header className={styles.header}>
              <div className={styles.headerMain}>
                <PFText as="span" typo="hl-sm" color="black">
                  {program.categoryLabel}
                </PFText>
                <PFText as="h1" typo="page-title" color="black" className={styles.title}>
                  {program.title}
                </PFText>
                <div className={styles.meta}>
                  <div className={styles.metaItem}>
                    <PFText as="span" typo="bd-lg-rg" color="neutral-cool-600">
                      프로그램 운영 기간
                    </PFText>
                    <PFText as="span" typo="hl-sm" color="black">
                      {program.operatingPeriodLabel}
                    </PFText>
                  </div>
                  <div className={styles.metaItem}>
                    <PFText as="span" typo="bd-lg-rg" color="neutral-cool-600">
                      후원사
                    </PFText>
                    <PFText as="span" typo="hl-sm" color="black">
                      {program.sponsor}
                    </PFText>
                  </div>
                </div>
              </div>
              <div className={styles.badges}>
                <ProgramStatusBadges
                  recruitmentStatus={program.recruitmentStatus}
                  educationTargetLabel={program.educationTargetLabel}
                  educationForm={program.educationForm}
                  educationFormLabel={program.educationFormLabel}
                  recruitmentRoleLabel={program.recruitmentRoleLabel}
                />
              </div>
            </header>
          }
        />
      </div>
    </section>
  )
}
