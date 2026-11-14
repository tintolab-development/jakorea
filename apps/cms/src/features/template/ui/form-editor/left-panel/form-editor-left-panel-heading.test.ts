import { describe, expect, it, vi } from 'vitest'
import type { ParagraphCardEditableHeading } from '@/features/template/ui/template-management/template-fullpage-modal'
import { withReadOnlyHeadingInUserMode } from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel-heading'

function editingHeading(
  overrides: Partial<ParagraphCardEditableHeading> = {}
): ParagraphCardEditableHeading {
  return {
    isEditMode: true,
    titleIsEditMode: true,
    descriptionIsEditMode: true,
    titleValue: '기본 정보',
    onTitleChange: vi.fn(),
    titleLeading: '1. ',
    descriptionValue: '',
    onDescriptionChange: vi.fn(),
    descriptionPlaceholder: '설명 입력',
    ...overrides,
  }
}

describe('withReadOnlyHeadingInUserMode', () => {
  it('비활성이면 헤딩을 그대로 둔다(템플릿 편집)', () => {
    const heading = editingHeading()
    expect(withReadOnlyHeadingInUserMode(heading, false)).toBe(heading)
  })

  it('사용 모드: 선택된 단락이어도 제목·설명을 view로 고정한다', () => {
    const heading = editingHeading({ descriptionValue: '안내 문구' })
    const next = withReadOnlyHeadingInUserMode(heading, true)
    expect(next.isEditMode).toBe(false)
    expect(next.titleIsEditMode).toBe(false)
    expect(next.descriptionIsEditMode).toBe(false)
    next.onTitleChange('바뀐 제목')
    next.onDescriptionChange('바뀐 설명')
    expect(heading.onTitleChange).not.toHaveBeenCalled()
    expect(heading.onDescriptionChange).not.toHaveBeenCalled()
    expect(next.showDescription).not.toBe(false)
  })

  it('사용 모드: 설명이 비었거나 placeholder면 숨긴다', () => {
    expect(withReadOnlyHeadingInUserMode(editingHeading(), true).showDescription).toBe(false)
    expect(
      withReadOnlyHeadingInUserMode(editingHeading({ descriptionValue: '설명 입력' }), true)
        .showDescription
    ).toBe(false)
  })
})
