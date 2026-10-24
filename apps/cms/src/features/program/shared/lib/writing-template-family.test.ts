import { describe, expect, it } from 'vitest'
import {
  isWritingTemplateRowInFamily,
  resolveWritingTemplateRowFamily,
} from './writing-template-family'
import type { TemplateRow } from '@/features/template/model/template.schema'

function row(partial: Pick<TemplateRow, 'id'> & Partial<TemplateRow>): TemplateRow {
  return {
    key: 'k',
    no: 1,
    templateName: 't',
    variant: 'default',
    creator: '',
    createdAt: '',
    updatedAt: '',
    ...partial,
  }
}

describe('resolveWritingTemplateRowFamily', () => {
  it('returns catalog code for catalog rows', () => {
    expect(
      resolveWritingTemplateRowFamily(row({ id: 'recruitment-volunteer' }))
    ).toBe('recruitment-volunteer')
  })

  it('strips copy/custom suffix when baseTemplateCode is absent', () => {
    expect(
      resolveWritingTemplateRowFamily(row({ id: 'recruitment-participant-school-custom-3' }))
    ).toBe('recruitment-participant-school')
  })

  it('prefers explicit baseTemplateCode over id', () => {
    expect(
      resolveWritingTemplateRowFamily(
        row({
          id: 'tmpl_unique_recruit',
          baseTemplateCode: 'recruitment-participant-school',
        })
      )
    ).toBe('recruitment-participant-school')
  })
})

describe('isWritingTemplateRowInFamily', () => {
  it('returns true when expected family is empty', () => {
    expect(isWritingTemplateRowInFamily(row({ id: 'recruitment-volunteer' }), '')).toBe(true)
    expect(isWritingTemplateRowInFamily(row({ id: 'recruitment-volunteer' }), null)).toBe(true)
  })

  it('matches same family including copy suffix', () => {
    expect(
      isWritingTemplateRowInFamily(
        row({ id: 'recruitment-volunteer-copy-2' }),
        'recruitment-volunteer'
      )
    ).toBe(true)
  })

  it('rejects different family', () => {
    expect(
      isWritingTemplateRowInFamily(
        row({ id: 'recruitment-participant-individual' }),
        'recruitment-volunteer'
      )
    ).toBe(false)
  })
})
