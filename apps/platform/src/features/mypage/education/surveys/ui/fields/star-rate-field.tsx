import type { StarRateParagraph } from '@jakorea/form-schema/writing-form'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import styles from '../survey-fields.module.css'

const STAR_PATH =
  'M21.8747 3.63155L25.6557 11.2925C25.9597 11.9095 26.5487 12.3365 27.2287 12.4355L35.6837 13.6645C37.3977 13.9135 38.0817 16.0195 36.8417 17.2285L30.7237 23.1915C30.2317 23.6715 30.0067 24.3635 30.1227 25.0415L31.5667 33.4615C31.8597 35.1685 30.0677 36.4705 28.5347 35.6645L20.9727 31.6885C20.3637 31.3685 19.6367 31.3685 19.0277 31.6885L11.4657 35.6645C9.93265 36.4705 8.14065 35.1685 8.43365 33.4615L9.87765 25.0415C9.99365 24.3635 9.76965 23.6725 9.27665 23.1915L3.15865 17.2285C1.91865 16.0195 2.60265 13.9135 4.31665 13.6645L12.7717 12.4355C13.4527 12.3365 14.0407 11.9095 14.3447 11.2925L18.1257 3.63155C18.8917 2.07855 21.1067 2.07855 21.8737 3.63155H21.8747Z'

const STAR_COUNT = 5

function StarIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
        <path d={STAR_PATH} fill="#FFCD00" />
      </svg>
    )
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
      <g opacity={0.6}>
        <path d={STAR_PATH} fill="white" />
        <path d={STAR_PATH} fill="#22404B" fillOpacity={0.2} />
      </g>
    </svg>
  )
}

type SurveyStarRateFieldProps = {
  paragraph: StarRateParagraph
  onUpdateParagraph: FormUpdateParagraph
}

export function SurveyStarRateField({ paragraph, onUpdateParagraph }: SurveyStarRateFieldProps) {
  const rating = paragraph.selectedPreviewStars ?? 0

  return (
    <div className={styles.starRow} role="group" aria-label="별점">
      {Array.from({ length: STAR_COUNT }, (_, index) => {
        const starIndex = index + 1
        return (
          <button
            key={starIndex}
            type="button"
            className={styles.starButton}
            aria-label={`${starIndex}점`}
            aria-pressed={starIndex <= rating}
            onClick={() => {
              onUpdateParagraph(paragraph.id, current =>
                current.kind === 'single_item' && current.variant === 'star_rate'
                  ? { ...current, selectedPreviewStars: starIndex }
                  : current,
              )
            }}
          >
            <StarIcon filled={starIndex <= rating} />
          </button>
        )
      })}
    </div>
  )
}
