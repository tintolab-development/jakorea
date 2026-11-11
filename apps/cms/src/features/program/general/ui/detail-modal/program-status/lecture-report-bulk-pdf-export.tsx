import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchGeneralProgramLectureReportPreviewContent,
  fetchGeneralProgramLectureReportsPage,
} from '@/features/program/general/api/admin-program-progress-service'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'
import {
  mapLectureReportDtoToInstructorRow,
  type ParticipatingInstructorLectureReportRow,
} from '@/features/program/general/api/adapters/lecture-reports-adapters'
import {
  buildLectureReportPreviewContext,
  type LectureReportPreviewContext,
} from '@/features/program/general/lib/build-lecture-report-issuance-preview'
import {
  downloadLectureReportPdfFiles,
  filterLectureReportBulkPdfRows,
  LECTURE_REPORT_NO_SUBMITTED_PDF_CTA,
  type LectureReportPdfFile,
} from '@/features/program/general/lib/download-lecture-reports-bulk-pdf'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import { notifyProgramApiUnavailable } from '@/features/program/shared/lib/program-api-unavailable'
import { hasFileDownloadPermission } from '@/shared/lib/lecture-report-bulk-download'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import type { Program } from '@/types/domain'
import { LectureReportBulkPdfExportHost } from './lecture-report-bulk-pdf-export-host'
import { showAdminAccessDeniedAlert } from '@/shared/lib/admin-role-policy'

async function fetchAllLectureReportRows(
  programId: string,
  instructorMemberId?: number,
  program?: Program | null
): Promise<ParticipatingInstructorLectureReportRow[]> {
  const dtos: unknown[] = []
  let page = 0
  for (let guard = 0; guard < 50; guard += 1) {
    const result = await fetchGeneralProgramLectureReportsPage(programId, page, {
      instructorMemberId,
    })
    dtos.push(...result.rows)
    if (!result.hasMore) break
    page += 1
  }

  const mapped = dtos
    .map((item, index) => mapLectureReportDtoToInstructorRow(item, index, program))
    .filter((row): row is ParticipatingInstructorLectureReportRow => row != null)

  const filtered =
    instructorMemberId != null
      ? (() => {
          const hasScopedField = mapped.some(row => row.instructorMemberId != null)
          if (!hasScopedField) return mapped
          return mapped.filter(row => row.instructorMemberId === instructorMemberId)
        })()
      : mapped

  return filtered.map((row, index) => ({ ...row, no: index + 1 }))
}

function previewRowContextFromListRow(row: ParticipatingInstructorLectureReportRow) {
  return {
    id: row.id,
    no: row.no,
    reportId: row.reportId,
    scheduleId: row.scheduleId,
    schoolName: row.schoolName,
    educationGrade: row.educationGrade,
    educationScheduleLabel: row.educationScheduleLabel,
    lectureDate: row.lectureDate,
    sessionNo: row.sessionNo,
    curriculumSessionCount: row.curriculumSessionCount,
    scheduleRole: row.scheduleRole,
    educationSlotKey: row.educationSlotKey,
    timeLabel: row.timeLabel,
  }
}

export interface LectureReportBulkPdfExportRunnerProps {
  programId: string
  instructor: ParticipatingInstructorRow
  program?: Program | null
  rows: ParticipatingInstructorLectureReportRow[]
  onComplete: (files: LectureReportPdfFile[]) => void
}

export function LectureReportBulkPdfExportRunner({
  programId,
  instructor,
  program,
  rows,
  onComplete,
}: LectureReportBulkPdfExportRunnerProps) {
  const [index, setIndex] = useState(0)
  const [context, setContext] = useState<LectureReportPreviewContext | null>(null)
  const filesRef = useRef<LectureReportPdfFile[]>([])
  const finishedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    filesRef.current = []
    finishedRef.current = false
    setIndex(0)
    setContext(null)
  }, [rows])

  useEffect(() => {
    if (finishedRef.current) return
    if (index >= rows.length) {
      finishedRef.current = true
      onCompleteRef.current(filesRef.current)
      return
    }

    const row = rows[index]
    let cancelled = false
    setContext(null)

    void fetchGeneralProgramLectureReportPreviewContent(programId, row)
      .then(content => {
        if (cancelled) return
        setContext(
          buildLectureReportPreviewContext(
            instructor,
            program,
            previewRowContextFromListRow(row),
            content
          )
        )
      })
      .catch(() => {
        if (!cancelled) setIndex(current => current + 1)
      })

    return () => {
      cancelled = true
    }
  }, [index, instructor, program, programId, rows])

  const handleHostComplete = useCallback((result: LectureReportPdfFile | null) => {
    if (result != null && result.blob.size > 0) {
      filesRef.current = [...filesRef.current, result]
    }
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

export function useLectureReportBulkPdfExport(options: {
  programId: string | undefined
  program?: Program | null
  instructor: ParticipatingInstructorRow
  instructorMemberId?: number
  rows: ParticipatingInstructorLectureReportRow[]
  remoteEnabled: boolean
  hasNextPage: boolean
  unavailableContext: string
}) {
  const { showAlert } = useCmsAlert()
  const [bulkDownloading, setBulkDownloading] = useState(false)
  const [exportRows, setExportRows] = useState<ParticipatingInstructorLectureReportRow[] | null>(
    null
  )

  const canBulkDownloadFiles = hasFileDownloadPermission()
  const hasPdfTargets = useMemo(
    () => filterLectureReportBulkPdfRows(options.rows).length > 0 || options.hasNextPage,
    [options.hasNextPage, options.rows]
  )

  const handleBulkDownload = useCallback(async () => {
    if (bulkDownloading) return
    if (!options.remoteEnabled || options.programId == null || options.programId === '') {
      notifyProgramApiUnavailable(options.unavailableContext, '일반 프로그램 · 강의보고서 일괄 다운로드')
      return
    }
    // 권한 설정 V1.2: 버튼은 노출하고 다운로드 권한이 없으면 접근 불가 안내
    if (!canBulkDownloadFiles) {
      showAdminAccessDeniedAlert()
      return
    }

    setBulkDownloading(true)
    try {
      const allRows = await fetchAllLectureReportRows(
        options.programId,
        options.instructorMemberId,
        options.program
      )
      const targets = filterLectureReportBulkPdfRows(allRows)
      if (targets.length === 0) {
        showAlert({ title: '안내', content: LECTURE_REPORT_NO_SUBMITTED_PDF_CTA })
        setBulkDownloading(false)
        return
      }
      setExportRows(targets)
    } catch (error) {
      setBulkDownloading(false)
      showAlert({
        title: '안내',
        content: getGeneralProgramApiErrorMessage(error, '강의보고서 일괄 다운로드에 실패했습니다.'),
      })
    }
  }, [
    bulkDownloading,
    canBulkDownloadFiles,
    options.instructorMemberId,
    options.program,
    options.programId,
    options.remoteEnabled,
    options.unavailableContext,
    showAlert,
  ])

  const handleExportComplete = useCallback(
    async (files: LectureReportPdfFile[]) => {
      setExportRows(null)
      try {
        if (files.length === 0) {
          showAlert({
            title: '안내',
            content: '강의보고서 PDF를 만들지 못했습니다.',
          })
          return
        }
        await downloadLectureReportPdfFiles(files)
      } catch (error) {
        showAlert({
          title: '안내',
          content: getGeneralProgramApiErrorMessage(
            error,
            '강의보고서 일괄 다운로드에 실패했습니다.'
          ),
        })
      } finally {
        setBulkDownloading(false)
      }
    },
    [showAlert]
  )

  const exportHost =
    exportRows != null && options.programId ? (
      <LectureReportBulkPdfExportRunner
        programId={options.programId}
        instructor={options.instructor}
        program={options.program}
        rows={exportRows}
        onComplete={files => {
          void handleExportComplete(files)
        }}
      />
    ) : null

  return {
    bulkDownloading,
    canBulkDownloadFiles,
    hasPdfTargets,
    handleBulkDownload,
    exportHost,
  }
}
