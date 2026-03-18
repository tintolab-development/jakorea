/**
 * 교육기관 상세 풀페이지 인라인 뷰
 * LNB 제외 메인 영역에서만 렌더. 탭: 신청 정보 | 학생 명단 | 강사 배정 현황 | 게시글
 * 액션: 승인 취소 | 정보 수정 | 정보 상세 보기
 */

import type { ReactNode } from 'react'
import { useState } from 'react'
import { AppButton } from '@/shared/ui/app-button'
import type { Program } from '@/types/domain'
import type { SchoolDetailForModal } from '../model/school-detail-types'
import type { ParticipatingSchoolRow, ParticipatingSchoolSession } from '@/data/mock/participating-schools'
import type { ParticipatingInstructorRow } from '@/data/mock/participating-instructors'
import type { InstructorListFormInstructor } from '../model/school-detail-types'
import type { SettlementStatusKey } from '@/data/mock/participating-instructors'
import { getInstructorRowsForSchool } from '../lib/school-detail-mock'
import { TextbookStatusBadge } from '@/shared/components/textbook-status-badge'
import { SchoolDetailStudentListSection } from './school-detail-student-list-section'
import './program-detail-info-tab.css'
import './school-detail-fullpage-view.css'

const SCHOOL_DETAIL_TAB_KEYS = ['application', 'students', 'instructors', 'posts'] as const
type SchoolDetailTabKey = (typeof SCHOOL_DETAIL_TAB_KEYS)[number]

const SCHOOL_DETAIL_TAB_LABELS: Record<SchoolDetailTabKey, string> = {
  application: '신청 정보',
  students: '학생 명단',
  instructors: '강사 배정 현황',
  posts: '게시글',
}

const SESSION_STATUS_LABELS: Record<string, string> = {
  completed: '진행 완료',
  pending: '진행 대기',
  not_planned: '미진행 희망',
}

/** td 내 디바이더( | ) — 양옆 gap 12px(담당 교사는 16px) */
function TdDivider({ variant }: { variant?: 'teacher' }) {
  return (
    <span
      className={
        variant === 'teacher'
          ? 'school-detail-fullpage-view__td-divider school-detail-fullpage-view__td-divider--teacher'
          : 'school-detail-fullpage-view__td-divider'
      }
      aria-hidden
    >
      {' | '}
    </span>
  )
}

/** 세그먼트 배열을 디바이더로 이어서 반환 (variant: teacher 시 양옆 16px) */
function withTdDivider(segments: ReactNode[], variant?: 'teacher') {
  return (
    <>
      {segments.reduce<ReactNode[]>((acc, seg, i) => {
        if (i > 0) acc.push(<TdDivider key={`d-${i}`} variant={variant} />)
        acc.push(<span key={i}>{seg}</span>)
        return acc
      }, [])}
    </>
  )
}

export interface SchoolDetailFullpageViewProps {
  program: Program
  detail: SchoolDetailForModal
  row: ParticipatingSchoolRow
  onClearSchoolId: () => void
  onSaveBasicInfo?: (patch: Partial<SchoolDetailForModal> & { id: string }) => void
  onSaveInstructorInfo?: (schoolId: string, instructors: InstructorListFormInstructor[]) => void
  savedBasicPatches?: Record<string, Partial<SchoolDetailForModal>>
  savedInstructorPatches?: Record<string, InstructorListFormInstructor[]>
  instructorList: ParticipatingInstructorRow[]
}

export function SchoolDetailFullpageView({
  program: _program,
  detail,
  row,
  onClearSchoolId: _onClearSchoolId,
  onSaveBasicInfo: _onSaveBasicInfo,
  onSaveInstructorInfo: _onSaveInstructorInfo,
  savedBasicPatches = {},
  savedInstructorPatches = {},
  instructorList,
}: SchoolDetailFullpageViewProps) {
  const [activeTab, setActiveTab] = useState<SchoolDetailTabKey>('application')

  const mergedDetail = { ...detail, ...savedBasicPatches[detail.id] }
  const instructors =
    savedInstructorPatches[detail.id] !== undefined
      ? savedInstructorPatches[detail.id].map(inv => ({
          ...inv,
          settlementStatus: 'pending' as SettlementStatusKey,
        }))
      : getInstructorRowsForSchool(row.schoolName, instructorList)

  /** 담당 교사 정보: 교사명 | Tel | M | E-mail (스크린샷 형식) */
  const teacherDisplay = [
    mergedDetail.teacherName && `교사명: ${mergedDetail.teacherName}`,
    mergedDetail.teacherPhone && `Tel: ${mergedDetail.teacherPhone}`,
    mergedDetail.teacherMobile && `M: ${mergedDetail.teacherMobile}`,
    mergedDetail.teacherEmail && `E-mail: ${mergedDetail.teacherEmail}`,
  ]
    .filter(Boolean)
    .join(' | ') || '-'
  const mealDisplay = mergedDetail.mealProvided
    ? `제공 | ${mergedDetail.mealNotice ?? ''}`
    : '미제공'
  const waitingDisplay =
    mergedDetail.waitingRoomAvailable && mergedDetail.waitingRoomLocation
      ? `있음 | ${mergedDetail.waitingRoomLocation}`
      : '없음'
  const educationTimeDisplay =
    mergedDetail.totalEducationHours != null && mergedDetail.totalSessions != null
      ? `${mergedDetail.totalEducationHours}시간 (총 ${mergedDetail.totalSessions}회차)`
      : '-'

  /** 기본 정보: 스크린샷 순서. 2열 배치 후 담당 교사/신청 사유/기타 요청사항은 span 2 */
  const basicInfoItems = [
    { key: 'schoolName', label: '신청 기관명', children: mergedDetail.schoolName },
    {
      key: 'approval',
      label: '프로그램 승인 현황',
      children: (
        <div className="school-detail-fullpage-view__approval-cell">
          {withTdDivider([
            '승인 완료',
            <button
              key="notification"
              type="button"
              className="school-detail-fullpage-view__notification-btn"
            >
              알림 발송
            </button>,
          ])}
        </div>
      ),
    },
    { key: 'region', label: '기관 주소', children: mergedDetail.region },
    {
      key: 'addressDetail',
      label: '상세 주소',
      children: mergedDetail.addressDetail ?? '-',
    },
    { key: 'educationGrade', label: '신청 학년', children: mergedDetail.educationGrade },
    {
      key: 'classCount',
      label: '신청 학급 수 및 총 인원',
      children: withTdDivider([
        `${mergedDetail.classCount}개 학급`,
        `총 ${mergedDetail.studentCount}명`,
      ]),
    },
    { key: 'venue', label: '교육 장소', children: mergedDetail.venue ?? '-' },
    {
      key: 'educationFormat',
      label: '교육 형태',
      children: mergedDetail.educationFormat ?? '-',
    },
    {
      key: 'textbook',
      label: '교재명',
      children: (() => {
        const name = mergedDetail.textbookName ?? '-'
        const kitsAndQty =
          mergedDetail.textbookKits != null && mergedDetail.textbookQuantity != null
            ? `${mergedDetail.textbookKits}키드 (${mergedDetail.textbookQuantity}권)`
            : mergedDetail.textbookQuantity != null
              ? `${mergedDetail.textbookQuantity}권`
              : '-'
        const status = <TextbookStatusBadge status={mergedDetail.textbookStatus} />
        return withTdDivider([name, kitsAndQty, status])
      })(),
    },
    {
      key: 'educationTime',
      label: '신청 총 교육시간 및 회차',
      children: educationTimeDisplay,
    },
    {
      key: 'prevYear',
      label: '전년도 참여 여부',
      children: mergedDetail.previousYearParticipation ?? '-',
    },
    {
      key: 'affiliated',
      label: '결연 금융회사명',
      children: mergedDetail.affiliatedFinancialCompany ?? '미결연',
    },
    {
      key: 'teacher',
      label: '담당 교사 정보',
      children: withTdDivider(
        teacherDisplay === '-' ? ['-'] : teacherDisplay.split(' | '),
        'teacher'
      ),
      span: 2,
    },
    {
      key: 'reason',
      label: '신청 사유',
      children: mergedDetail.applicationReason ?? '-',
      span: 2,
    },
    {
      key: 'other',
      label: '기타 요청사항',
      children: mergedDetail.otherRequests ?? '-',
      span: 2,
    },
  ]

  /** 안내 사항: 2열 배치. 왼쪽 열 3개, 오른쪽 열 2개 후 식사는 span 2 */
  const guidanceItems = [
    {
      key: 'computer',
      label: '강의 공간 내 컴퓨터 여부',
      children: mergedDetail.computerInRoom ?? '-',
    },
    {
      key: 'waitingRoom',
      label: '대기실 여부 및 위치',
      children: withTdDivider(
        waitingDisplay.includes(' | ')
          ? waitingDisplay.split(' | ')
          : [waitingDisplay]
      ),
    },
    {
      key: 'parking',
      label: '주차 공간 여부 및 위치',
      children: mergedDetail.parkingInfo ?? '-',
    },
    {
      key: 'meal',
      label: '식사 제공 여부 및 안내',
      children: withTdDivider(
        mealDisplay.includes(' | ') ? mealDisplay.split(' | ') : [mealDisplay]
      ),
    },
    {
      key: 'criminalCheck',
      label: '성범죄 경력 조회서 요청',
      children: mergedDetail.criminalCheckRequest ?? '-',
      span: 2,
    },
  ]

  const sessions = row.sessions ?? []

  /** 기본 정보·안내 사항을 2열 테이블 행으로 변환 (프로그램 정보 탭과 동일한 table 구조) */
  const toTableRows = (
    items: Array<{ key: string; label: string; children: ReactNode; span?: number }>
  ) => {
    const rows: React.ReactNode[] = []
    let i = 0
    while (i < items.length) {
      const item = items[i]
      if (item.span === 2) {
        rows.push(
          <tr key={item.key}>
            <th>{item.label}</th>
            <td colSpan={3}>{item.children}</td>
          </tr>
        )
        i += 1
      } else {
        const next = items[i + 1]
        if (next && 'span' in next && next.span === 2) {
          rows.push(
            <tr key={item.key}>
              <th>{item.label}</th>
              <td>{item.children}</td>
              <th />
              <td />
            </tr>
          )
          i += 1
        } else if (next) {
          rows.push(
            <tr key={`${item.key}-${next.key}`}>
              <th>{item.label}</th>
              <td>{item.children}</td>
              <th>{next.label}</th>
              <td>{next.children}</td>
            </tr>
          )
          i += 2
        } else {
          rows.push(
            <tr key={item.key}>
              <th>{item.label}</th>
              <td colSpan={3}>{item.children}</td>
            </tr>
          )
          i += 1
        }
      }
    }
    return rows
  }

  return (
    <div className="school-detail-fullpage-view">
      <div className="program-detail-fullpage-modal__tabs-row school-detail-fullpage-view__tabs-row">
        <div className="program-detail-fullpage-modal__tabs">
          {SCHOOL_DETAIL_TAB_KEYS.map(key => (
            <button
              key={key}
              type="button"
              className={`program-detail-fullpage-modal__tab ${activeTab === key ? 'program-detail-fullpage-modal__tab--active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              <span className="program-detail-fullpage-modal__tab-label">
                {SCHOOL_DETAIL_TAB_LABELS[key]}
              </span>
            </button>
          ))}
        </div>
        {activeTab === 'application' && (
          <div className="program-detail-fullpage-modal__header-actions">
            <AppButton variant="danger" size="large" onClick={() => {}}>
              승인 취소
            </AppButton>
            <AppButton variant="primary" size="large" onClick={() => {}}>
              정보 수정
            </AppButton>
            <AppButton variant="primary" size="large" onClick={() => {}}>
              정보 상세 보기
            </AppButton>
          </div>
        )}
      </div>

      <div className="program-detail-fullpage-modal__content school-detail-fullpage-view__content">
        {activeTab === 'application' && (
          <div className="program-detail-fullpage-modal__info-tab">
            <div className="program-detail-fullpage-modal__info-tab-block">
              <h3 className="program-detail-info-tab__section-title">기본 정보</h3>
              <div className="program-detail-info-tab__table-wrapper program-detail-info-tab__table-wrapper--top">
                <table className="program-detail-info-tab__table program-detail-info-tab__table--basic">
                  <colgroup>
                    <col style={{ width: '200px' }} />
                    <col />
                    <col style={{ width: '200px' }} />
                    <col />
                  </colgroup>
                  <tbody>{toTableRows(basicInfoItems)}</tbody>
                </table>
              </div>
            </div>

            <div className="program-detail-fullpage-modal__info-tab-block school-detail-fullpage-view__guidance-block">
              <h3 className="program-detail-info-tab__section-title">안내 사항</h3>
              <div className="program-detail-info-tab__table-wrapper program-detail-info-tab__table-wrapper--top">
                <table className="program-detail-info-tab__table program-detail-info-tab__table--basic">
                  <colgroup>
                    <col style={{ width: '200px' }} />
                    <col />
                    <col style={{ width: '200px' }} />
                    <col />
                  </colgroup>
                  <tbody>{toTableRows(guidanceItems)}</tbody>
                </table>
              </div>
            </div>

            <div className="program-detail-fullpage-modal__info-tab-block">
              <h3 className="program-detail-info-tab__section-title">
                강의 회차별 교육 진행 현황
              </h3>
              <div className="program-detail-info-tab__table-wrapper program-detail-info-tab__table-wrapper--top">
                <table className="program-detail-info-tab__table program-detail-info-tab__table--basic school-detail-fullpage-view__sessions-table">
                  <colgroup>
                    <col style={{ width: '200px' }} />
                    <col />
                  </colgroup>
                  <tbody>
                    {sessions.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="school-detail-fullpage-view__sessions-empty">
                          등록된 회차가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      sessions.map(session => (
                        <SessionTableRow key={session.round} session={session} />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="program-detail-fullpage-modal__info-tab">
            <SchoolDetailStudentListSection
              schoolId={detail.id}
              studentCount={detail.studentCount}
              readOnly={false}
              onViewDetail={() => {}}
              onSaveEdit={() => {}}
            />
          </div>
        )}

        {activeTab === 'instructors' && (
          <div className="program-detail-fullpage-modal__info-tab">
            <div className="program-detail-info-tab__section-header-row">
              <h3 className="program-detail-info-tab__section-title">강사 배정 현황</h3>
            </div>
            {instructors.length === 0 ? (
              <p className="school-detail-fullpage-view__placeholder">배정된 강사가 없습니다.</p>
            ) : (
              <ul className="school-detail-fullpage-view__instructor-list">
                {instructors.map(i => (
                  <li key={i.id}>
                    {i.role === 'lead' ? '[대표] ' : ''}
                    {i.instructorName} · {i.contact} · {i.email}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="program-detail-fullpage-modal__info-tab">
            <p className="school-detail-fullpage-view__placeholder">게시글 탭 (기존 모달 콘텐츠 재사용 예정)</p>
          </div>
        )}
      </div>
    </div>
  )
}

function SessionTableRow({ session }: { session: ParticipatingSchoolSession }) {
  const isNotPlanned = session.status === 'not_planned' || !session.date
  const datePart = `${session.date.replace(/\./g, '. ')}(${session.dayOfWeek})`
  const durationFormat = `${session.duration} (${session.format})`
  const periodTime = `${session.classNum} (${session.timeRange.replace('~', ' ~ ')})`
  const statusLabel = session.status ? SESSION_STATUS_LABELS[session.status] ?? session.status : '미진행 희망'
  const statusClass =
    session.status === 'completed'
      ? 'school-detail-fullpage-view__session-status--completed'
      : session.status === 'pending'
        ? 'school-detail-fullpage-view__session-status--pending'
        : 'school-detail-fullpage-view__session-status--not_planned'

  const contentCell =
    isNotPlanned ? (
      '미진행 희망'
    ) : (
      withTdDivider([
        datePart,
        durationFormat,
        periodTime,
        <span key="status" className={`school-detail-fullpage-view__session-status ${statusClass}`}>
          {statusLabel}
        </span>,
      ])
    )

  return (
    <tr>
      <th>{session.round}차시 강의</th>
      <td>{contentCell}</td>
    </tr>
  )
}
