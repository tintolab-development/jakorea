import { describe, expect, it } from 'vitest'
import {
  buildLectureReportFilledDraft,
  buildLectureReportPreviewFileName,
  type LectureReportPreviewContext,
} from './build-lecture-report-issuance-preview'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type { Program } from '@/types/domain'

function createContext(
  content?: LectureReportPreviewContext['content'],
  overrides: Partial<LectureReportPreviewContext> = {}
): LectureReportPreviewContext {
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
    hideInstitutionFields: false,
    content,
    ...overrides,
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

  it('보기 화면에 강사 정보를 넣고 항목 타이틀 필수 표시를 끈다', () => {
    const draft = buildLectureReportFilledDraft(createContext())
    const instructor = draft.paragraphs.find(
      paragraph =>
        paragraph.kind === 'single_item' &&
        paragraph.variant === 'user_info' &&
        paragraph.paragraphTitle === '강사 정보'
    )
    expect(instructor).toMatchObject({
      requiredMark: false,
      fieldAnswers: { name: '김제이' },
    })
    expect(
      draft.paragraphs.some(
        paragraph =>
          paragraph.kind === 'single_item' &&
          (paragraph.requiredMark === true || paragraph.answerRequired === true)
      )
    ).toBe(false)
  })

  it('제출 양식에 있는 진행 정보 값은 빈 배정 필드로 지우지 않는다', () => {
    const draft = buildLectureReportFilledDraft(
      createContext(undefined, {
        hideInstitutionFields: true,
        content: {
          form: {
            schemaVersion: 1,
            formSettings: { titleNumbering: 'none' },
            paragraphs: [
              {
                id: 'lecture-report-program-progress',
                kind: 'single_item',
                variant: 'lecture_report_program_progress',
                requiredMark: true,
                paragraphTitle: '프로그램 진행 정보',
                paragraphDescription: '',
                participatesInTitleNumbering: true,
                answerRequired: true,
                programName: '정산(개인/봉사자/강사)',
                textbookName: '교재명',
                progressUnit: '12',
                institutionName: '',
                institutionLocation: '',
                educationDate: '2026-11-06',
                sessionTime: '10:00 ~ 11:00',
                sessionIndex: '1차시',
                educationTarget: '중등',
                classLabel: '2반',
                studentCount: '30',
              },
            ],
          },
        },
        row: {
          id: 'report-1',
          no: 1,
          schoolName: '-',
          educationGrade: '중등',
          educationScheduleLabel: '2026.11.06(금)',
        },
      })
    )
    const progress = draft.paragraphs.find(
      paragraph => paragraph.kind === 'single_item' && paragraph.variant === 'lecture_report_program_progress'
    )
    expect(progress).toMatchObject({
      programName: '정산(개인/봉사자/강사)',
      textbookName: '교재명',
      progressUnit: '12',
      sessionTime: '10:00 ~ 11:00',
      sessionIndex: '1차시',
      educationTarget: '중등',
      classLabel: '2반',
      studentCount: '30',
      institutionName: '',
    })
  })
})

describe('buildLectureReportPreviewFileName', () => {
  it('제출일(submittedAt)을 Asia/Seoul 날짜로 쓴다', () => {
    expect(
      buildLectureReportPreviewFileName(createContext({ submittedAt: '2026-11-09T16:30:00Z' }))
    ).toBe('[JA Korea] 강의보고서_김제이_261110')
  })

  it('제출일이 없거나 잘못되면 대체 날짜(기본 오늘)를 쓴다', () => {
    const fallback = new Date('2026-06-05T12:00:00+09:00')
    expect(buildLectureReportPreviewFileName(createContext({ submittedAt: null }), fallback)).toBe(
      '[JA Korea] 강의보고서_김제이_260605'
    )
    expect(buildLectureReportPreviewFileName(createContext({ submittedAt: 'x' }), fallback)).toBe(
      '[JA Korea] 강의보고서_김제이_260605'
    )
  })
})
