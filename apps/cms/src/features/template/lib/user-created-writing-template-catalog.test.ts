import { describe, expect, it } from 'vitest'
import type { TemplateSection } from '@/features/template/model/template.schema'
import {
  forgetUserCreatedWritingTemplate,
  getUserCreatedWritingTemplateName,
  mergeUserCreatedWritingTemplates,
  rememberUserCreatedWritingTemplate,
  renameUserCreatedWritingTemplate,
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

  it('renames a newly created copy shown in the list', () => {
    rememberUserCreatedWritingTemplate({
      templateCode: 'recruitment-school-copy-test',
      templateName: '일반_참여 기관 모집 폼 (1)',
      sectionKey: 'application',
      createdAt: '2026-09-28T00:00:00.000Z',
    })

    expect(renameUserCreatedWritingTemplate('recruitment-school-copy-test', '  기관 모집 수정본 ')).toBe(
      true
    )
    expect(getUserCreatedWritingTemplateName('recruitment-school-copy-test')).toBe('기관 모집 수정본')
    const rows = mergeUserCreatedWritingTemplates([emptyRecruitmentSection()])[0]?.rows ?? []
    expect(rows.find(row => row.id === 'recruitment-school-copy-test')?.templateName).toBe(
      '기관 모집 수정본'
    )
    expect(renameUserCreatedWritingTemplate('unknown-code', '이름')).toBe(false)

    forgetUserCreatedWritingTemplate('recruitment-school-copy-test')
  })
})
