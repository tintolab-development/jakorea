import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'

import { getLoginApiErrorMessage } from '../src/features/auth/sign-in/lib/get-login-api-error-message'
import { schoolGradeOptions } from '../src/features/auth/sign-up/lib/constants'
import {
  getSchoolGradeOptions,
  isGradeInSchoolLevel,
  type SchoolLevel,
} from '../src/features/auth/sign-up/lib/school-grade'
import {
  buildConfirmationRows,
  resolveSubmittedSchoolStatus,
} from '../src/features/auth/sign-up/lib/utils'
import { NETWORK_ERROR_INLINE_MESSAGE } from '../src/shared/lib/network-error-message'

const generalInput = {
  selectedType: 'general' as const,
  birthDate: '1999.01.01',
  gender: 'male' as const,
  address: '서울특별시 강서구 마곡중앙로 171',
  addressDetail: '714호',
  email: 'member@example.com',
  volunteerId: '',
  name: '홍길동',
  phone: '01012345678',
  schoolName: '서울과학기술대학교',
  grade: '2학년',
  affiliationName: '',
}

function labels(schoolStatus: 'enrolled' | 'none' | null) {
  return buildConfirmationRows({
    ...generalInput,
    schoolStatus: resolveSubmittedSchoolStatus(schoolStatus),
  }).map(row => `${row.label}:${row.value}`)
}

describe('14세 이상 일반회원 입력 정보 확인 — 재학 여부별 행', () => {
  it("'재학 중'이면 재학유무 바로 다음에 소속/학교명·학년 행을 보여 준다", () => {
    expect(labels('enrolled')).toEqual([
      '회원유형:일반회원',
      '이메일 ID:member@example.com',
      '이름:홍길동',
      '휴대폰 번호:010-1234-5678',
      '생년월일:1999.01.01',
      '성별:남성',
      '재학유무:재학 중',
      '소속/학교명:서울과학기술대학교',
      '학년:2학년',
      '자택 주소:서울특별시 강서구 마곡중앙로 171 714호',
      '1365 ID:-',
    ])
  })

  it("'해당 없음'이면 기존대로 소속 기관명 행만 보여 준다", () => {
    const rows = labels('none')
    expect(rows).toContain('재학유무:해당 없음')
    expect(rows).toContain('소속 기관명:소속 없음')
    expect(rows.some(row => row.startsWith('소속/학교명') || row.startsWith('학년'))).toBe(false)
  })

  it('미선택은 확인 화면에 닿지 않지만, 닿으면 해당 없음과 같은 행을 쓴다', () => {
    expect(resolveSubmittedSchoolStatus(null)).toBe('none')
    expect(labels(null)).toEqual(labels('none'))
  })
})

describe('학년 선택지와 범위 밖 학년 비우기 기준이 같은지 (14세 이상·미성년 공통)', () => {
  const levels: Array<SchoolLevel | null> = ['초등학교', '중학교', '고등학교', '대학교', '전문대학', null]

  it.each(levels)('%s: 선택지에 있는 학년만 범위 안으로 본다', level => {
    const options = getSchoolGradeOptions(level, schoolGradeOptions)
    for (const grade of schoolGradeOptions) {
      expect(isGradeInSchoolLevel(grade, level, schoolGradeOptions)).toBe(options.includes(grade))
    }
  })
})

describe('비밀번호 재설정 — 응답 본문 없는 오류 문구', () => {
  it('본문 없는 502는 네트워크 오류 안내(제목·본문 두 줄)를 쓴다', () => {
    const error = new AxiosError('Request failed with status code 502', undefined, undefined, undefined, {
      status: 502,
      data: '',
      statusText: 'Bad Gateway',
      headers: {},
      config: {} as never,
    })
    expect(
      getLoginApiErrorMessage(error, NETWORK_ERROR_INLINE_MESSAGE, { overrideApprovalPending: false }),
    ).toBe('일시적인 네트워크 오류가 발생했어요.\n잠시 후 다시 시도해 주세요.')
  })

  it('서버 메시지가 있으면 서버 메시지를 쓴다', () => {
    const error = new AxiosError('Request failed', undefined, undefined, undefined, {
      status: 400,
      data: { error: { code: 'PASSWORD_RECENTLY_USED', message: '최근에 사용한 비밀번호는 다시 사용할 수 없습니다.' } },
      statusText: 'Bad Request',
      headers: {},
      config: {} as never,
    })
    expect(
      getLoginApiErrorMessage(error, NETWORK_ERROR_INLINE_MESSAGE, { overrideApprovalPending: false }),
    ).toBe('최근에 사용한 비밀번호는 다시 사용할 수 없습니다.')
  })
})
