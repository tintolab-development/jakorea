/**
 * 학교 권한 내 학습 관리 페이지
 * SCHOOL 권한에서 "내 학습 관리" 카테고리 진입 시 표시되는 페이지
 * 카테고리명과 동기화하여 표시
 *
 * 참고: 관리자용 설문 관리 기능은 별도로 구현 예정
 */

import { useLocation } from 'react-router-dom'
import { ComingSoonPage } from '@/pages/error/coming-soon-page'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { useAuthStore } from '@/features/auth/model/auth-store'

/**
 * 학교 권한 내 학습 관리 페이지
 * SCHOOL 권한에서 /school/my-learning 경로로 접근 시 표시
 *
 * 네이밍 참고:
 * - 경로는 /school/my-learning으로 변경 (라우팅 네이밍 일관성)
 * - 컴포넌트명은 SchoolMyLearningPage로 명확화
 */
export function SchoolMyLearningPage() {
  const location = useLocation()
  const { user } = useAuthStore()

  // 카테고리명 가져오기 (헤더와 동일한 로직 사용)
  // SCHOOL 권한에서 /school/my-learning 경로는 "내 학습 관리"로 매핑됨
  const categoryName =
    getCategoryNameByPath(location.pathname, 1, user?.role, user) || '내 학습 관리'

  return (
    <ComingSoonPage
      title={categoryName}
      description={`${categoryName} 기능은 현재 준비 중입니다. 곧 만나보실 수 있습니다.`}
    />
  )
}

export default SchoolMyLearningPage
