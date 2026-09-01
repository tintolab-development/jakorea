import { useId, useState, type FormEvent } from 'react'
import { PFAlertModal, PFButton, PFText } from '@/shared/ui'
import styles from './newsletter-section.module.css'

export function NewsletterSection() {
  const consentId = useId()
  const nameId = useId()
  const emailId = useId()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [isSuccessOpen, setIsSuccessOpen] = useState(false)

  const canSubmit = agreed && name.trim().length > 0 && email.trim().length > 0

  const completeSubscribe = () => {
    if (!canSubmit) return
    // Mock only — API 연동 전
    setName('')
    setEmail('')
    setAgreed(false)
    setIsSuccessOpen(true)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    completeSubscribe()
  }

  return (
    <section className={styles.section} aria-labelledby="impact-newsletter-title">
      <div className={styles.inner}>
        <div className={styles.copy}>
          <h2 id="impact-newsletter-title" className={styles.title}>
            <span className={styles.titleLine}>JA Korea의</span>
            <span className={styles.titleLine}>새로운 소식을 받아보세요</span>
          </h2>

          <label className={styles.consent} htmlFor={consentId}>
            <input
              id={consentId}
              className={styles.consentInput}
              type="checkbox"
              checked={agreed}
              onChange={event => setAgreed(event.target.checked)}
            />
            <span
              className={[styles.consentCheck, agreed ? styles.consentCheckVisible : undefined]
                .filter(Boolean)
                .join(' ')}
              aria-hidden="true"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="11"
                viewBox="0 0 15 11"
                fill="none"
                className={styles.consentCheckIcon}
              >
                <path
                  d="M5.36393 11L0 5.77153L1.64913 4.16425L5.36393 7.78524L13.3509 0L15 1.60727L5.36393 11Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <PFText
              as="span"
              typo="bd-md-md"
              color="neutral-cool-500"
              className={styles.consentText}
            >
              뉴스레터 구독을 위한 이름 및 이메일 주소 수집에 동의합니다
            </PFText>
          </label>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.fields}>
            <div className={styles.field}>
              <label htmlFor={nameId} className={styles.fieldLabel}>
                이름
              </label>
              <input
                id={nameId}
                className={styles.fieldInput}
                type="text"
                placeholder="이름을 입력해 주세요"
                value={name}
                onChange={event => setName(event.target.value)}
                autoComplete="name"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor={emailId} className={styles.fieldLabel}>
                이메일
              </label>
              <input
                id={emailId}
                className={styles.fieldInput}
                type="email"
                placeholder="이메일 주소를 입력해 주세요"
                value={email}
                onChange={event => setEmail(event.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <PFButton
            type="button"
            size="xlarge"
            variant="primary"
            width="100%"
            className={styles.submit}
            aria-disabled={!canSubmit}
            onClick={completeSubscribe}
          >
            뉴스레터 구독하기
          </PFButton>
        </form>
      </div>

      <PFAlertModal
        open={isSuccessOpen}
        confirmVariant="primary"
        title="뉴스레터 구독이 완료되었어요"
        description={'JA Korea의 교육 프로그램과\n새로운 소식을 이메일로 전해드릴게요.'}
        onConfirm={() => setIsSuccessOpen(false)}
      />
    </section>
  )
}
