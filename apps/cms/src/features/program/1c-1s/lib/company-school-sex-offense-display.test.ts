import { describe, expect, it } from 'vitest'
import { formatCompanySchoolSexOffenseParts } from './company-school-sex-offense-display'

describe('formatCompanySchoolSexOffenseParts', () => {
  it('사이트 이용은 시안처럼 제출 방식 | ID : | 검증번호 : 로 보인다', () => {
    expect(
      formatCompanySchoolSexOffenseParts(
        '동의서 제출 요청 | 범죄경력회보서 사이트 이용 | 온라인 제출 | 기관 ID kimja | 검증번호 940412'
      )
    ).toEqual(['온라인 제출', 'ID : kimja', '검증번호 : 940412'])
  })
  it('JA 시스템 확인은 방식만 보인다', () => {
    expect(
      formatCompanySchoolSexOffenseParts('동의서 제출 요청 | JA 시스템 내에서 동의서 확인')
    ).toEqual(['JA 시스템 내에서 동의서 확인'])
  })
  it('미제출과 빈 값', () => {
    expect(formatCompanySchoolSexOffenseParts('동의서 미제출')).toEqual(['동의서 미제출'])
    expect(formatCompanySchoolSexOffenseParts('동의서 제출 요청')).toEqual(['동의서 제출 요청'])
    expect(formatCompanySchoolSexOffenseParts(undefined)).toEqual([])
  })
})
