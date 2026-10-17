import { educationApplicationDetailPath } from '@/features/mypage/lib/constants'

export function educationProgramNoticeTabPath(applicationId: string): string {
  return `${educationApplicationDetailPath(applicationId)}?section=notice`
}
