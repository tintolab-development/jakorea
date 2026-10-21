import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))

function readCss(fileName: string): string {
  return readFileSync(join(here, fileName), 'utf8')
}

const PLACEHOLDER_SAFE_TBODY =
  '.ant-table-tbody\n  > tr:not(.ant-table-placeholder):not(.ant-table-measure-row)'

describe('참여 학생 목록 empty hover shift (CSS contract)', () => {
  it('60px 본문 셀 규칙은 placeholder·measure-row를 제외한다', () => {
    const css = readCss('school-detail-modal.css')
    expect(css).toContain(PLACEHOLDER_SAFE_TBODY)
    expect(css).toContain('> td.ant-table-cell')
    expect(css).not.toMatch(
      /\.school-detail-modal__student-table \.ant-table-tbody > tr > td\.ant-table-cell \{/
    )
  })

  it('수정 모드 셀 패딩 규칙도 placeholder·measure-row를 제외한다', () => {
    const css = readCss('school-detail-student-list-section.css')
    expect(css).toContain(
      '.school-detail-modal__student-table--edit\n  .ant-table-tbody\n  > tr:not(.ant-table-placeholder):not(.ant-table-measure-row)'
    )
    expect(css).not.toMatch(
      /\.school-detail-modal__student-table--edit \.ant-table-tbody > tr > td\.ant-table-cell \{/
    )
  })
})
