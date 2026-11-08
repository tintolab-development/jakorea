import type { ConsentFormData } from '@/types/consent'
import type { TermsViewType } from '@/features/auth/lib/terms-view-config'

import { RegisterTermsCheckControl } from './register-terms-check-control'
import { RegisterTermsAgreeAllCheckIcon } from './register-terms-check-icon'

type ConsentFieldKey = keyof ConsentFormData

interface TermsItemConfig {
  key: ConsentFieldKey
  required: boolean
  label: string
}

const REQUIRED_TERMS_ITEMS: TermsItemConfig[] = [
  { key: 'termsOfService', required: true, label: '서비스 이용약관' },
  { key: 'privacyPolicy', required: true, label: '개인정보 수집·이용 동의' },
]

const OPTIONAL_TERMS_ITEMS: TermsItemConfig[] = [
  { key: 'marketingConsent', required: false, label: '마케팅 정보 수신 동의' },
]

interface RegisterTermsAgreementProps {
  value: ConsentFormData
  onChange: (value: ConsentFormData) => void
  onViewTerm?: (type: TermsViewType) => void
  mfaSetupAgreed?: boolean
  onMfaSetupAgreedChange?: (checked: boolean) => void
}

export function RegisterTermsAgreement({
  value,
  onChange,
  onViewTerm,
  mfaSetupAgreed = false,
  onMfaSetupAgreedChange,
}: RegisterTermsAgreementProps) {
  const includesMfaConsent = onMfaSetupAgreedChange != null
  /** 필수 항목 전체 동의 — 선택(마케팅) 항목은 건드리지 않는다. */
  const allRequiredChecked =
    REQUIRED_TERMS_ITEMS.every(item => value[item.key]) && (!includesMfaConsent || mfaSetupAgreed)

  const handleAgreeAll = () => {
    const nextChecked = !allRequiredChecked
    onChange({
      ...value,
      termsOfService: nextChecked,
      privacyPolicy: nextChecked,
    })
    if (includesMfaConsent) {
      onMfaSetupAgreedChange(nextChecked)
    }
  }

  const handleItemChange = (key: ConsentFieldKey, checked: boolean) => {
    onChange({ ...value, [key]: checked })
  }

  return (
    <div className="register-terms-agreement">
      <div className="register-terms-agreement__body">
        <button
          type="button"
          className="register-terms-agree-all"
          aria-pressed={allRequiredChecked}
          onClick={handleAgreeAll}
        >
          <span
            className={`register-terms-check register-terms-check--static register-terms-check--agree-all${
              allRequiredChecked ? ' register-terms-check--checked' : ''
            }`}
            aria-hidden
          >
            <RegisterTermsAgreeAllCheckIcon checked={allRequiredChecked} />
          </span>
          <span className="register-terms-agree-all__label">필수 항목 전체 동의하기</span>
        </button>

        <ul className="register-terms-agreement__list">
          {REQUIRED_TERMS_ITEMS.map(item => {
            const checked = value[item.key]

            return (
              <li key={item.key} className="register-terms-agreement__item">
                <RegisterTermsCheckControl
                  checked={checked}
                  onChange={next => handleItemChange(item.key, next)}
                  ariaLabel={`필수 ${item.label}`}
                />
                <span className="register-terms-agreement__badge register-terms-agreement__badge--required">
                  필수
                </span>
                <span className="register-terms-agreement__label">{item.label}</span>
                <button
                  type="button"
                  className="register-terms-agreement__view"
                  onClick={() => onViewTerm?.(item.key)}
                >
                  보기
                </button>
              </li>
            )
          })}
          {includesMfaConsent ? (
            <li className="register-terms-agreement__item">
              <RegisterTermsCheckControl
                checked={mfaSetupAgreed}
                onChange={onMfaSetupAgreedChange}
                ariaLabel="필수 2단계 인증(MFA) 설정 동의"
              />
              <span className="register-terms-agreement__badge register-terms-agreement__badge--required">
                필수
              </span>
              <span className="register-terms-agreement__label">2단계 인증(MFA) 설정 동의</span>
              <button
                type="button"
                className="register-terms-agreement__view"
                onClick={() => onViewTerm?.('mfaSetup')}
              >
                보기
              </button>
            </li>
          ) : null}
          {OPTIONAL_TERMS_ITEMS.map(item => {
            const checked = value[item.key]

            return (
              <li key={item.key} className="register-terms-agreement__item">
                <RegisterTermsCheckControl
                  checked={checked}
                  onChange={next => handleItemChange(item.key, next)}
                  ariaLabel={`선택 ${item.label}`}
                />
                <span className="register-terms-agreement__badge register-terms-agreement__badge--optional">
                  선택
                </span>
                <span className="register-terms-agreement__label">{item.label}</span>
                <button
                  type="button"
                  className="register-terms-agreement__view"
                  onClick={() => onViewTerm?.(item.key)}
                >
                  보기
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="register-terms-agreement__footnote-wrapper">
        <p className="register-terms-agreement__footnote">
          선택 항목에 동의하지 않아도 회원가입이 가능합니다.
        </p>
      </div>
    </div>
  )
}
