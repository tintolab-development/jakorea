import type { EmailTemplate, FileTemplate, SmsTemplate, TemplateStatus, TemplateAudience } from '@/types/template'

function daysAgo(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

const commonAudience: TemplateAudience[] = ['ADMIN_INTERNAL', 'SCHOOL', 'INSTRUCTOR', 'VOLUNTEER']

export const mockFileTemplates: FileTemplate[] = [
  {
    id: 'tpl-file-001',
    type: 'files',
    title: '봉사활동 안내문(기본)',
    description: '학교/봉사자 공통 안내문 기본 양식',
    tags: ['안내', '봉사단', '기본'],
    audience: commonAudience,
    status: 'published',
    updatedAt: daysAgo(2),
    updatedBy: '관리자(운영)',
    content: {
      fileName: '봉사활동_안내문_v1.pdf',
      mimeType: 'application/pdf',
      downloadUrl: '#',
      version: 'v1.0',
      sizeBytes: 245_000,
    },
  },
  {
    id: 'tpl-file-002',
    type: 'files',
    title: '학교 협조 공문(샘플)',
    description: '학교 담당자에게 발송하는 협조 공문 양식',
    tags: ['공문', '학교'],
    audience: ['ADMIN_INTERNAL', 'SCHOOL'],
    status: 'review',
    updatedAt: daysAgo(1),
    updatedBy: '관리자(운영)',
    content: {
      fileName: '학교협조공문_v0.9.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      downloadUrl: '#',
      version: 'v0.9',
      sizeBytes: 132_000,
    },
  },
  {
    id: 'tpl-file-003',
    type: 'files',
    title: '강사 활동 보고서 양식',
    description: '강사 제출용 활동 보고서 서식',
    tags: ['보고서', '강사'],
    audience: ['ADMIN_INTERNAL', 'INSTRUCTOR'],
    status: 'draft',
    updatedAt: daysAgo(7),
    updatedBy: '관리자(운영)',
    content: {
      fileName: '강사활동보고서_양식_v0.1.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      downloadUrl: '#',
      version: 'v0.1',
      sizeBytes: 88_000,
    },
  },
]

export const mockSmsTemplates: SmsTemplate[] = [
  {
    id: 'tpl-sms-001',
    type: 'sms',
    title: '[봉사단] 활동 일정 안내',
    description: '봉사자 대상 일정 안내 기본 문구',
    tags: ['봉사단', '일정', '안내'],
    audience: ['VOLUNTEER'],
    status: 'published',
    updatedAt: daysAgo(1),
    updatedBy: '관리자(운영)',
    content: {
      text:
        '안녕하세요 {{name}}님, {{date}}(금) {{time}} 봉사활동이 예정되어 있습니다.\n장소: {{location}}\n문의: JA Korea 운영팀\n{{link}}',
      variables: ['name', 'date', 'time', 'location', 'link'],
    },
  },
  {
    id: 'tpl-sms-002',
    type: 'sms',
    title: '[강사] 프로그램 매칭 확정 안내',
    description: '강사 매칭 완료 후 확정 안내',
    tags: ['강사', '매칭', '확정'],
    audience: ['INSTRUCTOR'],
    status: 'review',
    updatedAt: daysAgo(3),
    updatedBy: '관리자(운영)',
    content: {
      text:
        '{{name}} 강사님, {{programTitle}} 프로그램 매칭이 확정되었습니다.\n기간: {{startDate}}~{{endDate}}\n상세: {{link}}',
      variables: ['name', 'programTitle', 'startDate', 'endDate', 'link'],
    },
  },
  {
    id: 'tpl-sms-003',
    type: 'sms',
    title: '[공통] 안내/공지 템플릿(초안)',
    description: '대상 공통 공지용 초안 템플릿',
    tags: ['공지', '공통'],
    audience: ['SCHOOL', 'INSTRUCTOR', 'VOLUNTEER'],
    status: 'draft',
    updatedAt: daysAgo(7),
    updatedBy: '관리자(운영)',
    content: {
      text:
        '안녕하세요 {{name}}님.\n{{message}}\n감사합니다.\nJA Korea 운영팀',
      variables: ['name', 'message'],
    },
  },
]

export const mockEmailTemplates: EmailTemplate[] = [
  {
    id: 'tpl-email-001',
    type: 'email',
    title: '[봉사단] 활동 안내 메일(기본)',
    description: '봉사자 대상 활동 안내 기본 메일 템플릿',
    tags: ['봉사단', '안내', '기본'],
    audience: ['VOLUNTEER'],
    status: 'published',
    updatedAt: daysAgo(2),
    updatedBy: '관리자(운영)',
    content: {
      subject: '[JA Korea] {{name}}님, 봉사활동 안내드립니다',
      markdown: [
        '안녕하세요, **{{name}}**님.',
        '',
        '아래 일정으로 봉사활동이 예정되어 안내드립니다.',
        '',
        '- 일정: {{date}}(금) {{time}}',
        '- 장소: {{location}}',
        '- 상세 안내: {{link}}',
        '',
        '문의사항이 있으시면 본 메일로 회신해주세요.',
        '',
        '감사합니다.',
        'JA Korea 운영팀',
      ].join('\n'),
      html: '',
      variables: ['name', 'date', 'time', 'location', 'link'],
    },
  },
  {
    id: 'tpl-email-002',
    type: 'email',
    title: '[강사] 프로그램 매칭 확정 메일',
    description: '강사 매칭 완료 후 확정 안내',
    tags: ['강사', '매칭', '확정'],
    audience: ['INSTRUCTOR'],
    status: 'review',
    updatedAt: daysAgo(4),
    updatedBy: '관리자(운영)',
    content: {
      subject: '[JA Korea] {{name}} 강사님, {{programTitle}} 매칭 확정 안내',
      markdown: [
        '안녕하세요 {{name}} 강사님,',
        '',
        '아래 프로그램 매칭이 확정되어 안내드립니다.',
        '',
        '## 프로그램 정보',
        '- 프로그램명: {{programTitle}}',
        '- 기간: {{startDate}} ~ {{endDate}}',
        '',
        '상세 내용은 아래 링크에서 확인해주세요.',
        '',
        '{{link}}',
        '',
        '감사합니다.',
        'JA Korea 운영팀',
      ].join('\n'),
      html: '',
      variables: ['name', 'programTitle', 'startDate', 'endDate', 'link'],
    },
  },
]

export function extractTemplateVariables(text: string): string[] {
  const vars = new Set<string>()
  const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g
  let m: RegExpExecArray | null
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(text)) !== null) {
    if (m[1]) vars.add(m[1])
  }
  return Array.from(vars)
}

export function applyTemplateVariables(
  text: string,
  values: Record<string, string>
): string {
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    return values[key] ?? `{{${key}}}`
  })
}

// 간단 바이트 계산(대략): ASCII 1 byte, 그 외 2 bytes
export function estimateMessageBytes(text: string): number {
  let bytes = 0
  for (const ch of text) {
    const code = ch.charCodeAt(0)
    bytes += code <= 0x7f ? 1 : 2
  }
  return bytes
}

export function getTemplateStatusLabel(status: TemplateStatus) {
  const map: Record<TemplateStatus, string> = {
    draft: '초안',
    review: '검토',
    published: '게시',
    archived: '아카이브',
  }
  return map[status]
}

export function getTemplateStatusColor(status: TemplateStatus) {
  const map: Record<TemplateStatus, string> = {
    draft: 'default',
    review: 'processing',
    published: 'success',
    archived: 'default',
  }
  return map[status]
}

