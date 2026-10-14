import aiLiteracyLectureUrl from '../image/illustration/ai-literacy-lecture.png'
import aiLiteracySpeakerUrl from '../image/illustration/ai-literacy-speaker.png'
import swAiPracticeUrl from '../image/illustration/sw-ai-practice.png'
import type { DigitalLiteracyProgramSection } from '../model/types'

export const EDUCATION_DIGITAL_LITERACY_PROGRAMS: readonly DigitalLiteracyProgramSection[] = [
  {
    id: 'ai-literacy',
    title: 'AI 리터러시 교육',
    description:
      '생성형 AI를 안전하고 효과적으로 활용할 수 있도록 지원하는 교육 프로그램입니다. AI 도구로 창의성과 생산성을 높이는 방법과 AI가 생성하는 거짓 정보를 가려내고 책임감 있게 사용하는 AI 윤리를 함께 다룹니다. 교사에게는 수업에 AI를 통합함으로써 교육의 효과성을 높일 수 있게 돕고, 학생에게는 수강·과제·진로 탐색 등 다양한 교육의 영역에서 AI를 활용할 수 있는 힘을 길러줍니다.',
    galleryVariant: 'split',
    images: [
      {
        src: aiLiteracyLectureUrl,
        alt: '참가자들이 테이블에 앉아 AI 관련 강의를 듣고 발표 화면을 보는 모습',
        width: 960,
        height: 540,
        objectPosition: '50% 55%',
      },
      {
        src: aiLiteracySpeakerUrl,
        alt: '연단에서 마이크를 들고 발표하는 강사의 모습',
        width: 440,
        height: 540,
        objectPosition: '32% 68%',
      },
    ],
    programName: 'Google AI Educator Series(GES)',
    partnerName: 'Google for Education',
    programDescription:
      '생성형 AI인 Gemini를 활용해 교사 업무 생산성을 높이고 학생에게 양질의 학습 경험을 제공하는 교사 AI 역량강화 프로그램입니다. 생성형 AI와 각종 AI 도구를 교육 현장에 통합해 활용할 수 있도록 지원하며, AI 윤리 교육으로 기술을 효과적이고 책임감 있게 사용하는 힘을 기릅니다.',
  },
  {
    id: 'sw-ai',
    title: 'SW·AI 역량강화 교육',
    description:
      '청소년과 청년이 소프트웨어, AI 등 첨단 산업에서 활용되는 디지털 도구를 효과적으로 사용할 수 있도록 지원합니다. 디자인씽킹 기반 체험형 AI 교육으로 가상의 문제를 해결하거나 산업 현장에서 사용하는 방식으로 AI를 활용해보는 등 폭넓은 교육 프로그램을 운영합니다. 또한 단순히 기술적 역량을 기르는 데 그치지 않고 여러 산업 분야에서 SW·AI 기술을 활용할 수 있도록 다양한 기회를 제공합니다.',
    galleryVariant: 'full',
    images: [
      {
        src: swAiPracticeUrl,
        alt: '실습 장비가 있는 공간에서 강사가 참가자들에게 자료를 들어 설명하는 모습',
        width: 1440,
        height: 540,
        objectPosition: '48% 30%',
      },
    ],
    programName: '삼성SW·AI아카데미(SSAFY)',
    partnerName: 'SAMSUNG',
    programDescription:
      '1년 과정의 실무 중심 SW·AI 교육으로 청년들이 취업 시장에서 경쟁력을 갖출 수 있도록 지원합니다. AI 활용 영상 제작이나 3D 프린팅 등 AI를 활용한 창작 활동으로 창의력을 키우는 ‘AI 창의캠프‘, 교육 과정 수료를 앞둔 청년에게 창업이라는 또 다른 진로 영역을 탐색할 수 있도록 ‘AI 창업캠프’를 운영하고 있습니다.',
  },
]

export function getEducationDigitalLiteracyPrograms() {
  return EDUCATION_DIGITAL_LITERACY_PROGRAMS
}
