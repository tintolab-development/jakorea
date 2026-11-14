import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  PFElectronicSignatureEditConfirm,
  PFElectronicSignatureModal,
} from '../pf-electronic-signature-modal'
import { createFormSignatureValue } from '../pf-form-signature-block/normalize-form-signature'
import type { FormSignatureValue } from '../pf-form-signature-block/types'
import { PFFormDraftSignatureContext } from './context'

const MODAL_TITLE_CREATE = '전자서명하기'
const MODAL_TITLE_EDIT = '전자서명 수정하기'

function cloneProfileForApply(profile: FormSignatureValue): FormSignatureValue {
  return {
    ...profile,
    signedAt: new Date().toISOString(),
  }
}

export type PFFormDraftSignatureProviderProps = {
  children: ReactNode
  readOnly?: boolean
  /** 제목 「전자서명 수정하기」 확인 후 — 본문에 찍힌 서명 전부 해제 */
  onClearAllSignatureSlots?: () => void
}

/**
 * 제목 행에서 만든 전자서명 프로필을 보관한다.
 * 본문 서명란은 자동 채우지 않고, 각 「서명하기」 클릭 시 이 프로필을 해당 칸에만 적용한다.
 */
export function PFFormDraftSignatureProvider({
  children,
  readOnly = false,
  onClearAllSignatureSlots,
}: PFFormDraftSignatureProviderProps) {
  const [draftProfile, setDraftProfile] = useState<FormSignatureValue | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [headerEditConfirmOpen, setHeaderEditConfirmOpen] = useState(false)
  const pendingSlotApplyRef = useRef<((profile: FormSignatureValue) => void) | null>(null)

  const hasDraftProfile = draftProfile != null
  const modalTitle = hasDraftProfile ? MODAL_TITLE_EDIT : MODAL_TITLE_CREATE

  const clearPendingSlotApply = useCallback(() => {
    pendingSlotApplyRef.current = null
  }, [])

  const openCreate = useCallback(
    (options?: { applyToSlot?: (profile: FormSignatureValue) => void }) => {
      if (readOnly) return
      pendingSlotApplyRef.current = options?.applyToSlot ?? null
      setModalOpen(true)
    },
    [readOnly],
  )

  const requestTitleEdit = useCallback(() => {
    if (readOnly) return
    clearPendingSlotApply()
    if (hasDraftProfile) {
      setHeaderEditConfirmOpen(true)
      return
    }
    setModalOpen(true)
  }, [clearPendingSlotApply, hasDraftProfile, readOnly])

  const contextValue = useMemo(
    () => ({
      readOnly,
      hasDraftProfile,
      getDraftProfile: () => draftProfile,
      cloneProfileForApply,
      openCreate,
      requestTitleEdit,
    }),
    [draftProfile, hasDraftProfile, openCreate, readOnly, requestTitleEdit],
  )

  return (
    <PFFormDraftSignatureContext.Provider value={contextValue}>
      {children}
      {!readOnly ? (
        <>
          <PFElectronicSignatureModal
            open={modalOpen}
            title={modalTitle}
            onClose={() => {
              clearPendingSlotApply()
              setModalOpen(false)
            }}
            onSign={result => {
              const profile = createFormSignatureValue(result)
              setDraftProfile(profile)
              const applyToSlot = pendingSlotApplyRef.current
              clearPendingSlotApply()
              if (applyToSlot) {
                applyToSlot(cloneProfileForApply(profile))
              }
              setModalOpen(false)
            }}
          />
          <PFElectronicSignatureEditConfirm
            open={headerEditConfirmOpen}
            onCancel={() => setHeaderEditConfirmOpen(false)}
            onConfirm={() => {
              setHeaderEditConfirmOpen(false)
              onClearAllSignatureSlots?.()
              setDraftProfile(null)
              setModalOpen(true)
            }}
          />
        </>
      ) : null}
    </PFFormDraftSignatureContext.Provider>
  )
}
