import valueIcon01Url from '../image/icon/value-icon-01.svg?url'
import valueIcon02Url from '../image/icon/value-icon-02.svg?url'
import valueIcon03Url from '../image/icon/value-icon-03.svg?url'
import valueIcon04Url from '../image/icon/value-icon-04.svg?url'
import valueIcon05Url from '../image/icon/value-icon-05.svg?url'

export type GlobalValueItemCode =
  | 'VALUE_1'
  | 'VALUE_2'
  | 'VALUE_3'
  | 'VALUE_4'
  | 'VALUE_5'

/** itemCode → 로컬 아이콘. API는 아이콘 파일을 주지 않는다. */
export const GLOBAL_VALUE_ICON_BY_CODE: Record<GlobalValueItemCode, string> = {
  VALUE_1: valueIcon01Url,
  VALUE_2: valueIcon02Url,
  VALUE_3: valueIcon03Url,
  VALUE_4: valueIcon04Url,
  VALUE_5: valueIcon05Url,
}
