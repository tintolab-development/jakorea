import { describe, expect, it } from 'vitest'
import {
  mapIndividualMemberDetailToUser,
  mapInstructorMemberDetailToUser,
  mapTeacherMemberDetailToUser,
  resolveInstructorBankFields,
} from './map-member-detail-to-user'
import { mergeListUserWithFetchedDetail } from './merge-list-user-with-detail'
import type {
  IndividualMemberDetailResponse,
  InstructorDetailResponse,
  InstructorMemberDetailResponse,
} from '@/shared/api/generated/members/schemas'
import type { User } from '@/types/user'

type InstructorMemberDetailTestInput = InstructorMemberDetailResponse & {
  instructorProfile?: InstructorDetailResponse | null
  homeAddress?: string
  homeAddressDetail?: string
  affiliation?: string
  affiliatedSchoolName?: string
  employmentStatus?: string
  assignedGrade?: string
  instructorAssignedGrade?: string
  organizationText?: string
  bankName?: string
  accountNumber?: string
  accountHolder?: string
  bankAccounts?: Array<{
    bankName?: string
    accountNumber?: string
    accountHolder?: string
    current?: boolean
  }>
}

function baseInstructorDetail(
  partial: Partial<InstructorMemberDetailTestInput> = {}
): InstructorMemberDetailResponse {
  return {
    member: {
      memberId: 101,
      uuid: 'instructor-uuid',
      email: 'teacher@example.com',
      name: '김강사',
      phone: '010-1111-2222',
      gender: 'F',
      birthDate: '1990.05.01',
      roles: ['INSTRUCTOR'],
      status: 'ACTIVE',
    },
    instructorProfile: {
      memberId: 101,
      educationLevel: '대학교 졸업',
      careerText: '경제교육 5년',
      defaultFeeGrade: 'A',
      defaultJaGrade: 'B',
      oneLineIntro: '한 줄 소개입니다',
      homeAddress: '서울시 강서구 마곡중앙로 1',
      businessIncomeYn: true,
      activityTypes: ['UJAT'],
    },
    ...partial,
  }
}

describe('mapIndividualMemberDetailToUser', () => {
  function baseIndividualDetail(
    partial: Partial<IndividualMemberDetailResponse> = {}
  ): IndividualMemberDetailResponse {
    return {
      member: {
        memberId: 201,
        uuid: 'individual-uuid',
        email: 'student@example.com',
        name: '김학생',
        roles: ['INDIVIDUAL'],
        status: 'ACTIVE',
      },
      ...partial,
    }
  }

  it('NOT_ENROLLED이면 schoolEnrollmentStatus와 소속(일반)만 매핑한다', () => {
    const user = mapIndividualMemberDetailToUser(
      baseIndividualDetail({
        schoolName: 'JA Korea',
        enrollmentStatus: 'NOT_ENROLLED',
      })
    )

    expect(user.schoolEnrollmentStatus).toBe('NOT_ENROLLED')
    expect(user.affiliation).toBe('JA Korea')
  })

  it('ENROLLED이면 enrollmentStatus를 학년 접미사로 붙이지 않는다', () => {
    const user = mapIndividualMemberDetailToUser(
      baseIndividualDetail({
        schoolName: '서울고등학교',
        enrollmentStatus: 'ENROLLED',
      })
    )

    expect(user.schoolEnrollmentStatus).toBe('ENROLLED')
    expect(user.affiliation).toBe('서울고등학교')
  })

  it('레거시 enrollmentStatus(학년)는 소속 접미사로 유지한다', () => {
    const user = mapIndividualMemberDetailToUser(
      baseIndividualDetail({
        schoolName: '서울고등학교',
        enrollmentStatus: '2학년',
      })
    )

    expect(user.schoolEnrollmentStatus).toBeUndefined()
    expect(user.affiliation).toBe('서울고등학교 | 2학년')
  })

  it('termsAgreements를 User에 매핑한다', () => {
    const user = mapIndividualMemberDetailToUser(
      baseIndividualDetail({
        termsAgreements: [
          { termsType: 'SERVICE_TERMS', agreed: true },
          { termsType: 'MARKETING', agreed: false },
        ],
      })
    )

    expect(user.termsAgreements).toHaveLength(2)
    expect(user.termsAgreements?.[1]).toMatchObject({ termsType: 'MARKETING', agreed: false })
  })
})

describe('mapInstructorMemberDetailToUser', () => {
  it('상세 termsAgreements를 User에 매핑한다', () => {
    const user = mapInstructorMemberDetailToUser(
      baseInstructorDetail({
        termsAgreements: [
          { termsType: 'SERVICE_TERMS', agreed: true },
          { termsType: 'PAYMENT_STATEMENT_PRE_CONSENT', agreed: true },
          { termsType: 'FACILITATOR_PLEDGE', agreed: true },
        ],
      } as InstructorMemberDetailTestInput)
    )

    expect(user.termsAgreements).toHaveLength(3)
    expect(user.termsAgreements?.[1]).toMatchObject({
      termsType: 'PAYMENT_STATEMENT_PRE_CONSENT',
      agreed: true,
    })
  })

  it('프로필·계좌 필드를 상세 화면에 맞게 매핑한다', () => {
    const user = mapInstructorMemberDetailToUser(
      baseInstructorDetail({
        bankName: '국민',
        accountNumber: '123-456',
        accountHolder: '김강사',
      })
    )

    expect(user.gender).toBe('여성')
    expect(user.birthDate).toBe('1990-05-01')
    expect(user.detailAddress).toBe('서울시 강서구 마곡중앙로 1')
    expect(user.bio).toBe('한 줄 소개입니다')
    expect(user.affiliation).toBeUndefined()
    expect(user.listMetrics?.highestEducationLabel).toBe('대학교 졸업')
    expect(user.listMetrics?.instructorCareerSummaryLabel).toBe('경제교육 5년')
    expect(user.listMetrics?.instructorCareerYearsLabel).toBe('경제교육 5년')
    expect(user.listMetrics?.permissionApplicationTypeLabel).toBe('UJAT')
    expect(user.listMetrics?.instructorFeeGradeLabel).toBe('A')
    expect(user.listMetrics?.jaEvaluationGrade).toBe('B')
    expect(user.instructorInfo?.bankName).toBe('국민')
    expect(user.instructorInfo?.accountNumber).toBe('123-456')
    expect(user.instructorInfo?.isBusinessIncome).toBe(true)
  })

  it('certifications[]를 instructorCertifications로 매핑한다', () => {
    const user = mapInstructorMemberDetailToUser(
      baseInstructorDetail({
        certifications: [
          {
            id: 1,
            certificationName: '평생교육사 2급',
            issuer: '교육부',
            issuedDate: '2020-03-01',
          },
          { certificationName: '  ' },
        ],
      })
    )

    expect(user.instructorCertifications).toEqual([
      {
        id: 1,
        name: '평생교육사 2급',
        issuer: '교육부',
        issuedDate: '2020-03-01',
      },
    ])
  })

  it('activityTypes/primaryActivityType을 소속에 넣지 않고 한글 라벨로 매핑한다', () => {
    const user = mapInstructorMemberDetailToUser(
      baseInstructorDetail({
        instructorProfile: {
          memberId: 101,
          primaryActivityType: 'GENERAL',
          activityTypes: ['UJAT', 'GEMINI'],
          careerText: '16',
          oneLineIntro: '마스킹',
          selfIntroduction: '마스킹',
        },
      })
    )

    expect(user.affiliation).toBeUndefined()
    expect(user.bio).toBeUndefined()
    expect(user.instructorSelfIntroduction).toBeUndefined()
    expect(user.instructorMemberProfile).toBe('instructor_only')
    expect(user.listMetrics?.permissionApplicationTypeLabel).toBe('일반 강사')
    expect(user.listMetrics?.instructorCareerYearsLabel).toBe('16년')
    expect(user.listMetrics?.instructorCareerSummaryLabel).toBe('16년')
  })

  it('BE `"마스킹"` placeholder 경력·소개 필드는 User에 저장하지 않는다', () => {
    const user = mapInstructorMemberDetailToUser(
      baseInstructorDetail({
        member: {
          memberId: 101,
          uuid: 'instructor-uuid',
          email: 'teacher@example.com',
          name: '김강사',
          roles: ['SCHOOL_TEACHER'],
          status: 'ACTIVE',
        },
        instructorProfile: {
          memberId: 101,
          primaryActivityType: 'SCHOOL_TEACHER',
          careerText: '마스킹',
          oneLineIntro: '마스킹',
          selfIntroduction: '마스킹',
          educationLevel: '마스킹',
        },
      })
    )

    expect(user.bio).toBeUndefined()
    expect(user.instructorCareerText).toBeUndefined()
    expect(user.instructorSelfIntroduction).toBeUndefined()
    expect(user.listMetrics?.highestEducationLabel).toBeUndefined()
    expect(user.instructorMemberProfile).toBe('school_teacher')
  })

  it('educationLevel 코드를 한글 라벨로 변환한다', () => {
    const user = mapInstructorMemberDetailToUser(
      baseInstructorDetail({
        instructorProfile: {
          memberId: 101,
          educationLevel: 'college4 / graduated',
        },
      })
    )

    expect(user.listMetrics?.highestEducationLabel).toBe('대학교 4년제 / 졸업')
  })

  it('루트 affiliation·학교명·재직 현황 동의어를 매핑한다', () => {
    const user = mapInstructorMemberDetailToUser(
      baseInstructorDetail({
        instructorProfile: {
          memberId: 101,
          primaryActivityType: 'GENERAL',
        },
        affiliation: '진월초등학교, JA 강사단',
        affiliatedSchoolName: '진월초등학교',
        employmentStatus: 'ACTIVE',
      } as InstructorMemberDetailTestInput)
    )

    expect(user.affiliation).toBe('진월초등학교, JA 강사단')
    expect(user.affiliatedSchoolName).toBe('진월초등학교')
    // GENERAL은 학교명만으로 dual(교사 상세)로 올리지 않음
    expect(user.instructorMemberProfile).toBe('instructor_only')
    expect(user.listMetrics?.employmentStatusLabel).toBe('재직중')
  })

  it('CMS profile.affiliation.schoolName을 affiliatedSchoolName·담당 학년에 매핑한다', () => {
    const user = mapInstructorMemberDetailToUser(
      baseInstructorDetail({
        member: {
          memberId: 101,
          uuid: 'instructor-uuid',
          email: 'teacher@example.com',
          name: '김강사',
          roles: ['SCHOOL_TEACHER'],
          status: 'ACTIVE',
        },
        instructorProfile: {
          memberId: 101,
          primaryActivityType: 'SCHOOL_TEACHER',
        },
        profile: {
          memberType: 'SCHOOL_TEACHER',
          affiliation: {
            schoolName: '진월초등학교',
            employmentStatus: 'ACTIVE',
            organizationNames: [],
          },
          homeAddress: { line: '서울시 강서구' },
          education: {},
          career: { level: 'experienced', rows: [] },
          jaKoreaActivities: [],
          licenses: [],
          awards: [],
          essays: {},
        },
        instructorAssignedGrade: '4학년',
      } as InstructorMemberDetailTestInput)
    )

    expect(user.affiliatedSchoolName).toBe('진월초등학교')
    expect(user.instructorMemberProfile).toBe('school_teacher')
    expect(user.listMetrics?.employmentStatusLabel).toBe('재직중')
    expect(user.listMetrics?.instructorAssignedGrade).toBe('4학년')
    expect(user.instructorCmsProfile?.affiliation.schoolName).toBe('진월초등학교')
  })

  it('학교명만 있고 SCHOOL_TEACHER roles이면 교사 단독이다', () => {
    const user = mapInstructorMemberDetailToUser(
      baseInstructorDetail({
        member: {
          memberId: 101,
          roles: ['SCHOOL_TEACHER'],
          name: '김교사',
          email: 't@test.com',
        },
        instructorProfile: {
          memberId: 101,
          primaryActivityType: 'SCHOOL_TEACHER',
        },
        affiliatedSchoolName: '진월초등학교',
      } as InstructorMemberDetailTestInput)
    )

    expect(user.affiliatedSchoolName).toBe('진월초등학교')
    expect(user.instructorMemberProfile).toBe('school_teacher')
  })

  it('학교명 + INSTRUCTOR+SCHOOL_TEACHER roles이면 겸직이다', () => {
    const user = mapInstructorMemberDetailToUser(
      baseInstructorDetail({
        member: {
          memberId: 101,
          roles: ['SCHOOL_TEACHER', 'INSTRUCTOR'],
          name: '이겸직',
          email: 'd@test.com',
        },
        instructorProfile: {
          memberId: 101,
          primaryActivityType: 'SCHOOL_TEACHER',
        },
        affiliatedSchoolName: '진월초등학교',
      } as InstructorMemberDetailTestInput)
    )

    expect(user.instructorMemberProfile).toBe('instructor_dual')
  })

  it('학교명 + 비GENERAL activity만으로는 겸직으로 올리지 않는다', () => {
    const user = mapInstructorMemberDetailToUser(
      baseInstructorDetail({
        instructorProfile: {
          memberId: 101,
          primaryActivityType: 'UJAT',
        },
        affiliatedSchoolName: '진월초등학교',
      } as InstructorMemberDetailTestInput)
    )

    expect(user.affiliatedSchoolName).toBe('진월초등학교')
    expect(user.instructorMemberProfile).not.toBe('instructor_dual')
  })

  it('top-level 계좌가 없으면 bankAccounts(current)를 사용한다', () => {
    const user = mapInstructorMemberDetailToUser(
      baseInstructorDetail({
        bankName: undefined,
        accountNumber: undefined,
        accountHolder: undefined,
        bankAccounts: [
          {
            bankName: '우리',
            accountNumber: '000',
            accountHolder: '예전',
            current: false,
          },
          {
            bankName: '농협',
            accountNumber: '999-888',
            accountHolder: '김강사',
            current: true,
          },
        ],
      })
    )

    expect(user.instructorInfo?.bankName).toBe('농협')
    expect(user.instructorInfo?.accountNumber).toBe('999-888')
    expect(user.instructorInfo?.accountHolder).toBe('김강사')
  })

  it('settlement 객체의 계좌를 instructorInfo에 매핑한다', () => {
    const user = mapInstructorMemberDetailToUser(
      baseInstructorDetail({
        instructorProfile: undefined,
        profile: {
          memberType: 'GENERAL',
          affiliation: { organizationNames: [] },
          homeAddress: { line: '' },
          education: {},
          career: { level: 'experienced', rows: [] },
          jaKoreaActivities: [],
          licenses: [],
          awards: [],
          essays: {},
        },
        settlement: {
          bankName: '국민은행',
          accountNumber: '123-456',
          accountHolder: '김강사',
          businessIncome: true,
        },
      })
    )

    expect(user.instructorInfo?.bankName).toBe('국민은행')
    expect(user.instructorInfo?.accountNumber).toBe('123-456')
    expect(user.instructorInfo?.accountHolder).toBe('김강사')
    expect(user.instructorInfo?.isBusinessIncome).toBe(true)
    expect(user.instructorCmsSettlement?.bankName).toBe('국민은행')
  })

  it('루트 은행명만 있고 계좌번호는 bankAccounts에서 보완한다', () => {
    const bank = resolveInstructorBankFields(
      baseInstructorDetail({
        bankName: '우리은행',
        accountNumber: undefined,
        accountHolder: undefined,
        bankAccounts: [
          {
            bankName: '우리은행',
            accountNumber: '1002859723089',
            accountHolder: '김성명',
            current: true,
          },
        ],
      })
    )
    expect(bank).toEqual({
      bankName: '우리은행',
      accountNumber: '1002859723089',
      accountHolder: '김성명',
    })
  })

  it('SCHOOL_TEACHER여도 루트 계좌를 instructorInfo에 매핑한다', () => {
    const user = mapInstructorMemberDetailToUser(
      baseInstructorDetail({
        member: {
          memberId: 101,
          uuid: 'instructor-uuid',
          email: 'teacher@example.com',
          name: '김강사',
          roles: ['SCHOOL_TEACHER'],
          status: 'ACTIVE',
        },
        bankName: '우리은행',
        accountNumber: '*************',
        accountHolder: '김**',
        instructorProfile: {
          memberId: 101,
          primaryActivityType: 'SCHOOL_TEACHER',
          businessIncomeYn: true,
          oneLineIntro: '교사 한 줄 소개',
          careerText: '10',
          homeAddress: '서울시 관악구',
        },
      })
    )

    expect(user.instructorMemberProfile).toBe('school_teacher')
    expect(user.instructorInfo?.bankName).toBe('우리은행')
    expect(user.instructorInfo?.accountNumber).toBe('*************')
    expect(user.instructorInfo?.accountHolder).toBe('김**')
    expect(user.instructorInfo?.isBusinessIncome).toBe(true)
    expect(user.bio).toBe('교사 한 줄 소개')
    expect(user.listMetrics?.instructorCareerYearsLabel).toBe('10년')
  })

  it('defaultFeeGrade·jaGrade·homeAddressDetail·businessIncome Y/N 동의어를 허용한다', () => {
    const user = mapInstructorMemberDetailToUser(
      baseInstructorDetail({
        instructorProfile: {
          memberId: 101,
          defaultFeeGrade: '특강',
          jaGrade: 'S',
          homeAddress: '서울시 마포구',
          homeAddressDetail: '101호',
          businessIncomeYn: 'N' as unknown as boolean,
          educationLevel: '대학원',
        } as InstructorDetailResponse,
      })
    )

    expect(user.detailAddress).toBe('서울시 마포구')
    expect(user.detailAddressDetail).toBe('101호')
    expect(user.listMetrics?.instructorFeeGradeLabel).toBe('특강')
    expect(user.listMetrics?.jaEvaluationGrade).toBe('S')
    expect(user.listMetrics?.highestEducationLabel).toBe('대학원')
    expect(user.instructorInfo?.isBusinessIncome).toBe(false)
  })

  it('instructorProfile.status는 강사비 등급에 매핑하지 않는다', () => {
    const user = mapInstructorMemberDetailToUser(
      baseInstructorDetail({
        instructorProfile: {
          memberId: 101,
          status: 'APPROVED',
          defaultFeeGrade: null as unknown as string,
          feeGrade: 'APPROVED',
        } as InstructorDetailResponse,
      })
    )

    expect(user.instructorApprovalStatus).toBe('APPROVED')
    expect(user.listMetrics?.instructorFeeGradeLabel).toBeUndefined()
  })

  it('feeGrade 동의어는 강사비 등급에 쓰지 않는다 (defaultFeeGrade만)', () => {
    const user = mapInstructorMemberDetailToUser(
      baseInstructorDetail({
        instructorProfile: {
          memberId: 101,
          defaultFeeGrade: undefined,
          feeGrade: '특강',
        } as InstructorDetailResponse,
      })
    )

    expect(user.listMetrics?.instructorFeeGradeLabel).toBeUndefined()
  })

  it('defaultFeeGrade에 승인 status가 오면 강사비 등급으로 쓰지 않는다', () => {
    const user = mapInstructorMemberDetailToUser(
      baseInstructorDetail({
        instructorProfile: {
          memberId: 101,
          status: 'APPROVED',
          defaultFeeGrade: 'APPROVED',
        },
      })
    )

    expect(user.listMetrics?.instructorFeeGradeLabel).toBeUndefined()
    expect(user.instructorApprovalStatus).toBe('APPROVED')
  })

  it('강사비 등급 1·2·3을 N급 강사비로 정규화한다', () => {
    const user = mapInstructorMemberDetailToUser(
      baseInstructorDetail({
        instructorProfile: {
          memberId: 101,
          defaultFeeGrade: '1',
        },
      })
    )
    expect(user.listMetrics?.instructorFeeGradeLabel).toBe('1급 강사비')
  })

  it('instructorProfile 없이 루트 homeAddress도 detailAddress로 매핑한다', () => {
    const user = mapInstructorMemberDetailToUser(
      baseInstructorDetail({
        instructorProfile: undefined,
        homeAddress: '경기도 성남시 분당구 판교로 1',
        homeAddressDetail: '202호',
      } as InstructorMemberDetailTestInput)
    )

    expect(user.detailAddress).toBe('경기도 성남시 분당구 판교로 1')
    expect(user.detailAddressDetail).toBe('202호')
  })

  it('프로필 값이 비면 listMetrics 키를 undefined로 넣지 않는다', () => {
    const user = mapInstructorMemberDetailToUser(
      baseInstructorDetail({
        instructorProfile: {
          memberId: 101,
          status: 'APPROVED',
        },
      })
    )

    expect(user.listMetrics?.highestEducationLabel).toBeUndefined()
    expect(user.listMetrics?.instructorFeeGradeLabel).toBeUndefined()
    expect(user.instructorApprovalStatus).toBe('APPROVED')
  })

  it('profile 없을 때 organizationText를 CMS affiliation organizationNames로 병합한다', () => {
    const user = mapInstructorMemberDetailToUser(
      baseInstructorDetail({
        organizationText: '10 | JA 강사단',
        instructorProfile: {
          memberId: 101,
          primaryActivityType: 'GENERAL',
        },
      } as InstructorMemberDetailTestInput)
    )

    expect(user.instructorCmsProfile?.affiliation?.organizationNames).toEqual(['JA 강사단'])
    expect(user.affiliation).toBe('JA 강사단')
  })
})

describe('resolveInstructorBankFields', () => {
  it('current 계좌가 없으면 첫 계좌를 쓴다', () => {
    const bank = resolveInstructorBankFields({
      bankAccounts: [{ bankName: '신한', accountNumber: '1', accountHolder: 'A' }],
    } as InstructorMemberDetailResponse)
    expect(bank.bankName).toBe('신한')
  })
})

describe('mergeListUserWithFetchedDetail listMetrics', () => {
  it('상세의 undefined listMetrics가 목록 값을 지우지 않는다', () => {
    const list: Omit<User, 'password'> = {
      id: 'instructor-uuid',
      email: 'teacher@example.com',
      name: '김강사',
      role: 'INSTRUCTOR',
      isActive: true,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      listMetrics: {
        settlementStatusLabel: '정산 가능',
        highestEducationLabel: '목록학력',
      },
    }
    const fetched = mapInstructorMemberDetailToUser(
      baseInstructorDetail({
        instructorProfile: {
          memberId: 101,
          careerText: '상세 경력만',
        },
      })
    )

    const merged = mergeListUserWithFetchedDetail(list, fetched)

    expect(merged.listMetrics?.settlementStatusLabel).toBe('정산 가능')
    expect(merged.listMetrics?.highestEducationLabel).toBe('목록학력')
    expect(merged.listMetrics?.instructorCareerSummaryLabel).toBe('상세 경력만')
  })

  it('상세 affiliation이 activity enum이면 목록 소속을 유지한다', () => {
    const list: Omit<User, 'password'> = {
      id: 'instructor-uuid',
      email: 'teacher@example.com',
      name: '김강사',
      role: 'INSTRUCTOR',
      isActive: true,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      affiliation: '진월초등학교, JA 강사단',
      bio: '목록 소개',
    }
    const fetched = mapInstructorMemberDetailToUser(
      baseInstructorDetail({
        instructorProfile: {
          memberId: 101,
          primaryActivityType: 'GENERAL',
          activityTypes: ['UJAT'],
          oneLineIntro: '마스킹',
          careerText: '마스킹',
        },
      })
    )

    const merged = mergeListUserWithFetchedDetail(list, fetched)

    expect(merged.affiliation).toBe('진월초등학교, JA 강사단')
    expect(merged.bio).toBe('목록 소개')
  })
})

describe('mapTeacherMemberDetailToUser', () => {
  it('소속 학교 organizationId와 재직 현황을 매핑한다', () => {
    const user = mapTeacherMemberDetailToUser({
      member: {
        memberId: 42,
        uuid: 'teacher-uuid',
        email: 'teacher@example.com',
        name: '김교사',
        roles: ['SCHOOL_TEACHER'],
        status: 'ACTIVE',
      },
      organizationId: 12,
      organizationName: '진월초등학교',
      employmentStatus: 'ACTIVE',
    })

    expect(user.organizationId).toBe(12)
    expect(user.instructorMemberProfile).toBe('school_teacher')
    expect(user.affiliatedSchoolName).toBe('진월초등학교')
    expect(user.listMetrics?.employmentStatusLabel).toBe('재직중')
  })
})
