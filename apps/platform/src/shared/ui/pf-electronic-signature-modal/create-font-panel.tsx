import { useEffect } from 'react'
import { PFText } from '../pf-text'
import { PFTextInput } from '../pf-text-input'
import signatureCreateIconUrl from '@/assets/autograph/icon-signature-create.png'
import {
  SIGNATURE_FONT_STYLES,
  SIGNATURE_GOOGLE_FONTS_HREF,
} from './signature-fonts'
import styles from './pf-electronic-signature-modal.module.css'

type CreateFontPanelProps = {
  name: string
  selectedStyleCode: string | null
  onNameChange: (value: string) => void
  onSelectStyle: (code: string) => void
}

function ensureSignatureFontsLoaded() {
  const id = 'pf-electronic-signature-fonts'
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = SIGNATURE_GOOGLE_FONTS_HREF
  document.head.appendChild(link)
}

export function CreateFontPanel({
  name,
  selectedStyleCode,
  onNameChange,
  onSelectStyle,
}: CreateFontPanelProps) {
  const trimmed = name.trim()
  const hasName = trimmed.length > 0

  useEffect(() => {
    ensureSignatureFontsLoaded()
  }, [])

  return (
    <div className={styles.panelBodyCreate}>
      <div className={styles.createHeader}>
        <PFText as="p" typo="label-md" color="neutral-warm-600" className={styles.guide}>
          전자서명에 사용할 이름을 입력해 주세요.
        </PFText>
        <PFTextInput
          className={styles.fullWidthField}
          size="large"
          value={name}
          placeholder="예) 홍길동"
          aria-label="전자서명에 사용할 이름"
          onValueChange={onNameChange}
        />
      </div>

      {hasName ? (
        <div className={styles.fontGrid} role="listbox" aria-label="서명 스타일">
          {SIGNATURE_FONT_STYLES.map(style => {
            const selected = selectedStyleCode === style.code
            return (
              <button
                key={style.code}
                type="button"
                role="option"
                aria-selected={selected}
                className={[styles.fontCard, selected ? styles.fontCardSelected : undefined]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onSelectStyle(style.code)}
              >
                <span
                  className={styles.fontPreview}
                  style={{ fontFamily: style.family, fontWeight: style.weight }}
                >
                  {trimmed}
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className={styles.createEmpty}>
          <img
            className={styles.emptyIcon}
            src={signatureCreateIconUrl}
            alt=""
            aria-hidden="true"
          />
          <PFText as="span" typo="hl-lg" color="neutral-cool-500" className={styles.emptyHint}>
            전자서명에 사용할 이름을 입력해 주세요.
          </PFText>
        </div>
      )}
    </div>
  )
}

export function renderCreateSignatureDataUrl(args: {
  name: string
  fontStyleCode: string
}): string | null {
  const style = SIGNATURE_FONT_STYLES.find(item => item.code === args.fontStyleCode)
  if (!style) return null

  const width = 720
  const height = 240
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#1a1a1a'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `${style.weight} 72px ${style.family}`
  ctx.fillText(args.name.trim(), width / 2, height / 2)
  return canvas.toDataURL('image/png')
}
