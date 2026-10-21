import { useCallback, useId, useState, type FormEvent } from 'react'
import { isValidEmailId } from '@/shared/lib'
import { PFAlertModal, PFButton, PFModal, PFText, PFTextInput } from '@/shared/ui'
import type { NewsletterSubscribeResponse } from '../api/newsletter-client'
import { getNewsletterSubscribeErrorMessage } from '../api/newsletter-errors'
import {
  getNewsletterSubscribeResultCopy,
  isNewsletterSubscribeAccepted,
} from '../api/newsletter-result'
import { useNewsletterSubscribeMutation } from '../api/use-newsletter-subscribe'
import styles from './newsletter-subscribe-modal.module.css'

export type NewsletterSubscribeModalProps = {
  open: boolean
  onClose: () => void
  onSuccess?: (result?: NewsletterSubscribeResponse | null) => void
}

type FieldErrors = {
  name?: string
  email?: string
  consent?: string
}

const EMPTY_FORM = {
  name: '',
  email: '',
  agreed: false,
}

export function NewsletterSubscribeModal({
  open,
  onClose,
  onSuccess,
}: NewsletterSubscribeModalProps) {
  const consentId = useId()
  const subscribeMutation = useNewsletterSubscribeMutation()
  const [name, setName] = useState(EMPTY_FORM.name)
  const [email, setEmail] = useState(EMPTY_FORM.email)
  const [agreed, setAgreed] = useState(EMPTY_FORM.agreed)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [errorMessage, setErrorMessage] = useState('')

  const resetForm = useCallback(() => {
    setName(EMPTY_FORM.name)
    setEmail(EMPTY_FORM.email)
    setAgreed(EMPTY_FORM.agreed)
    setErrors({})
  }, [])

  const handleClose = useCallback(() => {
    if (subscribeMutation.isPending) return
    resetForm()
    setErrorMessage('')
    onClose()
  }, [onClose, resetForm, subscribeMutation.isPending])

  const submitSubscribe = async () => {
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    const nextErrors: FieldErrors = {}

    if (!trimmedName) {
      nextErrors.name = '이름을 입력해 주세요.'
    }
    if (!trimmedEmail) {
      nextErrors.email = '이메일 주소를 입력해 주세요.'
    } else if (!isValidEmailId(trimmedEmail)) {
      nextErrors.email = '올바른 이메일 주소를 입력해 주세요.'
    }
    if (!agreed) {
      nextErrors.consent = '뉴스레터 구독을 위한 이름 및 이메일 주소 수집에 동의해 주세요.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    try {
      const result = await subscribeMutation.mutateAsync({
        name: trimmedName,
        email: trimmedEmail,
      })
      resetForm()
      if (isNewsletterSubscribeAccepted(result.status)) {
        onSuccess?.(result)
        return
      }
      setErrorMessage(getNewsletterSubscribeResultCopy(result).description)
    } catch (error) {
      setErrorMessage(getNewsletterSubscribeErrorMessage(error))
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void submitSubscribe()
  }

  return (
    <>
    <PFModal
      open={open}
      size="md"
      title="뉴스레터 신청하기"
      className={styles.panel}
      onClose={handleClose}
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.fields}>
            <PFTextInput
              size="large"
              label="이름"
              placeholder="이름을 입력해 주세요"
              required
              autoComplete="name"
              value={name}
              error={Boolean(errors.name)}
              message={errors.name}
              messageStatus={errors.name ? 'error' : 'neutral'}
              onValueChange={value => {
                setName(value)
                setErrors(previous => ({ ...previous, name: undefined }))
              }}
            />
            <PFTextInput
              size="large"
              label="이메일"
              type="email"
              placeholder="이메일 주소를 입력해 주세요"
              required
              autoComplete="email"
              value={email}
              error={Boolean(errors.email)}
              message={errors.email}
              messageStatus={errors.email ? 'error' : 'neutral'}
              onValueChange={value => {
                setEmail(value)
                setErrors(previous => ({ ...previous, email: undefined }))
              }}
            />
            <label
              className={[styles.consent, errors.consent ? styles.consentError : undefined]
                .filter(Boolean)
                .join(' ')}
              htmlFor={consentId}
            >
              <input
                id={consentId}
                className={styles.consentInput}
                type="checkbox"
                checked={agreed}
                onChange={event => {
                  setAgreed(event.target.checked)
                  setErrors(previous => ({ ...previous, consent: undefined }))
                }}
              />
              <span
                className={[styles.consentCheck, agreed ? styles.consentCheckOn : undefined]
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
                typo="bd-lg-sb"
                color="neutral-cool-700"
                className={styles.consentText}
              >
                뉴스레터 구독을 위한 이름 및 이메일 주소 수집에 동의합니다
              </PFText>
            </label>
          {errors.consent ? (
            <p className={styles.consentMessage} role="alert">
              {errors.consent}
            </p>
          ) : null}
        </div>

          <div className={styles.actions}>
          <PFButton
            type="button"
            variant="secondary"
            size="xlarge"
            disabled={subscribeMutation.isPending}
            onClick={handleClose}
          >
            취소
          </PFButton>
          <PFButton
            type="submit"
            variant="primary"
            size="xlarge"
            disabled={subscribeMutation.isPending}
          >
            {subscribeMutation.isPending ? '처리 중…' : '신청하기'}
          </PFButton>
        </div>
      </form>
    </PFModal>

    <PFAlertModal
      open={Boolean(errorMessage)}
      title="뉴스레터 구독 안내"
      description={errorMessage}
      onConfirm={() => setErrorMessage('')}
    />
    </>
  )
}
