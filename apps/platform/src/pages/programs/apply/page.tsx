import { useEffect, useState } from 'react'
import {
  getMockProgramById,
  getProgramIdFromPath,
  ProgramBackButton,
  programApplyCompletePath,
  programDetailPath,
} from '@/features/program'
import { getDevAuthLoggedIn } from '@/shared/lib'
import { PFButton, PFText } from '@/shared/ui'
import styles from './page.module.css'

export function ProgramApplyPage() {
  const [isReady, setIsReady] = useState(false)
  const programId = getProgramIdFromPath()
  const program = programId ? getMockProgramById(programId) : undefined

  useEffect(() => {
    if (!programId) {
      return
    }

    if (!getDevAuthLoggedIn()) {
      window.location.assign(
        `/auth/required?redirect=${encodeURIComponent(`/programs/${programId}/apply`)}`
      )
      return
    }

    setIsReady(true)
  }, [programId])

  if (!isReady || !program) {
    return null
  }

  const handleBack = () => {
    window.location.assign(programDetailPath(program.id))
  }

  const handleSubmit = () => {
    window.location.assign(programApplyCompletePath(program.id))
  }

  return (
    <section className={styles.page}>
      <div className={styles.back}>
        <ProgramBackButton label="이전으로" onClick={handleBack} />
      </div>

      <div className={styles.inner}>
        <header className={styles.header}>
          <PFText as="h1" typo="page-title" color="black">
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

        <form
          className={styles.form}
          onSubmit={event => {
            event.preventDefault()
            handleSubmit()
          }}
        >
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>
              <PFText as="span" typo="bd-md-sb" color="black">
                개인정보 수집·이용 <span className={styles.required}>*</span>
              </PFText>
            </legend>
            <label className={styles.radio}>
              <input type="radio" name="privacy-consent" value="agree" defaultChecked />
              동의
            </label>
            <label className={styles.radio}>
              <input type="radio" name="privacy-consent" value="disagree" />
              동의하지 않음
            </label>
          </fieldset>

          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>
              <PFText as="span" typo="bd-md-sb" color="black">
                개인정보 제3자 정보 제공·이용 동의 <span className={styles.required}>*</span>
              </PFText>
            </legend>
            <label className={styles.radio}>
              <input type="radio" name="third-party-consent" value="agree" defaultChecked />
              동의
            </label>
            <label className={styles.radio}>
              <input type="radio" name="third-party-consent" value="disagree" />
              동의하지 않음
            </label>
          </fieldset>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="motivation">
              <PFText as="span" typo="bd-md-sb" color="black">
                자기소개 및 지원동기 <span className={styles.required}>*</span>
              </PFText>
            </label>
            <textarea
              id="motivation"
              className={styles.textarea}
              placeholder="자유롭게 작성해 주세요"
              rows={6}
            />
          </div>

          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>
              <PFText as="span" typo="bd-md-sb" color="black">
                진행 희망 교육 일정 <span className={styles.required}>*</span>
              </PFText>
            </legend>
            <label className={styles.checkbox}>
              <input type="checkbox" name="schedule" value="2026-04-20" />
              &apos;26년 4월 20일(월) 9:30 - 12:20
            </label>
            <label className={styles.checkbox}>
              <input type="checkbox" name="schedule" value="2026-04-27" />
              &apos;26년 4월 27일(월) 13:00 - 15:50
            </label>
          </fieldset>

          <div className={styles.actions}>
            <PFButton size="xlarge" width="100%" type="submit">
              신청하기
            </PFButton>
          </div>
        </form>
      </div>
    </section>
  )
}
