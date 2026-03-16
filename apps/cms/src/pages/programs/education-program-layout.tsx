/**
 * 교육 프로그램 공통 레이아웃
 * 위젯 + Outlet. 경로: /programs/education, /programs/education/student-recruitment, /programs/education/enrollment
 */

import { Outlet } from 'react-router-dom'

export function EducationProgramLayout() {
  return (
    <div>
      <Outlet />
    </div>
  )
}
