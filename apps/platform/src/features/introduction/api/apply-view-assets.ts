import {
  GLOBAL_VALUE_ICON_BY_CODE,
  type GlobalValueItemCode,
} from '../lib/global-value-icons'
import type { IntroductionPageContent } from '../model/types'
import { GLOBAL_VALUE_ITEM_CODES } from './mappers'

function isItemCode(value: string): value is GlobalValueItemCode {
  return (GLOBAL_VALUE_ITEM_CODES as readonly string[]).includes(value)
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
        : (GLOBAL_VALUE_ITEM_CODES[index] ?? 'VALUE_1')
      return {
        ...item,
        iconUrl: GLOBAL_VALUE_ICON_BY_CODE[code],
      }
    }),
  }
}
