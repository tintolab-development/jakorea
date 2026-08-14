import { useEffect, useState, type ReactNode } from 'react'
import { PFAlertModal, PFButton } from '@/shared/ui'
import {
  CONSENT_WRITE_INCOMPLETE_ALERT_MESSAGE,
  type InstructorApplyConsentKey,
} from './catalog'
import { CrimeConsentForm } from './crime-form'
import { loadConsentWriteDraft, saveConsentWriteDraft } from './draft-persist'
import { EducatorConsentForm } from './educator-form'
import { markInstructorApplyConsentAgreed } from './form-persist'
import { NoticeConsentForm } from './notice-form'
import { PaymentConsentForm } from './payment-form'
import {
  isCrimeConsentIncomplete,
  isEducatorConsentIncomplete,
  isNoticeConsentIncomplete,
  isPaymentConsentIncomplete,
} from './validate'
import styles from './consent-form.module.css'

function ConsentWriteShell({
  incomplete,
  onComplete,
  consentKey,
  children,
}: {
  incomplete: boolean
  onComplete: () => void
  consentKey: InstructorApplyConsentKey
  children: ReactNode
}) {
  const [alertOpen, setAlertOpen] = useState(false)

  const handleSubmit = () => {
    if (incomplete) {
      setAlertOpen(true)
      return
    }
    markInstructorApplyConsentAgreed(consentKey)
    onComplete()
  }

  return (
    <>
      <form
        className={styles.form}
        onSubmit={event => {
          event.preventDefault()
          handleSubmit()
        }}
      >
        {children}
        <div className={styles.actions}>
          <PFButton size="xlarge" width={240} type="submit">
            작성 완료
          </PFButton>
        </div>
      </form>
      <PFAlertModal
        open={alertOpen}
        title="안내"
        description={CONSENT_WRITE_INCOMPLETE_ALERT_MESSAGE}
        onConfirm={() => setAlertOpen(false)}
      />
    </>
  )
}

function PaymentWrite({ onComplete }: { onComplete: () => void }) {
  const [draft, setDraft] = useState(() => loadConsentWriteDraft('consentPaymentStatement'))
  useEffect(() => {
    saveConsentWriteDraft('consentPaymentStatement', draft)
  }, [draft])

  return (
    <ConsentWriteShell
      consentKey="consentPaymentStatement"
      incomplete={isPaymentConsentIncomplete(draft)}
      onComplete={onComplete}
    >
      <PaymentConsentForm draft={draft} onChange={setDraft} />
    </ConsentWriteShell>
  )
}

function EducatorWrite({ onComplete }: { onComplete: () => void }) {
  const [draft, setDraft] = useState(() => loadConsentWriteDraft('consentEducatorPledge'))
  useEffect(() => {
    saveConsentWriteDraft('consentEducatorPledge', draft)
  }, [draft])

  return (
    <ConsentWriteShell
      consentKey="consentEducatorPledge"
      incomplete={isEducatorConsentIncomplete(draft)}
      onComplete={onComplete}
    >
      <EducatorConsentForm draft={draft} onChange={setDraft} />
    </ConsentWriteShell>
  )
}

function NoticeWrite({ onComplete }: { onComplete: () => void }) {
  const [draft, setDraft] = useState(() => loadConsentWriteDraft('consentAdministrativeJoint'))
  useEffect(() => {
    saveConsentWriteDraft('consentAdministrativeJoint', draft)
  }, [draft])

  return (
    <ConsentWriteShell
      consentKey="consentAdministrativeJoint"
      incomplete={isNoticeConsentIncomplete(draft)}
      onComplete={onComplete}
    >
      <NoticeConsentForm draft={draft} onChange={setDraft} />
    </ConsentWriteShell>
  )
}

function CrimeWrite({ onComplete }: { onComplete: () => void }) {
  const [draft, setDraft] = useState(() => loadConsentWriteDraft('consentSexOffenseCheck'))
  useEffect(() => {
    saveConsentWriteDraft('consentSexOffenseCheck', draft)
  }, [draft])

  return (
    <ConsentWriteShell
      consentKey="consentSexOffenseCheck"
      incomplete={isCrimeConsentIncomplete(draft)}
      onComplete={onComplete}
    >
      <CrimeConsentForm draft={draft} onChange={setDraft} />
    </ConsentWriteShell>
  )
}

export function InstructorApplyConsentWriteForm({
  consentKey,
  onComplete,
}: {
  consentKey: InstructorApplyConsentKey
  onComplete: () => void
}) {
  if (consentKey === 'consentPaymentStatement') {
    return <PaymentWrite onComplete={onComplete} />
  }
  if (consentKey === 'consentEducatorPledge') {
    return <EducatorWrite onComplete={onComplete} />
  }
  if (consentKey === 'consentAdministrativeJoint') {
    return <NoticeWrite onComplete={onComplete} />
  }
  return <CrimeWrite onComplete={onComplete} />
}