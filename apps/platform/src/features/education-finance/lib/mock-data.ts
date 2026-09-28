import ujatLeftUrl from '../image/illustration/ujat-left.jpg'
import ujatRightUrl from '../image/illustration/ujat-right.jpg'
import employeeUrl from '../image/illustration/employee.jpg'
import instructorMainUrl from '../image/illustration/instructor-main.png'
import instructorTopUrl from '../image/illustration/instructor-top.jpg'
import instructorBottomUrl from '../image/illustration/instructor-bottom.png'
import type { FinanceProgramSection } from '../model/types'

export const EDUCATION_FINANCE_PROGRAMS: readonly FinanceProgramSection[] = [
  {
    id: 'ujat',
    title: '대학생 경제교육봉사단 UJAT',
    description:
      '2006년부터 20년 넘게 지속되어 온 JA의 대표 경제교육 프로그램입니다. 전국 주요 지역의 대학생 봉사단원이 초등학교 정규 수업 시간에 강사로 참여해 체계적인 JA의 교재를 바탕으로 어린이 눈높이에 맞춘 체험형 경제교육을 진행합니다. 소비, 저축, 투자, 직업 등 일상적인 주제를 놀이와 활동으로 풀어내 경제의 기초 개념을 자연스럽게 전달합니다. 특히 서울, 경기, 대전, 대구, 전북, 부산 등 전국 단위로 운영돼 지역 간 교육 격차 해소에도 기여하고 있습니다.',
    galleryVariant: 'split',
    images: [
      {
        src: ujatLeftUrl,
        alt: '교실에서 교육자가 학생들에게 경제교육을 진행하는 모습',
        width: 960,
        height: 540,
        layer: { frameW: 960, frameH: 540, layerW: 960, layerH: 540, x: 0, y: 0 },
      },
      {
        src: ujatRightUrl,
        alt: '학생이 경제교육 활동지를 사용하는 모습',
        width: 440,
        height: 540,
        layer: {
          frameW: 440,
          frameH: 540,
          layerW: 895.643,
          layerH: 597.168,
          x: -227.637,
          y: -18.764,
        },
      },
    ],
  },
  {
    id: 'employee',
    title: '임직원 참여형 경제·금융 교육',
    description:
      '기업 임직원이 교육자로 참여해 청소년과 교감하며 직접 경제·금융교육을 진행하는 프로그램입니다. 임직원은 각 분야의 전문가로서 자신이 가진 전문성과 경험을 나누며, 청소년에게는 시장경제에 대한 올바른 인식을 심어줍니다. 기업의 전문성과 JA의 교육이 만나 청소년에게 한층 깊이 있는 배움을 전합니다.',
    galleryVariant: 'full',
    images: [
      {
        src: employeeUrl,
        alt: '교실에서 교육자가 학생들을 대상으로 금융교육을 진행하는 모습',
        width: 1440,
        height: 540,
        layer: { frameW: 1440, frameH: 540, layerW: 1602, layerH: 1068, x: -29, y: -167 },
      },
    ],
    programName: '꿀잼 어린이 금융교육',
    partnerName: '메트라이프생명 사회공헌재단',
    programDescription:
      '메트라이프생명 소속 보험재무설계사(FSR)가 지역 초등학생에게 직접 경제교육을 진행합니다. 교육 접근성이 상대적으로 낮은 지역을 중심으로 임직원이 직접 찾아가 경제 지식을 체계적으로 전합니다. 이와 함께 지역아동센터 아동을 위한 참여형 경제·금융교육인 ‘꿀잼 어린이 금융올림픽’과, 화폐에 대한 이해를 돕는 ‘어린이 금융·화폐교육’을 통해 어린이가 합리적인 경제 주체로 자라나도록 지원합니다.',
  },
  {
    id: 'instructor',
    title: '강사 파견 경제·금융 교육',
    description:
      '전국 초·중·고등학교에 전문 경제교육 강사단을 파견하는 JA Korea의 대표 경제교육 입니다. 학교 정규 수업과 연계해 청소년이 근로자, 소비자, 개인으로서 미래의 삶을 준비할 수 있는 힘을 길러 줍니다. JA의 검증된 교재와 커리큘럼, 참여를 유도하는 놀이와 보드게임 등을 통해 교육을 효과적으로 전달합니다. 생활에 도움이 되는 실질적인 경제 지식을 전함으로써 청소년이 일상에서 합리적인 의사 결정을 내리는 토대를 만듭니다.',
    galleryVariant: 'stack',
    images: [
      {
        src: instructorMainUrl,
        alt: '강사가 활동 자료를 들고 경제 개념을 설명하는 모습',
        width: 880,
        height: 540,
        layer: { frameW: 880, frameH: 540, layerW: 1008, layerH: 756, x: -8, y: -88 },
      },
      {
        src: instructorTopUrl,
        alt: '교실 전체가 보이는 경제·금융 수업 장면',
        width: 520,
        height: 260,
        layer: { frameW: 520, frameH: 260, layerW: 800, layerH: 600, x: -189, y: -106 },
      },
      {
        src: instructorBottomUrl,
        alt: '학생들이 참여하는 경제·금융 수업 장면',
        width: 520,
        height: 260,
        layer: { frameW: 520, frameH: 260, layerW: 581.059, layerH: 387.42, x: -31, y: -64 },
      },
    ],
    programName: '1사1교 경제·금융교육',
    programDescription:
      '금융 분야 기업과 학교를 매칭하는 1사1교 경제·금융교육은 전문 강사가 학교에 직접 찾아가 교육함으로써 경제교육에 대한 접근성을 높이고, 많은 학생들이 시장경제에 대해 바르게 이해할 수 있도록 지원합니다. 특별히 JA가 가진 교육 콘텐츠를 적극적으로 활용해 교육 효과성을 극대화하고 있습니다.',
  },
]

export function getEducationFinancePrograms() {
  return EDUCATION_FINANCE_PROGRAMS
}
