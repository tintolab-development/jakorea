import { describe, expect, it } from 'vitest'
import {
  fileDownloadPasswordSubmitFieldErrors,
  formatContainedPiiLead,
  isValidFileDownloadPassword,
  parseContainedPiiTypes,
  validateFileDownloadPasswordConfirm,
} from '@jakorea/domain/shared/file-download-password'
import {
  defaultContainedPiiForKind,
  resolveContainedPiiTypes,
} from '@jakorea/domain/shared/protected-file-download-kinds'

describe('file download password', () => {
  it('8자 영문·숫자·특수문자 조합만 허용한다', () => {
    expect(isValidFileDownloadPassword('Abcd123!')).toBe(true)
    expect(isValidFileDownloadPassword('Abcd12!')).toBe(false)
    expect(isValidFileDownloadPassword('abcdefgh')).toBe(false)
    expect(isValidFileDownloadPassword('Abcd 123!')).toBe(false)
  })

  it('확인 불일치와 규칙 실패를 구분한다', () => {
    expect(validateFileDownloadPasswordConfirm('Abcd123!', 'Abcd123!')).toBeNull()
    expect(validateFileDownloadPasswordConfirm('Abcd123!', 'Abcd123@')).toBe(
      '암호가 일치하지 않습니다.'
    )
    expect(validateFileDownloadPasswordConfirm('short', 'short')).toBe(
      '영문·숫자·특수문자를 조합해 8자 이상 입력해 주세요.'
    )
    expect(fileDownloadPasswordSubmitFieldErrors('', 'Jafile1!')).toEqual({
      password: '파일 암호를 입력해 주세요.',
    })
    expect(fileDownloadPasswordSubmitFieldErrors('short', 'short')).toEqual({
      password: '파일 암호는 8자 이상이며 영문, 숫자, 특수문자를 포함하고 공백이 없어야 합니다.',
    })
    expect(fileDownloadPasswordSubmitFieldErrors('Jafile1!', 'Jafile1!')).toEqual({})
  })

  it('포함 개인정보 문구를 동적으로 만든다', () => {
    expect(formatContainedPiiLead(['RESIDENT_REGISTRATION_NUMBER'])).toBe(
      '주민등록번호가 포함된 파일입니다.'
    )
    expect(
      formatContainedPiiLead(['ACCOUNT_NUMBER', 'RESIDENT_REGISTRATION_NUMBER'])
    ).toBe('주민등록번호·계좌번호가 포함된 파일입니다.')
    expect(formatContainedPiiLead([])).toBe('개인정보가 포함된 파일입니다.')
    expect(parseContainedPiiTypes(['RESIDENT_REGISTRATION_NUMBER', 'UNKNOWN'])).toEqual([
      'RESIDENT_REGISTRATION_NUMBER',
    ])
    expect(parseContainedPiiTypes(null)).toEqual([])
  })

  it('다운로드 kind 기본 PII와 override를 해석한다', () => {
    expect(defaultContainedPiiForKind('SEX_OFFENSE_CONSENT')).toEqual([
      'RESIDENT_REGISTRATION_NUMBER',
    ])
    expect(defaultContainedPiiForKind('PAYMENT_STATEMENT')).toEqual([
      'RESIDENT_REGISTRATION_NUMBER',
      'ACCOUNT_NUMBER',
    ])
    expect(
      resolveContainedPiiTypes('TAX_REPORT_EXCEL', ['ACCOUNT_NUMBER'])
    ).toEqual(['ACCOUNT_NUMBER'])
    expect(defaultContainedPiiForKind('HOMEPAGE_PII_ATTACHMENT')).toEqual([])
  })
})
