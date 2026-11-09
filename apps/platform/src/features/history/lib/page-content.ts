import era1920Url from '../image/illustration/era-1920.png'
import era1950Url from '../image/illustration/era-1950.png'
import era1960Url from '../image/illustration/era-1960.png'
import era1980Url from '../image/illustration/era-1980.png'
import expansionPhotoUrl from '../image/illustration/expansion-photo.png'
import koreaPhotoUrl from '../image/illustration/korea-photo.png'
import learningPhotoUrl from '../image/illustration/learning-photo.png'
import philosophyMindsetUrl from '../image/illustration/philosophy-mindset.png'
import philosophyPracticeUrl from '../image/illustration/philosophy-practice.png'
import philosophyRoleModelUrl from '../image/illustration/philosophy-role-model.png'
import philosophySupportUrl from '../image/illustration/philosophy-support.png'
import thriveDigitalUrl from '../image/illustration/thrive-digital.svg'
import thriveEmpowerUrl from '../image/illustration/thrive-empower.svg'
import thriveEnablersUrl from '../image/illustration/thrive-enablers.svg'
import thrivePartnerUrl from '../image/illustration/thrive-partner.svg'
import ctaPhotoUrl from '../image/illustration/cta-photo.png'
import type {
  HistoryEraPhoto,
  HistoryPhilosophyCard,
  HistoryThriveCard,
  HistoryTimelinePeriod,
} from '../model/types'

export const LEARNING_PHOTO_URL = learningPhotoUrl
export const EXPANSION_PHOTO_URL = expansionPhotoUrl
export const KOREA_PHOTO_URL = koreaPhotoUrl
export const CTA_PHOTO_URL = ctaPhotoUrl

export const HISTORY_ERA_PHOTOS: readonly HistoryEraPhoto[] = [
  {
    year: '1920',
    caption:
      '미국 메사추세츠 스프링필드에서 열린 Trade Fair에 모자를 비롯한 상품들이 전시되어 있다.',
    captionLines: [
      '미국 메사추세츠 스프링필드에서 열린',
      'Trade Fair에 모자를 비롯한 상품들이 전시되어 있다.',
    ],
    imageUrl: era1920Url,
    alt: '1920년대 스프링필드 Trade Fair에 전시된 모자와 상품',
    align: 'left',
  },
  {
    year: '1950',
    caption: 'JA Company Program의 Trade Fair에 참여한 학생들이 수상하고 있다.',
    imageUrl: era1950Url,
    alt: '1950년대 JA Company Program Trade Fair에서 수상하는 학생들',
    align: 'right',
  },
  {
    year: '1960',
    caption: 'JA를 통해 성장한 학생 기업이 자신들의 상품을 선보이고 있다.',
    imageUrl: era1960Url,
    alt: '1960년대 JA 학생 기업이 상품을 선보이는 모습',
    align: 'left',
  },
  {
    year: '1980',
    caption: '인디애나폴리스에서 JA의 응용경제학 교육 프로그램이 진행되고 있다.',
    imageUrl: era1980Url,
    alt: '1980년대 인디애나폴리스 JA 응용경제학 교육 현장',
    align: 'right',
  },
]

export const WORLD_TIMELINE_PERIODS: readonly HistoryTimelinePeriod[] = [
  {
    id: '1919-1929',
    label: '1919-1929',
    title: '청소년 비즈니스 교육의 시작',
    events: [
      { year: '1919', lines: ['방과후교실에서 비즈니스 교육 시작'] },
      { year: '1920', lines: ['Junior Achievement로 이름 변경'] },
      { year: '1929', lines: ['실물 창업에 기반한 기업가정신 교육 진행'] },
    ],
  },
  {
    id: '1955-1962',
    label: '1955-1962',
    title: '',
    events: [
      { year: '1955', lines: ['캐나다 밴쿠버에 JA 첫 국제 사무소 개설'] },
      { year: '1962', lines: ['JA를 모델로 한 Young Enterprise 영국에서 출범'] },
    ],
  },
  {
    id: '1969-2000',
    label: '1969-2000',
    title: '',
    events: [
      { year: '1969', lines: ['컴퓨터 시뮬레이션 교육 도입'] },
      { year: '1974', lines: ['학교에서 직접 운영할 수 있는 교육 프로그램 연구 및 개발'] },
      { year: '1980 ~ 1990', lines: ['아프리카, 중남미, 유럽, 아시아로 JA 네트워크 확장'] },
      {
        year: '1994',
        lines: [
          '급증하는 세계적 경제교육 수요를 충족시키기 위해 Junior Achievement International 창설',
        ],
      },
      {
        year: '2000',
        lines: ['온라인 학습과 오프라인 활동을 결합한 게임형 시뮬레이션 교육 본격화'],
      },
    ],
  },
  {
    id: '2019-now',
    label: '2019-Now',
    title: '',
    events: [
      { year: '2019', lines: ['JA 창립 100주년'] },
      { year: '2020', lines: ['코로나19 대응 디지털 교육 프로그램 확대'] },
      { year: '2022', lines: ['2022년부터 5년 연속 노벨평화상 후보 추천'] },
      { year: 'Now', lines: ['2050년까지 청소년에게 연간 1억 건의 학습 경험 제공 목표'] },
    ],
  },
]

export const KOREA_TIMELINE_PERIODS: readonly HistoryTimelinePeriod[] = [
  {
    id: '2002-2006',
    label: '2002-2006',
    title: '한국에서 시작된 JA 교육',
    events: [
      { year: '2002', lines: ['JA Korea 설립 (초대 이사장 강경식 전 부총리)'] },
      { year: '2003', lines: ['JA 초등 경제교육 프로그램 한국화, 청소년 진로 프로그램 개발'] },
      {
        year: '2006',
        lines: [
          '2006년 대학생경제교육봉사단 UJAT 출범',
          '고등학교 대상 글로벌 기업가정신 교육 프로그램 운영',
        ],
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
        lines: [
          '대학생 경제교육봉사단 표창(서울시)',
          '대학생, 기업 파트너가 학교 정규 수업에 참여하는 교육 모델을 전국으로 확장',
        ],
      },
      { year: '2014', lines: ['청소년 SW 교육 시작'] },
      { year: '2015', lines: ['누적 교육 수혜자 100만 명 돌파'] },
    ],
  },
  {
    id: '2016-2020',
    label: '2016-2020',
    title: '',
    events: [
      {
        year: '2016',
        lines: [
          '급변하는 산업 환경을 반영한 디지털 리터러시 교육 확대 (ICT, 코딩, 데이터, 정보보안 등)',
        ],
      },
      { year: '2019', lines: ['대한민국 경제교육대상(기획재정부)'] },
      {
        year: '2020',
        lines: ['기업가정신 확산·진흥 유공 포상(중소벤처기업부)', '누적 교육 봉사자 10만 명 돌파'],
      },
    ],
  },
  {
    id: '2021-now',
    label: '2021-Now',
    title: '',
    events: [
      {
        year: '2021',
        lines: [
          '온라인 체험형 경제교육 플랫폼 JA Finance Park 개발 및 운영',
          '생성형 AI 활용 교육 및 AI 윤리 교육 확대',
        ],
      },
      {
        year: '2026',
        lines: ['JA Asia Pacific Company of the Year Competition(COYC) 개최'],
      },
      {
        year: 'Now',
        lines: ['BETTER GROUND High School 등 한국 개발 교육 프로그램의 글로벌 운영 (6개국)'],
      },
    ],
  },
]

export const HISTORY_PHILOSOPHY_CARDS: readonly HistoryPhilosophyCard[] = [
  {
    id: 'practice',
    title: '직접 해보며 익힙니다',
    description: '실제 환경과 유사한 체험 활동으로 새로운 기술과 문제 해결 방법을 배웁니다.',
    descriptionPcLines: [
      '실제 환경과 유사한 체험 활동으로',
      '새로운 기술과 문제 해결 방법을 배웁니다.',
    ],
    descriptionMobileLines: [
      '실제 환경과 유사한 체험 활동으로',
      '새로운 기술과 문제 해결 방법을 배웁니다.',
    ],
    imageUrl: philosophyPracticeUrl,
    alt: '헤드셋을 착용하고 미소 짓는 청소년',
  },
  {
    id: 'role-model',
    title: '롤 모델을 만납니다',
    description: '교사, 기업인, 봉사자, 멘토의 경험을 통해 자신의 미래를 구체적으로 상상합니다.',
    descriptionPcLines: [
      '교사, 기업인, 봉사자,',
      '멘토의 경험을 통해 자신의 미래를',
      '구체적으로 상상합니다.',
    ],
    descriptionMobileLines: [
      '교사, 기업인, 봉사자, 멘토의 경험을 통해',
      '자신의 미래를 구체적으로 상상합니다.',
    ],
    imageUrl: philosophyRoleModelUrl,
    alt: '함께 웃고 있는 청소년들',
  },
  {
    id: 'mindset',
    title: '긍정적으로 사고합니다',
    description: '부정적인 생각에 머무르지 않고, 다음 도전으로 이어갈 수 있는 회복력을 기릅니다.',
    descriptionPcLines: [
      '부정적인 생각에 머무르지 않고,',
      '다음 도전으로 이어갈 수 있는',
      '회복력을 기릅니다.',
    ],
    descriptionMobileLines: [
      '부정적인 생각에 머무르지 않고, 다음 도전으로',
      '이어갈 수 있는 회복력을 기릅니다.',
    ],
    imageUrl: philosophyMindsetUrl,
    alt: '미소 짓는 두 명의 청소년',
  },
  {
    id: 'support',
    title: '믿음과 지지를 경험합니다',
    description: '자신의 가능성을 믿어주는 사람들의 응원 속에서 더 큰 도전을 시작합니다.',
    descriptionPcLines: ['자신의 가능성을 믿어주는 사람들의 응원 속에서 더 큰 도전을 시작합니다.'],
    descriptionMobileLines: [
      '자신의 가능성을 믿어주는 사람들의 응원 속에서',
      '더 큰 도전을 시작합니다.',
    ],
    imageUrl: philosophySupportUrl,
    alt: '창가에서 앞을 바라보는 청소년',
  },
]

export const HISTORY_THRIVE_CARDS: readonly HistoryThriveCard[] = [
  {
    id: 'empower',
    titleLines: ['EMPOWER YOUTH EVERYWHERE'],
    description: '더 많은 지역의 청소년에게 배움의 기회를 전합니다.',
    descriptionPcLines: ['더 많은 지역의 청소년에게 배움의 기회를 전합니다.'],
    descriptionMobileLines: ['더 많은 지역의 청소년에게', '배움의 기회를 전합니다.'],
    decorationUrl: thriveEmpowerUrl,
  },
  {
    id: 'digital',
    titleLines: ['ACCELERATE DIGITAL'],
    description: 'AI와 디지털 기술을 활용해 새로운 교육 경험을 만듭니다.',
    descriptionPcLines: ['AI와 디지털 기술을 활용해 새로운', '교육 경험을 만듭니다.'],
    descriptionMobileLines: ['AI와 디지털 기술을 활용해', '새로운 교육 경험을 만듭니다.'],
    decorationUrl: thriveDigitalUrl,
  },
  {
    id: 'partner',
    titleLines: ['PARTNER FOR IMPACT'],
    description: '학교, 기업, 정부, 지역사회가 협력해 지속가능한 변화를 만듭니다.',
    descriptionPcLines: ['학교, 기업, 정부, 지역사회가 협력해', '지속가능한 변화를 만듭니다.'],
    descriptionMobileLines: ['학교, 기업, 정부, 지역사회가 협력해', '지속가능한 변화를 만듭니다.'],
    decorationUrl: thrivePartnerUrl,
  },
  {
    id: 'enablers',
    titleLines: ['STRATEGIC ENABLERS'],
    description:
      '데이터 기반 의사결정, 이해관계자 참여 및 AI 자동화 활용, 회원국 성장 단계별 지원을 통해 청소년 교육의 기반을 강화합니다.',
    descriptionPcLines: [
      '데이터 기반 의사결정, 이해관계자 참여 및 AI 자동화 활용, 회원국 성장 단계별 지원을 통해 청소년 교육의 기반을 강화합니다.',
    ],
    descriptionMobileLines: [
      '데이터 기반 의사결정, 이해관계자',
      '참여 및 AI 자동화 활용, 회원국 성장',
      '단계별 지원을 통해 청소년 교육의',
      '기반을 강화합니다.',
    ],
    decorationUrl: thriveEnablersUrl,
  },
]
