import valueIcon01Url from '../image/icon/value-icon-01.svg?url'
import valueIcon02Url from '../image/icon/value-icon-02.svg?url'
import valueIcon03Url from '../image/icon/value-icon-03.svg?url'
import valueIcon04Url from '../image/icon/value-icon-04.svg?url'
import valueIcon05Url from '../image/icon/value-icon-05.svg?url'
import valueIcon06Url from '../image/icon/value-icon-06.svg?url'
import type { GlobalValueItemCode } from '../api/mappers'

export type { GlobalValueItemCode }

/** itemCode → 로컬 아이콘. API는 아이콘 파일을 주지 않는다. */
export const GLOBAL_VALUE_ICON_BY_CODE: Record<GlobalValueItemCode, string> = {
  VALUE_1: valueIcon01Url,
  VALUE_2: valueIcon02Url,
  VALUE_3: valueIcon03Url,
  VALUE_4: valueIcon04Url,
  VALUE_5: valueIcon05Url,
  VALUE_6: valueIcon06Url,
}
