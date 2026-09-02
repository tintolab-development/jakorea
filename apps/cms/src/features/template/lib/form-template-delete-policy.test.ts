import { describe, expect, it } from 'vitest'
import {
  resolveWritingFormTemplateDeletable,
  shouldShowWritingFormTemplateDeleteButton,
} from '@/features/template/lib/form-template-delete-policy'

describe('form-template-delete-policy', () => {
  it('treats system templates as non-deletable', () => {
    expect(
      resolveWritingFormTemplateDeletable({
        id: 'registration-general',
        systemTemplate: true,
      })
    ).toBe(false)
  })

  it('treats user-created templates as deletable', () => {
    expect(
      resolveWritingFormTemplateDeletable({
        id: 'survey-custom-20260824-01',
        systemTemplate: false,
      })
    ).toBe(true)
  })

  it('uses availableActions DELETE when systemTemplate is omitted', () => {
    expect(
      resolveWritingFormTemplateDeletable({
        id: 'application-instructor',
        availableActions: ['DELETE'],
      })
    ).toBe(true)
  })

  it('hides delete without remote API', () => {
    expect(
      shouldShowWritingFormTemplateDeleteButton(
        { id: 'survey-custom-01', systemTemplate: false },
        false
      )
    ).toBe(false)
  })
})
