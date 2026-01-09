/**
 * 문의하기 Mock 데이터
 */

export interface Inquiry {
  id: string
  title: string
  content: string
  category: '활동' | '봉사시간' | '시스템' | '정산' | '안내' | '기타'
  status: 'PENDING' | 'ANSWERED'
  createdAt: string
  author: string
  userId: string
  answer?: {
    content: string
    answeredAt: string
    author: string
  }
}

export const mockInquiries: Inquiry[] = [
  {
    id: '1',
    category: '봉사시간',
    title: '1365 포털에 봉사시간이 아직 안 올라왔어요.',
    content: '지난주 수요일에 활동을 완료했는데 아직 1365 포털에서 확인이 안 됩니다. 확인 부탁드립니다.',
    status: 'ANSWERED',
    createdAt: '2025-01-02T10:00:00',
    author: '서봉사',
    userId: 'user-volunteer1',
    answer: {
      content: '안녕하세요, 자원봉사자님. 해당 활동은 현재 운영팀에서 활동 보고서 검토 단계에 있습니다. 검토 승인 후 1365로 전송될 예정이며, 이번 주 금요일까지는 반영될 것으로 보입니다. 조금만 더 기다려주시기 바랍니다.',
      answeredAt: '2025-01-03T14:00:00',
      author: '운영팀 관리자',
    },
  },
  {
    id: '2',
    category: '활동',
    title: '파트너 연락처 확인이 가능한가요?',
    content: '배정된 파트너분과 사전에 조율할 내용이 있어서 연락을 드리고 싶은데 연락처가 안 보여요.',
    status: 'PENDING',
    createdAt: '2025-01-07T15:30:00',
    author: '최강사',
    userId: 'user-instructor1',
  },
  {
    id: '3',
    category: '시스템',
    title: '활동 보고서 사진 업로드가 안 됩니다.',
    content: '아이폰에서 찍은 사진을 올리려고 하는데 파일 확장자 오류가 뜨면서 업로드가 실패합니다.',
    status: 'ANSWERED',
    createdAt: '2024-12-28T11:20:00',
    author: '윤지원',
    userId: 'user-volunteer2',
    answer: {
      content: 'HEIC 확장자 파일은 현재 웹에서 직접 업로드가 제한될 수 있습니다. 이미지 설정에서 "가장 호환성 있는" 모드로 변경하시거나 JPG로 변환하여 업로드해 보시기 바랍니다. 지속적으로 오류가 발생하면 메일로 사진을 보내주시면 수동으로 처리해 드리겠습니다.',
      answeredAt: '2024-12-28T16:45:00',
      author: 'IT지원팀',
    },
  },
]
