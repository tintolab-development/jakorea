/**
 * 교육 프로그램 공통 레이아웃
 * 위젯 + Outlet. 경로: /programs/education, /programs/education/student-recruitment, /programs/education/enrollment
 */

import { Outlet } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { ProgramProgressWidget } from '@/features/dashboard/ui/program-progress-widget'

export function EducationProgramLayout() {
  const user = useAuthStore(s => s.user)
  const isAdmin = user?.role === 'ADMIN'

  return (
    <div>
      {isAdmin && (
        <div className="program-progress-widget-container">
          <ProgramProgressWidget title={null} />
        </div>
      )}
      <Outlet />
    </div>
  )
}
