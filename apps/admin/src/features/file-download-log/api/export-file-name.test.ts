import { describe, expect, it } from 'vitest'
import { localizeServerExportFileName } from './export-file-name'

describe('localizeServerExportFileName', () => {
  it('서버 영문 이름을 규칙에 맞는 한글로 바꾼다', () => {
    expect(localizeServerExportFileName('file_download_log_20261110_073312.xlsx')).toBe(
      '[JA Korea] 홈페이지 어드민_파일 다운로드 이력_261110.xlsx'
    )
    expect(localizeServerExportFileName('admin_account_action_log_20261110_072517.xlsx')).toBe(
      '[JA Korea] 홈페이지 어드민_관리자 계정 처리 이력_261110.xlsx'
    )
    expect(localizeServerExportFileName('member_login_log_20261110_072450.xlsx')).toBe(
      '[JA Korea] 홈페이지 어드민_회원 로그인 이력_261110.xlsx'
    )
  })

  it('목록 내보내기 이름도 화면별로 구분한다', () => {
    expect(localizeServerExportFileName('system_issue_log_20261110_074925.xlsx')).toBe(
      '[JA Korea] 홈페이지 어드민_버그,이슈 이력_261110.xlsx'
    )
    expect(localizeServerExportFileName('privacy_access_log_20261110_075525.xlsx')).toBe(
      '[JA Korea] 홈페이지 어드민_개인정보 조회 이력_261110.xlsx'
    )
    expect(localizeServerExportFileName('career_talent_applications_20261110_075517.xlsx')).toBe(
      '[JA Korea] 홈페이지 어드민_인재채용 신청 목록_261110.xlsx'
    )
    expect(localizeServerExportFileName('talent_applications_20261110_075517.xlsx')).toBe(
      '[JA Korea] 홈페이지 어드민_재능기부 신청 목록_261110.xlsx'
    )
    expect(localizeServerExportFileName('corporate_consultations_20261110_074934.xlsx')).toBe(
      '[JA Korea] 홈페이지 어드민_기업 후원 상담 신청 목록_261110.xlsx'
    )
  })

  it('모르는 이름이나 이미 한글인 이름은 그대로 둔다', () => {
    expect(localizeServerExportFileName('unknown_log_20261110_073312.xlsx')).toBe(
      'unknown_log_20261110_073312.xlsx'
    )
    expect(localizeServerExportFileName('[JA Korea] CMS 어드민_x_261110.xlsx')).toBe(
      '[JA Korea] CMS 어드민_x_261110.xlsx'
    )
  })
})
