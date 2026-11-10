/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { CategoryNameModal } from './category-name-modal'
import { CATEGORY_NAME_INVALID_TITLE } from './category-name'

function renderModal(props: Partial<Parameters<typeof CategoryNameModal>[0]> = {}) {
  const onSubmit = vi.fn()
  const onCancel = vi.fn()
  render(
    <CategoryNameModal
      open
      mode="edit"
      initialName="Root@Category"
      onCancel={onCancel}
      onSubmit={onSubmit}
      {...props}
    />
  )
  return { onSubmit, onCancel }
}

describe('CategoryNameModal', () => {
  afterEach(() => {
    cleanup()
  })

  it('수정 모드에서 허용되지 않은 문자가 있으면 저장하지 않고 사용 불가 안내를 띄운다', () => {
    const { onSubmit } = renderModal()

    fireEvent.click(screen.getByRole('button', { name: '수정' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText(CATEGORY_NAME_INVALID_TITLE)).toBeInTheDocument()
  })

  it('수정 모드 입력도 추가 모드와 동일하게 허용 문자만 남긴다', () => {
    const { onSubmit } = renderModal({ initialName: '' })
    const input = screen.getByPlaceholderText('카테고리명을 입력해 주세요')

    fireEvent.change(input, { target: { value: '안내 공지!' } })
    expect(input).toHaveValue('안내 공지')

    fireEvent.click(screen.getByRole('button', { name: '수정' }))
    expect(onSubmit).toHaveBeenCalledWith('안내 공지')
  })

  it('추가 모드는 상위 카테고리·카테고리명에 필수 표시를 한다', () => {
    render(
      <CategoryNameModal
        open
        mode="add"
        parentName="공통"
        initialName=""
        onCancel={() => {}}
        onSubmit={() => {}}
      />
    )

    const marks = document.body.querySelectorAll('.detail-info-form__field-required')
    expect(marks).toHaveLength(2)
  })
})
