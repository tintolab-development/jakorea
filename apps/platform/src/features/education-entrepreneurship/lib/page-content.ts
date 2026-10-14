import startupLeftUrl from '../image/illustration/startup-left.png'
import startupRightUrl from '../image/illustration/startup-right.png'
import contestUrl from '../image/illustration/contest.png'
import elementaryMainUrl from '../image/illustration/elementary-main.png'
import elementaryTopUrl from '../image/illustration/elementary-top.png'
import elementaryBottomUrl from '../image/illustration/elementary-bottom.png'
import type { EntrepreneurshipProgramSection } from '../model/types'

export const EDUCATION_ENTREPRENEURSHIP_PROGRAMS: readonly EntrepreneurshipProgramSection[] = [
  {
    id: 'startup',
    title: '실물 창업 프로그램',
    description:
      '청소년이 창업의 전 과정을 직접 실현해보는 체험형 기업가정신 교육입니다. 교육에 참여하는 학생들은 아이디어 발상과 디자인씽킹을 시작으로 제품 기획, 제작, 홍보, 판매, 투자 설명회(IR)까지 실제 창업의 절차를 직접 경험합니다. 더불어 팀을 이뤄 프로젝트를 수행하며 창의력, 리더십, 협동심, 문제 해결 능력, 위기 관리 능력을 기릅니다.',
    galleryVariant: 'split',
    images: [
      {
        src: startupLeftUrl,
        alt: '청소년들이 부스에서 사업 아이디어와 제품을 설명하는 모습',
        width: 960,
        height: 540,
        objectPosition: 'center',
      },
      {
        src: startupRightUrl,
        alt: '청소년들이 수상 보드와 꽃다발을 들고 있는 모습',
        width: 440,
        height: 540,
        objectPosition: 'center',
      },
    ],
    programName: 'Company of the Year',
    programDescription:
      '창업을 통해 주변 문제에 대한 해결 방안을 모색해보는 JA의 대표 기업가정신 교육 프로그램입니다. 청소년들은 문제를 해결할 수 있는 실물 상품을 기획 및 제작하고 전문가 앞에서 비즈니스 모델을 발표하는 ‘투자 설명회’를 거치며 비즈니스 관점에서 세상을 바라보는 경험을 얻습니다. 더불어 창업 과정에서 따라오는 실패와 성공의 경험을 밑거름 삼아 한 사람의 기업가로 성장합니다. 최종적으로 국내대회에서 우수한 성과를 거둔 팀은 아시아·태평양 지역 청소년 기업가들이 참여하는 국제대회 ‘JA Asia Pacific Company of the Year Competition’ 진출하게 됩니다.',
  },
  {
    id: 'contest',
    title: '비즈니스 경연대회',
    description:
      '비즈니스 전략을 수립 및 발표하는 과정을 통해 기업가정신을 함양합니다. 대회에 참여하는 청소년은 무역, 창업, 금융, 컨설팅 등 여러 분야의 전문가와 교류하며 비즈니스 역량을 키웁니다. 또한 사업 계획이나 비즈니스 대응 방안을 발표하는 팀 단위 프로젝트를 겪으며 기업가로 발돋움할 수 있는 기반을 마련합니다. 국내 대회에서 뛰어난 성과를 거둔 팀에게는 JA 글로벌 네트워크와 협력해 국제대회 진출 자격을 제공합니다.',
    galleryVariant: 'full',
    images: [
      {
        src: contestUrl,
        alt: '참가자들이 청중과 심사위원 앞에서 발표하는 모습',
        width: 1440,
        height: 540,
        objectPosition: 'center',
      },
    ],
    programName: 'International Trade Challenge',
    partnerName: 'FedEx',
    programDescription:
      '고등학생이 실제 무역 사례를 분석하고 발표하는 과정을 겪으며 기업가로 성장할 수 있도록 돕는 국제무역창업대회입니다. 학생들은 FedEx 임직원이 멘토로 참여하는 교육 워크숍을 통해 해외 시장에 대한 이해와 분석 방법을 대해 배우고, 실제 글로벌 상황에 기반한 마켓과 사업 아이템을 바탕으로 시장 진입 전략을 세워 발표하게 됩니다. 국내대회에서 우승한 팀에게는 아시아·태평양 지역 각 국가별 우승 팀이 모여 경쟁하는 Asia Pacific Finals 진출 자격을 부여합니다.',
  },
  {
    id: 'elementary',
    title: '초·중등 기업가정신 교육',
    description:
      '초·중학생의 눈높이에 맞춰 참여형 교육과 놀이를 결합한 체험형 기업가정신 교육을 운영합니다. 교육을 듣고 나면 가족, 직업, 기업, 경제의 기본 개념을 자연스럽게 이해할 수 있습니다. 학생들은 상품을 만들고 CEO가 되어보는 활동으로 기업가정신과 창의력을 함양하게 됩니다.',
    galleryVariant: 'stack',
    images: [
      {
        src: elementaryMainUrl,
        alt: '교실에서 강사와 학생들이 수업에 참여하는 모습',
        width: 880,
        height: 540,
        objectPosition: 'center',
      },
      {
        src: elementaryTopUrl,
        alt: '학생들이 테이블에서 활동하는 모습',
        width: 520,
        height: 260,
        objectPosition: 'center',
      },
      {
        src: elementaryBottomUrl,
        alt: '강사가 교실에서 설명하는 모습',
        width: 520,
        height: 260,
        objectPosition: 'center',
      },
    ],
    programName: '기발한 초등 CEO 교실',
    partnerName: '한국경제인협회',
    programDescription:
      '가족과 마을을 중심으로 경제의 기초 개념을 익히고, 장난감을 활용해 제품 생산부터 판매까지 기업 운영의 전 과정을 경험해보는 기업가정신 교육입니다. 이를 통해 청소년은 기업가의 시각과 시장 경제의 원리를 배웁니다. 특히 전국 늘봄·돌봄학교에서 기발한 CEO 교실을 진행함으로써 기업가정신 교육의 접근성을 높이는 데 기여하고 있습니다.',
  },
]

export function getEducationEntrepreneurshipPrograms() {
  return EDUCATION_ENTREPRENEURSHIP_PROGRAMS
}
