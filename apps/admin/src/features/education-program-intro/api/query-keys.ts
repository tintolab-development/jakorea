import type { ProgramIntroCategoryKey } from '@/entities/education-program-intro/model/types'

export const educationProgramIntroQueryKeys = {
  all: ['education-program-intro'] as const,
  categories: () => [...educationProgramIntroQueryKeys.all, 'category'] as const,
  category: (key: ProgramIntroCategoryKey, source: 'remote' | 'local') =>
    [...educationProgramIntroQueryKeys.categories(), key, source] as const,
}
