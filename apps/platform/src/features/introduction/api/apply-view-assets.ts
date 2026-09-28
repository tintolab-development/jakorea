import {
  GLOBAL_VALUE_ICON_BY_CODE,
  type GlobalValueItemCode,
} from '../lib/global-value-icons'
import type { IntroductionPageContent } from '../model/types'

function isItemCode(value: string): value is GlobalValueItemCode {
  return (
    value === 'VALUE_1' ||
    value === 'VALUE_2' ||
    value === 'VALUE_3' ||
    value === 'VALUE_4' ||
    value === 'VALUE_5'
  )
}

/** mapper가 넣은 itemCode placeholder → 로컬 SVG URL */
export function applyOrganizationViewAssets(
  content: IntroductionPageContent,
): IntroductionPageContent {
  return {
    ...content,
    globalValues: content.globalValues.map((item, index) => {
      const code = isItemCode(item.iconUrl)
        ? item.iconUrl
        : ((['VALUE_1', 'VALUE_2', 'VALUE_3', 'VALUE_4', 'VALUE_5'][index] ??
            'VALUE_1') as GlobalValueItemCode)
      return {
        ...item,
        iconUrl: GLOBAL_VALUE_ICON_BY_CODE[code],
      }
    }),
  }
}
