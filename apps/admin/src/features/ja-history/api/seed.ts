import ctaPhotoUrl from '../image/cta-photo.png'
import era1920Url from '../image/era-1920.png'
import era1950Url from '../image/era-1950.png'
import era1960Url from '../image/era-1960.png'
import era1980Url from '../image/era-1980.png'
import expansionPhotoUrl from '../image/expansion-photo.png'
import heroVisualUrl from '../image/hero-visual.png'
import koreaPhotoUrl from '../image/korea-photo.png'
import learningPhotoUrl from '../image/learning-photo.png'
import philosophyMindsetUrl from '../image/philosophy-mindset.png'
import philosophyPracticeUrl from '../image/philosophy-practice.png'
import philosophyRoleModelUrl from '../image/philosophy-role-model.png'
import philosophySupportUrl from '../image/philosophy-support.png'
import thriveDigitalUrl from '../image/thrive-digital.svg'
import thriveEmpowerUrl from '../image/thrive-empower.svg'
import thriveEnablersUrl from '../image/thrive-enablers.svg'
import thrivePartnerUrl from '../image/thrive-partner.svg'
import year1919Url from '../image/year-1919.svg'
import type { JaHistoryData, JaHistoryMedia, JaHistoryTimeline } from '@/entities/ja-history/model/types'

function lines(parts: readonly string[]): string {
  return parts.join('\n')
}

function media(url: string, fileName: string, alt: string): JaHistoryMedia {
  return { url, fileName, alt }
}

const WORLD_TIMELINE: JaHistoryTimeline = {
  image: media(
    expansionPhotoUrl,
    'expansion-photo.png',
    '테이블에 둘러앉아 함께 활동하는 JA 청소년들',
  ),
  title: lines(['세상이 바뀔 때마다', 'JA의 교육도 진화했습니다.']),
  body: lines([
    '새로운 산업이 등장하고 일하는 방식이 바뀔 때마다 청소년에게',
    '필요한 역량도 달라졌습니다. JA는 교육의 대상과 방법, 활동 지역을 끊임없이 확장해 왔습니다. 그러나 청소년에게 경험을 제공하고',
    '스스로 미래를 만들어 갈 힘을 길러준다는 원칙은 한 세기 넘게',
    '이어지고 있습니다.',
  ]),
  periods: [
    {
      id: '1919-1929',
      label: '1919-1929',
      title: '청소년 비즈니스 교육의 시작',
      events: [
        { year: '1919', text: '방과후교실에서 비즈니스 교육 시작' },
        { year: '1920', text: 'Junior Achievement로 이름 변경' },
        { year: '1929', text: '실물 창업에 기반한 기업가정신 교육 진행' },
      ],
    },
    {
      id: '1955-1962',
      label: '1955-1962',
      title: '',
      events: [
        { year: '1955', text: '캐나다 밴쿠버에 JA 첫 국제 사무소 개설' },
        { year: '1962', text: 'JA를 모델로 한 Young Enterprise 영국에서 출범' },
      ],
    },
    {
      id: '1969-2000',
      label: '1969-2000',
      title: '',
      events: [
        { year: '1969', text: '컴퓨터 시뮬레이션 교육 도입' },
        { year: '1974', text: '학교에서 직접 운영할 수 있는 교육 프로그램 연구 및 개발' },
        { year: '1980 ~ 1990', text: '아프리카, 중남미, 유럽, 아시아로 JA 네트워크 확장' },
        {
          year: '1994',
          text: '급증하는 세계적 경제교육 수요를 충족시키기 위해 Junior Achievement International 창설',
        },
        {
          year: '2000',
          text: '온라인 학습과 오프라인 활동을 결합한 게임형 시뮬레이션 교육 본격화',
        },
      ],
    },
    {
      id: '2019-now',
      label: '2019-Now',
      title: '',
      events: [
        { year: '2019', text: 'JA 창립 100주년' },
        { year: '2020', text: '코로나19 대응 디지털 교육 프로그램 확대' },
        { year: '2022', text: '2022년부터 5년 연속 노벨평화상 후보 추천' },
        { year: 'Now', text: '2050년까지 청소년에게 연간 1억 건의 학습 경험 제공 목표' },
      ],
    },
  ],
}

const KOREA_TIMELINE: JaHistoryTimeline = {
  image: media(koreaPhotoUrl, 'korea-photo.png', '교실에서 함께 활동하는 JA Korea 교육 현장'),
  title: lines(['전 세계가 함께하는 배움이', '2002년 한국의 교실에 닿았습니다']),
  body: lines([
    '2002년 10월, 청소년 교육 NGO JA Korea가 설립됐습니다.',
    'JA Korea는 JA의 체험형 교육을 한국 학교 현장에 맞게 발전시키며 진로·취업, 경제·금융, 기업가정신, 디지털 리터러시 분야의 교육을',
    '제공해 왔습니다. 또한 JA Global Network가 공유하는 교육',
    '철학은 유지하면서, 한국이 마주한 현실과 학교 현장의 필요에 맞춰 새로운 콘텐츠를 개발 및 보급하고 있습니다.',
  ]),
  periods: [
    {
      id: '2002-2006',
      label: '2002-2006',
      title: '한국에서 시작된 JA 교육',
      events: [
        { year: '2002', text: 'JA Korea 설립 (초대 이사장 강경식 전 부총리)' },
        { year: '2003', text: 'JA 초등 경제교육 프로그램 한국화, 청소년 진로 프로그램 개발' },
        {
          year: '2006',
          text: lines([
            '2006년 대학생경제교육봉사단 UJAT 출범',
            '고등학교 대상 글로벌 기업가정신 교육 프로그램 운영',
          ]),
        },
      ],
    },
    {
      id: '2007-2015',
      label: '2007-2015',
      title: '',
      events: [
        {
          year: '2007',
          text: lines([
            '대학생 경제교육봉사단 표창(서울시)',
            '대학생, 기업 파트너가 학교 정규 수업에 참여하는 교육 모델을 전국으로 확장',
          ]),
        },
        { year: '2014', text: '청소년 SW 교육 시작' },
        { year: '2015', text: '누적 교육 수혜자 100만 명 돌파' },
      ],
    },
    {
      id: '2016-2020',
      label: '2016-2020',
      title: '',
      events: [
        {
          year: '2016',
          text: '급변하는 산업 환경을 반영한 디지털 리터러시 교육 확대 (ICT, 코딩, 데이터, 정보보안 등)',
        },
        { year: '2019', text: '대한민국 경제교육대상(기획재정부)' },
        {
          year: '2020',
          text: lines([
            '기업가정신 확산·진흥 유공 포상(중소벤처기업부)',
            '누적 교육 봉사자 10만 명 돌파',
          ]),
        },
      ],
    },
    {
      id: '2021-now',
      label: '2021-NOW',
      title: '',
      events: [
        {
          year: '2021',
          text: lines([
            '온라인 체험형 경제교육 플랫폼 JA Finance Park 개발 및 운영',
            '생성형 AI 활용 교육 및 AI 윤리 교육 확대',
          ]),
        },
        {
          year: '2026',
          text: 'JA Asia Pacific Company of the Year Competition(COYC) 개최',
        },
        {
          year: 'Now',
          text: 'BETTER GROUND High School 등 한국 개발 교육 프로그램의 글로벌 운영 (6개국)',
        },
      ],
    },
  ],
}

export function buildJaHistorySeed(): JaHistoryData {
  return {
    hero: {
      image: media(heroVisualUrl, 'hero-visual.png', 'JA History 히어로'),
      eyebrow: 'JA History',
      mainText: lines(['BOUNDLESS YOUTH;', 'THRIVING COMMUNITIES']),
    },
    origin: {
      yearMark: media(year1919Url, 'year-1919.svg', ''),
      title: lines(['A WORLD OF POSSIBILITIES', '청소년을 위한 100년의 여정']),
      body: lines([
        '처음 JA의 교육은 학생들이 비즈니스 자원봉사자들의 지도 아래 직접 기업을',
        '운영해보는 방과후 프로그램(Company Program)으로 시작했습니다.',
        '그리고 100년이 지난 오늘날, JA는 100여 개 회원국으로 구성된 네트워크를 통해 매년',
        '2천만 명 이상의 청소년에게 진로·취업, 경제·금융, 기업가정신 교육을 제공하고 있습니다.',
        '',
        '규모와 교육의 방식은 달라졌지만, 모든 청소년에게 자신의 미래와 공동체를 변화시킬',
        '무한한 가능성이 있다는 믿음은 변함없이 이어지고 있습니다.',
      ]),
      learningEyebrow: 'LEARNING BY DOING',
      learningTitle: '배움에서 실천으로',
      learningBody: lines([
        '1919년 미국에서 8세부터 12세까지의 어린이에게 비즈니스를 가르치는 방과후교실이 시작됐습니다.',
        '이 조직은 이듬해 Junior Achievement라는 이름을 갖게 되었습니다.',
        '',
        '1929년 JA에 참여한 청소년들은 실제 상품과 서비스를 판매하는 회사를 만들기 시작했습니다.',
        '교실에서 경제를 배우는 데 그치지 않고, 직접 아이디어를 내고 자금을 마련하며 상품을 생산하고',
        '판매하면서 경제가 움직이는 방식을 배웠습니다.',
      ]),
      learningImage: media(
        learningPhotoUrl,
        'learning-photo.png',
        '방과후 교실에서 기계를 다루며 배우는 청소년들',
      ),
      learningOutro: lines([
        '이 때 자리 잡은 Learning by Doing, ‘직접 해보며 배우는 교육’은 지금까지도 JA의 체험형 교육으로 이어지고 있습니다. 청소년은 팀을 이뤄 자신의 아이디어를 실제 행동으로 옮깁니다.',
        '결과가 기대와 달라도 방법을 바꿔 다시 시도합니다. 이 과정에서 지식을 습득하는 것은 물론, 도전하는 태도와 책임감, 회복력, 문제해결 능력을 함께 키웁니다.',
      ]),
      learningEmphasis: lines(['직접 해보는 경험이', '스스로를 믿는 힘이 됩니다.']),
    },
    eras: [
      {
        year: '1920',
        image: media(era1920Url, 'era-1920.png', '1920년대 스프링필드 Trade Fair에 전시된 모자와 상품'),
        caption: lines([
          '미국 메사추세츠 스프링필드에서 열린',
          'Trade Fair에 모자를 비롯한 상품들이 전시되어 있다.',
        ]),
      },
      {
        year: '1950',
        image: media(era1950Url, 'era-1950.png', '1950년대 JA Company Program Trade Fair에서 수상하는 학생들'),
        caption: 'JA Company Program의 Trade Fair에 참여한 학생들이 수상하고 있다.',
      },
      {
        year: '1960',
        image: media(era1960Url, 'era-1960.png', '1960년대 JA 학생 기업이 상품을 선보이는 모습'),
        caption: 'JA를 통해 성장한 학생 기업이 자신들의 상품을 선보이고 있다.',
      },
      {
        year: '1980',
        image: media(era1980Url, 'era-1980.png', '1980년대 인디애나폴리스 JA 응용경제학 교육 현장'),
        caption: '인디애나폴리스에서 JA의 응용경제학 교육 프로그램이 진행되고 있다.',
      },
    ],
    worldTimeline: WORLD_TIMELINE,
    philosophy: {
      eyebrow: 'LEARNING BY DOING',
      title: lines(['‘나는 할 수 있다’는', '믿음을 키우는 교육']),
      lead: lines([
        'JA가 추구하는 변화의 중심에는 자기효능감(Self-efficacy)이 있습니다.',
        '자기효능감은 새로운 문제를 만났을 때, 스스로 해낼 수 있다고 믿고 실제 행동으로 옮기는 힘입니다.',
        '정답을 알려주는 대신 청소년이 직접 시도하고 실패에서 배우며 더 나은 방법을 찾을 수 있도록 돕습니다.',
      ]),
      cards: [
        {
          id: 'practice',
          title: '직접 해보며 익힙니다',
          description: '실제 환경과 유사한 체험 활동으로 새로운 기술과 문제 해결 방법을 배웁니다.',
          image: media(philosophyPracticeUrl, 'philosophy-practice.png', '헤드셋을 착용하고 미소 짓는 청소년'),
        },
        {
          id: 'role-model',
          title: '롤 모델을 만납니다',
          description: '교사, 기업인, 봉사자, 멘토의 경험을 통해 자신의 미래를 구체적으로 상상합니다.',
          image: media(philosophyRoleModelUrl, 'philosophy-role-model.png', '함께 웃고 있는 청소년들'),
        },
        {
          id: 'mindset',
          title: '긍정적으로 사고합니다',
          description: '부정적인 생각에 머무르지 않고, 다음 도전으로 이어갈 수 있는 회복력을 기릅니다.',
          image: media(philosophyMindsetUrl, 'philosophy-mindset.png', '미소 짓는 두 명의 청소년'),
        },
        {
          id: 'support',
          title: '믿음과 지지를 경험합니다',
          description: '자신의 가능성을 믿어주는 사람들의 응원 속에서 더 큰 도전을 시작합니다.',
          image: media(philosophySupportUrl, 'philosophy-support.png', '창가에서 앞을 바라보는 청소년'),
        },
      ],
    },
    koreaTimeline: KOREA_TIMELINE,
    thrive: {
      title: lines(['Thrive:', '2050년을 향한 JA의 발걸음']),
      lead: lines([
        '기술이 빠르게 발전함에 따라 교육과 일의 방식이 달라지고 있습니다.',
        'JA Worldwide는 2026-2028 글로벌 전략 Thrive를 기반으로 더 많은 청소년에게 교육의 기회를 제공하고,',
        '디지털 기술을 적극적으로 활용하며, 파트너십을 통해 더 큰 임팩트를 만들어 갈 예정입니다',
      ]),
      cards: [
        {
          id: 'empower',
          title: 'EMPOWER YOUTH EVERYWHERE',
          description: '더 많은 지역의 청소년에게 배움의 기회를 전합니다.',
          decoration: media(thriveEmpowerUrl, 'thrive-empower.svg', ''),
        },
        {
          id: 'digital',
          title: 'ACCELERATE DIGITAL',
          description: 'AI와 디지털 기술을 활용해 새로운 교육 경험을 만듭니다.',
          decoration: media(thriveDigitalUrl, 'thrive-digital.svg', ''),
        },
        {
          id: 'partner',
          title: 'PARTNER FOR IMPACT',
          description: '학교, 기업, 정부, 지역사회가 협력해 지속가능한 변화를 만듭니다.',
          decoration: media(thrivePartnerUrl, 'thrive-partner.svg', ''),
        },
        {
          id: 'enablers',
          title: 'STRATEGIC ENABLERS',
          description:
            '데이터 기반 의사결정, 이해관계자 참여 및 AI 자동화 활용, 회원국 성장 단계별 지원을 통해 청소년 교육의 기반을 강화합니다.',
          decoration: media(thriveEnablersUrl, 'thrive-enablers.svg', ''),
        },
      ],
      footnote: lines([
        'JA는 2050년까지 청소년에게 연간 1억 건의 학습 경험을 제공하고, 측정 가능한 형태의 변화를 창출해 번영하는 공동체를 만드는 것을 장기 목표로 삼아 오늘도',
        '전 세계 100여 개 국가에서 청소년을 교육하고 있습니다.',
      ]),
    },
    cta: {
      title: lines(['청소년이 가진', '무한한 잠재력을 믿습니다']),
      body: 'JA Korea는 앞으로도 청소년이 실제 삶과 연결된 교육을 통해 스스로 선택하고 도전할 수 있도록 돕겠습니다. 학교, 기업, 강사, 봉사자, 지역사회 등 다양한 교육 파트너와 협력해 더 많은 청소년에게 배움의 기회를 전하겠습니다.',
      image: media(ctaPhotoUrl, 'cta-photo.png', '함께 웃고 있는 여러 명의 어린이'),
      primaryLabel: '교육 프로그램 살펴보기',
      primaryHref: '/programs',
      secondaryLabel: 'JA Impact 살펴보기',
      secondaryHref: '/impact',
    },
    updatedAt: '',
    version: 0,
  }
}
