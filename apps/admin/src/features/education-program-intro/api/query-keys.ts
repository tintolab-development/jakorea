import type { ProgramIntroFieldCode } from '@/entities/education-program-intro/model/types'

export const educationProgramIntroQueryKeys = {
  all: ['education-program-intro'] as const,
  details: () => [...educationProgramIntroQueryKeys.all, 'detail'] as const,
  detail: (fieldCode: ProgramIntroFieldCode, source: 'remote' | 'local') =>
    [...educationProgramIntroQueryKeys.details(), fieldCode, source] as const,
}
