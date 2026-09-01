import { useEffect } from 'react'
import { PFText } from '../pf-text'
import { PFTextInput } from '../pf-text-input'
import signatureCreateIconUrl from '@/assets/autograph/icon-signature-create.png'
import { SIGNATURE_FONT_STYLES, ensureSignatureFontsReady } from './signature-fonts'
import styles from './pf-electronic-signature-modal.module.css'

type CreateFontPanelProps = {
  name: string
  selectedStyleCode: string | null
  onNameChange: (value: string) => void
  onSelectStyle: (code: string) => void
}

function ensureSignatureFontsLoaded() {
  void ensureSignatureFontsReady()
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

const SIGNATURE_RENDER_FONT_SIZE = 96

export async function renderCreateSignatureDataUrl(args: {
  name: string
  fontStyleCode: string
}): Promise<string | null> {
  const style = SIGNATURE_FONT_STYLES.find(item => item.code === args.fontStyleCode)
  if (!style) return null

  const text = args.name.trim()
  if (!text) return null

  try {
    await ensureSignatureFontsReady()
  } catch {
    /* 폰트 로드 실패 — fallback 폰트로 렌더 */
  }

  // 서명 폰트를 못 쓰는 경우에도 shorthand가 유효해야 크기가 유지된다
  const font = `${style.weight} ${SIGNATURE_RENDER_FONT_SIZE}px ${style.family}, sans-serif`

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.font = font
  const metrics = ctx.measureText(text)
  const ascent = metrics.actualBoundingBoxAscent || SIGNATURE_RENDER_FONT_SIZE * 0.8
  const descent = metrics.actualBoundingBoxDescent || SIGNATURE_RENDER_FONT_SIZE * 0.3
  const paddingX = Math.round(SIGNATURE_RENDER_FONT_SIZE * 0.15)
  const paddingY = Math.round(SIGNATURE_RENDER_FONT_SIZE * 0.15)

  // 표시 시 높이에 맞춰 축소되므로 텍스트 크기에 맞는 캔버스로 렌더
  canvas.width = Math.ceil(Math.max(metrics.width, SIGNATURE_RENDER_FONT_SIZE)) + paddingX * 2
  canvas.height = Math.ceil(ascent + descent) + paddingY * 2

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.font = font
  ctx.fillStyle = '#1a1a1a'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)
  return canvas.toDataURL('image/png')
}
