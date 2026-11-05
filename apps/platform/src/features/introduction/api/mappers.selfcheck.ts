import assert from 'node:assert/strict'
import {
  resolveHistorySelection,
  resolveYearForPeriod,
} from '../lib/achievement-data.ts'
import {
  hasOrganizationContent,
  mapHistoryByYear,
  mapPublicOrganization,
  toDisplayLines,
} from './mappers.ts'

assert.deepEqual(toDisplayLines('한 줄'), ['한 줄'])
assert.deepEqual(toDisplayLines('첫\n둘'), ['첫', '둘'])
assert.deepEqual(toDisplayLines('  '), [])

const mapped = mapPublicOrganization({
  introduction: {
    section1Title: '청소년이 마음껏 역량을 발휘하며\n성공할 수 있도록 함께합니다',
    section1Subtitle: 'JA Korea는\n청소년의 무한한 가능성을 믿습니다',
    section2TitleEn: 'Inspiring Youth',
    section2SubtitleKo: 'JA Korea는 청소년의 가능성을 미래로 연결합니다',
    content1Title: '청소년을 위한 글로벌 교육 네트워크',
    content1Description: 'JA Korea는 국제 교육 비정부기구(NGO)인 JA Worldwide의 한국 지부입니다.',
    content2Title: '청소년의 미래를 위한 체계적인 교육 경험',
    content2Description: '관심 있는 분야를 탐색하며 영감(Inspire)을 얻고,',
    globalVisionSubtitleEn: 'Young people have the skillset and mindset to build thriving communities.',
    globalVisionTextKo: '공동체의 성장을 이끌 수 있는 역량과 마음가짐을 갖춘 청소년이 되도록 교육합니다.',
    globalMissionSubtitleEn: 'JA inspires and prepares young people to succeed in a global economy.',
    globalMissionTextKo: '청소년이 마음껏 역량을 발휘하며 성공할 수 있도록 함께합니다.',
  },
  globalValues: [
    {
      id: 1,
      itemCode: 'VALUE_1',
      mainText: 'BELIEVE IN THE BOUNDLESS POTENTIAL OF YOUNG PEOPLE',
      subText: '청소년의 무한한 잠재력에 대한 믿음',
      displayOrder: 1,
    },
    {
      id: 2,
      itemCode: 'VALUE_2',
      mainText: 'ADVOCATE FOR RELEVANT, HANDS-ON LEARNING',
      subText: '실전 중심의 학습 정리',
      displayOrder: 2,
    },
  ],
  worldwide: {
    guidanceText:
      'JA Worldwide는 100여년간 쌓아온 경험과 열정을 가진 세계에서 가장 영향력 있는 청소년 교육 NGO중 하나로서, 매년 약 100여 개국에서 50만 명 교육 진행자들과 함께 2,300만 명 이상의 청소년들을 교육하고 있습니다.',
    links: [
      {
        id: 1,
        linkCode: 'JA_WORLDWIDE',
        displayName: 'JA Worldwide',
        externalUrl: 'https://www.jaworldwide.org/',
      },
      {
        id: 6,
        linkCode: 'JA_AMERICAS',
        displayName: 'JA AMERICAS',
        externalUrl: 'https://www.jaamericas.org/',
      },
    ],
  },
  history: [
    { id: 1, year: 2020, month: 12, content: "삼성전자와 함께하는 'Care Beyond Skin' 온라인 교육" },
    { id: 2, year: 2020, month: 12, content: "삼성전자와 함께하는 'We Tech Care' 온라인 교육" },
    { id: 3, year: 2020, month: 1, content: '2020 JA Korea 신년 비전 공유' },
  ],
  awards: [
    {
      id: 10,
      awardedDate: '2025-12-01',
      awardName: 'JA Worldwide Nominated for the 2023 Nobel Peace Prize',
      awardingInstitution: '노벨위원회',
    },
  ],
  certifications: [
    {
      id: 1,
      certifiedDate: '2025-12-01',
      content: '교육기부기관 지정 (인증번호 제2011-062호)',
      certificationInstitution: '교육부',
    },
  ],
  bi: {
    title: '브랜드 아이덴티티',
    mainText:
      'JA Korea의 심볼과 로고는 JA 교육을 통해 청소년들이 함께 성장하고 나아가는 모습을 담고 있습니다.',
    subText:
      "브랜드의 초기 모델인 '새'의 형상을 바탕으로, 청소년들이 교육을 통해 얻은 지식과 기술, 유연한 사고방식을 세상과 나누며 글로벌 사회에 긍정적인 영향력을 펼쳐가는 모습을 '날개'라는 시각적 상징으로 표현했습니다.",
  },
})

assert.equal(mapped.hero.introLines.length, 2)
assert.equal(mapped.hero.introMobile, 'JA Korea는 청소년의 무한한 가능성을 믿습니다')
assert.equal(mapped.globalValues.length, 2)
assert.equal(mapped.globalValues[0]?.koreanTitle, '청소년의 무한한 잠재력에 대한 믿음')
assert.equal(mapped.worldwide.globalLinkHref, 'https://www.jaworldwide.org/')
assert.equal(
  mapped.worldwide.regions.find(r => r.id === 'americas')?.href,
  'https://www.jaamericas.org/',
)
assert.equal(mapped.historyByYear[2020]?.months[0]?.month, '12')
assert.equal(mapped.historyByYear[2020]?.months[0]?.items.length, 2)
assert.equal(mapped.awards[0]?.dateLabel, '2025년 12월')
assert.equal(mapped.certifications.length, 1)
assert.equal(mapped.bi.title, '브랜드 아이덴티티')
assert.equal(hasOrganizationContent(mapped), true)

const historyOnly = mapHistoryByYear([
  { year: 2016, month: 6, content: '지역 거점 교육 확대' },
])
assert.equal(historyOnly[2016]?.months[0]?.items[0], '지역 거점 교육 확대')

assert.equal(hasOrganizationContent(mapPublicOrganization({})), false)

const mixedYears = mapHistoryByYear([
  { year: 2024, month: 12, content: '최근 연혁' },
  { year: 2020, month: 1, content: '과거 연혁' },
])
assert.deepEqual(resolveHistorySelection(mixedYears), { periodId: '2021-2025', year: 2024 })
assert.equal(resolveYearForPeriod('2026-now', mixedYears), 2026)
assert.equal(resolveYearForPeriod('2021-2025', mixedYears), 2024)
assert.equal(resolveYearForPeriod('2016-2020', mixedYears), 2020)

console.log('introduction mapPublicOrganization selfcheck: ok')
