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
}: {
  item: GlobalValueItem
  isExpanded: boolean
  isDesktopMotion: boolean
}) {
  const itemClassName = [
    styles.item,
    isDesktopMotion ? (isExpanded ? styles.isExpanded : styles.isCollapsed) : styles.isStatic,
  ].join(' ')

  return (
    <article className={itemClassName} aria-current={isExpanded ? 'true' : undefined}>
      <div className={styles.itemHeader}>
        <PFText as="span" typo="bd-md-md" color="white" className={styles.number}>
          {item.number}
        </PFText>
        <PFText as="p" typo="bd-lg-sb" color="white" className={styles.koreanCollapsed}>
          {item.koreanTitle}
        </PFText>
      </div>

      <div className={styles.itemBody}>
        <div className={styles.itemBodyInner}>
          <PFText as="h3" typo="hl-lg-md" color="white" className={styles.english}>
            <EnglishLines lines={item.englishTitleLines} />
          </PFText>
          <div className={styles.meta}>
            <img
              className={styles.icon}
              src={item.iconUrl}
              alt=""
              width={84}
              height={84}
              draggable={false}
            />
            <PFText as="p" typo="bd-lg-sb" color="white" className={styles.korean}>
              {item.koreanTitle}
            </PFText>
          </div>
        </div>
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
        <PFText as="h2" typo="hd-sm" color="white" className={styles.title}>
          {GLOBAL_VALUE_SECTION_TITLE}
        </PFText>

        <div className={styles.list}>
          {GLOBAL_VALUE_ITEMS.map((item, index) => (
            <ValueItem
              key={item.id}
              item={item}
              isExpanded={!isDesktopMotion || index === activeValueIndex}
              isDesktopMotion={isDesktopMotion}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
