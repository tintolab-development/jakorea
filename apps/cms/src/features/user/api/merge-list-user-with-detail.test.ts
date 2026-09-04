import { describe, expect, it } from 'vitest'
import {
  applySavedBasicInfoPatchToUser,
  mergeListUserWithFetchedDetail,
  patchMemberListPagesWithFetchedDetail,
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

  it('unmask 상세에 id1365가 없으면 목록·기존 상세의 1365 ID를 유지한다', () => {
    const list = baseUser({
      id: 'individual-uuid',
      role: 'INDIVIDUAL',
      name: '홍길동',
      email: 'hong@example.com',
      schoolInfo: undefined,
      id1365: '0915123456',
    })
    const fetched = baseUser({
      id: 'individual-uuid',
      role: 'INDIVIDUAL',
      name: '홍길동',
      email: 'hong@example.com',
      schoolInfo: undefined,
    })
    delete (fetched as { id1365?: string }).id1365

    const merged = mergeListUserWithFetchedDetail(list, fetched)

    expect(merged.id1365).toBe('0915123456')
  })

  it('마스킹된 목록 값보다 unmask 원문 id1365를 우선한다', () => {
    const list = baseUser({
      id: 'individual-uuid',
      role: 'INDIVIDUAL',
      name: '홍길동',
      email: 'hong@example.com',
      schoolInfo: undefined,
      id1365: '0915***',
    })
    const fetched = baseUser({
      id: 'individual-uuid',
      role: 'INDIVIDUAL',
      name: '홍길동',
      email: 'hong@example.com',
      schoolInfo: undefined,
      id1365: '0915123456',
    })

    const merged = mergeListUserWithFetchedDetail(list, fetched)

    expect(merged.id1365).toBe('0915123456')
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

  it('상세 roles SCHOOL_TEACHER 단독이면 목록 dual 프로필을 교사로 고친다', () => {
    const list = baseUser({
      id: 'teacher-uuid',
      role: 'INSTRUCTOR',
      name: '김교사',
      instructorMemberProfile: 'instructor_dual',
      roles: ['INSTRUCTOR', 'SCHOOL_TEACHER'],
      schoolInfo: undefined,
    })
    const fetched = baseUser({
      id: 'teacher-uuid',
      role: 'INSTRUCTOR',
      name: '김교사',
      instructorMemberProfile: 'school_teacher',
      roles: ['SCHOOL_TEACHER'],
      schoolInfo: undefined,
    })

    const merged = mergeListUserWithFetchedDetail(list, fetched)

    expect(merged.roles).toEqual(['SCHOOL_TEACHER'])
    expect(merged.instructorMemberProfile).toBe('school_teacher')
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
      { termsType: 'MARKETING', termsVersion: '1', required: false, agreed: true, agreedAt: expect.any(String) },
    ])
  })

  it('상세 GET이 시·군·구로만 잘리면 목록의 더 긴 도로명을 유지한다', () => {
    const list = baseUser({
      id: 'individual-uuid',
      role: 'INDIVIDUAL',
      name: '홍길동',
      email: 'hong@example.com',
      schoolInfo: undefined,
      detailAddress: '서울특별시 금천구 독산로 123',
      detailAddressDetail: '101호',
    })
    const fetched = baseUser({
      id: 'individual-uuid',
      role: 'INDIVIDUAL',
      name: '홍길동',
      email: 'hong@example.com',
      schoolInfo: undefined,
      detailAddress: '서울특별시 금천구',
      detailAddressDetail: undefined,
    })

    const merged = mergeListUserWithFetchedDetail(list, fetched)

    expect(merged.detailAddress).toBe('서울특별시 금천구 독산로 123')
    expect(merged.detailAddressDetail).toBe('101호')
  })

  it('자택 주소 상세 저장 시 이전 상세를 남기지 않는다', () => {
    const user = baseUser({
      id: 'individual-uuid',
      role: 'INDIVIDUAL',
      name: '홍길동',
      email: 'hong@example.com',
      detailAddress: '서울특별시 관악구 관악로 1',
      detailAddressDetail: '101호',
    })

    const merged = applySavedBasicInfoPatchToUser(user, {
      detailAddress: '서울특별시 관악구 관악로 1',
      detailAddressDetail: '202호',
    })

    expect(merged.detailAddress).toBe('서울특별시 관악구 관악로 1')
    expect(merged.detailAddressDetail).toBe('202호')
  })

  it('개인 회원 소속 저장 시 재학 여부를 반영한다', () => {
    const user = baseUser({
      id: 'individual-uuid',
      role: 'INDIVIDUAL',
      name: '홍길동',
      email: 'hong@example.com',
      affiliation: '서울고등학교',
      schoolEnrollmentStatus: 'ENROLLED',
    })

    const merged = applySavedBasicInfoPatchToUser(user, {
      affiliation: 'JA코리아',
      individualSchoolName: 'JA코리아',
      schoolEnrollmentStatus: 'NOT_ENROLLED',
    })

    expect(merged.affiliation).toBe('JA코리아')
    expect(merged.schoolEnrollmentStatus).toBe('NOT_ENROLLED')
  })
})

describe('patchMemberListPagesWithFetchedDetail', () => {
  it('목록 행에 JA 등급을 merge하고, 없으면 첫 페이지 앞에 추가한다', () => {
    const listUser = baseUser({
      id: 'member-99',
      memberId: 99,
      role: 'INSTRUCTOR',
      name: '신규강사',
      email: 'new@example.com',
    })
    const created = baseUser({
      id: 'member-99',
      memberId: 99,
      role: 'INSTRUCTOR',
      name: '신규강사',
      email: 'new@example.com',
      listMetrics: { jaEvaluationGrade: 'A' },
      instructorCmsProfile: {
        memberType: 'GENERAL',
        affiliation: { organizationNames: [] },
        homeAddress: { line: '' },
        education: {},
        career: { level: 'experienced', rows: [] },
        jaKoreaActivities: [],
        licenses: [],
        awards: [],
        essays: {},
        defaultJaGrade: 'A',
      },
    })

    const withExisting = patchMemberListPagesWithFetchedDetail(
      {
        pages: [{ users: [listUser], nextCursor: undefined }],
        pageParams: [undefined],
      },
      created
    )
    expect(withExisting?.pages[0].users[0].listMetrics?.jaEvaluationGrade).toBe('A')

    const withoutExisting = patchMemberListPagesWithFetchedDetail(
      {
        pages: [{ users: [] as Omit<User, 'password'>[], nextCursor: undefined }],
        pageParams: [undefined],
      },
      created
    )
    expect(withoutExisting?.pages[0]?.users[0]?.id).toBe('member-99')
    expect(withoutExisting?.pages[0]?.users[0]?.listMetrics?.jaEvaluationGrade).toBe('A')
  })
})
