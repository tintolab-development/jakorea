/**
 * FAQ Mock 데이터
 */

export interface FAQ {
  id: string
  category: '활동' | '봉사시간' | '시스템' | '정산' | '안내'
  question: string
  answer: string
  tags?: string[]
  status: 'published' | 'draft' | 'archived'
  order: number
}

export const mockFAQs: FAQ[] = [
  {
    id: '1',
    category: '봉사시간',
    question: '봉사시간은 언제 확인 가능한가요?',
    answer: '봉사 활동 종료 후 활동 보고서가 승인되면 1365 자원봉사 포털로 실적이 전송됩니다. 전송 후 포털 반영까지는 약 3~5일 정도 소요될 수 있습니다.',
    tags: ['1365', '확인시기'],
    status: 'published',
    order: 1,
  },
  {
    id: '2',
    category: '봉사시간',
    question: '1365 아이디가 없으면 봉사시간을 못 받나요?',
    answer: '네, 봉사시간은 1365 자원봉사 포털을 통해 연계되므로 반드시 1365 아이디가 필요하며, JAKorea 회원정보에 해당 아이디를 등록해주셔야 합니다.',
    tags: ['1365', '필수사항'],
    status: 'published',
    order: 2,
  },
  {
    id: '3',
    category: '활동',
    question: '2인 1조 파트너는 어떻게 정해지나요?',
    answer: '교육 기수와 지역을 고려하여 시스템에서 자동으로 배정하거나 운영팀에서 조정합니다. 가급적 파트너 중복을 피하고 다양한 분들과 활동하실 수 있도록 배정하고 있습니다.',
    tags: ['파트너', '배정방식'],
    status: 'published',
    order: 3,
  },
  {
    id: '4',
    category: '활동',
    question: '갑작스러운 사정으로 봉사 일정 변경이 가능한가요?',
    answer: '일정 변경은 파트너와 학교 측의 협의가 필요하므로 가급적 지양해주시기 바랍니다. 불가피한 경우 최소 1주일 전에 운영팀으로 연락주셔야 하며, 대리 봉사자 투입 등의 조치가 필요할 수 있습니다.',
    tags: ['일정변경', '취소'],
    status: 'published',
    order: 4,
  },
  {
    id: '5',
    category: '시스템',
    question: '비밀번호를 잊어버렸어요.',
    answer: '로그인 화면의 "비밀번호 찾기" 기능을 이용하시거나, 가입 시 등록한 이메일/휴대폰 번호를 통해 본인 인증 후 재설정하실 수 있습니다.',
    tags: ['로그인', '계정'],
    status: 'published',
    order: 5,
  },
  {
    id: '6',
    category: '정산',
    question: '봉사단도 활동비를 받나요?',
    answer: '기본적으로 봉사 활동은 무보수 원칙이나, 일부 원거리 활동의 경우 교통비 실비가 지급될 수 있습니다. 해당되는 경우 프로그램 공지사항을 통해 별도로 안내드립니다.',
    tags: ['교통비', '활동비'],
    status: 'published',
    order: 6,
  },
  {
    id: '7',
    category: '안내',
    question: '봉사 인증서는 어디서 발급받나요?',
    answer: '전체 봉사 기간이 종료된 후 마이페이지 > 봉사단 활동 관리 > 참여 이력 메뉴에서 인증서를 PDF로 내려받으실 수 있습니다.',
    tags: ['인증서', '수료증'],
    status: 'published',
    order: 7,
  },
]
