/**
 * JA Global Value 아이콘 — Platform 기관소개와 동일 SVG (고정 매핑, 수정/삭제 불가)
 */
import type { GlobalValueKey } from '@/entities/global-value/model/types'
import valueIcon01Url from './assets/value-icon-01.svg'
import valueIcon02Url from './assets/value-icon-02.svg'
import valueIcon03Url from './assets/value-icon-03.svg'
import valueIcon04Url from './assets/value-icon-04.svg'
import valueIcon05Url from './assets/value-icon-05.svg'
import valueIcon06Url from './assets/value-icon-06.svg'

type ValueIconProps = {
  iconKey: GlobalValueKey
  size?: number
  className?: string
}

/** Platform GLOBAL_VALUE_ICON_BY_CODE 와 동일 순서 · 자산 */
const VALUE_ICON_SRC: Record<GlobalValueKey, string> = {
  value_1: valueIcon01Url,
  value_2: valueIcon02Url,
  value_3: valueIcon03Url,
  value_4: valueIcon04Url,
  value_5: valueIcon05Url,
  value_6: valueIcon06Url,
}

export function ValueIcon({ iconKey, size = 40, className }: ValueIconProps) {
  return (
    <img
      className={className}
      src={VALUE_ICON_SRC[iconKey] ?? VALUE_ICON_SRC.value_1}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      draggable={false}
      style={{ display: 'block', flexShrink: 0 }}
    />
  )
}
