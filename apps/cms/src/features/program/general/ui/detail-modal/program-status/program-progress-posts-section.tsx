import { EnrollmentProgramDetailPostsTab } from '@/features/user/detail/ui/enrollment-program-detail-posts-tab'
import type { Program } from '@/types/domain'
import './program-progress-posts-section.css'

/** 일반 프로그램 진행 현황 — 게시글 (개인·기관 동일 UI, 프로그램 전체 범위) */
export function ProgramProgressPostsSection({ program }: { program: Program }) {
  return (
    <div className="program-progress-posts-section">
      <EnrollmentProgramDetailPostsTab program={program} />
    </div>
  )
}
