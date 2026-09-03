import type { JaWorldwideRegion, JaWorldwideRegionId } from '../lib/ja-worldwide-data'
import africaSvg from '../image/illustration/ja-africa.svg?raw'
import americasSvg from '../image/illustration/ja-americas-includes-canada.svg?raw'
import asiaPacificSvg from '../image/illustration/ja-asia-pacific.svg?raw'
import europeSvg from '../image/illustration/ja-europe.svg?raw'
import menaSvg from '../image/illustration/injaz-al-arab-ja-mena.svg?raw'
import usaSvg from '../image/illustration/ja-usa.svg?raw'
import styles from './ja-worldwide-section.module.css'

/** SVG 루트 제거 후 fill을 CSS currentColor로 위임 */
function toCurrentColorMarkup(raw: string): string {
  return raw
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
    .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
    .replace(/<svg[^>]*>/i, '')
    .replace(/<\/svg>/i, '')
    .replace(/\sfill="[^"]*"/gi, '')
    .replace(/\sfill-opacity="[^"]*"/gi, '')
}

const REGION_MARKUP: Record<JaWorldwideRegionId, string> = {
  americas: toCurrentColorMarkup(americasSvg),
  usa: toCurrentColorMarkup(usaSvg),
  europe: toCurrentColorMarkup(europeSvg),
  africa: toCurrentColorMarkup(africaSvg),
  mena: toCurrentColorMarkup(menaSvg),
  'asia-pacific': toCurrentColorMarkup(asiaPacificSvg),
}

type JaWorldwideMapProps = {
  regions: readonly JaWorldwideRegion[]
  activeRegionId: JaWorldwideRegionId | null
  /** Desktop: hover / focus */
  onRegionActivate: (id: JaWorldwideRegionId) => void
  /** Mobile: tap으로 selected 유지 (Desktop에서는 미사용) */
  selectOnClick?: boolean
  onRegionSelect?: (id: JaWorldwideRegionId) => void
}

/** 지역별 illustration SVG를 inline <g>로 합성 — path 개별 리스너 없음 */
export function JaWorldwideMap({
  regions,
  activeRegionId,
  onRegionActivate,
  selectOnClick = false,
  onRegionSelect,
}: JaWorldwideMapProps) {
  return (
    <svg
      className={styles.map}
      viewBox="0 0 1440 760"
      role="img"
      aria-labelledby="ja-worldwide-map-title"
    >
      <title id="ja-worldwide-map-title">JA Worldwide 지역 지도</title>
      {regions.map(region => {
        const regionClassName = [
          styles.region,
          activeRegionId === region.id ? styles.regionActive : undefined,
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <g
            key={region.id}
            className={regionClassName}
            data-region={region.id}
            tabIndex={0}
            role="button"
            aria-label={region.ctaLabel}
            onMouseEnter={selectOnClick ? undefined : () => onRegionActivate(region.id)}
            onFocus={() => {
              if (selectOnClick) {
                onRegionSelect?.(region.id)
                return
              }
              onRegionActivate(region.id)
            }}
            onClick={selectOnClick ? () => onRegionSelect?.(region.id) : undefined}
            dangerouslySetInnerHTML={{ __html: REGION_MARKUP[region.id] }}
          />
        )
      })}
    </svg>
  )
}
