import { describe, expect, it } from 'vitest'
import {
  buildLegacyFlatFieldsFromCmsProfile,
  instructorCmsProfileToApplicantInstructorRowPartial,
  instructorCmsProfileToFormValues,
  instructorProfileFormValuesToCmsProfile,
  instructorProfileFormValuesToCmsSettlement,
  toApiInstructorCmsProfile,
  toApiInstructorCmsSettlement,
} from '@/features/user/api/map-instructor-cms-profile'
import { INITIAL_VALUES } from '@/features/user/shared/ui/instructor-profile-form'

describe('map-instructor-cms-profile', () => {
  it('폼 → profile → 폼 round-trip (학력·경력·자유작성)', () => {
    const values = {
      ...INITIAL_VALUES,
      eduSchoolType: 'college4',
      eduStatus: 'graduated',
      educationDetailKeys: [...(['high', 'college4'] as const)],
      highSchool: {
        ...INITIAL_VALUES.highSchool,
        schoolName: 'OO고등학교',
        gradYear: null,
      },
      college4Rows: [
        {
          ...INITIAL_VALUES.college4Rows[0],
          schoolName: 'OO대학교',
          major: '경제학',
        },
      ],
      careerLevel: 'experienced' as const,
      careers: [
        {
          ...INITIAL_VALUES.careers[0],
          companyName: 'JA Korea',
          roleName: '강사',
          currentlyEmployed: true,
        },
      ],
      awardRows: [
        {
          ...INITIAL_VALUES.awardRows[0],
          title: '우수강사상',
        },
      ],
      freeWrite1: '자기소개',
      freeWrite2: '경제교육',
      freeWrite3: '소통',
      freeWrite4: '대처사례',
    }

    const profile = instructorProfileFormValuesToCmsProfile(values)
    expect(profile.education.highSchool?.schoolName).toBe('OO고등학교')
    expect(profile.career.level).toBe('experienced')
    expect(profile.career.rows).toHaveLength(1)
    expect(profile.awards).toHaveLength(1)
    expect(profile.essays.freeWrite2).toBe('경제교육')

    const back = instructorCmsProfileToFormValues(profile)
    expect(back.eduSchoolType).toBe('college4')
    expect(back.freeWrite4).toBe('대처사례')
    expect(back.awardRows?.[0]?.title).toBe('우수강사상')
  })

  it('legacy flat 필드를 profile에서 생성한다', () => {
    const profile = instructorProfileFormValuesToCmsProfile({
      ...INITIAL_VALUES,
      eduSchoolType: 'college4',
      eduStatus: 'graduated',
      instructorCareer: '10',
      freeWrite1: 'hello',
      oneLineIntro: 'intro',
    })
    const legacy = buildLegacyFlatFieldsFromCmsProfile(profile)
    expect(legacy.educationLevel).toBe('college4 / graduated')
    expect(legacy.careerText).toBe('10')
    expect(legacy.selfIntroduction).toBe('hello')
    expect(legacy.oneLineIntro).toBe('intro')
  })

  it('profile → 이력서 row partial', () => {
    const profile = instructorProfileFormValuesToCmsProfile({
      ...INITIAL_VALUES,
      careerLevel: 'new',
      freeWrite1: 'a',
      freeWrite2: 'b',
      awardRows: [{ ...INITIAL_VALUES.awardRows[0], title: '수료' }],
    })
    const partial = instructorCmsProfileToApplicantInstructorRowPartial(profile)
    expect(partial.instructorCareerLevel).toBe('new')
    expect(partial.freeWriting2).toBe('b')
    expect(partial.awards).toHaveLength(1)
  })

  it('고등학교 row가 없어도 profile 변환에 실패하지 않는다', () => {
    const { highSchool: _highSchool, ...rest } = INITIAL_VALUES
    const profile = instructorProfileFormValuesToCmsProfile({
      ...rest,
      eduSchoolType: 'college4',
      eduStatus: 'graduated',
      educationDetailKeys: ['college4'],
      college4Rows: [
        {
          admitYear: null,
          gradYear: null,
          schoolName: 'OO대학교',
          major: '경제학',
        },
      ],
    } as typeof INITIAL_VALUES)

    expect(profile.education.highSchool).toBeUndefined()
    expect(profile.education.college4).toHaveLength(1)
    expect(profile.education.college4?.[0]?.schoolName).toBe('OO대학교')
  })

  it('강사비 등급(instructorFeeGrade) → defaultFeeGrade round-trip', () => {
    const profile = instructorProfileFormValuesToCmsProfile({
      ...INITIAL_VALUES,
      instructorFeeGrade: '2급 강사비',
    })
    expect(profile.defaultFeeGrade).toBe('2급 강사비')

    const back = instructorCmsProfileToFormValues(profile)
    expect(back.instructorFeeGrade).toBe('2급 강사비')
  })

  it('toApiInstructorCmsProfile은 강사비 등급을 BE 코드로 정규화한다', () => {
    const profile = instructorProfileFormValuesToCmsProfile({
      ...INITIAL_VALUES,
      instructorFeeGrade: '2급 강사비',
    })
    expect(toApiInstructorCmsProfile(profile).defaultFeeGrade).toBe('2')
  })

  it('toApiInstructorCmsSettlement은 bankAccounts를 포함한다', () => {
    const settlement = instructorProfileFormValuesToCmsSettlement({
      ...INITIAL_VALUES,
      bankName: '국민',
      accountNumber: '123',
      accountHolder: '홍길동',
    })
    expect(settlement.bankAccounts).toHaveLength(1)

    const wire = toApiInstructorCmsSettlement(settlement)
    expect(wire).toEqual({
      bankName: '국민',
      accountNumber: '123',
      accountHolder: '홍길동',
      businessIncome: false,
      bankAccounts: [
        {
          bankName: '국민',
          accountNumber: '123',
          accountHolder: '홍길동',
          current: true,
        },
      ],
    })
  })

  it('JA 평가 등급(jaEvaluationGrade) → defaultJaGrade round-trip', () => {
    const profile = instructorProfileFormValuesToCmsProfile({
      ...INITIAL_VALUES,
      jaEvaluationGrade: 'B',
    })
    expect(profile.defaultJaGrade).toBe('B')

    const back = instructorCmsProfileToFormValues(profile)
    expect(back.jaEvaluationGrade).toBe('B')
  })

  it('교사 유형 학교 검색값은 affiliation.schoolSelection에 담는다', () => {
    const profile = instructorProfileFormValuesToCmsProfile({
      ...INITIAL_VALUES,
      memberType: 'school_teacher',
      schoolName: '고양고등학교',
      schoolProvider: 'NEIS',
      schoolExternalCode: 'B109000000',
      schoolAddress: '경기도 고양시',
      schoolRegionSido: '경기도',
      schoolRegionSigungu: '고양시',
      employmentStatus: 'ACTIVE',
    })

    expect(profile.affiliation.schoolName).toBe('고양고등학교')
    expect(profile.affiliation.schoolSelection).toMatchObject({
      name: '고양고등학교',
      provider: 'NEIS',
      externalSchoolCode: 'B109000000',
    })
    expect(toApiInstructorCmsProfile(profile).affiliation?.schoolName).toBe('고양고등학교')
  })

  it('profile 목록 필드가 빈 배열이어도 Form.List용 최소 1행을 반환한다', () => {
    const profile = instructorProfileFormValuesToCmsProfile({
      ...INITIAL_VALUES,
      careerLevel: 'experienced',
    })
    profile.jaKoreaActivities = []
    profile.licenses = []
    profile.awards = []
    profile.career.rows = []

    const back = instructorCmsProfileToFormValues(profile)
    expect(back.jaKoreaRows).toHaveLength(1)
    expect(back.licenseRows).toHaveLength(1)
    expect(back.awardRows).toHaveLength(1)
    expect(back.careers).toHaveLength(1)
  })

  it('Form.List sparse row(undefined)가 있어도 profile 변환에 실패하지 않는다', () => {
    const profile = instructorProfileFormValuesToCmsProfile({
      ...INITIAL_VALUES,
      eduSchoolType: 'college4',
      eduStatus: 'graduated',
      educationDetailKeys: ['college4'],
      college4Rows: [
        undefined,
        {
          ...INITIAL_VALUES.college4Rows[0],
          schoolName: '연세대학교',
        },
      ] as unknown as typeof INITIAL_VALUES.college4Rows,
    })

    expect(profile.education.college4).toHaveLength(1)
    expect(profile.education.college4?.[0]?.schoolName).toBe('연세대학교')
  })
})
