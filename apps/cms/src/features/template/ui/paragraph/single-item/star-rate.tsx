import { useEffect, useRef } from 'react'
import type { StarRateParagraph } from '@/features/template/model/writing-form-draft.schema'
import type { ParagraphBodyInteractionMode } from '@/features/template/ui/paragraph/paragraph-body-interaction-mode'
import './star-rate.css'

const STAR_PATH =
  'M21.8747 3.63155L25.6557 11.2925C25.9597 11.9095 26.5487 12.3365 27.2287 12.4355L35.6837 13.6645C37.3977 13.9135 38.0817 16.0195 36.8417 17.2285L30.7237 23.1915C30.2317 23.6715 30.0067 24.3635 30.1227 25.0415L31.5667 33.4615C31.8597 35.1685 30.0677 36.4705 28.5347 35.6645L20.9727 31.6885C20.3637 31.3685 19.6367 31.3685 19.0277 31.6885L11.4657 35.6645C9.93265 36.4705 8.14065 35.1685 8.43365 33.4615L9.87765 25.0415C9.99365 24.3635 9.76965 23.6725 9.27665 23.1915L3.15865 17.2285C1.91865 16.0195 2.60265 13.9135 4.31665 13.6645L12.7717 12.4355C13.4527 12.3365 14.0407 11.9095 14.3447 11.2925L18.1257 3.63155C18.8917 2.07855 21.1067 2.07855 21.8737 3.63155H21.8747Z'

function StarIconGray() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
      <g opacity={0.6}>
        <path d={STAR_PATH} fill="white" />
        <path d={STAR_PATH} fill="#22404B" fillOpacity={0.2} />
      </g>
    </svg>
  )
}

function StarIconYellow() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
      <path d={STAR_PATH} fill="#FFCD00" />
    </svg>
  )
}

const STAR_COUNT = 5

function clampRating(n: number | null | undefined): number {
  if (n == null || Number.isNaN(n)) return 0
  return Math.min(STAR_COUNT, Math.max(0, Math.floor(n)))
}

/** 별점형 (star_rate) — 비편집 시 항상 회색만; 단락 선택 시에만 노란 별·클릭 반영 */
export function StarRate({
  paragraph,
  onChange,
  isCardSelected,
  isBodyInteractive,
  paragraphInteractionMode = 'authoring',
}: {
  paragraph: StarRateParagraph
  onChange?: (next: StarRateParagraph) => void
  /** 단락 카드 선택 — authoring 시 카드 선택 진입에 따른 미리보기 정리 */
  isCardSelected: boolean
  /** 별 클릭·노란 별 표시 — user 모드에서는 카드 비선택이어도 true일 수 있음 */
  isBodyInteractive: boolean
  paragraphInteractionMode?: ParagraphBodyInteractionMode
}) {
  /** 마운트 직후 `isCardSelected===true`여도 기존과 같이 “선택 진입”으로 한 번 잡히도록 false에서 시작 */
  const prevCardSelected = useRef(false)

  useEffect(() => {
    const enteringCardSelected = isCardSelected && !prevCardSelected.current
    prevCardSelected.current = isCardSelected
    if (paragraphInteractionMode !== 'authoring') return
    if (!enteringCardSelected || !onChange) return
    if (paragraph.selectedPreviewStars == null) return
    onChange({ ...paragraph, selectedPreviewStars: null })
  }, [isCardSelected, paragraphInteractionMode, onChange, paragraph])

  const storedRating = clampRating(paragraph.selectedPreviewStars ?? null)
  const displayRating = isBodyInteractive ? storedRating : 0

  const setRating = (next: number) => {
    if (!onChange) return
    onChange({ ...paragraph, selectedPreviewStars: next })
  }

  return (
    <div className="star-rate-body" role="group" aria-label="별점">
      {Array.from({ length: STAR_COUNT }, (_, i) => {
        const starIndex = i + 1
        const filled = starIndex <= displayRating
        return (
          <button
            key={starIndex}
            type="button"
            className="star-rate-body__star"
            disabled={!isBodyInteractive}
            aria-label={`${starIndex}점`}
            aria-pressed={filled}
            onClick={() => {
              if (!isBodyInteractive) return
              setRating(starIndex)
            }}
          >
            {filled ? <StarIconYellow /> : <StarIconGray />}
          </button>
        )
      })}
    </div>
  )
}
