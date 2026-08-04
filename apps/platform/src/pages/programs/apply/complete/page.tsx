import {
  getProgramIdFromPath,
  programDetailPath,
  PROGRAMS_PATH,
  useMockProgramById,
} from '@/features/program'
import illustCheckUrl from '@/shared/assets/illustration/illust-check.svg'
import { PFButton, PFText } from '@/shared/ui'
import styles from './page.module.css'

export function ProgramApplyCompletePage() {
  const programId = getProgramIdFromPath()
  const { program, isLoading } = useMockProgramById(programId)

  if (isLoading && !program) {
    return null
  }

  if (!program) {
    return (
      <section className={styles.page}>
        <PFText as="p" typo="hd-md" color="black">
          신청 정보를 확인할 수 없어요
        </PFText>
        <PFButton variant="secondary" onClick={() => window.location.assign(PROGRAMS_PATH)}>
          목록으로
        </PFButton>
      </section>
    )
  }

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <img className={styles.illustration} src={illustCheckUrl} alt="" aria-hidden="true" />
        <PFText as="h1" typo="hd-md" color="black" className={styles.title}>
          신청이 완료되었어요
        </PFText>
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-500" className={styles.description}>
          {program.title}
          <br />
          프로그램 신청이 정상적으로 접수되었습니다.
        </PFText>

        <div className={styles.actions}>
          <PFButton size="xlarge" width="100%" onClick={() => window.location.assign(PROGRAMS_PATH)}>
            다른 프로그램 보기
          </PFButton>
          <PFButton
            size="xlarge"
            variant="tertiary"
            width="100%"
            onClick={() => window.location.assign(programDetailPath(program.id))}
          >
            프로그램 상세로 이동
          </PFButton>
        </div>
      </div>
    </section>
  )
}
