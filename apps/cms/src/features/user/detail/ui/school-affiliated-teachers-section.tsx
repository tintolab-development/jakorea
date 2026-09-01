/**
 * 학교 상세 — 기본 정보 하단 소속 교사 목록
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { AffiliatedTeacherLinkTarget, SchoolAffiliatedTeacherRow, SchoolTeacherEmploymentStatus } from '@/types/user'
import { CmsButton } from '@/shared/ui'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import { TABLE_COLUMN_WIDTHS, TABLE_CONFIG } from '@/shared/constants/table'
import { formatDateSpaced } from '@/shared/utils'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import {
  SCHOOL_TEACHER_EMPLOYMENT_BADGE_CELL_STYLE,
  SCHOOL_TEACHER_EMPLOYMENT_STATUS_DROPDOWN_OPTIONS,
  isSchoolTeacherEmploymentMutedStatus,
  SchoolTeacherEmploymentStatusBadge,
} from '@/features/user/detail/lib/school-teacher-employment-status'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_100_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_100_HEADER_CLASSNAME,
} from '@/shared/components'
import './school-affiliated-teachers-section.css'

export interface SchoolAffiliatedTeachersSectionProps {
  rows: SchoolAffiliatedTeacherRow[]
  /** 상단「개인정보 상세보기」로 마스킹 해제된 경우 연락처·이메일 원문 표시 */
  personalInfoRevealed?: boolean
  /** 선택 교사 일괄 탈퇴 — 미지정 시 안내만 표시 */
  onWithdrawSelected?: (teacherIds: string[]) => void
  /** `linkedUserId`가 있는 행 클릭 시 해당 CMS 회원 상세로 이동 */
  onLinkedUserClick?: (target: AffiliatedTeacherLinkTarget) => void
  /** 재직 현황 변경 시 (API 연동 시 저장 로직 연결) */
  onEmploymentStatusChange?: (
    teacherId: string,
    status: SchoolTeacherEmploymentStatus
  ) => void | Promise<void>
}

function isCheckboxClickTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return Boolean(target.closest('.ant-checkbox-wrapper, .ant-checkbox'))
}

export function SchoolAffiliatedTeachersSection({
  rows,
  personalInfoRevealed = false,
  onLinkedUserClick,
  onEmploymentStatusChange,
}: SchoolAffiliatedTeachersSectionProps) {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [employmentPatchById, setEmploymentPatchById] = useState<
    Partial<Record<string, SchoolTeacherEmploymentStatus>>
  >({})
  const [openEmploymentDropdownId, setOpenEmploymentDropdownId] = useState<string | null>(null)

  /** 서버(부모) rows가 바뀌면 로컬 재직 패치 초기화 */
  const rowsStableKey = useMemo(
    () => rows.map(r => `${r.id}:${r.employmentStatus}`).join(','),
    [rows]
  )
  useEffect(() => {
    setEmploymentPatchById({})
  }, [rowsStableKey])

  type Row = SchoolAffiliatedTeacherRow & { key: string }

  const dataSource = useMemo<Row[]>(
    () =>
      rows.map(r => ({
        ...r,
        key: r.id,
        employmentStatus: employmentPatchById[r.id] ?? r.employmentStatus,
      })),
    [rows, employmentPatchById]
  )

  const handleEmploymentStatusChange = useCallback(
    (teacherId: string, next: SchoolTeacherEmploymentStatus) => {
      setEmploymentPatchById(prev => ({ ...prev, [teacherId]: next }))
      setOpenEmploymentDropdownId(null)
      void onEmploymentStatusChange?.(teacherId, next)
    },
    [onEmploymentStatusChange]
  )

  const columns: ColumnsType<Row> = useMemo(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: TABLE_COLUMN_WIDTHS.index,
        align: 'center',
        render: (_: unknown, __: Row, index: number) => rows.length - index,
      },
      {
        title: '교사명',
        dataIndex: 'name',
        key: 'name',
        width: TABLE_COLUMN_WIDTHS.name,
        align: 'center',
      },
      {
        title: '담당 학년',
        dataIndex: 'assignedGrade',
        key: 'assignedGrade',
        width: 100,
        align: 'center',
      },
      {
        title: '연락처',
        dataIndex: 'phone',
        key: 'phone',
        width: TABLE_COLUMN_WIDTHS.phone,
        align: 'center',
        render: (phone: string) =>
          personalInfoRevealed ? (phone?.trim() ? phone : '-') : MASKING_POLICY.phone(phone),
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        width: TABLE_COLUMN_WIDTHS.email,
        align: 'center',
        render: (email: string) =>
          personalInfoRevealed ? (email?.trim() ? email : '-') : MASKING_POLICY.email(email),
      },
      {
        title: '재직 현황',
        dataIndex: 'employmentStatus',
        key: 'employmentStatus',
        width: 116,
        align: 'center',
        onHeaderCell: () => ({ className: STATUS_DROPDOWN_CELL_TAG_100_HEADER_CLASSNAME }),
        onCell: () => ({
          className: `${STATUS_DROPDOWN_CELL_CLASSNAME} ${STATUS_DROPDOWN_CELL_TAG_100_CLASSNAME}`,
          onClick: (e: React.MouseEvent<HTMLTableCellElement>) => e.stopPropagation(),
        }),
        render: (_: unknown, record: Row) => (
          <StatusDropdownCell<SchoolTeacherEmploymentStatus>
            status={record.employmentStatus}
            statusOptions={SCHOOL_TEACHER_EMPLOYMENT_STATUS_DROPDOWN_OPTIONS}
            renderBadge={s => <SchoolTeacherEmploymentStatusBadge status={s} />}
            isItemDisabled={(cur, opt) => cur === opt}
            onChange={next => handleEmploymentStatusChange(record.id, next)}
            isOpen={openEmploymentDropdownId === record.id}
            onOpenChange={open => setOpenEmploymentDropdownId(open ? record.id : null)}
            style={SCHOOL_TEACHER_EMPLOYMENT_BADGE_CELL_STYLE}
            tagLayout="tag100"
          />
        ),
      },
      {
        title: '가입일',
        dataIndex: 'joinedAt',
        key: 'joinedAt',
        width: TABLE_COLUMN_WIDTHS.date,
        align: 'center',
        render: (d: Row['joinedAt']) => formatDateSpaced(d),
      },
    ],
    [rows.length, openEmploymentDropdownId, handleEmploymentStatusChange, personalInfoRevealed]
  )

  const handleWithdraw = () => {
    window.alert('준비 중입니다.')
  }

  const handleRowClick = (record: Row) => {
    const targetId =
      record.linkedUserId?.trim() ||
      (record.teacherMemberId != null ? String(record.teacherMemberId) : '')
    if (!targetId) return
    onLinkedUserClick?.({
      userId: targetId,
      teacherMemberId: record.teacherMemberId,
      name: record.name,
      assignedGrade: record.assignedGrade,
    })
  }

  return (
    <section className="school-affiliated-teachers-section">
      <header className="school-affiliated-teachers-section__header">
        <div className="school-affiliated-teachers-section__header-lead">
          <h2 className="detail-info-form__title">소속 교사 목록</h2>
          <div className="detail-info-form__description">{`총 ${rows.length}건`}</div>
        </div>
        <div className="school-affiliated-teachers-section__header-end">
          <CmsButton
            variant="delete"
            size="medium"
            disabled={selectedRowKeys.length === 0}
            onClick={handleWithdraw}
          >
            회원 탈퇴
          </CmsButton>
        </div>
      </header>
      <DetailInfoForm title="소속 교사 목록" hideHeader className="school-affiliated-teachers-section__form">
        <DetailInfoForm.Row type="custom">
          <div className="school-affiliated-teachers-section__body">
            <Table
              className="cms-data-table cms-data-table--fluid school-affiliated-teachers-section__table"
              rowSelection={{
                columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
                selectedRowKeys,
                onChange: keys => setSelectedRowKeys(keys),
              }}
              columns={columns}
              dataSource={dataSource}
              pagination={false}
              size={TABLE_CONFIG.size}
              bordered={TABLE_CONFIG.bordered}
              scroll={TABLE_CONFIG.scroll}
              rowKey="id"
              onRow={record => ({
                className: isSchoolTeacherEmploymentMutedStatus(record.employmentStatus)
                  ? 'school-affiliated-teachers-section__row--muted-text'
                  : undefined,
                onClick: e => {
                  if (isCheckboxClickTarget(e.target)) return
                  handleRowClick(record)
                },
                style:
                  (record.linkedUserId || record.teacherMemberId != null) && onLinkedUserClick
                    ? { cursor: 'pointer' }
                    : undefined,
              })}
            />
          </div>
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </section>
  )
}
