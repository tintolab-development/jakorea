import type { ConsentFormData } from '@/types/consent'

import { RegisterTermsCheckControl } from './register-terms-check-control'
import { RegisterTermsAgreeAllCheckIcon } from './register-terms-check-icon'

type ConsentFieldKey = keyof ConsentFormData

interface TermsItemConfig {
  key: ConsentFieldKey
  required: boolean
  label: string
}

const TERMS_ITEMS: TermsItemConfig[] = [
  { key: 'termsOfService', required: true, label: '서비스 이용약관' },
  { key: 'privacyPolicy', required: true, label: '개인정보 수집·이용 동의' },
  { key: 'marketingConsent', required: false, label: '마케팅 정보 수신 동의' },
]

interface RegisterTermsAgreementProps {
  value: ConsentFormData
  onChange: (value: ConsentFormData) => void
  onViewTerm?: (key: ConsentFieldKey) => void
}

export function RegisterTermsAgreement({
  value,
  onChange,
  onViewTerm,
}: RegisterTermsAgreementProps) {
  const allChecked = TERMS_ITEMS.every(item => value[item.key])

  const handleAgreeAll = () => {
    const nextChecked = !allChecked
    onChange({
      termsOfService: nextChecked,
      privacyPolicy: nextChecked,
      marketingConsent: nextChecked,
    })
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
          aria-pressed={allChecked}
          onClick={handleAgreeAll}
        >
          <span
            className={`register-terms-check register-terms-check--static register-terms-check--agree-all${
              allChecked ? ' register-terms-check--checked' : ''
            }`}
            aria-hidden
          >
            <RegisterTermsAgreeAllCheckIcon checked={allChecked} />
          </span>
          <span className="register-terms-agree-all__label">전체 동의하기</span>
        </button>

        <ul className="register-terms-agreement__list">
          {TERMS_ITEMS.map(item => {
            const checked = value[item.key]

            return (
              <li key={item.key} className="register-terms-agreement__item">
                <RegisterTermsCheckControl
                  checked={checked}
                  onChange={next => handleItemChange(item.key, next)}
                  ariaLabel={`${item.required ? '필수' : '선택'} ${item.label}`}
                />
                <span
                  className={`register-terms-agreement__badge${
                    item.required
                      ? ' register-terms-agreement__badge--required'
                      : ' register-terms-agreement__badge--optional'
                  }`}
                >
                  {item.required ? '필수' : '선택'}
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
          선택 항목에 동의하지 않아도 회원가입은 가능해요.
        </p>
      </div>
    </div>
  )
}
