export type MailVariableItem = {
  label: string
  hint?: string
}

export type MailVariableGroup = {
  id: string
  label: string
  items: MailVariableItem[]
}

function item(label: string, hint?: string): MailVariableItem {
  return hint ? { label, hint } : { label }
}

export const MAIL_TEMPLATE_VARIABLE_GROUPS: MailVariableGroup[] = [
  {
    id: 'name',
    label: '이름',
    items: [
      item('회원명'),
      item('담당교사명'),
      item('배정된 강사명'),
      item('배정된 봉사자명'),
      item('팀 명'),
      item('소속명'),
      item('프로그램 담당자명'),
      item('담당자명'),
      item('참여자 모집 문의처명'),
      item('신청 기관명'),
      item('배정 기관명'),
      item('프로그램명'),
    ],
  },
  {
    id: 'email',
    label: '이메일',
    items: [
      item('사용자 아이디(이메일)'),
      item('담당교사 메일'),
      item('참여자 모집 문의처 메일'),
      item('강사 모집 문의처 메일'),
      item('봉사자 모집 문의처 메일'),
    ],
  },
  {
    id: 'phone',
    label: '전화번호',
    items: [
      item('프로그램 담당자 연락처'),
      item('참여자 모집 문의처 전화번호'),
      item('강사 모집 문의처 전화번호'),
      item('봉사자 모집 문의처 전화번호'),
    ],
  },
  {
    id: 'status',
    label: '상태값',
    items: [
      item('서류 심사 현황'),
      item('면접 결과'),
      item('프로그램 승인 현황'),
      item('프로그램 진행 현황'),
      item('프로그램 수료 현황'),
      item('수료증 발급 여부'),
      item('강사 활동인증서 발급 여부'),
      item('봉사자 활동인증서 발급 여부'),
      item('참여자 모집 현황'),
      item('교육진행자 서약 동의 현황'),
    ],
  },
  {
    id: 'type',
    label: '유형',
    items: [item('봉사자 참여 유형')],
  },
  {
    id: 'period',
    label: '기간',
    items: [
      item('프로그램 운영 기간'),
      item('프로그램 운영 시작일'),
      item('프로그램 운영 종료일'),
      item('참여자 모집 기간'),
      item('참여자 모집 시작일'),
      item('참여자 모집 마감일'),
      item('강사 모집 시작일'),
      item('강사 모집 마감일'),
      item('봉사자 모집 기간'),
      item('봉사자 모집 시작일'),
      item('봉사자 모집 마감일'),
      item('UJAT 상반기 봉사자 모집 기간'),
      item('UJAT 상반기 봉사자 모집 시작일'),
      item('UJAT 상반기 봉사자 모집 마감일'),
      item('UJAT 하반기 봉사자 모집 기간'),
      item('UJAT 하반기 봉사자 모집 시작일'),
      item('UJAT 하반기 봉사자 모집 마감일'),
      item('면접 진행 기간'),
      item('면접 신청일'),
      item('면접 배정일'),
      item('서류 합격 발표일'),
      item('최종 합격 발표일'),
      item('교육 진행 예정일'),
      item('교육 진행 일정'),
      item('영수증 제출 마감일'),
    ],
  },
  {
    id: 'time',
    label: '시간',
    items: [item('교육 진행 수업 시간'), item('교육 진행 차시')],
  },
  {
    id: 'location',
    label: '장소',
    items: [
      item('자택 주소지_상세'),
      item('소속 기관 소재지_시군구'),
      item('소속 기관 소재지_상세'),
    ],
  },
  {
    id: 'target',
    label: '대상',
    items: [
      item('교육 대상'),
      item('교육 대상 상세'),
      item('모집 대상'),
      item('신청 학년'),
      item('교육 학년'),
    ],
  },
  {
    id: 'quantity',
    label: '수량',
    items: [item('총 선정 학급 수'), item('총 선정 학생 수')],
  },
  {
    id: 'amount',
    label: '금액',
    items: [
      item('학생 교통비'),
      item('활동비'),
      item('정산금액', '*세금 미제외 금액'),
    ],
  },
]

export function getMailVariableLabel(variable: MailVariableItem): string {
  return variable.label
}

export function formatMailVariableToken(label: string): string {
  return `#{${label}}`
}

export function filterMailVariableGroups(
  groups: MailVariableGroup[],
  query: string
): MailVariableGroup[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return groups
  return groups
    .map(group => ({
      ...group,
      items: group.items.filter(variable => {
        const label = getMailVariableLabel(variable)
        const token = formatMailVariableToken(label).toLowerCase()
        const hint = variable.hint?.toLowerCase() ?? ''
        return (
          label.toLowerCase().includes(normalized) ||
          token.includes(normalized) ||
          hint.includes(normalized)
        )
      }),
    }))
    .filter(group => group.items.length > 0)
}
