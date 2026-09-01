import { shouldUsePlatformMockData } from '@/shared/lib/dev-auth'
import { useShouldUsePlatformMockData } from '@/shared/hooks'
import type { OneToOneInquiryItem } from '../model/types'

export const MOCK_ONE_TO_ONE_INQUIRIES: OneToOneInquiryItem[] = [
  {
    id: 'inq-1',
    category: '프로그램',
    title: '내 프로그램을 확인하려면 어떻게 해야하나요?',
    status: 'pending',
    createdAt: '2026년 05월 08일',
    programName: '2026 JA 경제교육 캠프',
    question:
      '안녕하세요. 마이페이지에서 신청한 프로그램 목록이 보이지 않아 문의드립니다. 교육현황 메뉴에 들어가도 빈 화면만 표시됩니다.',
    order: 1,
  },
  {
    id: 'inq-2',
    category: '계정',
    title: '비밀번호가 맞는데도 로그인이 되지 않아요.',
    status: 'answered',
    createdAt: '2026년 05월 07일',
    programName: '회원 서비스',
    question:
      '안녕하세요. 기존에 사용하던 계정으로 로그인을 하려고 하는데 비밀번호가 맞는데도 계속 틀렸다고 나옵니다. 비밀번호 재설정도 시도해봤는데 메일이 오지 않아서 확인이 어렵습니다.',
    answer:
      '안녕하세요. 문의해 주셔서 감사합니다. 확인 결과 회원님의 계정은 정상적으로 유지되고 있습니다. 비밀번호 재설정 메일이 보이지 않는 경우 스팸함을 함께 확인해 주세요. 그래도 메일을 받지 못하셨다면 가입하신 이메일 주소를 함께 남겨주시면 추가로 확인해 드리겠습니다.',
    order: 2,
  },
  {
    id: 'inq-3',
    category: '프로그램',
    title: '프로그램 신청 취소는 어디에서 하나요?',
    status: 'pending',
    createdAt: '2026년 05월 06일',
    programName: '2026 UJAT 봉사 프로그램',
    question:
      '일정 변경으로 인해 신청한 프로그램을 취소하려고 합니다. 마이페이지에서 취소 버튼을 찾지 못해 문의드립니다.',
    answer:
      '모집 마감 전에는 마이페이지 > 교육현황에서 신청 취소가 가능합니다. 해당 프로그램 상세에서 「신청 취소」 버튼을 확인해 주세요.',
    order: 3,
  },
  {
    id: 'inq-4',
    category: '정산',
    title: '정산 지급일을 확인하고 싶습니다.',
    status: 'answered',
    createdAt: '2026년 05월 05일',
    programName: '2025 하반기 강사 정산',
    question: '정산 승인 완료 후 입금 예정일을 알고 싶습니다.',
    answer:
      '정산 승인 후 영업일 기준 약 7~14일 내 지급됩니다. 마이페이지 > 정산현황에서 지급 예정일과 처리 상태를 확인할 수 있습니다.',
    order: 4,
  },
  {
    id: 'inq-5',
    category: '회원가입',
    title: '법정대리인 동의 메일이 오지 않아요.',
    status: 'pending',
    createdAt: '2026년 05월 04일',
    programName: '회원 서비스',
    question:
      '만 14세 미만 자녀 회원가입 중 보호자 동의 메일을 재발송했지만 계속 수신되지 않습니다.',
    order: 5,
  },
  {
    id: 'inq-6',
    category: '계정',
    title: '등록 이메일 주소 변경이 가능한가요?',
    status: 'answered',
    createdAt: '2026년 05월 03일',
    programName: '회원 서비스',
    question: '회원정보에 등록된 이메일을 다른 주소로 변경하고 싶습니다.',
    answer:
      '마이페이지 > 회원정보 설정에서 이메일 변경이 가능합니다. 변경 시 본인 확인 절차가 필요할 수 있습니다.',
    order: 6,
  },
  {
    id: 'inq-7',
    category: '프로그램',
    title: 'UJAT 파트너 매칭 일정 문의',
    status: 'pending',
    createdAt: '2026년 05월 02일',
    programName: '2026 UJAT 봉사 프로그램',
    question: '파트너 매칭 결과와 첫 봉사 일정은 언제 공지되나요?',
    order: 7,
  },
  {
    id: 'inq-8',
    category: '정산',
    title: '지급조서 재작성이 필요한지 확인 부탁드립니다.',
    status: 'answered',
    createdAt: '2026년 05월 01일',
    programName: '2025 하반기 강사 정산',
    question: '개인정보 유효기간 만료 안내를 받았는데 지급조서를 다시 작성해야 하나요?',
    answer:
      '개인정보 유효기간 만료 후 최초 정산 신청 시 지급조서 재작성이 필요합니다. 마이페이지 > 약관 및 정책 동의 관리에서 상태를 확인해 주세요.',
    order: 8,
  },
  {
    id: 'inq-9',
    category: '프로그램',
    title: '교육 자료 다운로드가 되지 않습니다.',
    status: 'pending',
    createdAt: '2026년 04월 30일',
    programName: '2026 JA 경제교육 캠프',
    question: '프로그램 상세 페이지에서 교육 자료 PDF 다운로드 버튼을 눌러도 반응이 없습니다.',
    order: 9,
  },
  {
    id: 'inq-10',
    category: '회원가입',
    title: '소셜 계정 연동 해제 방법',
    status: 'answered',
    createdAt: '2026년 04월 28일',
    programName: '회원 서비스',
    question: '카카오 로그인 연동을 해제하고 이메일 로그인만 사용하고 싶습니다.',
    answer:
      '마이페이지 > 회원정보 설정 > 로그인 수단 관리에서 연동된 소셜 계정을 해제할 수 있습니다. 이메일·비밀번호 등록이 선행되어야 합니다.',
    order: 10,
  },
]

export function useMockOneToOneInquiriesCatalog(): OneToOneInquiryItem[] {
  useShouldUsePlatformMockData()
  if (!shouldUsePlatformMockData()) return []
  return MOCK_ONE_TO_ONE_INQUIRIES
}
