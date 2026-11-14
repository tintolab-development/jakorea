import { describe, expect, it } from 'vitest'
import { registerFormGenderToApiLabel } from '@/features/user/detail/lib/profile-form-gender'
import { toApiGender } from '@/features/user/api/map-member-gender-birth'
import {
  mapCreateUserRequestToPreRegisterIndividual,
  mapCreateUserRequestToPreRegisterInstructor,
} from '@/features/user/api/map-pre-register-request'
import { mapStudentRowToRosterRequest } from '@/features/program/general/api/adapters/student-roster-adapters'
import type { SchoolDetailStudentRow } from '@/features/program/general/model/school-detail-types'

/**
 * Step 6.4 — 등록 성별: 폼 값 → 제출 핸들러 변환(registerFormGenderToApiLabel) → API 매퍼 → 요청 본문.
 * 실제 API를 호출하지 않고 요청 직전 본문만 검사한다(가짜 데이터).
 */
type CreateUserRequest = Parameters<typeof mapCreateUserRequestToPreRegisterIndividual>[0]
type FormGender = Parameters<typeof registerFormGenderToApiLabel>[0]

function individualRequest(gender: string | undefined): CreateUserRequest {
  return {
    email: 'member@example.test',
    password: 'member@example.test',
    name: '홍길동',
    phone: '010-1234-5678',
    gender,
    birthDate: '1990-01-15',
    role: 'INDIVIDUAL',
    isActive: true,
    address: '서울특별시 강서구 화곡로 1',
    schoolEnrollmentStatus: 'NOT_ENROLLED',
  } as CreateUserRequest
}

function instructorRequest(gender: string | undefined): CreateUserRequest {
  return {
    email: 'instructor@example.test',
    password: 'instructor@example.test',
    name: '김강사',
    gender,
    role: 'INSTRUCTOR',
    isActive: true,
  } as CreateUserRequest
}

describe('일반회원 신규 등록 payload', () => {
  it.each<[FormGender, string]>([
    ['male', 'MALE'],
    ['female', 'FEMALE'],
  ])('직접 고른 %s → gender %s', (formValue, expected) => {
    const body = mapCreateUserRequestToPreRegisterIndividual(
      individualRequest(registerFormGenderToApiLabel(formValue))
    )
    expect(body.gender).toBe(expected)
  })

  it('미선택(null·undefined)은 요청을 만들지 않는다(남성 추정 없음)', () => {
    for (const formValue of [undefined, null] as FormGender[]) {
      expect(() =>
        mapCreateUserRequestToPreRegisterIndividual(individualRequest(registerFormGenderToApiLabel(formValue)))
      ).toThrow('성별')
    }
  })

  it('마스킹 ** 는 실제 성별로 보내지 않는다', () => {
    expect(() => mapCreateUserRequestToPreRegisterIndividual(individualRequest('**'))).toThrow('성별')
  })
})

describe('강사회원 신규 등록 payload', () => {
  it.each<[FormGender, string]>([
    ['male', 'MALE'],
    ['female', 'FEMALE'],
  ])('직접 고른 %s → gender %s', (formValue, expected) => {
    const body = mapCreateUserRequestToPreRegisterInstructor(
      instructorRequest(registerFormGenderToApiLabel(formValue))
    )
    expect(body.gender).toBe(expected)
  })

  it('미선택·마스킹·알 수 없는 값은 gender를 보내지 않는다(서버 선택 항목, 남성 추정 없음)', () => {
    for (const gender of [registerFormGenderToApiLabel(undefined), '**', '', 'UNKNOWN']) {
      expect(mapCreateUserRequestToPreRegisterInstructor(instructorRequest(gender))).not.toHaveProperty('gender')
    }
  })
})

describe('관리자 신규 등록 payload (createUser 관리자 분기의 toApiGender)', () => {
  it('직접 고른 성별만 M/F로 바뀐다', () => {
    expect(toApiGender(registerFormGenderToApiLabel('male'))).toBe('MALE')
    expect(toApiGender(registerFormGenderToApiLabel('female'))).toBe('FEMALE')
  })

  it('미선택·마스킹·알 수 없는 값은 undefined(본문에서 빠짐)', () => {
    expect(toApiGender(registerFormGenderToApiLabel(undefined))).toBeUndefined()
    expect(toApiGender('**')).toBeUndefined()
    expect(toApiGender('')).toBeUndefined()
    expect(toApiGender('UNKNOWN')).toBeUndefined()
  })
})

describe('학생 추가 payload', () => {
  function newStudent(gender: SchoolDetailStudentRow['gender']): SchoolDetailStudentRow {
    return {
      id: 'draft-student-1',
      no: 1,
      name: '김학생',
      gender,
      birthDate: '2013. 04. 05.',
      gradeClass: '5학년 1반',
    } as SchoolDetailStudentRow
  }

  it('직접 고른 성별 그대로 보낸다', () => {
    expect(mapStudentRowToRosterRequest(newStudent('female')).gender).toBe('FEMALE')
    expect(mapStudentRowToRosterRequest(newStudent('male')).gender).toBe('MALE')
  })

  it('신규 행 미선택은 빈 값으로 보내 서버 필수 검증에 맡긴다(male로 채우지 않음)', () => {
    expect(mapStudentRowToRosterRequest(newStudent(undefined)).gender).toBe('')
  })
})

describe('회원 유형 간 값 재사용 없음', () => {
  it('이전 등록의 성별이 다음 등록 요청에 남지 않는다', () => {
    const first = mapCreateUserRequestToPreRegisterInstructor(instructorRequest(registerFormGenderToApiLabel('female')))
    const second = mapCreateUserRequestToPreRegisterInstructor(instructorRequest(registerFormGenderToApiLabel(undefined)))
    expect(first.gender).toBe('FEMALE')
    expect(second).not.toHaveProperty('gender')
    expect(() =>
      mapCreateUserRequestToPreRegisterIndividual(individualRequest(registerFormGenderToApiLabel(undefined)))
    ).toThrow('성별')
  })
})
