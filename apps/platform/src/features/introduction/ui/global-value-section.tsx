import { Fragment, type ReactNode } from 'react'
import { PFText } from '@/shared/ui'
import {
  GLOBAL_VALUE_ITEMS,
  GLOBAL_VALUE_SECTION_TITLE,
  type GlobalValueItem,
} from '../lib/global-value-data'
import styles from './global-value-section.module.css'
import { JaWorldwideSection } from './ja-worldwide-section'

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

function ValueListBlock({
  activeValueIndex,
  isDesktopMotion,
  afterList,
}: {
  activeValueIndex: number
  isDesktopMotion: boolean
  afterList?: ReactNode
}) {
  return (
    <div className={styles.inner}>
      <h2 className={styles.title}>{GLOBAL_VALUE_SECTION_TITLE}</h2>

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

      {afterList}
    </div>
  )
}

export type GlobalValuePanelProps = {
  activeValueIndex?: number
  isDesktopMotion: boolean
  /**
   * JA Worldwide를 `.list` 다음(연속 배경)에 포함할지.
   * Mobile: `.list` 바로 다음 형제.
   * Desktop accordion: `.inner`(list) 다음 형제 — sticky viewport overflow에 안 잘리게 panel 하위 배치.
   */
  withWorldwide?: boolean
  className?: string
}

/** JA Global Value 표현 단위 — 스크롤/accordion index는 IntroductionScroll이 소유 */
export function GlobalValuePanel({
  activeValueIndex = 0,
  isDesktopMotion,
  withWorldwide = false,
  className,
}: GlobalValuePanelProps) {
  return (
    <div
      className={[
        styles.panel,
        isDesktopMotion ? styles.isAccordion : undefined,
        withWorldwide ? styles.withWorldwide : undefined,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={GLOBAL_VALUE_SECTION_TITLE}
    >
      {isDesktopMotion && withWorldwide ? (
        <>
          {/*
            Desktop: accordion flex(.inner)와 Worldwide를 분리해 overflow:hidden에 안 잘리게 함.
            둘 다 같은 .panel 하위 → primary-700·그라데이션 연속.
          */}
          <ValueListBlock
            activeValueIndex={activeValueIndex}
            isDesktopMotion={isDesktopMotion}
          />
          <JaWorldwideSection />
        </>
      ) : (
        <ValueListBlock
          activeValueIndex={activeValueIndex}
          isDesktopMotion={isDesktopMotion}
          afterList={
            withWorldwide ? (
              <div className={styles.worldwideSlot}>
                <JaWorldwideSection />
              </div>
            ) : null
          }
        />
      )}
    </div>
  )
}
