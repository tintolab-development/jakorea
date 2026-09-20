import exploreLectureUrl from '../image/illustration/explore-lecture.jpg'
import exploreWorkshopUrl from '../image/illustration/explore-workshop.jpg'
import experienceUrl from '../image/illustration/experience.jpg'
import strengthenBaristaUrl from '../image/illustration/strengthen-barista.jpg'
import strengthenMentoringUrl from '../image/illustration/strengthen-mentoring.jpg'
import strengthenCounselingUrl from '../image/illustration/strengthen-counseling.jpg'
import type { CareerProgramSection } from '../model/types'

export const EDUCATION_CAREER_PROGRAMS: readonly CareerProgramSection[] = [
  {
    id: 'explore',
    title: '진로 탐색 프로그램',
    description:
      '청소년이 다양한 직업의 세계를 폭넓게 살펴보면서 막연했던 진로의 선택지를 구체적으로 넓혀가는 프로그램입니다. 학생들은 프로그램에 참여하면서 자신이 무엇에 관심 있고 어떤 일이 맞는지 스스로 탐색하는 시간을 갖습니다. 또한 현직자와의 대화와 직무 체험을 통해 각 직업이 실제로 어떤 일을 하는지 생생하게 이해하게 됩니다. 이 과정을 통해 청소년은 주도적으로 진로를 결정하는 힘을 갖게 됩니다.',
    galleryVariant: 'explore',
    images: [
      {
        src: exploreLectureUrl,
        alt: '강연자가 무대에서 진로 교육을 진행하고 참여자들이 경청하는 모습',
        width: 960,
        height: 540,
        objectPosition: 'center',
      },
      {
        src: exploreWorkshopUrl,
        alt: '참여자들이 테이블에 모여 활동하는 모습',
        width: 440,
        height: 540,
        objectPosition: '86% center',
      },
    ],
    programName: 'Global Career Discovery',
    partnerName: 'SAP',
    programDescription:
      'SAP의 임직원이 멘토로 참여해 고등학생이 진로를 주도적으로 설계할 수 있도록 지원합니다. 학생들은 IT·소프트웨어 분야 진로 탐색은 물론, JA Career Success 교재를 활용해 직장 생활에 필요한 의사소통 능력과 문제 해결 역량을 키울 수 있는 다양한 교육에 참여합니다. 또한 AI 도구를 활용해 자신의 강점을 파악하고 진로를 고민해보는 시간도 가집니다.',
  },
  {
    id: 'experience',
    title: '직무 체험 프로그램',
    description:
      '청소년이 관심 있는 산업과 직무를 교실 밖 현장에서 직접 경험해보는 프로그램입니다. 자산운용, 항공, 영화·콘텐츠, 게임 개발 등 다양한 분야의 기업과 함께 현직자 멘토링 및 견학 기회를 제공합니다. 학생들은 책으로만 접하던 직업 세계를 눈으로 보고 손으로 익히며, 현업 전문가와 나누는 대화를 통해 진로와 미래를 주도적으로 구체화합니다. 일부 프로그램에서는 학생이 직접 결과물을 기획 및 제작해보는 프로젝트를 진행해 실무자로서의 가능성을 확장할 수 있도록 돕습니다. 청소년은 프로그램을 통해 자신에게 맞는 길을 스스로 탐색하는 힘을 기릅니다.',
    galleryVariant: 'experience',
    images: [
      {
        src: experienceUrl,
        alt: '참여자들이 모니터와 기기를 활용해 직무를 체험하는 모습',
        width: 1440,
        height: 540,
        objectPosition: 'center',
      },
    ],
    programName: 'BETTER GROUND High School',
    partnerName: 'KRAFTON',
    programDescription:
      '게임 분야 진로를 희망하는 고등학생에게 현직자 멘토링과 전문적인 교육을 제공해, 실제 게임을 개발할 수 있도록 지원합니다. 기획, 프로그래밍, 아트 등의 역할을 나눠 프로젝트를 수행하고, 그 과정에서 게임 개발 직무를 체험합니다. 2025년부터는 글로벌로 확장돼 여러 나라의 게임 개발 꿈나무 청소년과 교류할 수 있는 기회도 제공하고 있습니다.',
  },
  {
    id: 'strengthen',
    title: '취업 역량 강화 프로그램',
    description:
      '성공적인 취업에 필요한 실무 역량을 강화하고, 실제 취업까지 연결될 수 있도록 지원하는 프로그램입니다. 특성화고등학교 학생을 비롯해 사회 진출을 앞둔 청소년과 청년에게 이력서 작성, 자기소개서 첨삭, 실전 모의 면접 등 취업을 위한 스킬과 함께 직장에서 갖춰야 할 태도와 소통 방식에 대해서도 교육합니다. 학생들은 현직자 앞에서 직접 면접을 경험하며 자신감을 키우고 부족한 점을 스스로 보완할 수 있게 됩니다.',
    galleryVariant: 'strengthen',
    images: [
      {
        src: strengthenBaristaUrl,
        alt: '커피 관련 직무 체험 교육을 진행하는 모습',
        width: 880,
        height: 540,
        objectPosition: 'center',
      },
      {
        src: strengthenMentoringUrl,
        alt: '멘토와 참여자가 마주 앉아 대화하는 모습',
        width: 520,
        height: 260,
        objectPosition: 'center 42%',
      },
      {
        src: strengthenCounselingUrl,
        alt: '상담·교육 활동이 이루어지는 모습',
        width: 520,
        height: 260,
        objectPosition: 'center',
      },
    ],
    programName: 'Build Your Opportunities',
    partnerName: 'Starbucks',
    programDescription:
      '스타벅스 바리스타 파트너가 멘토로 활동하며 학생들에게 취업 준비 및 사회생활 기술, 바리스타 교육 등을 제공합니다. 특성화고등학교 학생들에게는 교육 이수 후 채용 연계의 기회까지 제공해 지금까지 500여 명 이상이 스타벅스 바리스타로 취업했습니다. 이와 함께 취업 역량을 종합적으로 키울 수 있는 JOB 박람회를 개최해 청년 취업 활성화를 도모하고 있습니다.',
  },
]

export function getEducationCareerPrograms() {
  return EDUCATION_CAREER_PROGRAMS
}
