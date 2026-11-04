import { useEffect, useState } from 'react'
import { HOMEPAGE_PII_REVEAL_COPY } from '@/shared/lib/homepage-pii'
import { CmsButton } from './cms-button'
import { ConfirmModal } from './confirm-modal'

type Props = {
  canReveal: boolean
  revealed: boolean
  loading?: boolean
  disabled?: boolean
  onReveal: () => void
}

export function HomepagePiiRevealAction({
  canReveal,
  revealed,
  loading = false,
  disabled = false,
  onReveal,
}: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (!canReveal || revealed) setConfirmOpen(false)
  }, [canReveal, revealed])

  if (!canReveal) return null

  return (
    <>
      <CmsButton
        variant="secondary"
        size="large"
        type="button"
        loading={loading}
        disabled={disabled || revealed}
        onClick={() => {
          if (revealed) return
          setConfirmOpen(true)
        }}
      >
        {revealed ? HOMEPAGE_PII_REVEAL_COPY.revealed : HOMEPAGE_PII_REVEAL_COPY.button}
      </CmsButton>
      <ConfirmModal
        open={confirmOpen}
        title={HOMEPAGE_PII_REVEAL_COPY.confirmTitle}
        content={HOMEPAGE_PII_REVEAL_COPY.confirmContent}
        confirmText={HOMEPAGE_PII_REVEAL_COPY.confirmText}
        cancelText={HOMEPAGE_PII_REVEAL_COPY.cancelText}
        confirmLoading={loading}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false)
          onReveal()
        }}
      />
    </>
  )
}
