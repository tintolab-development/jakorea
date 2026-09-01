import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { isRealApiModuleEnabled, type RealApiModule } from '@/shared/config/real-api-modules'

type PostsModule = Extract<RealApiModule, 'notices' | 'faqs' | 'inquiries'>

export function usePostsRemoteEnabled(module: PostsModule, enabled = true): boolean {
  useAuthStore(s => s.token)
  return enabled && isRealApiModuleEnabled(module) && hasRemoteAdminJwt()
}

export function shouldUsePostsRemote(module: PostsModule): boolean {
  return isRealApiModuleEnabled(module) && hasRemoteAdminJwt()
}
