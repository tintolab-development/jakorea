/**
 * 참여 강사 상세·강사 신청 상세 — 「JA 평가 등급」 필드.
 * 조회: 등급만. 수정 모드: 등급 | `등급 평가` 버튼 → 회원 상세와 같은 JA 등급 평가 모달(서버 저장).
 * 저장 후 프로그램 신청·진행 쿼리를 무효화해 서버 등급을 다시 읽는다(로컬 값은 즉시 반영용).
 */

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  ProgramDetailTdSegmentWrap,
  withProgramDetailTdDivider,
} from '@/features/program/shared/ui/program-detail-td-divider'
import { CmsButton } from '@/shared/ui'
import { JaGradeEvaluationModal } from '@/features/user/detail/ui/modal/ja-grade-evaluation-modal'
import {
  generalApplicationsQueryKeys,
  generalProgramProgressQueryKeys,
} from '@/features/program/general/api/general-applications-query-keys'
import { formatJaEvaluationGradeCellDisplay } from '@/features/program/general/lib/ja-evaluation-grade-display'

function toMemberId(value: string | number | null | undefined): number | null {
  if (value == null) return null
  const n = typeof value === 'number' ? value : Number(String(value).trim())
  return Number.isInteger(n) && n > 0 ? n : null
}

export function InstructorJaGradeField({
  grade,
  memberId,
  editable,
}: {
  /** 서버 JA 평가 등급 원시값 */
  grade: string | null | undefined
  /** 강사 회원 id — 없으면 버튼 미노출 */
  memberId: string | number | null | undefined
  /** 수정 모드 여부 */
  editable: boolean
}) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [savedGrade, setSavedGrade] = useState<string | null>(null)
  const instructorMemberId = toMemberId(memberId)
  const display = formatJaEvaluationGradeCellDisplay(savedGrade ?? grade)

  if (!editable || instructorMemberId == null) return <>{display}</>

  const button = (
    <CmsButton
      type="button"
      variant="secondary"
      size="h32"
      adminAction="write"
      onClick={() => setOpen(true)}
    >
      등급 평가
    </CmsButton>
  )

  return (
    <>
      {display === '-' ? (
        button
      ) : (
        <ProgramDetailTdSegmentWrap>
          {withProgramDetailTdDivider([display, button])}
        </ProgramDetailTdSegmentWrap>
      )}
      <JaGradeEvaluationModal
        open={open}
        instructorMemberId={instructorMemberId}
        onClose={() => setOpen(false)}
        onComplete={async ({ grade: nextGrade }) => {
          setSavedGrade(nextGrade)
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: generalApplicationsQueryKeys.all }),
            queryClient.invalidateQueries({ queryKey: generalProgramProgressQueryKeys.all }),
          ])
        }}
      />
    </>
  )
}
