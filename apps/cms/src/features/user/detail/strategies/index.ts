import type { User } from '@/types/user'
import { adminStrategy } from './admin.strategy'
import { individualStrategy } from './individual.strategy'
import { instructorStrategy } from './instructor.strategy'
import { schoolStrategy } from './school.strategy'
import type { UserDetailRoleStrategy } from './user-detail-role-strategy.types'

export type {
  UserDetailRoleStrategy,
  UserDetailStrategyCtx,
  UserDetailStrategySectionConfig,
  UserDetailStrategyExternalId1365,
} from './user-detail-role-strategy.types'

export const roleStrategyMap: Record<User['role'], UserDetailRoleStrategy> = {
  INSTRUCTOR: instructorStrategy,
  SCHOOL: schoolStrategy,
  ADMIN: adminStrategy,
  INDIVIDUAL: individualStrategy,
}
