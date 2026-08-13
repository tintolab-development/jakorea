import { useEffect, useMemo, useState } from 'react'
import {
  getMockApplyFormDraft,
  getProgramIdFromPath,
  ProgramBackButton,
  programApplyCompletePath,
  programDetailPath,
  useMockProgramById,
} from '@/features/program'
import { FormTemplateHost, FormTemplateRenderer } from '@/features/form-template'
import { getDevAuthLoggedIn } from '@/shared/lib'
import { PFButton, PFText } from '@/shared/ui'
import styles from './page.module.css'
import { useNavigate } from 'react-router-dom'

export function ProgramApplyPage() {
  const navigate = useNavigate()
  const [isReady, setIsReady] = useState(false)
  const programId = getProgramIdFromPath()
  const { program, isLoading } = useMockProgramById(programId)

  useEffect(() => {
    if (!programId) {
      return
    }

    if (!getDevAuthLoggedIn()) {
      navigate(
        `/auth/required?redirect=${encodeURIComponent(`/programs/${programId}/apply`)}`
      )
      return
    }

    setIsReady(true)
  }, [navigate, programId])

  const draft = useMemo(
    () => (program ? getMockApplyFormDraft(program) : null),
    [program]
  )

  if (!isReady || isLoading || !program || !draft) {
    return null
  }

  const handleBack = () => {
    navigate(programDetailPath(program.id))
  }

  const handleSubmit = () => {
    // TODO: CMS 등록 신청 폼 draft 기준 검증 · POST program application API
    navigate(programApplyCompletePath(program.id))
  }

  return (
    <section className={styles.page}>
      <div className={styles.back}>
        <ProgramBackButton size="small" label="이전으로" onClick={handleBack} />
      </div>

      <div className={styles.inner}>
        <header className={styles.header}>
          <PFText as="h1" typo="page-title" color="black" className={styles.pageTitle}>
            프로그램 신청하기
          </PFText>
        </header>

        <div className={styles.summary}>
          <PFText as="h2" typo="bd-lg-sb" color="black">
            {program.title}
          </PFText>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
            {program.applicationPeriodLabel}
          </PFText>
        </div>

        <div className={styles.form}>
          <FormTemplateHost surface="platformUser">
            <FormTemplateRenderer
              draft={draft}
              interactionMode="user"
              surface="platformUser"
            />
          </FormTemplateHost>

          <div className={styles.actions}>
            <PFButton size="xlarge" width={240} type="button" onClick={handleSubmit}>
              신청하기
            </PFButton>
          </div>
        </div>
      </div>
    </section>
  )
}
