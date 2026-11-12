import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { InstructorAssignmentPanel } from '../src/features/mypage/education/schedules/ui/instructor-assignment-panel'
import { EducationSessionCardHeader } from '../src/features/mypage/education/shared/ui/session-card-header'
import { formatLectureReportCardTimeSubtitle } from '../src/features/mypage/education/schedules/lib/instructor-education-schedule-display'
import { mapLectureReportAssignmentToInstructorItem } from '../src/features/mypage/education/schedules/api/instructor-assignment-client'
import type { InstructorAssignmentItem } from '../src/features/mypage/education/schedules/api/instructor-assignment-client'
import type { LectureReportAssignment } from '../src/features/mypage/education/schedules/api/lecture-report-client'

function assignment(
  partial: Partial<InstructorAssignmentItem> & Pick<InstructorAssignmentItem, 'assignmentId' | 'scheduleId'>,
): InstructorAssignmentItem {
  return {
    organizationApplicationId: null,
    institutionName: null,
    grade: null,
    requestedGrade: null,
    instructorRole: 'LEAD',
    institutionAddress: null,
    scheduleLocation: '서울',
    startAt: null,
    endAt: null,
    sessionNo: null,
    scheduleName: null,
    distanceKm: 1.2,
    distanceStatus: 'CALCULATED',
    ...partial,
  }
}

describe('InstructorAssignmentPanel 회차·차시·사전교육', () => {
  it('CASE 1: 사전교육과 본교육 2회차를 같은 의미로 표시하고 No.는 테이블 번호다', () => {
    const html = renderToStaticMarkup(
      <InstructorAssignmentPanel
        individual
        assignedItems={[
          assignment({
            assignmentId: 3,
            scheduleId: 30,
            instructorRole: 'ASSISTANT',
            startAt: '2026-11-06T06:00:00.000Z',
            endAt: '2026-11-06T06:10:00.000Z',
            sessionNo: null,
            scheduleRole: 'PRE_EDUCATION',
          }),
          assignment({
            assignmentId: 2,
            scheduleId: 20,
            startAt: '2026-11-06T06:05:00.000Z',
            endAt: '2026-11-06T06:10:00.000Z',
            sessionNo: 1,
            curriculumSessionCount: 2,
          }),
          assignment({
            assignmentId: 1,
            scheduleId: 10,
            startAt: '2026-11-06T06:15:00.000Z',
            endAt: '2026-11-06T06:20:00.000Z',
            sessionNo: 2,
            curriculumSessionCount: 2,
          }),
        ]}
      />,
    )
    expect(html).toContain('담당 교육 진행 일정')
    expect(html).toContain('2026년 11월 6일(금) 15:00 ~ 15:10 사전교육')
    expect(html).toContain('2026년 11월 6일(금) 15:05 ~ 15:10 1회차 (2차시)')
    expect(html).toContain('2026년 11월 6일(금) 15:15 ~ 15:20 2회차 (2차시)')
    expect(html).not.toContain('| 1차시')
    expect(html).not.toContain('| 2차시')
    expect(html).toContain('<td>3</td>')
    expect(html).toContain('<td>2</td>')
    expect(html).toContain('<td>1</td>')
  })

  it('CASE 4: 차시가 없으면 회차만 표시한다', () => {
    const html = renderToStaticMarkup(
      <InstructorAssignmentPanel
        individual
        assignedItems={[
          assignment({
            assignmentId: 1,
            scheduleId: 10,
            startAt: '2026-11-06T06:15:00.000Z',
            endAt: '2026-11-06T06:20:00.000Z',
            sessionNo: 2,
          }),
        ]}
      />,
    )
    expect(html).toContain('2026년 11월 6일(금) 15:15 ~ 15:20 2회차')
    expect(html).not.toContain('2회차 (2차시)')
  })

  it('CASE 5: sessionNo=null만으로 사전교육을 만들지 않는다', () => {
    const html = renderToStaticMarkup(
      <InstructorAssignmentPanel
        individual
        assignedItems={[
          assignment({
            assignmentId: 1,
            scheduleId: 10,
            startAt: '2026-11-06T06:00:00.000Z',
            endAt: '2026-11-06T06:10:00.000Z',
            sessionNo: null,
          }),
        ]}
      />,
    )
    expect(html).toContain('2026년 11월 6일(금) 15:00 ~ 15:10')
    expect(html).not.toContain('사전교육')
  })
})

describe('강의보고서 카드 자막 렌더', () => {
  it('시간과 교육 단위를 분리하고 같은 assignment 의미를 쓴다', () => {
    const rows: Array<
      Pick<
        LectureReportAssignment,
        'sessionNo' | 'scheduleRole' | 'curriculumSessionCount' | 'startAt' | 'endAt'
      > & { timeRange: string }
    > = [
      {
        timeRange: '15:00~15:10',
        scheduleRole: 'PRE_EDUCATION',
        sessionNo: null,
        curriculumSessionCount: null,
        startAt: '2026-11-06T06:00:00.000Z',
        endAt: '2026-11-06T06:10:00.000Z',
      },
      {
        timeRange: '15:05~15:10',
        scheduleRole: null,
        sessionNo: 1,
        curriculumSessionCount: 2,
        startAt: '2026-11-06T06:05:00.000Z',
        endAt: '2026-11-06T06:10:00.000Z',
      },
      {
        timeRange: '15:15~15:20',
        scheduleRole: null,
        sessionNo: 2,
        curriculumSessionCount: 2,
        startAt: '2026-11-06T06:15:00.000Z',
        endAt: '2026-11-06T06:20:00.000Z',
      },
    ]
    const html = rows
      .map(row =>
        renderToStaticMarkup(
          <EducationSessionCardHeader
            badge={<span>진행 완료</span>}
            date="2026.11.06"
            subtitle={<span>{formatLectureReportCardTimeSubtitle(row)}</span>}
          />,
        ),
      )
      .join('')
    expect(html).toContain('15:00~15:10 사전교육')
    expect(html).toContain('15:05~15:10 2차시')
    expect(html).toContain('15:15~15:20 2차시')
    expect(html).not.toContain('| 1회차')
    expect(html).not.toContain('1차시')
  })
})

describe('CASE 8 assignmentId 매핑 정합', () => {
  it('강의보고서 배정을 배정 현황 행으로 옮겨도 회차·차시 필드가 유지된다', () => {
    const mapped = mapLectureReportAssignmentToInstructorItem({
      assignmentId: 99,
      instructorApplicationId: null,
      programId: 1,
      scheduleId: 10,
      startAt: '2026-11-06T06:05:00.000Z',
      endAt: '2026-11-06T06:10:00.000Z',
      scheduleName: null,
      sessionNo: 1,
      scheduleRole: 'EDUCATION',
      educationSlotKey: 'general-common-line:1',
      curriculumSessionCount: 2,
      institutionName: null,
      grade: null,
      lectureStatus: 'COMPLETED',
      reportStatus: 'AVAILABLE',
      submitDueAt: null,
      canSubmit: true,
      reportId: null,
    })
    expect(mapped.assignmentId).toBe(99)
    expect(mapped.sessionNo).toBe(1)
    expect(mapped.scheduleRole).toBe('EDUCATION')
    expect(mapped.educationSlotKey).toBe('general-common-line:1')
    expect(mapped.curriculumSessionCount).toBe(2)
  })
})
