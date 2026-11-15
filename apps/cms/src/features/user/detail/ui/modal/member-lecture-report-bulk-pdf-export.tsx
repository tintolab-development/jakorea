import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchLectureReportPreviewContentByReportId } from '@/features/program/general/api/admin-program-progress-service'
import type { LectureReportPreviewContext } from '@/features/program/general/lib/build-lecture-report-issuance-preview'
import type { LectureReportPdfFile } from '@/features/program/general/lib/download-lecture-reports-bulk-pdf'
import { LectureReportBulkPdfExportHost } from '@/features/program/general/ui/detail-modal/program-status/lecture-report-bulk-pdf-export-host'
import type { MemberLectureReportTableRow } from '@/features/user/api/map-member-lecture-reports'

type LectureReportPreviewContent = LectureReportPreviewContext['content']

/**
 * 회원 상세 「강의보고서 제출 내역」의 미리보기·일괄 PDF가 같은 문서를 만들도록 공통으로 쓰는 문맥.
 * 회원 목록 응답에는 프로그램 유형이 없어 기관 칸은 제출 답변대로 둔다.
 */
export function buildMemberLectureReportPreviewContext(args: {
  row: MemberLectureReportTableRow
  rows: readonly MemberLectureReportTableRow[]
  content: LectureReportPreviewContent
  instructorName?: string
  programTitle: string
}): LectureReportPreviewContext {
  const { row, rows, content, instructorName, programTitle } = args
  return {
    instructor: { instructorName: instructorName?.trim() || '-' },
    program: { mainTitle: programTitle },
    row: {
      id: row.id,
      no: rows.findIndex(item => item.id === row.id) + 1,
      reportId: row.reportId,
      schoolName: row.institutionName ?? '',
      educationGrade: row.educationGrade ?? '',
      educationScheduleLabel: row.educationDateLabel,
      lectureDate: row.lectureStartAt,
    },
    content,
    hideInstitutionFields: false,
  }
}

/**
 * 일괄 본문 PDF 대상 — 제출 완료 보고서(프로그램 화면 `hasSubmittedReport`와 같은 기준)이고 본문을 읽을 보고서 id가 있다.
 * 회원 행의 `canViewReport`는 첨부 유무라서 쓰지 않는다(첨부 없이 제출한 보고서도 본문 PDF 대상).
 */
export function filterMemberLectureReportBulkPdfRows(
  rows: readonly MemberLectureReportTableRow[]
): MemberLectureReportTableRow[] {
  return rows.filter(
    row =>
      row.submissionStatusLabel === '제출 완료' &&
      typeof row.reportId === 'number' &&
      row.reportId > 0
  )
}

export interface MemberLectureReportBulkPdfExportRunnerProps {
  /** PDF로 만들 행(한 프로그램 안의 제출 완료 보고서) */
  targets: MemberLectureReportTableRow[]
  /** 번호 계산용 전체 목록 — 미리보기와 같은 번호를 쓴다 */
  rows: readonly MemberLectureReportTableRow[]
  instructorName?: string
  programTitle: string
  /** failedCount — 본문 조회·PDF 생성 실패 건수. 0이 아니면 호출부가 저장하지 않는다. */
  onComplete: (files: LectureReportPdfFile[], failedCount: number) => void
}

/**
 * 프로그램 화면 일괄 다운로드(CMS-FUNC-0244)와 같은 본문 PDF를 한 건씩 차례로 만든다.
 * 본문은 「강의보고서 보기」와 같은 보고서 id 기준 API에서 읽는다.
 */
export function MemberLectureReportBulkPdfExportRunner({
  targets,
  rows,
  instructorName,
  programTitle,
  onComplete,
}: MemberLectureReportBulkPdfExportRunnerProps) {
  const [index, setIndex] = useState(0)
  const [context, setContext] = useState<LectureReportPreviewContext | null>(null)
  const filesRef = useRef<LectureReportPdfFile[]>([])
  const failedCountRef = useRef(0)
  const finishedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    if (finishedRef.current) return
    if (index >= targets.length) {
      finishedRef.current = true
      onCompleteRef.current(filesRef.current, failedCountRef.current)
      return
    }

    const row = targets[index]
    let cancelled = false

    void fetchLectureReportPreviewContentByReportId(row.reportId as number)
      .then(content => {
        if (cancelled) return
        setContext(
          buildMemberLectureReportPreviewContext({ row, rows, content, instructorName, programTitle })
        )
      })
      .catch(() => {
        if (cancelled) return
        failedCountRef.current += 1
        setIndex(current => current + 1)
      })

    return () => {
      cancelled = true
    }
  }, [index, instructorName, programTitle, rows, targets])

  const handleHostComplete = useCallback((result: LectureReportPdfFile | null) => {
    if (result != null && result.blob.size > 0) {
      filesRef.current = [...filesRef.current, result]
    } else {
      failedCountRef.current += 1
    }
    setContext(null)
    setIndex(current => current + 1)
  }, [])

  if (context == null) return null

  return (
    <LectureReportBulkPdfExportHost
      key={context.row.id}
      context={context}
      onComplete={handleHostComplete}
    />
  )
}
