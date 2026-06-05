import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { INSTRUCTOR_FEE_GRADE_OPTIONS } from '@/data/mock/program-wage-info'
import type { ApplicantInstructorLectureFeeBasisType } from '@/data/mock/applicant-instructors'
import type { PermissionModalNotifyTiming } from '@/shared/components/permission-modal'
import {
  buildLectureFeeBasisDisplay,
  DEFAULT_LECTURE_FEE_PAYMENT_CRITERIA,
  parseLectureFeeAmountDigits,
} from './applicant-instructor-lecture-fee-basis'

export type InstructorFeeApprovalConfirmDetail = {
  lectureFeeBasisType: ApplicantInstructorLectureFeeBasisType
  instructorFeeGradeLabel: string | null
  lectureFeeMeasure: string | null
  lectureFeeAmount: string | null
  lectureFeeBasisDisplay: string | undefined
  notifyTiming: PermissionModalNotifyTiming
  manualNotifyAt?: Dayjs | null
}

export function resolveDefaultInstructorFeeGrade(
  instructorFeeGradeLabel: string | undefined,
  options = INSTRUCTOR_FEE_GRADE_OPTIONS
): string {
  const trimmed = instructorFeeGradeLabel?.trim()
  if (trimmed && options.some(option => option.value === trimmed)) {
    return trimmed
  }
  return options[0]!.value
}

export function canConfirmInstructorFeeApproval(params: {
  lectureFeeBasisType: ApplicantInstructorLectureFeeBasisType
  lectureFeeMeasure: string
  lectureFeeAmount: string
  notifyTiming: PermissionModalNotifyTiming
  manualNotifyAt: Dayjs | null
}): boolean {
  if (params.notifyTiming === 'manual' && !params.manualNotifyAt) {
    return false
  }

  if (params.lectureFeeBasisType === 'program') {
    return true
  }

  const measure = params.lectureFeeMeasure.trim()
  const amount = parseLectureFeeAmountDigits(params.lectureFeeAmount)
  return measure.length > 0 && amount.length > 0
}

export function buildInstructorFeeApprovalConfirmDetail(params: {
  lectureFeeBasisType: ApplicantInstructorLectureFeeBasisType
  instructorFeeGrade: string
  lectureFeeMeasure: string
  lectureFeeAmount: string
  notifyTiming: PermissionModalNotifyTiming
  manualNotifyAt: Dayjs | null
}): InstructorFeeApprovalConfirmDetail {
  const amountDigits =
    params.lectureFeeBasisType === 'program'
      ? ''
      : parseLectureFeeAmountDigits(params.lectureFeeAmount)
  const measure =
    params.lectureFeeBasisType === 'program' ? '' : params.lectureFeeMeasure.trim()

  return {
    lectureFeeBasisType: params.lectureFeeBasisType,
    instructorFeeGradeLabel:
      params.lectureFeeBasisType === 'program' ? params.instructorFeeGrade : null,
    lectureFeeMeasure: params.lectureFeeBasisType === 'program' ? null : measure || null,
    lectureFeeAmount: params.lectureFeeBasisType === 'program' ? null : amountDigits || null,
    lectureFeeBasisDisplay: buildLectureFeeBasisDisplay(
      params.lectureFeeBasisType,
      measure,
      amountDigits
    ),
    notifyTiming: params.notifyTiming,
    manualNotifyAt: params.notifyTiming === 'manual' ? params.manualNotifyAt : null,
  }
}

function nowManualNotifyAt(): Dayjs {
  return dayjs().second(0).millisecond(0)
}

export function useInstructorFeeApprovalModal(params: {
  open: boolean
  instructorFeeGradeLabel?: string
}) {
  const { open, instructorFeeGradeLabel } = params

  const [lectureFeeBasisType, setLectureFeeBasisType] =
    useState<ApplicantInstructorLectureFeeBasisType>('program')
  const [instructorFeeGrade, setInstructorFeeGrade] = useState(
    INSTRUCTOR_FEE_GRADE_OPTIONS[0]!.value
  )
  const [lectureFeeMeasure, setLectureFeeMeasure] = useState(DEFAULT_LECTURE_FEE_PAYMENT_CRITERIA)
  const [lectureFeeAmount, setLectureFeeAmount] = useState('')
  const [notifyTiming, setNotifyTiming] = useState<PermissionModalNotifyTiming>('immediate')
  const [manualNotifyAt, setManualNotifyAt] = useState<Dayjs | null>(null)
  const [dateTimePickerOpen, setDateTimePickerOpen] = useState(false)
  const [notifyError, setNotifyError] = useState('')

  const manualRadioAnchorRef = useRef<HTMLSpanElement>(null)
  const modalContentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setLectureFeeBasisType('program')
    setInstructorFeeGrade(resolveDefaultInstructorFeeGrade(instructorFeeGradeLabel))
    setLectureFeeMeasure(DEFAULT_LECTURE_FEE_PAYMENT_CRITERIA)
    setLectureFeeAmount('')
    setNotifyTiming('immediate')
    setManualNotifyAt(null)
    setDateTimePickerOpen(false)
    setNotifyError('')
  }, [open, instructorFeeGradeLabel])

  const showAmountFields =
    lectureFeeBasisType === 'special_lecture' || lectureFeeBasisType === 'other_labor'

  const canConfirm = useMemo(
    () =>
      canConfirmInstructorFeeApproval({
        lectureFeeBasisType,
        lectureFeeMeasure,
        lectureFeeAmount,
        notifyTiming,
        manualNotifyAt,
      }),
    [lectureFeeBasisType, lectureFeeMeasure, lectureFeeAmount, notifyTiming, manualNotifyAt]
  )

  const handleLectureFeeBasisTypeChange = useCallback(
    (next: ApplicantInstructorLectureFeeBasisType) => {
      setLectureFeeBasisType(next)
      if (next === 'program') {
        setInstructorFeeGrade(resolveDefaultInstructorFeeGrade(instructorFeeGradeLabel))
      } else if (next === 'special_lecture' || next === 'other_labor') {
        setLectureFeeMeasure(prev => prev.trim() || DEFAULT_LECTURE_FEE_PAYMENT_CRITERIA)
      }
    },
    [instructorFeeGradeLabel]
  )

  const handleNotifyTimingChange = useCallback((next: PermissionModalNotifyTiming) => {
    setNotifyTiming(next)
    setNotifyError('')
    if (next === 'manual') {
      setManualNotifyAt(nowManualNotifyAt())
      setDateTimePickerOpen(true)
    } else {
      setDateTimePickerOpen(false)
    }
  }, [])

  const buildConfirmDetail = useCallback((): InstructorFeeApprovalConfirmDetail | null => {
    if (
      !canConfirmInstructorFeeApproval({
        lectureFeeBasisType,
        lectureFeeMeasure,
        lectureFeeAmount,
        notifyTiming,
        manualNotifyAt,
      })
    ) {
      if (notifyTiming === 'manual' && !manualNotifyAt) {
        setNotifyError('알림 발송 일시를 설정해 주세요.')
      }
      return null
    }

    setNotifyError('')
    return buildInstructorFeeApprovalConfirmDetail({
      lectureFeeBasisType,
      instructorFeeGrade,
      lectureFeeMeasure,
      lectureFeeAmount,
      notifyTiming,
      manualNotifyAt,
    })
  }, [
    lectureFeeBasisType,
    instructorFeeGrade,
    lectureFeeMeasure,
    lectureFeeAmount,
    notifyTiming,
    manualNotifyAt,
  ])

  return {
    lectureFeeBasisType,
    instructorFeeGrade,
    lectureFeeMeasure,
    lectureFeeAmount,
    notifyTiming,
    manualNotifyAt,
    dateTimePickerOpen,
    notifyError,
    manualRadioAnchorRef,
    modalContentRef,
    showAmountFields,
    canConfirm,
    setLectureFeeMeasure,
    setLectureFeeAmount,
    setManualNotifyAt,
    setDateTimePickerOpen,
    setNotifyError,
    handleLectureFeeBasisTypeChange,
    handleNotifyTimingChange,
    buildConfirmDetail,
  }
}
