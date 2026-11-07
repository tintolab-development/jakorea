import { describe, expect, it } from 'vitest'
import type { GeminiApprovedTrainingDetailResponse } from '@/shared/api/generated/dashboard/schemas/geminiApprovedTrainingDetailResponse'
import {
  mapGeminiApprovedTrainingPrivacyUnmask,
  toGeminiApprovedTrainingUnmaskError,
} from './privacy-unmask'

describe('mapGeminiApprovedTrainingPrivacyUnmask', () => {
  it('교사·강사 원문만 담고 계좌가 없으면 null', () => {
    const mapped = mapGeminiApprovedTrainingPrivacyUnmask({
      id: 186100,
      teacherName: '김교사',
      teacherGender: 'FEMALE',
      teacherBirthDate: '1990-01-02',
      teacherPhone: '01012345678',
      teacherEmail: 'teacher@example.com',
      teacherHomeAddress: '서울시 중구 세종대로 1',
      teacherAccountNumber: null,
      teacherPosition: null,
      teacherSubject: null,
      teacherScheduleChangeCount: 0,
      assignedInstructor: {
        memberId: 9001,
        name: '이강사',
        phone: '01098765432',
        email: 'instructor@example.com',
        homeAddress: '서울시 종로구 세종로 1',
      },
    })

    expect(mapped).toEqual({
      teacherName: '김교사',
      teacherGender: '여성',
      teacherBirthDate: '1990-01-02',
      teacherPhone: '01012345678',
      teacherEmail: 'teacher@example.com',
      teacherHomeAddress: '서울시 중구 세종대로 1',
      teacherAccountNumber: null,
      instructor: {
        phone: '01098765432',
        email: 'instructor@example.com',
        homeAddress: '서울시 종로구 세종로 1',
      },
    })
    expect(mapped).not.toHaveProperty('teacherPosition')
  })

  it('배정 강사가 없으면 instructor를 만들지 않는다', () => {
    const mapped = mapGeminiApprovedTrainingPrivacyUnmask({
      teacherAccountNumber: '11012341234',
      // OpenAPI는 optional만 적지만 응답은 null로 온다.
      assignedInstructor: null,
    } as unknown as GeminiApprovedTrainingDetailResponse)

    expect(mapped.teacherAccountNumber).toBe('11012341234')
    expect(mapped.instructor).toBeNull()
  })
})

describe('toGeminiApprovedTrainingUnmaskError', () => {
  it('상태와 코드별 사용자 문구를 반환한다', () => {
    expect(
      toGeminiApprovedTrainingUnmaskError({ response: { status: 403, data: {} } }).message
    ).toBe('개인정보 원문을 볼 권한이 없습니다.')
    expect(
      toGeminiApprovedTrainingUnmaskError({
        response: { status: 404, data: { error: { code: 'GEMINI_APPROVED_TRAINING_NOT_FOUND' } } },
      }).message
    ).toBe('승인된 연수를 찾을 수 없습니다.')
    expect(
      toGeminiApprovedTrainingUnmaskError({
        response: {
          status: 410,
          data: { error: { code: 'GEMINI_APPROVED_TRAINING_PERSONAL_INFO_UNAVAILABLE' } },
        },
      }).message
    ).toBe('담당 교사 개인정보를 확인할 수 없습니다.')
    expect(toGeminiApprovedTrainingUnmaskError(new Error('boom')).message).toBe(
      '개인정보 원문 조회에 실패했습니다.'
    )
  })
})
