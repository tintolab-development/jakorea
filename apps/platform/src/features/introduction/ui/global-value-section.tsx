import { Fragment } from 'react'
import { PFText } from '@/shared/ui'
import {
  GLOBAL_VALUE_ITEMS,
  GLOBAL_VALUE_SECTION_TITLE,
  type GlobalValueItem,
} from '../lib/global-value-data'
import styles from './global-value-section.module.css'

function EnglishLines({ lines }: { lines: readonly string[] }) {
  return (
    <>
      {lines.map((line, index) => (
        <Fragment key={line}>
          {index > 0 ? <br /> : null}
          {line}
        </Fragment>
      ))}
    </>
  )
}

function ValueItem({
  item,
  isExpanded,
  isDesktopMotion,
  isFrontier,
}: {
  item: GlobalValueItem
  isExpanded: boolean
  isDesktopMotion: boolean
  isFrontier?: boolean
}) {
  const itemClassName = [
    styles.item,
    isDesktopMotion ? (isExpanded ? styles.isExpanded : styles.isCollapsed) : styles.isStatic,
  ].join(' ')

  return (
    <article
      className={itemClassName}
      aria-current={isDesktopMotion && isFrontier ? 'true' : undefined}
    >
      <div className={styles.contentLeft}>
        <span className={styles.number}>{item.number}</span>
        <h3 className={styles.english}>
          <EnglishLines lines={item.englishTitleLines} />
        </h3>
      </div>
      <div className={styles.contentRight}>
        <img
          className={styles.icon}
          src={item.iconUrl}
          alt=""
          width={84}
          height={84}
          draggable={false}
        />
        <PFText as="p" typo="hd-sm" color="palette-ice" className={styles.korean}>
          {item.koreanTitle}
        </PFText>
      </div>
    </article>
  )
}

export type GlobalValuePanelProps = {
  activeValueIndex?: number
  isDesktopMotion: boolean
  className?: string
}

/** JA Global Value 표현 단위 — 스크롤/accordion index는 IntroductionScroll이 소유 */
export function GlobalValuePanel({
  activeValueIndex = 0,
  isDesktopMotion,
  className,
}: GlobalValuePanelProps) {
  return (
    <div
      className={[
        styles.panel,
        isDesktopMotion ? styles.isAccordion : undefined,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={GLOBAL_VALUE_SECTION_TITLE}
    >
      <div className={styles.inner}>
        <PFText as="h2" typo="page-title" color="white" className={styles.title}>
          {GLOBAL_VALUE_SECTION_TITLE}
        </PFText>

        <div className={styles.list}>
          {GLOBAL_VALUE_ITEMS.map((item, index) => (
            <ValueItem
              key={item.id}
              item={item}
              isExpanded={!isDesktopMotion || index >= activeValueIndex}
              isDesktopMotion={isDesktopMotion}
              isFrontier={isDesktopMotion && index === activeValueIndex}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
