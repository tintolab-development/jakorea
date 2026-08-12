import { describe, expect, it } from 'vitest'
import { collectInstructorRegisterValidation } from '@jakorea/domain/instructor/validate-register'
import {
  INITIAL_VALUES,
  mapInstructorRegisterFormValuesToValidationInput,
} from './instructor-profile-form-model'

describe('mapInstructorRegisterFormValuesToValidationInput', () => {
  it('미등록 중첩 필드만 있는 부분 값에서도 매핑·검증이 예외 없이 동작한다', () => {
    const partialValues = {
      name: '',
      gender: 'male' as const,
      email: '',
      contact: '',
    }

    expect(() => mapInstructorRegisterFormValuesToValidationInput(partialValues as never)).not.toThrow()

    const validationInput = mapInstructorRegisterFormValuesToValidationInput({
      ...INITIAL_VALUES,
      ...partialValues,
    })
    const { missingRequired } = collectInstructorRegisterValidation(validationInput)

    expect(missingRequired).toBe(true)
  })
})
