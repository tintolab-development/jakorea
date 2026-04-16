import { recordPersonalInfoAccess } from '@/entities/personal-info-access-log/api/personal-info-access-log-service'

type RuntimeAuthUser = {
  id?: string
  name?: string
}

function readRuntimeAuthUser(): RuntimeAuthUser | null {
  if (typeof window === 'undefined' || !window.localStorage) return null
  const raw = window.localStorage.getItem('auth_user')
  if (!raw) return null
  try {
    return JSON.parse(raw) as RuntimeAuthUser
  } catch {
    return null
  }
}

export function trackPersonalInfoAccess(accessItem: string, accessPurpose: string): void {
  const purpose = accessPurpose.trim()
  if (!purpose) return

  const user = readRuntimeAuthUser()
  void recordPersonalInfoAccess({
    accessItem,
    accessPurpose: purpose,
    accessorId: user?.id ?? 'unknown-user',
    accessorName: user?.name ?? '알 수 없음',
    ipAddress: '14.128.xxx.xxx',
  })
}
