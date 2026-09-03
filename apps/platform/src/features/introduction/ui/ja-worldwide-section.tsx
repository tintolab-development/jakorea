import { useCallback, useState, type CSSProperties, type FocusEvent } from 'react'
import arrowDiagonalBlackUrl from '@/shared/assets/icons/arrow-diagonal-black.svg?url'
import arrowDiagonalWhiteUrl from '@/shared/assets/icons/arrow-diagonal-white-24.svg?url'
import { useMediaQuery } from '@/shared/hooks/use-media-query'
import { platformMediaQueries } from '@/shared/lib/breakpoints'
import { PFText } from '@/shared/ui'
import {
  JA_WORLDWIDE_DESCRIPTION,
  JA_WORLDWIDE_EYEBROW,
  JA_WORLDWIDE_GLOBAL_LINK,
  JA_WORLDWIDE_GUIDE,
  JA_WORLDWIDE_REGIONS,
  JA_WORLDWIDE_STAT,
  type JaWorldwideRegionId,
} from '../lib/ja-worldwide-data'
import awardsImageUrl01 from '../image/worldwide-awards-01.svg?url'
import awardsImageUrl02 from '../image/worldwide-awards-02.svg?url'
import { JaWorldwideMap } from './ja-worldwide-map'
import styles from './ja-worldwide-section.module.css'

/**
 * JA Global Value `.list` 다음 콘텐츠 블록.
 * sticky/스크롤 하이재킹 없음 — Global Value panel 연속 배경 안에서 일반 document scroll.
 */
export function JaWorldwideSection() {
  const isBelowPc = useMediaQuery(platformMediaQueries.belowPc)

  /** Desktop hover / focus — Mobile selected와 분리 */
  const [hoveredRegionId, setHoveredRegionId] = useState<JaWorldwideRegionId | null>(null)
  /** Mobile tap 선택 — 다른 region 선택 전까지 유지 */
  const [selectedRegionId, setSelectedRegionId] = useState<JaWorldwideRegionId | null>(null)

  const activeRegionId = isBelowPc ? selectedRegionId : hoveredRegionId
  const selectedRegion =
    selectedRegionId == null
      ? null
      : (JA_WORLDWIDE_REGIONS.find(region => region.id === selectedRegionId) ?? null)

  const activateHover = useCallback((id: JaWorldwideRegionId) => {
    setHoveredRegionId(id)
  }, [])

  const clearHover = useCallback(() => {
    setHoveredRegionId(null)
  }, [])

  const selectRegion = useCallback((id: JaWorldwideRegionId) => {
    setSelectedRegionId(id)
  }, [])

  const handleWrapBlur = useCallback((event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget
    if (next instanceof Node && event.currentTarget.contains(next)) return
    setHoveredRegionId(null)
  }, [])

  return (
    <section
      className={styles.section}
      aria-label="JA Worldwide"
      data-ja-worldwide
    >
      <div
        className={styles.background}
        aria-hidden="true"
      />
      <div className={styles.inner}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>{JA_WORLDWIDE_EYEBROW}</p>
            <p className={styles.stat}>{JA_WORLDWIDE_STAT}</p>
          </div>
          <a
            className={styles.globalLink}
            href={JA_WORLDWIDE_GLOBAL_LINK.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>{JA_WORLDWIDE_GLOBAL_LINK.label}</span>
            <img
              className={styles.globalLinkIcon}
              src={arrowDiagonalWhiteUrl}
              alt=""
              width={24}
              height={24}
              draggable={false}
            />
          </a>
        </header>

        <div
          className={styles.mapWrap}
          onMouseLeave={isBelowPc ? undefined : clearHover}
          onBlur={isBelowPc ? undefined : handleWrapBlur}
        >
          <div className={styles.mapScroll}>
            <JaWorldwideMap
              regions={JA_WORLDWIDE_REGIONS}
              activeRegionId={activeRegionId}
              onRegionActivate={activateHover}
              selectOnClick={isBelowPc}
              onRegionSelect={selectRegion}
            />

            {/* Desktop: 지도 위 absolute CTA — Mobile에서는 CSS로 숨김 */}
            {JA_WORLDWIDE_REGIONS.map(region => {
              const isActive = hoveredRegionId === region.id
              return (
                <a
                  key={region.id}
                  className={[styles.regionLink, isActive ? styles.regionLinkActive : undefined]
                    .filter(Boolean)
                    .join(' ')}
                  href={region.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={
                    {
                      '--region-link-x': region.linkX,
                      '--region-link-y': region.linkY,
                    } as CSSProperties
                  }
                  onMouseEnter={() => activateHover(region.id)}
                  onFocus={() => activateHover(region.id)}
                >
                  <span>{region.ctaLabel}</span>
                  <img
                    src={arrowDiagonalBlackUrl}
                    alt=""
                    width={14}
                    height={14}
                    draggable={false}
                  />
                </a>
              )
            })}
          </div>

          {/* Mobile: 지도 아래 · guide 위 — 선택 시에만 1개 */}
          {isBelowPc && selectedRegion ? (
            <div className={styles.mobileRegionAction}>
              <a
                className={styles.mobileRegionLink}
                href={selectedRegion.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>{selectedRegion.ctaLabel}</span>
                <img
                  className={styles.mobileRegionLinkIcon}
                  src={arrowDiagonalBlackUrl}
                  alt=""
                  width={24}
                  height={24}
                  draggable={false}
                />
              </a>
            </div>
          ) : null}

          <PFText as="p" typo="bd-sm-rg" color="white" className={styles.guide}>
            {JA_WORLDWIDE_GUIDE}
          </PFText>
        </div>

        <div className={styles.awardsWrap}>
          <div className={styles.awardsItem}>
            <img src={awardsImageUrl01} alt="" draggable={false} />
          </div>
          <div className={styles.awardsItem}>
            <img src={awardsImageUrl02} alt="" draggable={false} />
          </div>
        </div>
      </div>

      <div className={styles.description}>
        <p className={styles.descriptionText}>
          {JA_WORLDWIDE_DESCRIPTION}
        </p>
      </div>
    </section>
  )
}
