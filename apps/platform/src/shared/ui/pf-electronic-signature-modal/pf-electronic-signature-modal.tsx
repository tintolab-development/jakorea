import { useCallback, useEffect, useRef, useState } from 'react'
import { PFButton } from '../pf-button'
import { PFModal } from '../pf-modal'
import { PFTabs } from '../pf-tabs'
import { CreateFontPanel, renderCreateSignatureDataUrl } from './create-font-panel'
import { DrawCanvasPanel } from './draw-canvas-panel'
import styles from './pf-electronic-signature-modal.module.css'
import type {
  ElectronicSignatureMode,
  PFElectronicSignatureModalProps,
} from './types'

const TAB_ITEMS = [
  { key: 'draw', label: '서명 그리기' },
  { key: 'create', label: '서명 만들기' },
] as const

export function PFElectronicSignatureModal({
  open,
  onClose,
  onSign,
  initialMode = 'draw',
}: PFElectronicSignatureModalProps) {
  const [mode, setMode] = useState<ElectronicSignatureMode>(initialMode)
  const [drawHasStroke, setDrawHasStroke] = useState(false)
  const [drawResetToken, setDrawResetToken] = useState(0)
  const [createName, setCreateName] = useState('')
  const [selectedStyleCode, setSelectedStyleCode] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const resetAll = useCallback(() => {
    setMode(initialMode)
    setDrawHasStroke(false)
    setDrawResetToken(token => token + 1)
    setCreateName('')
    setSelectedStyleCode(null)
  }, [initialMode])

  useEffect(() => {
    if (!open) return
    resetAll()
  }, [open, resetAll])

  const canSign =
    mode === 'draw'
      ? drawHasStroke
      : Boolean(createName.trim() && selectedStyleCode)

  const handleSign = () => {
    if (!canSign) return

    if (mode === 'draw') {
      const canvas = canvasRef.current
      if (!canvas) return
      onSign({
        mode: 'draw',
        dataUrl: canvas.toDataURL('image/png'),
      })
      onClose()
      return
    }

    if (!selectedStyleCode) return
    void renderCreateSignatureDataUrl({
      name: createName,
      fontStyleCode: selectedStyleCode,
    }).then(dataUrl => {
      if (!dataUrl) return
      onSign({
        mode: 'create',
        dataUrl,
        displayName: createName.trim(),
        fontStyleCode: selectedStyleCode,
      })
      onClose()
    })
  }

  return (
    <PFModal
      open={open}
      title="전자서명하기"
      size="lg"
      mobilePlacement="full"
      onClose={onClose}
    >
      <div
        className={[styles.body, mode === 'create' ? styles.bodyCreate : undefined]
          .filter(Boolean)
          .join(' ')}
      >
        <PFTabs
          variant="pill"
          size="medium"
          ariaLabel="전자서명 방식"
          items={[...TAB_ITEMS]}
          value={mode}
          onChange={key => setMode(key as ElectronicSignatureMode)}
        />

        {mode === 'draw' ? (
          <DrawCanvasPanel
            canvasRef={canvasRef}
            resetToken={drawResetToken}
            onHasStrokeChange={setDrawHasStroke}
          />
        ) : (
          <CreateFontPanel
            name={createName}
            selectedStyleCode={selectedStyleCode}
            onNameChange={value => {
              setCreateName(value)
              if (!value.trim()) setSelectedStyleCode(null)
            }}
            onSelectStyle={setSelectedStyleCode}
          />
        )}

        <div className={styles.footer}>
          <PFButton type="button" variant="secondary" size="xlarge" onClick={onClose}>
            취소
          </PFButton>
          <PFButton
            type="button"
            variant="primary"
            size="xlarge"
            disabled={!canSign}
            onClick={handleSign}
          >
            서명하기
          </PFButton>
        </div>
      </div>
    </PFModal>
  )
}
