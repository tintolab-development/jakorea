export type MailVariableGroup = {
  id: string
  label: string
  items: string[]
}

export const MAIL_TEMPLATE_VARIABLE_GROUPS: MailVariableGroup[] = [
  {
    id: 'name',
    label: '이름',
    items: [
      '회원명',
      '담당교사명',
      '배정된 강사명',
      '배정된 봉사자명',
      '팀 명',
      '소속명',
      '프로그램 담당자명',
      '담당자명',
      '참여자 모집 문의처명',
      '신청 기관명',
      '배정 기관명',
      '프로그램명',
      '서비스명',
    ],
  },
  {
    id: 'email',
    label: '이메일',
    items: [
      '사용자 아이디(이메일)',
      '담당교사 메일',
      '참여자 모집 문의처 메일',
      '강사 모집 문의처 메일',
    ],
  },
]

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
      items: group.items.filter(item => {
        const token = formatMailVariableToken(item).toLowerCase()
        return item.toLowerCase().includes(normalized) || token.includes(normalized)
      }),
    }))
    .filter(group => group.items.length > 0)
}
