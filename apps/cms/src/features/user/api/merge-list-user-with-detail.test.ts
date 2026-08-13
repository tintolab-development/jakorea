import { describe, expect, it } from 'vitest'
import {
  applySavedBasicInfoPatchToUser,
  mergeListUserWithFetchedDetail,
} from './merge-list-user-with-detail'
import type { User } from '@/types/user'

function baseUser(partial: Partial<Omit<User, 'password'>>): Omit<User, 'password'> {
  return {
    id: 'list-uuid',
    email: 'school@example.com',
    name: '서울고등학교',
    role: 'SCHOOL',
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    schoolInfo: {
      schoolName: '서울고등학교',
      address: '서울시',
    },
    memberId: 42,
    ...partial,
  }
}

describe('mergeListUserWithFetchedDetail', () => {
  it('상세가 INDIVIDUAL로 오면 목록 SCHOOL 역할을 유지한다', () => {
    const list = baseUser({})
    const fetched = baseUser({
      id: 'detail-uuid',
      role: 'INDIVIDUAL',
      name: '담당자',
      schoolInfo: undefined,
    })

    const merged = mergeListUserWithFetchedDetail(list, fetched)

    expect(merged.role).toBe('SCHOOL')
    expect(merged.id).toBe('list-uuid')
    expect(merged.schoolInfo?.schoolName).toBe('서울고등학교')
    expect(merged.name).toBe('서울고등학교')
  })

  it('교사 drill-down 시 API name이 기관명이면 목록 교사명을 유지한다', () => {
    const list = baseUser({
      id: 'teacher-uuid',
      role: 'INSTRUCTOR',
      name: '박충재',
      instructorMemberProfile: 'school_teacher',
      affiliatedSchoolName: 'JA 테스트 중학교',
      schoolInfo: undefined,
    })
    const fetched = baseUser({
      id: 'teacher-uuid',
      role: 'INSTRUCTOR',
      name: 'JA 테스트 중학교',
      affiliatedSchoolName: 'JA 테스트 중학교',
      schoolInfo: {
        schoolName: 'JA 테스트 중학교',
        address: '',
      },
    })

    const merged = mergeListUserWithFetchedDetail(list, fetched)

    expect(merged.name).toBe('박충재')
    expect(merged.schoolInfo).toBeUndefined()
  })

  it('상세 계좌 정보를 목록 빈 instructorInfo 위에 병합한다', () => {
    const list = baseUser({
      id: 'teacher-uuid',
      role: 'INSTRUCTOR',
      name: '김강사',
      instructorMemberProfile: 'school_teacher',
      schoolInfo: undefined,
      instructorInfo: {
        bankName: '',
        accountNumber: '',
        accountHolder: '',
        isBusinessIncome: false,
      },
    })
    const fetched = baseUser({
      id: 'teacher-uuid',
      role: 'INSTRUCTOR',
      name: '김강사',
      schoolInfo: undefined,
      instructorInfo: {
        bankName: '우리은행',
        accountNumber: '1002-859-723089',
        accountHolder: '김강사',
        isBusinessIncome: true,
      },
    })

    const merged = mergeListUserWithFetchedDetail(list, fetched)

    expect(merged.instructorInfo).toEqual({
      bankName: '우리은행',
      accountNumber: '1002-859-723089',
      accountHolder: '김강사',
      isBusinessIncome: true,
    })
  })

  it('관리자 목록 slug id는 admin-account-{adminAccountId}로 canonicalize한다', () => {
    const list = baseUser({
      id: 'local-demo-admin-viewer',
      role: 'ADMIN',
      name: '데모 관리자',
      adminAccountId: 165003,
      schoolInfo: undefined,
      memberId: undefined,
    })
    const fetched = baseUser({
      id: 'local-demo-admin-viewer',
      role: 'ADMIN',
      name: '데모 관리자',
      adminAccountId: 165003,
      schoolInfo: undefined,
      memberId: undefined,
    })

    const merged = mergeListUserWithFetchedDetail(list, fetched)

    expect(merged.id).toBe('admin-account-165003')
  })

  it('마스킹 placeholder 응답이 unmask·목록 강사 필드를 덮어쓰지 않는다', () => {
    const list = baseUser({
      id: 'teacher-uuid',
      role: 'INSTRUCTOR',
      name: '김강사',
      bio: '한 줄 소개 원문',
      instructorCareerText: '10',
      instructorSelfIntroduction: '한 줄 소개 원문',
      listMetrics: {
        instructorCareerYearsLabel: '10년',
        instructorCareerSummaryLabel: '10년',
        highestEducationLabel: '대학교 4년제 | 졸업',
      },
    })
    const fetched = baseUser({
      id: 'teacher-uuid',
      role: 'INSTRUCTOR',
      name: '김강사',
      bio: '마스킹',
      instructorCareerText: '마스킹',
      instructorSelfIntroduction: '마스킹',
      listMetrics: {
        instructorCareerYearsLabel: '마스킹',
        instructorCareerSummaryLabel: '마스킹',
        highestEducationLabel: '마스킹',
      },
      participationHistory: 0,
    })

    const merged = mergeListUserWithFetchedDetail(list, fetched)

    expect(merged.bio).toBe('한 줄 소개 원문')
    expect(merged.instructorSelfIntroduction).toBe('한 줄 소개 원문')
    expect(merged.instructorCareerText).toBe('10')
    expect(merged.listMetrics?.instructorCareerYearsLabel).toBe('10년')
    expect(merged.listMetrics?.highestEducationLabel).toBe('대학교 4년제 | 졸업')
  })

  it('상세 GET의 비마스킹 listMetrics가 목록(구) 값보다 우선한다', () => {
    const list = baseUser({
      id: 'teacher-uuid',
      role: 'INSTRUCTOR',
      name: '김강사',
      listMetrics: {
        instructorCareerYearsLabel: '10년',
        instructorCareerSummaryLabel: '10년',
        highestEducationLabel: '대학교 4년제 | 졸업',
        jaEvaluationGrade: 'A',
      },
    })
    const fetched = baseUser({
      id: 'teacher-uuid',
      role: 'INSTRUCTOR',
      name: '김강사',
      listMetrics: {
        instructorCareerYearsLabel: '12년',
        instructorCareerSummaryLabel: '12년',
        highestEducationLabel: '대학원 | 졸업',
        jaEvaluationGrade: 'B',
      },
      participationHistory: 0,
    })

    const merged = mergeListUserWithFetchedDetail(list, fetched)

    expect(merged.listMetrics?.instructorCareerYearsLabel).toBe('12년')
    expect(merged.listMetrics?.instructorCareerSummaryLabel).toBe('12년')
    expect(merged.listMetrics?.highestEducationLabel).toBe('대학원 | 졸업')
    expect(merged.listMetrics?.jaEvaluationGrade).toBe('B')
  })
})

describe('applySavedBasicInfoPatchToUser', () => {
  it('저장 patch의 bio(한 줄 소개)는 instructorSelfIntroduction(자기소개)에 반영하지 않는다', () => {
    const user = baseUser({
      id: 'teacher-uuid',
      role: 'INSTRUCTOR',
      name: '김강사',
      bio: '기존 한 줄 소개',
      instructorSelfIntroduction: '기존 자기소개 및 지원동기',
      listMetrics: {
        instructorCareerYearsLabel: '마스킹',
        instructorCareerSummaryLabel: '마스킹',
      },
    })

    const merged = applySavedBasicInfoPatchToUser(user, {
      bio: '수정된 한 줄 소개',
      listMetrics: {
        instructorCareerSummaryLabel: '12년',
      },
    })

    expect(merged.bio).toBe('수정된 한 줄 소개')
    expect(merged.instructorSelfIntroduction).toBe('기존 자기소개 및 지원동기')
    expect(merged.listMetrics?.instructorCareerYearsLabel).toBe('12년')
    expect(merged.instructorCareerText).toBe('12')
  })

  it('선택 약관 PATCH는 기존 필수 약관을 유지한 채 해당 항목만 갱신한다', () => {
    const user = baseUser({
      id: 'individual-uuid',
      role: 'INDIVIDUAL',
      name: '홍길동',
      email: 'hong@example.com',
      termsAgreements: [
        { termsType: 'SERVICE_TERMS', termsVersion: '1', required: true, agreed: true },
        { termsType: 'PRIVACY_COLLECTION', termsVersion: '1', required: true, agreed: true },
        { termsType: 'MARKETING', termsVersion: '1', required: false, agreed: false },
      ],
    })

    const merged = applySavedBasicInfoPatchToUser(user, {
      termsAgreements: [{ termsType: 'MARKETING', version: '1', required: false, agreed: true }],
    })

    expect(merged.termsAgreements).toEqual([
      { termsType: 'SERVICE_TERMS', termsVersion: '1', required: true, agreed: true },
      { termsType: 'PRIVACY_COLLECTION', termsVersion: '1', required: true, agreed: true },
      { termsType: 'MARKETING', termsVersion: '1', required: false, agreed: true },
    ])
  })
})
