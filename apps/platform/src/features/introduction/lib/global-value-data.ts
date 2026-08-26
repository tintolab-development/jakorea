import valueIcon01Url from '../image/icon/value-icon-01.svg?url'
import valueIcon02Url from '../image/icon/value-icon-02.svg?url'
import valueIcon03Url from '../image/icon/value-icon-03.svg?url'
import valueIcon04Url from '../image/icon/value-icon-04.svg?url'
import valueIcon05Url from '../image/icon/value-icon-05.svg?url'

export type GlobalValueItem = {
  id: string
  number: string
  englishTitleLines: readonly string[]
  koreanTitle: string
  iconUrl: string
}

export const GLOBAL_VALUE_SECTION_TITLE = 'JA Global Value'

export const GLOBAL_VALUE_ITEMS: readonly GlobalValueItem[] = [
  {
    id: 'value-01',
    number: '01',
    englishTitleLines: ['BELIEVE IN THE BOUNDLESS', 'POTENTIAL OF YOUNG PEOPLE'],
    koreanTitle: '청소년의 무한한 잠재력에 대한 믿음',
    iconUrl: valueIcon01Url,
  },
  {
    id: 'value-02',
    number: '02',
    englishTitleLines: ['ADVOCATE FOR RELEVANT,', 'HANDS-ON LEARNING'],
    koreanTitle: '실전 중심의 학습 정리',
    iconUrl: valueIcon02Url,
  },
  {
    id: 'value-03',
    number: '03',
    englishTitleLines: [
      'TEACH ECONOMICS AND',
      'ENTREPRENEURSHIP',
      'FOR A MORE SUSTAINABLE WORLD',
    ],
    koreanTitle: '지속가능한 세상을 위한 시장경제와 기업가정신 교육',
    iconUrl: valueIcon03Url,
  },
  {
    id: 'value-04',
    number: '04',
    englishTitleLines: [
      'APPROACH OUR WORK',
      'WITH PASSION, HONESTY, INTEGRITY,',
      'AND EXCELLENCE',
    ],
    koreanTitle: '열정, 정직, 진정성, 탁월함에 기반한 실천',
    iconUrl: valueIcon04Url,
  },
  {
    id: 'value-05',
    number: '05',
    englishTitleLines: [
      'SEEK DIVERSE PERSPECTIVES',
      'TO REFLECT THE COMMUNITIES',
      'WE SERVE',
    ],
    koreanTitle: '파트너십과 협업을 통한 영향력 확대',
    iconUrl: valueIcon05Url,
  },
] as const

export const GLOBAL_VALUE_COUNT = GLOBAL_VALUE_ITEMS.length

/** Desktop accordion open/close — Hero Motion과 동일 계열 */
export const GLOBAL_VALUE_MOTION_MS = 400
