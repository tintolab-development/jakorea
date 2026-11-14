import type { PublicGlobalValueResponse } from '../api/types.ts'

export type GlobalValueItem = {
  id: string
  number: string
  englishTitleLines: readonly string[]
  /** `\n`은 PC에서만 줄바꿈(시안 2줄), Mobile은 자연 줄바꿈 */
  koreanTitle: string
  iconUrl: string
}

export const GLOBAL_VALUE_SECTION_TITLE = 'JA Global Value'

/**
 * JA Global Value 6항목 — 시안(03-1. JA Global Value_가치) 기준 FE 하드코딩.
 *
 * 홈페이지 Admin 항목 관리가 아직 연동되지 않아 API `globalValues` 대신 이 목록을 그린다.
 * Admin 연동 시 API 응답 행과 같은 모양이므로 `mapPublicOrganization`에서
 * `response.globalValues`로 소스만 바꾸면 된다.
 *
 * itemCode는 아이콘 식별자다(`GLOBAL_VALUE_ICON_BY_CODE`). 기존 5항목의 VALUE_5(파트너십)를
 * 유지하고 누락됐던 다양성 항목을 VALUE_6으로 추가했으며, 화면 순서는 displayOrder가 정한다.
 * mainText `\n` = 시안 강제 줄바꿈, 없으면 영역 폭에 맞춰 자연 줄바꿈.
 */
export const GLOBAL_VALUE_HARDCODED_ROWS: readonly PublicGlobalValueResponse[] = [
  {
    itemCode: 'VALUE_1',
    mainText: 'BELIEVE IN THE BOUNDLESS\nPOTENTIAL OF YOUNG PEOPLE',
    subText: '청소년의 무한한 잠재력에 대한 믿음',
    displayOrder: 1,
  },
  {
    itemCode: 'VALUE_2',
    mainText: 'ADVOCATE FOR RELEVANT,\nHANDS-ON LEARNING',
    subText: '실전 중심의 학습 정리',
    displayOrder: 2,
  },
  {
    itemCode: 'VALUE_3',
    mainText: 'TEACH ECONOMICS AND\nENTREPRENEURSHIP\nFOR A MORE SUSTAINABLE WORLD',
    subText: '지속가능한 세상을 위한 시장경제와 기업가정신 교육',
    displayOrder: 3,
  },
  {
    itemCode: 'VALUE_4',
    mainText: 'APPROACH OUR WORK\nWITH PASSION, HONESTY, INTEGRITY,\nAND EXCELLENCE',
    subText: '열정, 정직, 진정성, 탁월함에 기반한 실천',
    displayOrder: 4,
  },
  {
    itemCode: 'VALUE_6',
    mainText:
      'SEEK OUT DIVERSE BACKGROUNDS, PERSPECTIVES, AND TALENTS IN OUR STAFF, VOLUNTEERS, AND BOARDS TO REFLECT THE GEOGRAPHIES AND COMMUNITIES WE SERVE',
    subText:
      '우리가 활동하는 지역사회의 다양성을 반영하기 위해,\n임직원·봉사자·이사회에 다양한 배경, 관점, 재능 확보',
    displayOrder: 5,
  },
  {
    itemCode: 'VALUE_5',
    mainText: 'SEEK DIVERSE PERSPECTIVES\nTO REFLECT THE COMMUNITIES\nWE SERVE',
    subText: '파트너십과 협업을 통한 영향력 확대',
    displayOrder: 6,
  },
]

/** Desktop accordion open/close — Hero Motion과 동일 계열 */
export const GLOBAL_VALUE_MOTION_MS = 400
