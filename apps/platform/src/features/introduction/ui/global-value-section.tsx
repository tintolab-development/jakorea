import { Fragment, useLayoutEffect, useRef, type ReactNode } from 'react'
import { PFText } from '@/shared/ui'
import { GLOBAL_VALUE_SECTION_TITLE, type GlobalValueItem } from '../lib/global-value-data'
import type { IntroductionWorldwideContent } from '../model/types'
import styles from './global-value-section.module.css'
import { JaWorldwideSection } from './ja-worldwide-section'

function EnglishLines({ lines }: { lines: readonly string[] }) {
  return (
    <>
      {lines.map((line, index) => (
        <Fragment key={`${index}-${line}`}>
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
          <span className={styles.englishInner}>
            <EnglishLines lines={item.englishTitleLines} />
          </span>
        </h3>
      </div>
      <div className={styles.contentRight}>
        <img
          className={styles.icon}
          src={item.iconUrl}
          alt=""
          width={84}
          height={84}
          decoding="async"
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
  items,
  activeValueIndex,
  isDesktopMotion,
  afterList,
}: {
  items: readonly GlobalValueItem[]
  activeValueIndex: number
  isDesktopMotion: boolean
  afterList?: ReactNode
}) {
  const listRef = useRef<HTMLDivElement>(null)
  const isLastStage = isDesktopMotion && items.length > 1 && activeValueIndex >= items.length - 1

  /*
   * 마지막 단계: 06은 콘텐츠 높이 유지 → list가 넘치면 넘친 만큼 행을 위로 올린다.
   * 05 접힘 transition 중간값이 아닌 최종 높이가 필요하므로, 같은 자리에 숨긴 복제본으로 측정한다
   * (복제본은 transition 시작 상태가 없어 바로 최종 레이아웃).
   */
  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    if (!isLastStage) {
      list.style.setProperty('--value-shift', '0px')
      return
    }

    const measure = () => {
      const listHeight = list.clientHeight
      const clone = list.cloneNode(true) as HTMLDivElement
      clone.setAttribute('aria-hidden', 'true')
      clone.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;left:0;width:${list.clientWidth}px;height:${listHeight}px;`
      list.parentElement?.appendChild(clone)
      const last = clone.lastElementChild
      const contentBottom = last ? last.getBoundingClientRect().bottom - clone.getBoundingClientRect().top : 0
      clone.remove()
      const shift = Math.max(0, Math.ceil(contentBottom - listHeight))
      list.style.setProperty('--value-shift', `${shift}px`)
    }

    measure()
    if (typeof ResizeObserver === 'undefined') return
    let width = list.clientWidth
    let height = list.clientHeight
    const observer = new ResizeObserver(() => {
      if (list.clientWidth === width && list.clientHeight === height) return
      width = list.clientWidth
      height = list.clientHeight
      measure()
    })
    observer.observe(list)
    return () => observer.disconnect()
  }, [isLastStage])

  return (
    <div className={styles.inner}>
      <h2 className={styles.title}>{GLOBAL_VALUE_SECTION_TITLE}</h2>

      {/* 접힌 항목 존재 여부를 클래스로 전달 — `:has()` 스타일 무효화 비용 회피 */}
      <div
        ref={listRef}
        className={
          isDesktopMotion && activeValueIndex > 0
            ? `${styles.list} ${styles.hasCollapsed}`
            : styles.list
        }
      >
        {items.map((item, index) => (
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
  items: readonly GlobalValueItem[]
  worldwide: IntroductionWorldwideContent
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
  items,
  worldwide,
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
            items={items}
            activeValueIndex={activeValueIndex}
            isDesktopMotion={isDesktopMotion}
          />
          <JaWorldwideSection worldwide={worldwide} />
        </>
      ) : (
        <ValueListBlock
          items={items}
          activeValueIndex={activeValueIndex}
          isDesktopMotion={isDesktopMotion}
          afterList={
            withWorldwide ? (
              <div className={styles.worldwideSlot}>
                <JaWorldwideSection worldwide={worldwide} />
              </div>
            ) : null
          }
        />
      )}
    </div>
  )
}
