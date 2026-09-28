import { describe, expect, it } from 'vitest'
import type { TemplateSection } from '@/features/template/model/template.schema'
import {
  forgetUserCreatedWritingTemplate,
  mergeUserCreatedWritingTemplates,
  rememberUserCreatedWritingTemplate,
} from '@/features/template/lib/user-created-writing-template-catalog'

function emptyRecruitmentSection(): TemplateSection {
  return {
    key: 'application',
    title: '모집 양식',
    description: '',
    rows: [],
  }
}

describe('user-created writing template catalog', () => {
  it('merges a newly created recruitment copy into the list', () => {
    rememberUserCreatedWritingTemplate({
      templateCode: 'recruitment-instructor-copy-test',
      templateName: '강사 모집 (신규)',
      sectionKey: 'application',
      createdAt: '2026-09-28T00:00:00.000Z',
    })

    const sections = mergeUserCreatedWritingTemplates([emptyRecruitmentSection()])
    const recruitment = sections.find(section => section.key === 'application')
    expect(recruitment?.rows.some(row => row.id === 'recruitment-instructor-copy-test')).toBe(true)
    expect(recruitment?.rows[0]?.creator).toBe('사용자 생성')

    forgetUserCreatedWritingTemplate('recruitment-instructor-copy-test')
  })
})
