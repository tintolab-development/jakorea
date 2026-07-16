/**
 * 학교(교사) 상세 정보 모달
 * - width 1400, body height 830, 섹션 간 갭 32px
 * - 학교 정보 (보더 테이블 2행×4열)
 * - 소속된 교사 회원 목록 (체크박스 + 회원 삭제 버튼)
 * - 프로그램 참여 이력 (체크박스)
 */

import { useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import {
  getSchoolDetailStats,
  getAffiliatedTeachers,
  getSchoolProgramHistory,
  type AffiliatedTeacherRow,
  type ProgramParticipationRow,
} from '@/data/mock/school-detail'
import { formatDate } from '@/shared/utils'
import type { User } from '@/types/user'
import { TeacherDetailModal } from './teacher-detail-modal'
import './school-detail-modal.css'

export interface SchoolDetailModalProps {
  open: boolean
  user: Omit<User, 'password'> | null
  onClose: () => void
  onDeleteMembers?: (teacherIds: string[]) => void
}

export function SchoolDetailModal({
  open,
  user,
  onClose,
  onDeleteMembers,
}: SchoolDetailModalProps) {
  const [selectedTeacherKeys, setSelectedTeacherKeys] = useState<React.Key[]>([])
  const [selectedHistoryKeys, setSelectedHistoryKeys] = useState<React.Key[]>([])
  const [teacherDetailOpen, setTeacherDetailOpen] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<AffiliatedTeacherRow | null>(null)

  const stats = useMemo(
    () => (user ? getSchoolDetailStats(user.id) : { applicationCount: 0, participationCount: 0 }),
    [user]
  )
  const teachers = useMemo(() => (user ? getAffiliatedTeachers(user.id) : []), [user])
  const programHistory = useMemo(() => (user ? getSchoolProgramHistory(user.id) : []), [user])

  const schoolName = user?.schoolInfo?.schoolName ?? user?.name ?? '-'
  const region = user?.schoolInfo?.address?.split(' ').slice(0, 2).join(' ') ?? '-'

  const teacherColumns: ColumnsType<AffiliatedTeacherRow> = [
    {
      title: 'No.',
      key: 'no',
      align: 'center',
      render: (_, __, i) => teachers.length - i,
    },
    { title: '교사명', dataIndex: 'name', key: 'name', align: 'center', width: 120 },
    {
      title: '담당 학년',
      dataIndex: 'gradeInCharge',
      key: 'gradeInCharge',
      align: 'center',
    },
    { title: '연락처', dataIndex: 'phone', key: 'phone', align: 'center', width: 140 },
    { title: '이메일', dataIndex: 'email', key: 'email', align: 'center', width: 180 },
    {
      title: '가입일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      align: 'center',
      width: 130,
      render: (d: string) => formatDate(new Date(d)),
    },
  ]

  const historyColumns: ColumnsType<ProgramParticipationRow> = [
    {
      title: 'No.',
      key: 'no',
      align: 'center',
      render: (_, __, i) => programHistory.length - i,
    },
    {
      title: '프로그램명',
      dataIndex: 'programName',
      key: 'programName',
      align: 'center',
      minWidth: 300,
    },
    {
      title: '교육분야',
      dataIndex: 'educationField',
      key: 'educationField',
      align: 'center',
    },
    {
      title: '진행 학년',
      dataIndex: 'gradeTaught',
      key: 'gradeTaught',
      align: 'center',
    },
    {
      title: '교육 진행 기간',
      dataIndex: 'programPeriod',
      key: 'programPeriod',
      align: 'center',
    },
    {
      title: '담당교사',
      dataIndex: 'teacherInCharge',
      key: 'teacherInCharge',
      align: 'center',
    },
  ]

  if (!user) return null

  return (
    <>
      <ContentModal
        open={open}
        onCancel={onClose}
        title="학교(교사) 상세 정보"
        size="large"
        className="teal-header-modal--school-detail"
        footer={
          <CmsButton variant="secondary" size="large" onClick={onClose}>
            닫기
          </CmsButton>
        }
      >
        {/* 1. 학교 정보 */}
        <section className="school-detail-modal__section">
          <h3 className="school-detail-modal__section-title">학교 정보</h3>
          <div className="school-detail-modal__info-table-wrap">
            <table className="school-detail-modal__info-table">
              <tbody>
                <tr>
                  <th>학교명</th>
                  <td>{schoolName}</td>
                  <th>지역</th>
                  <td>{region}</td>
                </tr>
                <tr>
                  <th>프로그램 신청 횟수</th>
                  <td>{stats.applicationCount}회</td>
                  <th>프로그램 참여 횟수</th>
                  <td>{stats.participationCount}회</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 2. 소속된 교사 회원 목록 */}
        <section className="school-detail-modal__section">
          <div className="school-detail-modal__table-header">
            <h3 className="school-detail-modal__section-title">
              소속된 교사 회원 목록
              <span className="school-detail-modal__section-title-count">
                총 {teachers.length}건
              </span>
            </h3>
            {onDeleteMembers && (
              <CmsButton
                variant="delete"
                size="small"
                onClick={() => {
                  onDeleteMembers(selectedTeacherKeys as string[])
                  setSelectedTeacherKeys([])
                }}
                disabled={selectedTeacherKeys.length === 0}
              >
                회원 삭제
              </CmsButton>
            )}
          </div>
          <Table<AffiliatedTeacherRow>
            className="cms-data-table"
            rowSelection={{
              selectedRowKeys: selectedTeacherKeys,
              onChange: keys => setSelectedTeacherKeys(keys),
            }}
            columns={teacherColumns}
            dataSource={teachers}
            rowKey="id"
            pagination={false}
            onRow={record => ({
              onClick: e => {
                if ((e.target as HTMLElement).closest('.ant-table-selection-column')) return
                setSelectedTeacher(record)
                setTeacherDetailOpen(true)
              },
              style: { cursor: 'pointer' },
            })}
          />
        </section>

        {/* 3. 프로그램 참여 이력 */}
        <section className="school-detail-modal__section">
          <h3 className="school-detail-modal__section-title">
            프로그램 참여 이력
            <span className="school-detail-modal__section-title-count">
              총 {programHistory.length}건
            </span>
          </h3>
          <Table<ProgramParticipationRow>
            className="cms-data-table"
            rowSelection={{
              selectedRowKeys: selectedHistoryKeys,
              onChange: keys => setSelectedHistoryKeys(keys),
            }}
            columns={historyColumns}
            dataSource={programHistory}
            rowKey="id"
            pagination={false}
          />
        </section>
      </ContentModal>

      <TeacherDetailModal
        open={teacherDetailOpen}
        teacher={selectedTeacher}
        schoolUserId={user?.id ?? ''}
        onClose={() => {
          setTeacherDetailOpen(false)
          setSelectedTeacher(null)
        }}
      />
    </>
  )
}
