import { useId, useState, type FormEvent } from 'react'
import { isValidEmailId } from '@/shared/lib'
import { PFAlertModal, PFButton, PFText } from '@/shared/ui'
import type { NewsletterSubscribeResponse } from '../api/newsletter-client'
import { getNewsletterSubscribeErrorMessage } from '../api/newsletter-errors'
import {
  getNewsletterSubscribeResultCopy,
  resolveNewsletterSubscribeUi,
} from '../api/newsletter-result'
import { useNewsletterSubscribeMutation } from '../api/use-newsletter-subscribe'
import { NewsletterSubscribeModal } from './newsletter-subscribe-modal'
import { NewsletterSuccessModal } from './newsletter-success-modal'
import styles from './newsletter-section.module.css'

export function NewsletterSection() {
  const consentId = useId()
  const nameId = useId()
  const emailId = useId()
  const subscribeMutation = useNewsletterSubscribeMutation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [isSubscribeOpen, setIsSubscribeOpen] = useState(false)
  const [isSuccessOpen, setIsSuccessOpen] = useState(false)
  const [subscribeResult, setSubscribeResult] = useState<NewsletterSubscribeResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const showSuccess = (result?: NewsletterSubscribeResponse | null) => {
    setIsSubscribeOpen(false)
    setErrorMessage('')
    setSubscribeResult(result ?? null)
    setIsSuccessOpen(true)
  }

  const trySubscribeFromBanner = async () => {
    if (!agreed) {
      setErrorMessage('뉴스레터 구독을 위한 이름 및 이메일 주소 수집에\n동의해 주세요.')
      return
    }

    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    const isComplete = Boolean(trimmedName) && isValidEmailId(trimmedEmail)

    if (!isComplete) {
      setIsSubscribeOpen(true)
      return
    }

    try {
      const result = await subscribeMutation.mutateAsync({
        name: trimmedName,
        email: trimmedEmail,
      })
      setName('')
      setEmail('')
      setAgreed(false)
      const ui = resolveNewsletterSubscribeUi(result.status)
      if (ui === 'confirm-email' || ui === 'complete') {
        showSuccess(result)
        return
      }
      setErrorMessage(getNewsletterSubscribeResultCopy(result).description)
    } catch (error) {
      setErrorMessage(getNewsletterSubscribeErrorMessage(error))
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void trySubscribeFromBanner()
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
            type="submit"
            size="xlarge"
            variant="primary"
            width="100%"
            className={styles.submit}
            disabled={subscribeMutation.isPending}
          >
            {subscribeMutation.isPending ? '처리 중…' : '뉴스레터 구독하기'}
          </PFButton>
        </form>
      </div>

      <NewsletterSubscribeModal
        open={isSubscribeOpen}
        onClose={() => setIsSubscribeOpen(false)}
        onSuccess={showSuccess}
      />

      <NewsletterSuccessModal
        open={isSuccessOpen}
        result={subscribeResult}
        onConfirm={() => {
          setIsSuccessOpen(false)
          setSubscribeResult(null)
        }}
      />

      <PFAlertModal
        open={Boolean(errorMessage)}
        confirmVariant="primary"
        title="뉴스레터 구독 안내"
        description={errorMessage}
        onConfirm={() => setErrorMessage('')}
      />
    </section>
  )
}
