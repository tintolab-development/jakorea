import {
  HISTORY_CTA_PRIMARY,
  HISTORY_CTA_SECONDARY,
  HISTORY_HERO_EYEBROW,
  HISTORY_HERO_TITLE_LINES,
} from './constants'
import { historyEraAlign } from './era-align'
import { HISTORY_LOCAL_MEDIA } from './local-media'
import {
  CTA_PHOTO_URL,
  EXPANSION_PHOTO_URL,
  HISTORY_ERA_PHOTOS,
  HISTORY_PHILOSOPHY_CARDS,
  HISTORY_THRIVE_CARDS,
  KOREA_PHOTO_URL,
  KOREA_TIMELINE_PERIODS,
  LEARNING_PHOTO_URL,
  WORLD_TIMELINE_PERIODS,
} from './page-content'
import type { HistoryPageView, HistoryTimelinePeriodView } from '../model/view'

function media(fileName: string, url: string, alt: string) {
  return { fileName, url, alt }
}

const ORIGIN_BODY = `처음 JA의 교육은 학생들이 비즈니스 자원봉사자들의 지도 아래 직접 기업을
운영해보는 방과후 프로그램(Company Program)으로 시작했습니다.
그리고 100년이 지난 오늘날, JA는 100여 개 회원국으로 구성된 네트워크를 통해 매년
2천만 명 이상의 청소년에게 진로·취업, 경제·금융, 기업가정신 교육을 제공하고 있습니다.

규모와 교육의 방식은 달라졌지만, 모든 청소년에게 자신의 미래와 공동체를 변화시킬
무한한 가능성이 있다는 믿음은 변함없이 이어지고 있습니다.`

const LEARNING_BODY = `1919년 미국에서 8세부터 12세까지의 어린이에게 비즈니스를 가르치는 방과후교실이 시작됐습니다.
이 조직은 이듬해 Junior Achievement라는 이름을 갖게 되었습니다.

1929년 JA에 참여한 청소년들은 실제 상품과 서비스를 판매하는 회사를 만들기 시작했습니다.
교실에서 경제를 배우는 데 그치지 않고, 직접 아이디어를 내고 자금을 마련하며 상품을 생산하고
판매하면서 경제가 움직이는 방식을 배웠습니다.`

const LEARNING_OUTRO = `이 때 자리 잡은 Learning by Doing, ‘직접 해보며 배우는 교육’은 지금까지도 JA의 체험형 교육으로 이어지고 있습니다. 청소년은 팀을 이뤄 자신의 아이디어를 실제 행동으로 옮깁니다.
결과가 기대와 달라도 방법을 바꿔 다시 시도합니다. 이 과정에서 지식을 습득하는 것은 물론, 도전하는 태도와 책임감, 회복력, 문제해결 능력을 함께 키웁니다.`

const LEARNING_EMPHASIS = `직접 해보는 경험이
스스로를 믿는 힘이 됩니다.`

const WORLD_TITLE = `세상이 바뀔 때마다
JA의 교육도 진화했습니다.`

const WORLD_BODY = `새로운 산업이 등장하고 일하는 방식이 바뀔 때마다 청소년에게
필요한 역량도 달라졌습니다. JA는 교육의 대상과 방법, 활동 지역을 끊임없이 확장해 왔습니다. 그러나 청소년에게 경험을 제공하고
스스로 미래를 만들어 갈 힘을 길러준다는 원칙은 한 세기 넘게
이어지고 있습니다.`

const KOREA_TITLE = `전 세계가 함께하는 배움이
2002년 한국의 교실에 닿았습니다`

const KOREA_BODY = `2002년 10월, 청소년 교육 NGO JA Korea가 설립됐습니다.
JA Korea는 JA의 체험형 교육을 한국 학교 현장에 맞게 발전시키며 진로·취업, 경제·금융, 기업가정신, 디지털 리터러시 분야의 교육을
제공해 왔습니다. 또한 JA Global Network가 공유하는 교육
철학은 유지하면서, 한국이 마주한 현실과 학교 현장의 필요에 맞춰 새로운 콘텐츠를 개발 및 보급하고 있습니다.`

const PHILOSOPHY_TITLE = `‘나는 할 수 있다’는
믿음을 키우는 교육`

const PHILOSOPHY_LEAD = `JA가 추구하는 변화의 중심에는 자기효능감(Self-efficacy)이 있습니다.
자기효능감은 새로운 문제를 만났을 때, 스스로 해낼 수 있다고 믿고 실제 행동으로 옮기는 힘입니다.
정답을 알려주는 대신 청소년이 직접 시도하고 실패에서 배우며 더 나은 방법을 찾을 수 있도록 돕습니다.`

const THRIVE_TITLE = `Thrive:
2050년을 향한 JA의 발걸음`

const THRIVE_LEAD = `기술이 빠르게 발전함에 따라 교육과 일의 방식이 달라지고 있습니다.
JA Worldwide는 2026-2028 글로벌 전략 Thrive를 기반으로 더 많은 청소년에게 교육의 기회를 제공하고,
디지털 기술을 적극적으로 활용하며, 파트너십을 통해 더 큰 임팩트를 만들어 갈 예정입니다`

const THRIVE_FOOTNOTE = `JA는 2050년까지 청소년에게 연간 1억 건의 학습 경험을 제공하고, 측정 가능한 형태의 변화를 창출해 번영하는 공동체를 만드는 것을 장기 목표로 삼아 오늘도
전 세계 100여 개 국가에서 청소년을 교육하고 있습니다.`

const CTA_TITLE = `청소년이 가진
무한한 잠재력을 믿습니다`

const CTA_BODY =
  'JA Korea는 앞으로도 청소년이 실제 삶과 연결된 교육을 통해 스스로 선택하고 도전할 수 있도록 돕겠습니다. 학교, 기업, 강사, 봉사자, 지역사회 등 다양한 교육 파트너와 협력해 더 많은 청소년에게 배움의 기회를 전하겠습니다.'

function toPeriods(
  periods: ReadonlyArray<{
    id: string
    label: string
    title: string
    events: ReadonlyArray<{ year: string; lines: readonly string[] }>
  }>,
): HistoryTimelinePeriodView[] {
  return periods.map(period => ({
    id: period.id,
    label: period.label,
    title: period.title,
    events: period.events.map(event => ({
      year: event.year,
      text: event.lines.join('\n'),
    })),
  }))
}

/** API가 없거나 실패했을 때의 화면. 개행은 시드와 같다. */
export function createFallbackJaHistoryView(): HistoryPageView {
  return {
    hero: {
      image: media('hero-visual.png', HISTORY_LOCAL_MEDIA['hero-visual.png'], 'JA History 히어로'),
      eyebrow: HISTORY_HERO_EYEBROW,
      mainText: HISTORY_HERO_TITLE_LINES.join('\n'),
    },
    origin: {
      yearMark: media('year-1919.svg', HISTORY_LOCAL_MEDIA['year-1919.svg'], ''),
      englishTitle: 'A WORLD OF POSSIBILITIES',
      koreanTitle: '청소년을 위한 100년의 여정',
      body: ORIGIN_BODY,
    },
    learning: {
      eyebrow: 'LEARNING BY DOING',
      title: '배움에서 실천으로',
      body: LEARNING_BODY,
      image: media(
        'learning-photo.png',
        LEARNING_PHOTO_URL,
        '방과후 교실에서 기계를 다루며 배우는 청소년들',
      ),
      outro: LEARNING_OUTRO,
      emphasis: LEARNING_EMPHASIS,
    },
    eras: HISTORY_ERA_PHOTOS.map((item, index) => ({
      year: item.year,
      caption: item.captionLines?.join('\n') ?? item.caption,
      image: { url: item.imageUrl, alt: item.alt },
      align: historyEraAlign(item.year, index),
    })),
    world: {
      image: media(
        'expansion-photo.png',
        EXPANSION_PHOTO_URL,
        '테이블에 둘러앉아 함께 활동하는 JA 청소년들',
      ),
      title: WORLD_TITLE,
      body: WORLD_BODY,
      periods: toPeriods(WORLD_TIMELINE_PERIODS),
    },
    korea: {
      image: media('korea-photo.png', KOREA_PHOTO_URL, '교실에서 함께 활동하는 JA Korea 교육 현장'),
      title: KOREA_TITLE,
      body: KOREA_BODY,
      periods: toPeriods(KOREA_TIMELINE_PERIODS),
    },
    philosophy: {
      eyebrow: 'LEARNING BY DOING',
      title: PHILOSOPHY_TITLE,
      lead: PHILOSOPHY_LEAD,
      cards: HISTORY_PHILOSOPHY_CARDS.map(card => ({
        id: card.id,
        title: card.title,
        description: card.description,
        image: { url: card.imageUrl, alt: card.alt },
      })),
    },
    thrive: {
      title: THRIVE_TITLE,
      lead: THRIVE_LEAD,
      footnote: THRIVE_FOOTNOTE,
      cards: HISTORY_THRIVE_CARDS.map(card => ({
        id: card.id,
        title: card.titleLines.join('\n'),
        description: card.description,
        decoration: { url: card.decorationUrl, alt: '' },
      })),
    },
    cta: {
      title: CTA_TITLE,
      body: CTA_BODY,
      image: media('cta-photo.png', CTA_PHOTO_URL, '함께 웃고 있는 여러 명의 어린이'),
      primaryLabel: HISTORY_CTA_PRIMARY.label,
      primaryHref: HISTORY_CTA_PRIMARY.href,
      secondaryLabel: HISTORY_CTA_SECONDARY.label,
      secondaryHref: HISTORY_CTA_SECONDARY.href,
    },
  }
}
