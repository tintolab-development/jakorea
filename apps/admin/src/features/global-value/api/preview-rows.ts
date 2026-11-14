import type { GlobalValue, GlobalValueKey } from '@/entities/global-value/model/types'

/**
 * 서버 6항목 지원 전 미리보기 — 시안(홈페이지 Admin 27:41259) 6행 그대로.
 * 저장되지 않는다. 문구 `\n` = 시안 줄바꿈.
 */
const PREVIEW_TEXTS: ReadonlyArray<{ key: GlobalValueKey; mainText: string; subText: string }> = [
  {
    key: 'value_1',
    mainText: 'BELIEVE IN THE BOUNDLESS\nPOTENTIAL OF YOUNG PEOPLE',
    subText: '청소년의 무한한 잠재력에 대한 믿음',
  },
  {
    key: 'value_2',
    mainText: 'ADVOCATE FOR RELEVANT,\nHANDS-ON LEARNING',
    subText: '실전 중심의 학습 정리',
  },
  {
    key: 'value_3',
    mainText: 'TEACH ECONOMICS AND ENTREPRENEURSHIP\nFOR A MORE SUSTAINABLE WORLD',
    subText: '지속가능한 세상을 위한 시장경제와 기업가정신 교육',
  },
  {
    key: 'value_4',
    mainText: 'APPROACH OUR WORK\nWITH PASSION, HONESTY, INTEGRITY, AND EXCELLENCE',
    subText: '열정, 정직, 진정성, 탁월함에 기반한 실천',
  },
  {
    key: 'value_6',
    mainText:
      'SEEK OUT DIVERSE BACKGROUNDS, PERSPECTIVES, AND TALENTS IN OUR STAFF, VOLUNTEERS, AND BOARDS TO REFLECT THE GEOGRAPHIES AND COMMUNITIES WE SERVE',
    subText:
      '우리가 활동하는 지역사회의 다양성을 반영하기 위해,\n임직원·봉사자·이사회에 다양한 배경, 관점, 재능 확보',
  },
  {
    key: 'value_5',
    mainText: 'SEEK DIVERSE PERSPECTIVES\nTO REFLECT THE COMMUNITIES\nWE SERVE',
    subText: '파트너십과 협업을 통한 영향력 확대',
  },
]

export const GLOBAL_VALUE_PREVIEW_ROWS: readonly GlobalValue[] = PREVIEW_TEXTS.map(
  (row, index) => ({
    id: `preview-${row.key}`,
    key: row.key,
    sortOrder: index + 1,
    isActive: true,
    mainText: row.mainText,
    subText: row.subText,
    iconKey: row.key,
    updatedAt: '',
    version: 0,
  })
)
