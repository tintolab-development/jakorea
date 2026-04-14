/**
 * 수강 프로그램 상세 모달
 * 전체 회원 > 전체회원 목록 모달 > 프로그램 수강이력 탭 > 테이블 행 클릭 시 노출.
 * 테이블 UI: 학교 상세 정보 모달 참고. 필드·항목: persona.md / member-detail-modal-spec §6 스크린샷 기준.
 */

import { useMemo } from 'react'
import { Descriptions, Tabs, Typography } from 'antd'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { AppButton } from '@/shared/ui/app-button'
import type { Application, Program, ProgramRound } from '@/types/domain'
import { programService } from '@/entities/program/api/program-service'
import {
  formatDateRange,
  TYPE_LABEL,
  TARGET_LEVEL_LABEL,
} from '@/features/program/program-detail/lib/program-detail-info-constants'
import { ProgramLifecycleStatusBadge } from '@/shared/components/program-lifecycle-status-badge'
import { StatusBadge } from '@/shared/components/status-badge'
import {
  getProgramLifecycleLabel,
  getApplicationEnrollmentDisplayStatus,
} from '@/shared/constants/status'
import { EnrollmentProgramDetailPostsTab } from './enrollment-program-detail-posts-tab'
import { EnrollmentProgramDetailSubmissionsTab } from './enrollment-program-detail-submissions-tab'
import dayjs from 'dayjs'
import './enrollment-program-detail-modal.css'

const DEFAULT_CURRICULUM_BY_ROUND: string[] = [
  "'개인', '근로자', '소비자' 개념 정의 및 설명",
  '기업과 경제적 개념 이해',
  '의사결정 능력 향상 및 노동 준비에 대한 이해 학습',
  '전체 복습 및 향후 목표 설계',
]

function formatCurriculumDisplay(
  round: ProgramRound,
  programCurriculum: string | undefined
): string {
  const raw = round.curriculum?.trim() || programCurriculum?.trim()
  if (raw) {
    const hasHour = /^1\s*시간|^1시간/.test(raw)
    return hasHour ? raw : `1시간 (오프라인) | ${raw}`
  }
  const desc = DEFAULT_CURRICULUM_BY_ROUND[round.roundNumber - 1]
  return desc ? `1시간 (오프라인) | ${desc}` : '1시간 (오프라인) | (상세 내용 없음)'
}

function formatLectureRoundDisplay(program: Program): string {
  const rounds = program.rounds?.length
    ? [...program.rounds].sort((a, b) => a.roundNumber - b.roundNumber)
    : []
  if (rounds.length === 0) return '-'
  const last = rounds[rounds.length - 1]
  const lastDate = last?.endDate || last?.startDate || program.endDate
  const dateStr = lastDate ? dayjs(lastDate).format('YY.MM.DD') : ''
  const completed =
    program.lifecycleStatus === 'education_completed' ||
    program.lifecycleStatus === 'document_processing_completed'
  return `${dateStr} / ${rounds.length}회차 (${completed ? '완료' : '진행 중'})`
}

function formatContactDisplay(program: Program, application?: Application | null): string {
  const parts = [
    application?.managerName
      ? `담당자 : ${application.managerName}`
      : program.managerName
        ? `담당자 : ${program.managerName}`
        : null,
    program.contactPhone ? `Tel: ${program.contactPhone}` : null,
    program.contactEmail ? `E-mail: ${program.contactEmail}` : null,
  ].filter(Boolean)
  return parts.length ? parts.join(' | ') : '-'
}

/** 참여 학교명: 회원 소속 또는 mock */
function getParticipatingSchoolName(_program: Program, _application: Application | null): string {
  // TODO: application.subjectId로 학교 조회 또는 User.schoolInfo.affiliation
  return '틴토고등학교'
}

/** 담당 교사: mock (스크린샷 예시) */
function getTeacherDisplay(_program: Program, _application: Application | null): string {
  return '교사명 : 이길동 | Tel: 010-0000-0000 | E-mail: tinto@naver.com'
}

function EnrollmentProgramDetailInfoTab({
  program,
  application,
  onEditBasicInfo,
}: {
  program: Program
  application: Application | null
  onEditBasicInfo?: () => void
}) {
  const basicItems = useMemo(() => {
    const schoolName = getParticipatingSchoolName(program, application)
    const teacherDisplay = getTeacherDisplay(program, application)
    const typeLabel = TYPE_LABEL[program.type] ?? program.type ?? '-'
    const targetLabel = program.targetLevel
      ? (TARGET_LEVEL_LABEL[program.targetLevel] ?? program.targetLevel)
      : '-'
    const lifecycleStatus = program.lifecycleStatus
    const programCompleted =
      lifecycleStatus === 'education_completed' ||
      lifecycleStatus === 'document_processing_completed'
    const enrollmentEnded =
      application?.status &&
      getApplicationEnrollmentDisplayStatus(
        application.status,
        application.progressStatus,
        application.rejectionKind
      ) === 'PROGRAM_ENDED'
    const showEndedTag = programCompleted || enrollmentEnded
    const statusLabelText = lifecycleStatus
      ? getProgramLifecycleLabel(lifecycleStatus)
      : '봉사자 모집 완료'

    return [
      { key: 'title', label: '프로그램명', children: program.title ?? '-' },
      {
        key: 'period',
        label: '프로그램 운영 기간',
        children: formatDateRange(program.startDate, program.endDate),
      },
      { key: 'type', label: '프로그램 진행 방식', children: typeLabel },
      {
        key: 'status',
        label: '프로그램 진행 상태',
        children: (
          <span className="enrollment-program-detail-modal__status-cell">
            {showEndedTag ? (
              <span className="enrollment-program-detail-modal__status-cell-inner">
                <span className="enrollment-program-detail-modal__status-text">
                  {statusLabelText}
                </span>
                <StatusBadge domain="programEnrollment" status="PROGRAM_ENDED" variant="badge" />
              </span>
            ) : lifecycleStatus ? (
              <ProgramLifecycleStatusBadge status={lifecycleStatus} />
            ) : (
              '-'
            )}
          </span>
        ),
      },
      { key: 'schoolName', label: '참여 학교명', children: schoolName },
      { key: 'region', label: '프로그램 진행 지역', children: program.district ?? '-' },
      { key: 'targetGrade', label: '대상 학년', children: targetLabel },
      { key: 'venue', label: '진행 장소', children: program.venue ?? '-' },
      { key: 'teacher', label: '담당 교사', children: teacherDisplay, span: 2 as const },
    ]
  }, [program, application])

  const subItems = useMemo(
    () => [
      {
        key: 'lectureRound',
        label: '강의 진행 회차',
        children: formatLectureRoundDisplay(program),
      },
      { key: 'textbookName', label: '교재명', children: program.textbookName ?? '-' },
      {
        key: 'contact',
        label: '문의처',
        children: formatContactDisplay(program, application),
        span: 2 as const,
      },
    ],
    [program, application]
  )

  const sortedRounds = useMemo(() => {
    const rounds = program.rounds ?? []
    return rounds.length ? [...rounds].sort((a, b) => a.roundNumber - b.roundNumber) : []
  }, [program.rounds])

  return (
    <div className="enrollment-program-detail-modal__view">
      <div className="enrollment-program-detail-modal__basic">
        <div className="enrollment-program-detail-modal__basic-top">
          <div className="enrollment-program-detail-modal__basic-header-row">
            <span className="enrollment-program-detail-modal__section-title">기본 정보</span>
            <span className="enrollment-program-detail-modal__notice">
              학교 담당자(교사) 및 관리자만 작성/수정이 가능합니다. 11
            </span>
          </div>
          <AppButton variant="cancel" size="middle" onClick={() => onEditBasicInfo?.()}>
            수정
          </AppButton>
        </div>
        <div className="enrollment-program-detail-modal__descriptions-wrap">
          <Descriptions
            column={2}
            bordered
            size="middle"
            className="enrollment-program-detail-modal__descriptions"
            labelStyle={{ background: '#EDF0F2' }}
            items={basicItems}
          />
          <Descriptions
            column={2}
            bordered
            size="middle"
            className="enrollment-program-detail-modal__descriptions enrollment-program-detail-modal__descriptions--sub"
            labelStyle={{ background: '#EDF0F2' }}
            items={subItems}
          />
        </div>
      </div>

      <div className="enrollment-program-detail-modal__curriculum">
        <h3 className="enrollment-program-detail-modal__section-title">교육 커리큘럼</h3>
        <div className="enrollment-program-detail-modal__curriculum-table-wrap">
          <table className="enrollment-program-detail-modal__curriculum-table">
            <colgroup>
              <col className="enrollment-program-detail-modal__curriculum-col-label" />
              <col />
            </colgroup>
            <tbody>
              {sortedRounds.length > 0 ? (
                sortedRounds.map(round => (
                  <tr key={round.id}>
                    <th>{round.roundNumber}회차 강의 분량 및 내용</th>
                    <td>{formatCurriculumDisplay(round, program.curriculum)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="enrollment-program-detail-modal__curriculum-empty">
                    등록된 회차가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export interface EnrollmentProgramDetailModalProps {
  open: boolean
  onCancel: () => void
  /** 클릭한 수강 이력 행(Application). programId로 프로그램 조회 */
  application: Application | null
}

const TAB_KEYS = {
  INFO: 'info',
  POSTS: 'posts',
  SUBMISSIONS: 'submissions',
} as const

export function EnrollmentProgramDetailModal({
  open,
  onCancel,
  application,
}: EnrollmentProgramDetailModalProps) {
  const program: Program | undefined = useMemo(() => {
    if (!open || !application?.programId) return undefined
    return programService.getByIdSync(application.programId) ?? undefined
  }, [open, application?.programId])

  const tabItems = useMemo(() => {
    if (!program) return []
    return [
      {
        key: TAB_KEYS.INFO,
        label: '프로그램 상세 정보',
        children: (
          <div className="enrollment-program-detail-modal__tab-body">
            <EnrollmentProgramDetailInfoTab program={program} application={application} />
          </div>
        ),
      },
      {
        key: TAB_KEYS.POSTS,
        label: '게시글',
        children: (
          <div className="enrollment-program-detail-modal__tab-body">
            <EnrollmentProgramDetailPostsTab program={program} />
          </div>
        ),
      },
      {
        key: TAB_KEYS.SUBMISSIONS,
        label: '제출 내역 및 서류 발급',
        children: (
          <div className="enrollment-program-detail-modal__tab-body">
            <EnrollmentProgramDetailSubmissionsTab program={program} />
          </div>
        ),
      },
    ]
  }, [program, application])

  return (
    <TealHeaderModal
      open={open}
      onCancel={onCancel}
      title="수강 프로그램 상세"
      size="large"
      width={1400}
      className="enrollment-program-detail-modal"
      footer={
        <AppButton variant="cancel" size="large" onClick={onCancel}>
          닫기
        </AppButton>
      }
    >
      <div className="enrollment-program-detail-modal__body">
        {program ? (
          <Tabs defaultActiveKey={TAB_KEYS.INFO} items={tabItems} />
        ) : (
          <Typography.Text type="secondary">프로그램 정보를 찾을 수 없습니다.</Typography.Text>
        )}
      </div>
    </TealHeaderModal>
  )
}
