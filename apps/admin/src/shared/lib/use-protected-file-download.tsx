import { useCallback, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import type { ContainedPiiType } from '@jakorea/domain/shared/file-download-password'
import type { ProtectedFileDownloadKind } from '@jakorea/domain/shared/protected-file-download-kinds'
import { FilePasswordSetupModal } from '@/shared/ui/file-password-setup-modal'

export type RunProtectedFileDownloadInput = {
  kind: ProtectedFileDownloadKind
  containedPiiTypes?: readonly ContainedPiiType[] | null
  zIndex?: number
  download: (password: string) => Promise<void>
}

function ProtectedFileDownloadHost({
  bind,
}: {
  bind: MutableRefObject<(input: RunProtectedFileDownloadInput) => void>
}) {
  const [session, setSession] = useState<RunProtectedFileDownloadInput | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const sessionRef = useRef(session)
  const confirmLoadingRef = useRef(confirmLoading)
  sessionRef.current = session
  confirmLoadingRef.current = confirmLoading

  useLayoutEffect(() => {
    bind.current = input => {
      setSession(input)
    }
  }, [bind])

  const close = useCallback(() => {
    if (confirmLoadingRef.current) return
    setSession(null)
  }, [])

  const handleConfirm = useCallback(async (password: string) => {
    const current = sessionRef.current
    if (!current || confirmLoadingRef.current) return
    setConfirmLoading(true)
    try {
      await current.download(password)
      setSession(null)
    } finally {
      setConfirmLoading(false)
    }
  }, [])

  return (
    <FilePasswordSetupModal
      open={session != null}
      kind={session?.kind ?? 'HOMEPAGE_PII_ATTACHMENT'}
      containedPiiTypes={session?.containedPiiTypes}
      confirmLoading={confirmLoading}
      zIndex={session?.zIndex}
      onCancel={close}
      onConfirm={handleConfirm}
    />
  )
}

export function useProtectedFileDownload() {
  const bind = useRef<(input: RunProtectedFileDownloadInput) => void>(() => undefined)
  const filePasswordModal = useMemo(() => <ProtectedFileDownloadHost bind={bind} />, [bind])
  const runProtectedDownload = useCallback((input: RunProtectedFileDownloadInput) => {
    bind.current(input)
  }, [])
  return { runProtectedDownload, filePasswordModal }
}
