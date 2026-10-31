/**
 * UJAT 참여 봉사자 — 1365 마스킹 시트 + 허용된 원문 PREVIEW/DOWNLOAD JSON
 */

import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { Spin } from 'antd'
import type { Sheet } from '@fortune-sheet/core'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import { useUjatProgramScheduleDates } from '@/features/program/ujat/ui/detail-modal/application-institution/use-program-schedule-dates'
import { fetchUjatAllocationMatrix } from '@/features/program/ujat/api/education-execution-api'
import {
  downloadUjat1365RegistrationJson,
  fetchUjat1365RegistrationFormRemote,
  resolveParticipantIdForMember,
  type Ujat1365RegistrationFormResponse,
} from '@/features/program/ujat/api/ujat-1365-registration-form'
import { useMyProgramPrivacyRole } from '@/features/user/detail/lib/use-my-program-privacy-role'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'
import type { EducationProgressHalfKey } from '../tabs'
import {
  buildVolunteer1365FortuneSheet,
  buildVolunteer1365SheetColumnCount,
  type Volunteer1365VolunteerSource,
} from './volunteer-1365-fortune-data'
import { useVolunteer1365Attendance } from './use-volunteer-1365-attendance'
import './volunteer-1365-preview-modal.css'

const Workbook = lazy(() => import('@/pages/settlement-management/bulk-transfer-fortune-workbook'))

export interface Volunteer1365PreviewModalProps {
  open: boolean
  onCancel: () => void
  half: EducationProgressHalfKey
  volunteers: readonly Volunteer1365VolunteerSource[]
  programId?: string | null
  selectedMemberId?: string | null
}

function httpStatus(error: unknown): number | undefined {
  if (error == null || typeof error !== 'object' || !('response' in error)) return undefined
  return (error as { response?: { status?: number } }).response?.status
}

function rawFailureMessage(error: unknown): string {
  const status = httpStatus(error)
  if (status === 403) return '1365 원문 조회 권한이 없습니다.'
  if (status === 404) return '1365 등록 양식을 찾을 수 없습니다.'
  if (status != null && status >= 500) return '감사 기록 또는 원문 조회에 실패했습니다. 원문을 표시하지 않습니다.'
  return getGeneralProgramApiErrorMessage(error, '1365 원문 조회에 실패했습니다.')
}

export function Volunteer1365PreviewModal({
  open,
  onCancel,
  half,
  volunteers,
  programId,
  selectedMemberId,
}: Volunteer1365PreviewModalProps) {
  const { dates: scheduleDates } = useUjatProgramScheduleDates(programId)
  const { data: attendance } = useVolunteer1365Attendance({
    programId,
    half,
    scheduleDates,
    enabled: open,
  })
  const { canRevealSensitive, pending: privacyRolePending } = useMyProgramPrivacyRole(programId)
  const [preview, setPreview] = useState<Ujat1365RegistrationFormResponse | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const canUseRaw = canRevealSensitive && !privacyRolePending

  const memberId = useMemo(() => {
    const selected = selectedMemberId?.trim() ?? ''
    if (selected) return selected
    if (volunteers.length === 1) return volunteers[0]?.memberId?.trim() ?? ''
    return ''
  }, [selectedMemberId, volunteers])

  useEffect(() => {
    if (open) return
    setPreview(null)
    setMessage(null)
    setBusy(false)
  }, [open])

  const sheetData: Sheet[] = useMemo(() => {
    const sheet = buildVolunteer1365FortuneSheet(half, volunteers, scheduleDates, attendance)
    return [sheet]
  }, [attendance, half, scheduleDates, volunteers])

  const columnCount = useMemo(
    () => buildVolunteer1365SheetColumnCount(half, scheduleDates),
    [half, scheduleDates]
  )

  const resolveParticipantId = useCallback(async () => {
    if (!programId) throw new Error('프로그램이 없습니다.')
    if (!memberId) throw new Error('원문 대상 봉사자를 한 명 선택해 주세요.')
    const matrix = await fetchUjatAllocationMatrix(String(programId), {
      semesterType: half === 'h1' ? 'FIRST_HALF' : 'SECOND_HALF',
    })
    const participantId = resolveParticipantIdForMember(matrix.volunteers ?? [], memberId)
    if (participantId == null) {
      throw new Error('선택한 봉사자의 참여자 ID를 확인할 수 없습니다.')
    }
    return participantId
  }, [half, memberId, programId])

  const handlePreview = useCallback(async () => {
    if (!canUseRaw) return
    setBusy(true)
    setMessage(null)
    setPreview(null)
    try {
      const participantId = await resolveParticipantId()
      const response = await fetchUjat1365RegistrationFormRemote({
        programId: programId as string,
        participantId,
        mode: 'PREVIEW',
      })
      setPreview(response)
    } catch (error) {
      setPreview(null)
      setMessage(rawFailureMessage(error))
    } finally {
      setBusy(false)
    }
  }, [canUseRaw, programId, resolveParticipantId])

  const handleDownload = useCallback(async () => {
    if (!canUseRaw) return
    setBusy(true)
    setMessage(null)
    try {
      const participantId = await resolveParticipantId()
      const response = await fetchUjat1365RegistrationFormRemote({
        programId: programId as string,
        participantId,
        mode: 'DOWNLOAD',
      })
      downloadUjat1365RegistrationJson(response)
    } catch (error) {
      setMessage(rawFailureMessage(error))
    } finally {
      setBusy(false)
    }
  }, [canUseRaw, programId, resolveParticipantId])

  const handleClose = () => {
    setPreview(null)
    setMessage(null)
    onCancel()
  }

  return (
    <ContentModal
      open={open}
      onCancel={handleClose}
      title="1365 봉사시간 등록 양식 미리보기"
      description="교육 완료된 건에 한해서 양식에 반영됩니다. 원문은 허용된 PREVIEW/DOWNLOAD만 사용합니다."
      width={1400}
      size="large"
      className="volunteer-1365-preview-modal"
      footer={
        <>
          <CmsButton variant="secondary" size="large" onClick={handleClose}>
            닫기
          </CmsButton>
          <CmsButton
            variant="secondary"
            size="large"
            disabled={!canUseRaw || busy}
            onClick={() => void handlePreview()} >
            원문 미리보기
          </CmsButton>
          <CmsButton
            variant="primary"
            size="large"
            disabled={!canUseRaw || busy}
            onClick={() => void handleDownload()} >
            JSON 다운로드
          </CmsButton>
        </>
      }
    >
      {preview ? (
        <dl className="volunteer-1365-preview-modal__raw">
          <div>
            <dt>이름</dt>
            <dd>{preview.name ?? '-'}</dd>
          </div>
          <div>
            <dt>생년월일</dt>
            <dd>{preview.birthDate ?? '-'}</dd>
          </div>
          <div>
            <dt>1365 ID</dt>
            <dd>{preview.external1365Id ?? '-'}</dd>
          </div>
          <div>
            <dt>봉사 분</dt>
            <dd>{preview.volunteerMinutes ?? '-'}</dd>
          </div>
        </dl>
      ) : (
        <div className="volunteer-1365-preview-modal__sheet-host">
          {open ? (
            <Suspense
              fallback={
                <div className="volunteer-1365-preview-modal__sheet-loading">
                  <Spin size="large" />
                </div>
              }
            >
              <Workbook
                key={`${half}-${sheetData[0]?.celldata?.length ?? 0}-${attendance?.size ?? 0}`}
                data={sheetData}
                column={columnCount}
                showToolbar={false}
                showFormulaBar={false}
                showSheetTabs
                allowEdit={false}
                addRows={0}
              />
            </Suspense>
          ) : null}
        </div>
      )}
      {message ? <p>{message}</p> : null}
    </ContentModal>
  )
}
