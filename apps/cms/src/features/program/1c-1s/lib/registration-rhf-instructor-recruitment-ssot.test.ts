/** @vitest-environment node */
import { afterEach, describe, expect, it } from 'vitest'
import {
  replaceGeneralRecruitOverlayForScope,
  resetGeneralRecruitOverlayStoreForTests,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { buildCompanySchoolProgramFromRhf } from './build-registration-create-from-canonical'
import { importLegacyOverlayToCompanySchoolCanonical } from './import-legacy-registration-overlay'
import { createDefaultCompanySchoolRegistrationRhfValues } from './registration-rhf-values'
import {
  patchActiveCompanySchoolRecruitmentOverlay,
  registerCompanySchoolRegistrationRhf,
  type CompanySchoolRegistrationRhfApi,
} from './registration-rhf-api'
import {
  applyCompanySchoolRhfOverlayRecord,
  type CompanySchoolRegistrationRhfValues,
} from './registration-rhf-values'

function mockRhfApi(
  values: CompanySchoolRegistrationRhfValues
): CompanySchoolRegistrationRhfApi {
  let current = values
  return {
    getValues: () => current,
    getPath: path => (path === 'instructorRecruit' ? current.instructorRecruit : undefined),
    setPath: (path, value) => {
      if (path === 'instructorRecruit') {
        current = {
          ...current,
          instructorRecruit: value as CompanySchoolRegistrationRhfValues['instructorRecruit'],
        }
      }
    },
    reset: next => {
      current = next
    },
    applyOverlayRecord: overlay => {
      current = applyCompanySchoolRhfOverlayRecord(current, overlay)
    },
    isDirty: () => true,
    markBaseline: () => undefined,
  }
}

describe('1사1교 강사 모집 RHF SSOT', () => {
  afterEach(() => {
    registerCompanySchoolRegistrationRhf(null)
    resetGeneralRecruitOverlayStoreForTests()
  })

  it('CREATE는 overlay store leftover를 읽지 않고 RHF 강사 모집을 쓴다', () => {
    replaceGeneralRecruitOverlayForScope('recruitment-instructor', {
      'recruit.instructor.inquiryContact': '스토어 담당',
      'recruit.instructor.announcementPublished': 'unpublished',
    })
    const values = createDefaultCompanySchoolRegistrationRhfValues()
    values.instructorRecruit.inquiryContact = 'RHF 담당'
    values.instructorRecruit.announcementPublished = 'published'
    const program = buildCompanySchoolProgramFromRhf({ id: 'cs-instructor-rhf', values })
    expect(program.generalCommonInfo?.instructorRecruitmentInfo?.contactOrganizationName).toBe(
      'RHF 담당'
    )
    expect(program.registrationOverlay?.['recruit.instructor.inquiryContact']).toBe('RHF 담당')
    expect(program.registrationOverlay?.['recruit.instructor.announcementPublished']).toBe(
      'published'
    )
  })

  it('강사 overlay 키 patch는 RHF instructorRecruit로 간다', () => {
    const api = mockRhfApi(createDefaultCompanySchoolRegistrationRhfValues())
    registerCompanySchoolRegistrationRhf(api)
    const rest = patchActiveCompanySchoolRecruitmentOverlay({
      'recruit.instructor.inquiryTel': '02-000',
      'recruitInstructor.detailInfo.programDescription': '<p>소개</p>',
    })
    expect(rest).toEqual({})
    expect(api.getValues().instructorRecruit.inquiryTel).toBe('02-000')
    expect(api.getValues().instructorRecruit.detailInfo.programDescription).toBe('<p>소개</p>')
  })

  it('legacy GET overlay는 typed instructorRecruit로 import한다', () => {
    const imported = importLegacyOverlayToCompanySchoolCanonical({
      overlay: {
        'recruit.instructor.inquiryEmail': 'legacy@example.com',
        'recruit.instructor.announcementPublished': 'unpublished',
      },
    })
    expect(imported.instructorRecruit?.inquiryEmail).toBe('legacy@example.com')
    expect(imported.instructorRecruit?.announcementPublished).toBe('unpublished')
  })
})
