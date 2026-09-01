import { useState } from 'react'
import { TermsViewModal, useTermsViewModal } from '@/features/auth'
import { PFButton, PFStateBadge, PFText, PFToggle } from '@/shared/ui'
import {
  BASIC_CONSENT_ITEMS,
  INSTRUCTOR_DOCUMENT_CONSENT_ITEMS,
  type SettingsConsentItem,
} from '../lib/consent-catalog'
import styles from './consents-view.module.css'

export type SettingsConsentsViewProps = {
  showInstructorDocuments: boolean
}

function ConsentRequirementLabel({ required }: { required: boolean }) {
  return (
    <PFText typo="bd-md-sb" color={required ? 'primary-500' : 'neutral-cool-500'}>
      {required ? '필수' : '선택'}
    </PFText>
  )
}

function ConsentStatusBadge({ agreed }: { agreed: boolean }) {
  return (
    <PFStateBadge size="small" tone={agreed ? 'progress' : 'disabled'}>
      {agreed ? '동의함' : '미동의'}
    </PFStateBadge>
  )
}

function ConsentCard({
  item,
  marketingAgreed,
  onMarketingChange,
  onViewTerms,
}: {
  item: SettingsConsentItem
  marketingAgreed: boolean
  onMarketingChange: (next: boolean) => void
  onViewTerms: (item: SettingsConsentItem) => void
}) {
  const agreed = item.kind === 'toggle' ? marketingAgreed : item.agreed
  const cardClassName = [
    styles.card,
    item.required ? styles.cardRequired : styles.cardOptional,
  ].join(' ')

  return (
    <article className={cardClassName}>
      <div className={styles.cardHeader}>
        <div className={styles.titleGroup}>
          <ConsentRequirementLabel required={item.required} />
          <PFText typo="bd-md-sb" color="black">
            {item.title}
          </PFText>
        </div>
        <div className={styles.headerActions}>
          {item.termsViewType ? (
            <PFButton
              size="small"
              variant="text"
              className={styles.termsViewButton}
              onClick={() => onViewTerms(item)}
            >
              약관 보기
            </PFButton>
          ) : null}
        </div>
      </div>

      <div className={styles.statusRow}>
        <div className={styles.statusInfo}>
          <ConsentStatusBadge agreed={agreed} />
          {item.kind === 'document' && agreed && (item.agreedAt || item.validityLabel) ? (
            <PFText typo="bd-sm-rg" color="neutral-cool-500">
              {[
                item.agreedAt ? `동의일시 ${item.agreedAt}` : null,
                item.validityLabel ? `유효기간 ${item.validityLabel}` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </PFText>
          ) : null}
          {item.kind !== 'document' && agreed && item.agreedAt ? (
            <PFText typo="bd-sm-rg" color="black">
              동의일시 {item.agreedAt}
            </PFText>
          ) : null}
          {!agreed && item.hint ? (
            <PFText typo="bd-sm-rg" color="neutral-cool-500">
              {item.hint}
            </PFText>
          ) : null}
        </div>
        {item.kind === 'toggle' ? (
          <PFToggle
            variant="switch"
            checked={marketingAgreed}
            onChange={onMarketingChange}
            aria-label={`${item.title} ${marketingAgreed ? '동의' : '미동의'}`}
            className={styles.statusToggle}
          />
        ) : null}
      </div>

      {item.kind === 'document' && agreed ? (
        <div className={styles.actions}>
          <PFButton size="small" variant="tertiary" className={styles.actionButton}>
            동의 철회
          </PFButton>
          <PFButton size="small" variant="tertiary" className={styles.actionButton}>
            동의서 확인
          </PFButton>
          <PFButton size="small" variant="primary" className={styles.actionButton}>
            동의서 재작성
          </PFButton>
        </div>
      ) : null}

      {item.kind === 'document' && !agreed ? (
        <div className={styles.actions}>
          <PFButton size="small" variant="primary" width="100%">
            동의서 작성
          </PFButton>
        </div>
      ) : null}
    </article>
  )
}

export function SettingsConsentsView({ showInstructorDocuments }: SettingsConsentsViewProps) {
  const terms = useTermsViewModal()
  const marketingItem = BASIC_CONSENT_ITEMS.find(item => item.id === 'marketing')
  const [marketingAgreed, setMarketingAgreed] = useState(marketingItem?.agreed ?? false)

  return (
    <div className={styles.page}>
      <section className={styles.section}>
        <PFText as="h2" typo="hl-lg" color="black" className={styles.sectionTitle}>
          기본 동의항목
        </PFText>
        {BASIC_CONSENT_ITEMS.map(item => (
          <ConsentCard
            key={item.id}
            item={item}
            marketingAgreed={marketingAgreed}
            onMarketingChange={setMarketingAgreed}
            onViewTerms={next => {
              if (next.termsViewType) terms.open(next.termsViewType)
            }}
          />
        ))}
      </section>

      {showInstructorDocuments ? (
        <section className={styles.section}>
          <PFText as="h2" typo="hl-lg" color="black" className={styles.sectionTitle}>
            동의서·서약서
          </PFText>
          {INSTRUCTOR_DOCUMENT_CONSENT_ITEMS.map(item => (
            <ConsentCard
              key={item.id}
              item={item}
              marketingAgreed={marketingAgreed}
              onMarketingChange={setMarketingAgreed}
              onViewTerms={next => {
                if (next.termsViewType) terms.open(next.termsViewType)
              }}
            />
          ))}
        </section>
      ) : null}

      {terms.openType ? (
        <TermsViewModal open={terms.isOpen} type={terms.openType} onClose={terms.close} />
      ) : null}
    </div>
  )
}
