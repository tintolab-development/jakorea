import { useCallback, useMemo, useState } from 'react'
import type { Application } from '@/types/domain'

type ApplicationModalBranch = {
  isOpen: boolean
  data: Application | null
}

const initialBranch: ApplicationModalBranch = { isOpen: false, data: null }

export interface UserDetailApplicationModalHandle {
  /** Ant Design `Modal` 등에 전달할 표시 여부 */
  open: boolean
  data: Application | null
  /** `data`를 넣고 모달을 연다 */
  show: (record: Application) => void
  close: () => void
}

export interface UseUserDetailModalsResult {
  lectureAttendance: UserDetailApplicationModalHandle
  assignment: UserDetailApplicationModalHandle
}

export function useUserDetailModals(): UseUserDetailModalsResult {
  const [lectureAttendance, setLectureAttendance] =
    useState<ApplicationModalBranch>(initialBranch)
  const [assignment, setAssignment] = useState<ApplicationModalBranch>(initialBranch)

  const openLecture = useCallback((record: Application) => {
    setLectureAttendance({ isOpen: true, data: record })
  }, [])
  const closeLecture = useCallback(() => {
    setLectureAttendance(initialBranch)
  }, [])

  const openAssignment = useCallback((record: Application) => {
    setAssignment({ isOpen: true, data: record })
  }, [])
  const closeAssignment = useCallback(() => {
    setAssignment(initialBranch)
  }, [])

  return useMemo(
    () => ({
      lectureAttendance: {
        open: lectureAttendance.isOpen,
        data: lectureAttendance.data,
        show: openLecture,
        close: closeLecture,
      },
      assignment: {
        open: assignment.isOpen,
        data: assignment.data,
        show: openAssignment,
        close: closeAssignment,
      },
    }),
    [
      lectureAttendance,
      assignment,
      openLecture,
      closeLecture,
      openAssignment,
      closeAssignment,
    ]
  )
}
