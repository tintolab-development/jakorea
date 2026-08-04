import { Spin } from 'antd'
import { EnrollmentProgramDetailPostsTab } from '@/features/user/detail/ui/enrollment-program-detail-posts-tab'
import { useGeneralProgramPosts } from '@/features/program/general/hooks/use-general-program-posts-surveys'
import type { Program } from '@/types/domain'
import './program-progress-posts-section.css'

/** 일반 프로그램 진행 현황 — 게시글 (개인·기관 동일 UI, 프로그램 전체 범위) */
export function ProgramProgressPostsSection({ program }: { program: Program }) {
  const { posts, loading, isRemoteDataSource, invalidatePosts } = useGeneralProgramPosts(program.id)

  if (loading && isRemoteDataSource && posts == null) {
    return (
      <div className="program-progress-posts-section program-progress-posts-section--loading" role="status">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="program-progress-posts-section">
      <EnrollmentProgramDetailPostsTab
        program={program}
        postsOverride={isRemoteDataSource ? posts : null}
        onPostWriteSuccess={() => {
          void invalidatePosts()
        }}
      />
    </div>
  )
}
