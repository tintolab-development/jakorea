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

  it('대괄호 안 이름 볼드 마커를 남기지 않는다', () => {
    const { container } = render(
      renderContentModalDescription('[**일원**] 님의 프로그램 활동을 포기 처리하시겠습니까?'),
    )

    expect(container.textContent).toBe('[일원] 님의 프로그램 활동을 포기 처리하시겠습니까?')
    expect(container.textContent).not.toContain('*')
    expect(container.querySelector('strong')?.textContent).toBe('일원')
  })

  it('마스킹 ** 가 들어 있는 이름도 볼드 구간을 닫지 않는다', () => {
    const inner = render(renderContentModalDescription('[**일**원**] 님의 프로그램'))
    expect(inner.container.textContent).toBe('[일**원] 님의 프로그램')
    expect(inner.container.querySelector('strong')?.textContent).toBe('일**원')

    const wrap = render(renderContentModalDescription('**[일**원]** 님의 프로그램'))
    expect(wrap.container.textContent).toBe('[일**원] 님의 프로그램')
    expect(wrap.container.querySelector('strong')?.textContent).toBe('[일**원]')
  })

  it('한 줄에 볼드 구간이 둘이면 각각 유지한다', () => {
    const { container } = render(
      renderContentModalDescription('**[일**원]** 봉사자의 **[4월 1일]** 교육'),
    )
    expect(container.textContent).toBe('[일**원] 봉사자의 [4월 1일] 교육')
    const strongs = [...container.querySelectorAll('strong')].map(node => node.textContent)
    expect(strongs).toEqual(['[일**원]', '[4월 1일]'])
  })
})
