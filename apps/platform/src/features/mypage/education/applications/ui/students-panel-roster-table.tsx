import { useMemo } from 'react'
import type { PortalStudentRosterItem } from '../api/student-documents-types'
import {
  formatPortalStudentBirthDate,
  formatPortalStudentEmail,
  formatPortalStudentGender,
  formatPortalStudentGradeClass,
  formatPortalStudentPhone,
  resolvePortalStudentRosterRowNo,
} from '../lib/student-documents-display'
import { PFDataTable, type PFDataTableColumn } from '@/shared/ui'
import styles from './students-panel.module.css'

const ROSTER_TABLE_MIN_WIDTH = '920px'

function rosterRowKey(row: PortalStudentRosterItem): string {
  if (row.rosterId != null) return String(row.rosterId)
  return `${row.studentName ?? ''}-${row.studentNo ?? ''}-${row.birthDate ?? ''}`
}

type StudentsPanelRosterTableProps = {
  rows: PortalStudentRosterItem[]
}

export function StudentsPanelRosterTable({ rows }: StudentsPanelRosterTableProps) {
  const columns = useMemo((): PFDataTableColumn<PortalStudentRosterItem>[] => {
    return [
      {
        key: 'no',
        label: 'No',
        width: '56px',
        render: row => {
          const index = rows.indexOf(row)
          return String(resolvePortalStudentRosterRowNo(row, index >= 0 ? index : 0))
        },
      },
      {
        key: 'studentName',
        label: '학생명',
        width: '96px',
        render: row => row.studentName?.trim() || '-',
      },
      {
        key: 'gender',
        label: '성별',
        width: '64px',
        render: row => formatPortalStudentGender(row.gender),
      },
      {
        key: 'birthDate',
        label: '생년월일',
        width: '128px',
        render: row => formatPortalStudentBirthDate(row.birthDate),
      },
      {
        key: 'gradeClass',
        label: '학급',
        width: '88px',
        render: row => formatPortalStudentGradeClass(row.grade, row.className),
      },
      {
        key: 'contact',
        label: '연락처',
        width: '140px',
        render: row => formatPortalStudentPhone(row),
      },
      {
        key: 'email',
        label: '이메일',
        align: 'left',
        render: row => formatPortalStudentEmail(row),
      },
    ]
  }, [rows])

  return (
    <PFDataTable
      className={styles.rosterDataTable}
      columns={columns}
      rows={rows}
      minWidth={ROSTER_TABLE_MIN_WIDTH}
      rowKey={rosterRowKey}
    />
  )
}
