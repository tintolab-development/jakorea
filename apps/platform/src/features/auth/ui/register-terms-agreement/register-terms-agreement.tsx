import type { SignUpConsentFieldKey, SignUpConsentState } from '../../sign-up/model/consent.types'
import type { TermsViewType } from '../../model/terms-view.types'
import styles from './register-terms-agreement.module.css'

type TermsItemConfig = {
  key: SignUpConsentFieldKey
  viewType: TermsViewType
  required: boolean
  label: string
  showViewButton: boolean
}

const TERMS_ITEMS: TermsItemConfig[] = [
  {
    key: 'serviceTerms',
    viewType: 'serviceTerms',
    required: true,
    label: '서비스 이용약관',
    showViewButton: true,
  },
  {
    key: 'privacyCollection',
    viewType: 'privacyCollection',
    required: true,
    label: '개인정보 수집·이용 동의',
    showViewButton: true,
  },
  {
    key: 'mfaSetup',
    viewType: 'mfaSetup',
    required: true,
    label: '2단계 인증(MFA) 설정 동의',
    showViewButton: true,
  },
  {
    key: 'marketing',
    viewType: 'marketing',
    required: false,
    label: '마케팅 정보 수신 동의',
    showViewButton: true,
  },
]

type RegisterTermsAgreementProps = {
  value: SignUpConsentState
  allChecked: boolean
  onToggleAll: () => void
  onFieldChange: (key: SignUpConsentFieldKey, checked: boolean) => void
  onViewTerm: (type: TermsViewType) => void
}

function TermsCheckbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={[styles.checkbox, checked ? styles.checkboxChecked : undefined]
        .filter(Boolean)
        .join(' ')}
      aria-hidden="true"
    >
      {checked ? '✓' : null}
    </span>
  )
}

export function RegisterTermsAgreement({
  value,
  allChecked,
  onToggleAll,
  onFieldChange,
  onViewTerm,
}: RegisterTermsAgreementProps) {
  return (
    <div className={styles.card}>
      <button
        type="button"
        className={styles.agreeAllButton}
        aria-pressed={allChecked}
        onClick={onToggleAll}
      >
        <TermsCheckbox checked={allChecked} />
        <span className={styles.agreeAllLabel}>전체 동의하기</span>
      </button>

      <ul className={styles.list}>
        {TERMS_ITEMS.map(item => {
          const checked = value[item.key]

          return (
            <li key={item.key} className={styles.item}>
              <button
                type="button"
                className={styles.itemButton}
                onClick={() => onFieldChange(item.key, !checked)}
              >
                <TermsCheckbox checked={checked} />
                <span
                  className={[
                    styles.badge,
                    item.required ? styles.badgeRequired : styles.badgeOptional,
                  ].join(' ')}
                >
                  {item.required ? '필수' : '선택'}
                </span>
                <span className={styles.label}>{item.label}</span>
              </button>
              {item.showViewButton ? (
                <button
                  type="button"
                  className={styles.viewButton}
                  onClick={() => onViewTerm(item.viewType)}
                >
                  보기
                </button>
              ) : null}
            </li>
          )
        })}
      </ul>

      <p className={styles.footnote}>선택 항목에 동의하지 않아도 회원가입은 가능해요.</p>
    </div>
  )
}
