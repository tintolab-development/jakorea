import type { ApplicationPath } from '@/types/domain'
import type { UUID } from '@/types'

export const applicationPathService = {
  getAll: async (): Promise<ApplicationPath[]> => [],

  getById: async (_id: UUID): Promise<ApplicationPath | undefined> => undefined,

  getByProgramId: async (_programId: UUID): Promise<ApplicationPath | undefined> => undefined,

  create: async (
    _data: Omit<ApplicationPath, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ApplicationPath> => {
    throw new Error('application path not found')
  },

  update: async (_id: UUID, _data: Partial<ApplicationPath>): Promise<ApplicationPath> => {
    throw new Error('application path not found')
  },

  delete: async (_id: UUID): Promise<void> => {
    throw new Error('application path not found')
  },

  getByProgramIdSync: (_programId: UUID): ApplicationPath | undefined => undefined,

  getAllSync: (): ApplicationPath[] => [],
}
