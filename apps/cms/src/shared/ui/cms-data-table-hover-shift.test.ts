import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, '../../../../..')

function readCss(relativeFromRepo: string): string {
  return readFileSync(join(repoRoot, relativeFromRepo), 'utf8')
}

/** (a, b, c) = id, class/pseudo-class, type */
function specificity(selector: string): [number, number, number] {
  let a = 0
  let b = 0
  let c = 0

  const withoutPseudoElements = selector.replace(/::[\w-]+/g, '')
  a += (withoutPseudoElements.match(/#[\w-]+/g) ?? []).length

  const classLike =
    withoutPseudoElements.match(/\.[\w-]+|:\w[\w-]*(?:\([^)]*\))?|\[[^\]]+\]/g) ?? []
  b += classLike.length

  const withoutClasses = withoutPseudoElements
    .replace(/\.[\w-]+/g, '')
    .replace(/:\w[\w-]*(?:\([^)]*\))?/g, '')
    .replace(/\[[^\]]+\]/g, '')
  c += (withoutClasses.match(/[\w-]+/g) ?? []).length

  return [a, b, c]
}

function compareSpec(a: [number, number, number], b: [number, number, number]): number {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] - b[i]
  }
  return 0
}

/** 치수 블록에만 쓰이던 패턴(placeholder/measure 제외 + :hover + td) */
const FORBIDDEN_TBODY_DIMENSION_HOVER =
  /tr:not\(\.ant-table-placeholder\):not\(\.ant-table-measure-row\):hover\s*\n\s*> td/g

describe('cms-data-table hover shift (CSS contract)', () => {
  const cmsTableCss = readCss('apps/cms/src/shared/ui/cms-data-table.css')
  const adminTableCss = readCss('apps/admin/src/shared/ui/cms-data-table.css')
  const programListCss = readCss('apps/cms/src/features/program/general/ui/program-list.css')

  it('CMS·Admin 공통 css: tbody 치수용 measure-row):hover 선택자 없음', () => {
    expect(cmsTableCss).not.toMatch(FORBIDDEN_TBODY_DIMENSION_HOVER)
    expect(adminTableCss).not.toMatch(FORBIDDEN_TBODY_DIMENSION_HOVER)
  })

  it('CMS 공통 css: 본문 셀 padding은 단일 tbody 선택자 블록에만 정의', () => {
    expect(cmsTableCss).toContain(
      '.cms-data-table .ant-table-tbody > tr:not(.ant-table-placeholder):not(.ant-table-measure-row) > td {'
    )
    expect(cmsTableCss).not.toContain(
      '> tr:not(.ant-table-placeholder):not(.ant-table-measure-row):hover\n  > td {\n  box-sizing: border-box !important;\n  min-width: 80px;\n  padding:'
    )
  })

  it('program-list overview: base·hover 쌍에 동일 padding(12×16)', () => {
    expect(programListCss).toMatch(
      /\.program-list-card--program-list-overview[\s\S]*tr:hover[\s\S]*td\.ant-table-cell[\s\S]*padding: 12px 16px !important/
    )
    expect(programListCss).toMatch(
      /\.program-list-card--program-list-overview[\s\S]*tr:hover[\s\S]*td\.ant-table-selection-column[\s\S]*padding: 12px 4px 12px 8px !important/
    )
  })

  it('호버 시 overview padding 규칙이 공통 tbody padding보다 특이도 높음', () => {
    const sharedTbodyPadding =
      '.cms-data-table .ant-table-tbody > tr:not(.ant-table-placeholder):not(.ant-table-measure-row) > td'
    const programOverviewHover =
      '.program-list-card--program-list-overview .cms-data-table--program-list-overview .ant-table-tbody > tr:hover > td.ant-table-cell'

    expect(compareSpec(specificity(programOverviewHover), specificity(sharedTbodyPadding))).toBeGreaterThan(
      0
    )
  })

  it('회귀: 공통 tbody :hover 치수 규칙이 있으면 overview(tr>td만)보다 호버 시 특이도가 높아짐', () => {
    const brokenSharedHover =
      '.cms-data-table .ant-table-tbody > tr:not(.ant-table-placeholder):not(.ant-table-measure-row):hover > td'
    const programOverviewBeforeFix =
      '.program-list-card--program-list-overview .cms-data-table--program-list-overview .ant-table-tbody > tr > td.ant-table-cell'

    expect(
      compareSpec(specificity(brokenSharedHover), specificity(programOverviewBeforeFix))
    ).toBeGreaterThan(0)
  })
})
