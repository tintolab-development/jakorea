/**
 * @vitest-environment jsdom
 */
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderContentModalDescription } from './content-modal-description'

describe('renderContentModalDescription', () => {
  it('JS 개행 문자를 br로 줄바꿈하고 리터럴 \\n은 보이지 않는다', () => {
    const { container } = render(
      renderContentModalDescription(
        '해당 카테고리를 삭제하시겠습니까?\n삭제 시 NHN 서비스에서도 함께 반영됩니다.',
      ),
    )

    expect(container.querySelectorAll('br')).toHaveLength(1)
    expect(container.textContent).toBe(
      '해당 카테고리를 삭제하시겠습니까?삭제 시 NHN 서비스에서도 함께 반영됩니다.',
    )
    expect(container.textContent).not.toContain('\\n')
  })

  it('리터럴 \\n 두 글자도 br로 줄바꿈한다', () => {
    const { container } = render(
      renderContentModalDescription(
        '해당 카테고리를 삭제하시겠습니까?\\n삭제 시 NHN 서비스에서도 함께 반영됩니다.',
      ),
    )

    expect(container.querySelectorAll('br')).toHaveLength(1)
    expect(container.textContent).not.toContain('\\n')
  })

  it('className을 본문 p에 적용한다', () => {
    const { container } = render(
      renderContentModalDescription('안내', 'cms-modal__content'),
    )

    expect(container.querySelector('p')).toHaveClass('cms-modal__content')
  })
})
