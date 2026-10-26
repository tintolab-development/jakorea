import { describe, expect, it } from 'vitest'
import {
  buildLectureReportFilledDraft,
  type LectureReportPreviewContext,
} from './build-lecture-report-issuance-preview'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type { Program } from '@/types/domain'

function createContext(content?: LectureReportPreviewContext['content']): LectureReportPreviewContext {
  return {
    instructor: {
      id: 'instructor-1',
      no: 1,
      instructorName: '김제이',
    } as ParticipatingInstructorRow,
    program: {
      title: '한국씨티은행-JA Korea 특별한 JOB담',
      textbookName: '우리들의 경제생활',
    } as Program,
    row: {
      id: 'report-1',
      no: 1,
      schoolName: '제이초등학교',
      educationGrade: '초등학교 3학년',
      educationScheduleLabel: '2026.09.15 | 1회차 | 10:00-11:00',
    },
    content,
  }
}

describe('buildLectureReportFilledDraft', () => {
  it('실제 응답 객체와 파일 ID를 컨텍스트로 보존하고 예시 답변을 만들지 않는다', () => {
    const draft = buildLectureReportFilledDraft(
      createContext({
        formResponseId: 901,
        templateVersionId: 148,
        answers: {
          'lecture-report-program-progress': {
            programName: '응답 프로그램명',
            textbookName: '응답 교재',
            progressUnit: '3단원',
            institutionName: '응답 기관명',
            institutionLocation: '서울',
            educationDate: '2026-09-15',
            sessionTime: '10:00-11:00',
            sessionIndex: '1차시',
            educationTarget: '초등학교 3학년',
            classLabel: '2반',
            studentCount: '20명',
          },
          'lecture-report-education-content': {
            bodyText: '',
            items: [{ id: 'lecture-report-education-content-item-1', bodyText: '실제 답변' }],
          },
        },
        files: [{ fileObjectId: 7001 }, { fileObjectId: 7002 }],
      })
    )

    const progress = draft.paragraphs.find(
      paragraph => paragraph.kind === 'single_item' && paragraph.variant === 'lecture_report_program_progress'
    )
    expect(progress).toMatchObject({
      programName: '응답 프로그램명',
      progressUnit: '3단원',
      studentCount: '20명',
    })

    const content = draft.paragraphs.find(paragraph => paragraph.id === 'lecture-report-education-content')
    expect(
      content?.kind === 'single_item' && 'items' in content
        ? content.items?.find(item => item.id === 'lecture-report-education-content-item-1')
        : undefined
    ).toMatchObject({ bodyText: '실제 답변' })

    expect(JSON.stringify(draft)).not.toContain('경제의 기본 개념인 수요와 공급')
  })
})
