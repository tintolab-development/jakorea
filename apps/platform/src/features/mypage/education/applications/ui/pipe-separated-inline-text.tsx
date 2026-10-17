import { PFText } from '@/shared/ui'
import { splitPipeSeparatedParts } from './teacher-application-content/split-pipe-parts'
import styles from './pipe-separated-inline-text.module.css'

type PipeSeparatedInlineTextProps = {
  value: string
  /** 진행 희망 일정 카드 — 앞 날짜·시간 `bd-md-md`, 뒤 차시 등 `bd-md-bd` */
  emphasizeTail?: boolean
  className?: string
  partClassName?: string
}

export function PipeSeparatedInlineText({
  value,
  emphasizeTail = false,
  className,
  partClassName,
}: PipeSeparatedInlineTextProps) {
  const parts = splitPipeSeparatedParts(value)
  if (parts.length === 0) return null

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      {parts.map((part, index) => (
        <span key={`${index}-${part}`} className={styles.partWrap}>
          {index > 0 ? <span className={styles.divider} aria-hidden="true" /> : null}
          {emphasizeTail ? (
            <PFText
              as="span"
              typo={index === 0 ? 'bd-md-md' : 'bd-md-bd'}
              color="black"
              className={partClassName}
            >
              {part}
            </PFText>
          ) : (
            <span className={partClassName}>{part}</span>
          )}
        </span>
      ))}
    </div>
  )
}
