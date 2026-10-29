/** @vitest-environment node */
/**
 * 「교육 진행 장소」 BE 확정 계약 회귀 테스트.
 * - 행 키: educationFormBySession과 같은 카운터(본 행만 1부터, 사전 「사전」「연수」 라벨 제외)
 * - 모드 null + 공통 주소만 → common
 * - 필수: offline·hybrid·참여자 선택은 필수, online은 제외
 * - 400 VALIDATION_FAILED(field=educationPlaceAddress) → BE 메시지를 그대로 노출
 */
import { describe, expect, it } from 'vitest'
import type { GeneralProgramCommonInfoExtension } from '@/types/domain'
import { educationPlaceFromGeneralCommonInfo } from './education-place-common-info-fallback'
import { listIncompleteEducationPlaceReasons } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-education-place-rules'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'

describe('generalCommonInfo fallback — educationFormBySession과 같은 행 키', () => {
  it('「연수」 라벨 행은 사전 행으로 건너뛰고 본 행만 1부터 센다', () => {
    const common = {
      educationPlaceScheduleDetail: 'perSchedule',
      curriculumSessions: [
        {
          sessionLabel: '교육 연수',
          title: '연수',
          description: '',
          educationPlaceAddress: '연수 주소',
        },
        { sessionLabel: '1차시', title: 'A', description: '', educationPlaceAddress: 'A 주소' },
        { sessionLabel: '2차시', title: 'B', description: '' },
        { sessionLabel: '3차시', title: 'C', description: '', educationPlaceAddress: 'C 주소' },
      ],
    } as GeneralProgramCommonInfoExtension
    expect(educationPlaceFromGeneralCommonInfo(common).bySession).toEqual({
      1: 'A 주소',
      3: 'C 주소',
    })
  })

  it('모드 null + 공통 주소만 있으면 common', () => {
    const common = {
      educationPlaceScheduleDetail: null,
      educationPlaceAddress: ' 서울 중구 ',
    } as GeneralProgramCommonInfoExtension
    expect(educationPlaceFromGeneralCommonInfo(common)).toEqual({
      scheduleDetail: 'common',
      address: '서울 중구',
      bySession: {},
      byDetail: {},
    })
  })
})

describe('필수 규칙 — offline·hybrid·참여자 선택 필수, online 제외', () => {
  const base = {
    enabled: true,
    programType: 'curriculum' as const,
    sessionRoundType: 'single',
    educationFormScheduleDetail: 'common',
    educationFormByIndex: {},
    placeScheduleDetail: 'common',
    placeAddress: '',
    placeByIndex: {},
    rowCount: 1,
  }
  it.each(['offline', 'hybrid', 'participant_selection', 'participant_choice'])(
    '%s → 공통 주소 필수',
    form => {
      expect(
        listIncompleteEducationPlaceReasons({ ...base, commonEducationForm: form }).typeSettings
      ).toEqual(['typeSettings.educationPlace'])
    }
  )
  it('online → 필수 아님', () => {
    expect(listIncompleteEducationPlaceReasons({ ...base, commonEducationForm: 'online' })).toEqual(
      { typeSettings: [], rows: [] }
    )
  })
})

describe('저장 오류 — 400 VALIDATION_FAILED educationPlaceAddress', () => {
  it('BE error.message를 그대로 보여 준다', () => {
    const error = {
      isAxiosError: true,
      message: 'Request failed with status code 400',
      response: {
        status: 400,
        data: {
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            field: 'educationPlaceAddress',
            message: '교육 진행 장소를 입력해 주세요.',
          },
        },
      },
    }
    expect(getGeneralProgramApiErrorMessage(error, '저장 중 오류가 발생했습니다.')).toBe(
      '교육 진행 장소를 입력해 주세요.'
    )
  })
})
