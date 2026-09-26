import type { ProgramIntroFieldCode } from '@/entities/education-program-intro/model/types'

export const educationProgramIntroQueryKeys = {
  all: ['education-program-intro'] as const,
  details: () => [...educationProgramIntroQueryKeys.all, 'detail'] as const,
  detail: (fieldCode: ProgramIntroFieldCode) =>
    [...educationProgramIntroQueryKeys.details(), fieldCode, 'remote'] as const,
}
