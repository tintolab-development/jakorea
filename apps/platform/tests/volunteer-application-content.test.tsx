import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { mapPortalProgramDetail } from '../src/features/program/api/mappers'
import type { PortalProgramDetail } from '../src/features/program/api/types'
import { resolveApplicationContentFromAnswers } from '../src/features/mypage/education/applications/lib/application-content-from-answers'
import { resolveMypagePreferredScheduleLines } from '../src/features/mypage/education/applications/lib/mypage-preferred-schedule-lines'
import {
  groupScheduleLinesByDate,
  resolveVolunteerApplicationExtrasFromAnswers,
} from '../src/features/mypage/education/applications/lib/volunteer-application-extras-from-answers'
import { EducationApplicationContent } from '../src/features/mypage/education/applications/ui/content'

/** GET /api/portal/programs/186486 (일정형 GENERAL_INDIVIDUAL) — 일정 관련 필드만 발췌 */
const PROGRAM_186486 = {
  "programId": 186486,
  "programType": "GENERAL_INDIVIDUAL",
  "title": "[BOT-TEST] 봉사 신청 내용 fixture",
  "educationStructure": "schedule",
  "sessionRound": "single",
  "educationScheduleMode": "date",
  "educationScheduleLines": [
    "26년 11월 16일(월) 13:30 ~ 15:30",
    "26년 11월 16일(월) 09:30 ~ 11:30",
    "26년 10월 30일(금) 13:30 ~ 15:30",
    "26년 10월 30일(금) 09:30 ~ 11:30",
    "26년 10월 31일(토) 13:30 ~ 15:30",
    "26년 10월 31일(토) 09:30 ~ 11:30"
  ],
  "scheduleDetails": [
    {
      "scheduleLabel": "사전 교육",
      "blockKind": "preEducation",
      "name": "사전 교육",
      "scheduleDateLabel": "2026.10.30(금) 12:00 ~ 13:08",
      "assignmentEnabled": false,
      "educationFormLabel": "온라인"
    },
    {
      "scheduleLabel": "세부 일정 01",
      "blockKind": "sub",
      "name": "필요와 욕구, 현명한 소비",
      "scheduleDateLabel": "2026.11.16(월) 10:00 ~ 12:00",
      "progressTimeSummary": "그룹 A : 13:30 ~ 15:30 | 그룹 B : 09:30 ~ 11:30",
      "groupTimes": [
        {
          "startTime": "13:30",
          "endTime": "15:30"
        },
        {
          "startTime": "09:30",
          "endTime": "11:30"
        }
      ],
      "assignmentEnabled": false
    }
  ],
  "schedules": [
    {
      "scheduleId": 187543,
      "sessionNo": 4,
      "scheduleName": "공통 교육 예정 4",
      "startAt": "2026-10-30T00:30:00Z",
      "endAt": "2026-10-30T02:30:00Z",
      "allDay": false,
      "locationName": "서울특별시 중구 세종대로 110",
      "address": "서울특별시 중구 세종대로 110",
      "addressDetail": null,
      "maxParticipantCount": null,
      "term": null,
      "scheduleKind": "EDUCATION",
      "publiclyVisible": null
    },
    {
      "scheduleId": 187542,
      "sessionNo": 3,
      "scheduleName": "공통 교육 예정 3",
      "startAt": "2026-10-30T04:30:00Z",
      "endAt": "2026-10-30T06:30:00Z",
      "allDay": false,
      "locationName": "서울특별시 중구 세종대로 110",
      "address": "서울특별시 중구 세종대로 110",
      "addressDetail": null,
      "maxParticipantCount": null,
      "term": null,
      "scheduleKind": "EDUCATION",
      "publiclyVisible": null
    },
    {
      "scheduleId": 187545,
      "sessionNo": 6,
      "scheduleName": "공통 교육 예정 6",
      "startAt": "2026-10-31T00:30:00Z",
      "endAt": "2026-10-31T02:30:00Z",
      "allDay": false,
      "locationName": "서울특별시 중구 세종대로 110",
      "address": "서울특별시 중구 세종대로 110",
      "addressDetail": null,
      "maxParticipantCount": null,
      "term": null,
      "scheduleKind": "EDUCATION",
      "publiclyVisible": null
    },
    {
      "scheduleId": 187544,
      "sessionNo": 5,
      "scheduleName": "공통 교육 예정 5",
      "startAt": "2026-10-31T04:30:00Z",
      "endAt": "2026-10-31T06:30:00Z",
      "allDay": false,
      "locationName": "서울특별시 중구 세종대로 110",
      "address": "서울특별시 중구 세종대로 110",
      "addressDetail": null,
      "maxParticipantCount": null,
      "term": null,
      "scheduleKind": "EDUCATION",
      "publiclyVisible": null
    },
    {
      "scheduleId": 187541,
      "sessionNo": 2,
      "scheduleName": "공통 교육 예정 2",
      "startAt": "2026-11-16T00:30:00Z",
      "endAt": "2026-11-16T02:30:00Z",
      "allDay": false,
      "locationName": "서울특별시 중구 세종대로 110",
      "address": "서울특별시 중구 세종대로 110",
      "addressDetail": null,
      "maxParticipantCount": null,
      "term": null,
      "scheduleKind": "EDUCATION",
      "publiclyVisible": null
    },
    {
      "scheduleId": 187540,
      "sessionNo": 1,
      "scheduleName": "공통 교육 예정 1",
      "startAt": "2026-11-16T04:30:00Z",
      "endAt": "2026-11-16T06:30:00Z",
      "allDay": false,
      "locationName": "서울특별시 중구 세종대로 110",
      "address": "서울특별시 중구 세종대로 110",
      "addressDetail": null,
      "maxParticipantCount": null,
      "term": null,
      "scheduleKind": "EDUCATION",
      "publiclyVisible": null
    }
  ],
  "recruitments": []
} as unknown as PortalProgramDetail

/** 신청 1691643 answers (자유 작성 본문은 테스트 값) */
const ANSWERS_1691643: Record<string, unknown> = {
  'program-volunteer-application-seed-personal-info': { bottomConsent: 'agree' },
  'program-volunteer-application-seed-third-party': { bottomConsent: 'agree' },
  'program-volunteer-application-seed-ja-experience': 'program-volunteer-application-ja-experience-yes',
  'program-volunteer-application-seed-previous-ja-program': {
    applicationYear: '2019',
    programName: 'kdkdkdkdkdkdk',
  },
  'program-volunteer-application-seed-free-text-items': {
    items: [
      { id: 'intro', label: '1. 자기소개 및 지원동기를 자유롭게 작성해 주세요.', bodyText: 'ddd' },
      {
        id: 'educationExperience',
        label: '2. 교육봉사, 강사 아르바이트 등 교육 진행 경험을 간략히 적어 주세요.',
        bodyText: 'sdsdsd',
      },
      {
        id: 'necessity',
        label: '3. 초등학생 대상 경제 교육의 필요성에 대해 본인의 생각을 자유롭게 작성해 주세요.',
        bodyText: 'sdsddssd',
      },
      { id: 'jaExperience', bodyText: 'sdsdsdsd' },
    ],
  },
  'program-volunteer-application-seed-activity-schedule': [
    'schedule:187542',
    'schedule:187545',
    'schedule:187544',
  ],
  preferredScheduleBlocks: [],
}

function resolveLines(answers: Record<string, unknown>) {
  const program = mapPortalProgramDetail(PROGRAM_186486)
  expect(program).not.toBeNull()
  const content = resolveApplicationContentFromAnswers(answers)
  return resolveMypagePreferredScheduleLines({
    applicationType: 'VOLUNTEER',
    answers,
    preferredEducationScheduleLabel: content.preferredEducationScheduleLabel,
    preferredScheduleOptionValues: content.preferredScheduleOptionValues,
    program: program!,
  })
}

describe('봉사현황 신청 내용 — 신청 1691643', () => {
  it('일정형 프로그램도 schedule:{id}를 Portal schedules[]로 해석한다 (서버 제출 순서 유지)', () => {
    const lines = resolveLines(ANSWERS_1691643)
    expect(lines).toHaveLength(3)
    expect(lines[0]).toContain('10월 30일')
    expect(lines[0]).toContain('13:30')
    expect(lines[1]).toContain('10월 31일')
    expect(lines[1]).toContain('09:30')
    expect(lines[2]).toContain('10월 31일')
    expect(lines[2]).toContain('13:30')
    for (const line of lines) {
      expect(line).not.toMatch(/schedule:/)
      expect(line).not.toContain('공통 교육 예정')
    }
  })

  it('projected eventSchedules에는 scheduleId가 없고 scheduleOptionLookup은 서버 순서를 유지한다', () => {
    const program = mapPortalProgramDetail(PROGRAM_186486)!
    expect(program.eventSchedules.every(row => row.scheduleId == null)).toBe(true)
    expect(program.scheduleOptionLookup?.map(row => row.scheduleId)).toEqual(
      PROGRAM_186486.schedules?.map(row => row.scheduleId),
    )
  })

  it('자유 작성 4문항·JA 경험·이전 참여 프로그램을 모두 해석한다 (동의표 제외)', () => {
    const extras = resolveVolunteerApplicationExtrasFromAnswers(ANSWERS_1691643)
    expect(extras.freeTextSections.map(section => section.body)).toEqual([
      'ddd',
      'sdsdsd',
      'sdsddssd',
      'sdsdsdsd',
    ])
    // Figma 11005:340435 요약 라벨
    expect(extras.freeTextSections.map(section => section.title)).toEqual([
      '1. 자기소개 및 지원동기',
      '2. 교육봉사, 강사 아르바이트 등 교육 진행 경험',
      '3. 초등학생 대상 경제 교육의 필요성에 대해 본인의 생각을 자유롭게 작성',
      '4. 초·중·고 당시 학교에서 JA Korea 경제금융교육을 들은 경험 혹은 진행하는 프로그램에 지원하여 참여한 경험',
    ])
    expect(extras.infoFields).toEqual([
      { key: 'ja-experience', label: 'JA 봉사 프로그램 진행 경험 여부', value: '있음' },
      { key: 'previous-ja-program', label: '이전 참여 JA 봉사 프로그램', value: '2019년, kdkdkdkdkdkdk' },
    ])
  })

  it('JA 경험 「없음」이면 이전 참여 프로그램은 숨긴다', () => {
    const extras = resolveVolunteerApplicationExtrasFromAnswers({
      ...ANSWERS_1691643,
      'program-volunteer-application-seed-ja-experience': 'program-volunteer-application-ja-experience-no',
    })
    expect(extras.infoFields).toEqual([
      { key: 'ja-experience', label: 'JA 봉사 프로그램 진행 경험 여부', value: '없음' },
    ])
  })

  it('템플릿에서 문항 문구를 바꾼 경우 제출 label을 그대로 쓴다', () => {
    const extras = resolveVolunteerApplicationExtrasFromAnswers({
      'program-volunteer-application-seed-free-text-items': {
        items: [{ id: 'intro', label: '1. 커스텀 문항', bodyText: 'x' }],
      },
    })
    expect(extras.freeTextSections[0]?.title).toBe('1. 커스텀 문항')
  })

  it('같은 날짜 시간대를 한 줄로 묶고 제출 순서를 유지한다', () => {
    expect(groupScheduleLinesByDate(resolveLines(ANSWERS_1691643))).toEqual([
      '2026년 10월 30일(금), 13:30 ~ 15:30',
      '2026년 10월 31일(토), 09:30 ~ 11:30, 13:30 ~ 15:30',
    ])
    expect(groupScheduleLinesByDate(['2026년 4월 20일(월) 09:30 ~ 12:20 | 강서초등학교'])).toEqual([
      '2026년 4월 20일(월) 09:30 ~ 12:20 | 강서초등학교',
    ])
  })

  it('신청 내용 탭 렌더 (Figma 11005:340435) — 라벨/값 블록 → 자유 작성 4문항 → 일정 단일 카드', () => {
    const extras = resolveVolunteerApplicationExtrasFromAnswers(ANSWERS_1691643)
    const html = renderToStaticMarkup(
      <EducationApplicationContent
        selfIntroMotivation="ddd"
        preferredEducationScheduleLines={groupScheduleLinesByDate(resolveLines(ANSWERS_1691643))}
        alwaysShowPreferredSchedule
        scheduleSummaryTitle="봉사 진행 가능 일정"
        freeTextSections={extras.freeTextSections}
        infoFields={extras.infoFields}
      />,
    )
    const order = [
      'JA 봉사 프로그램 진행 경험 여부',
      '있음',
      '이전 참여 JA 봉사 프로그램',
      '2019년, kdkdkdkdkdkdk',
      '1. 자기소개 및 지원동기',
      'ddd',
      'sdsdsd',
      'sdsddssd',
      'sdsdsdsd',
      '봉사 진행 가능 일정',
      '2026년 10월 30일(금), 13:30 ~ 15:30',
      '2026년 10월 31일(토), 09:30 ~ 11:30, 13:30 ~ 15:30',
    ]
    let cursor = -1
    for (const text of order) {
      const at = html.indexOf(text, cursor + 1)
      expect(at, text).toBeGreaterThan(cursor)
      cursor = at
    }
    expect(html).not.toContain('진행 희망 교육 일정')
    expect(html).not.toContain('<table')
    expect(html).not.toContain('개인정보')
  })

  it('일정 미해석 시에도 단일 카드에 「-」', () => {
    const html = renderToStaticMarkup(
      <EducationApplicationContent alwaysShowPreferredSchedule scheduleSummaryTitle="봉사 진행 가능 일정" />,
    )
    expect(html).toContain('봉사 진행 가능 일정')
    expect(html).toContain('>-<')
  })

  it('봉사 외 신청(자유 작성 없음)은 기존 「자기소개 및 지원동기」 단일 섹션 그대로', () => {
    const html = renderToStaticMarkup(
      <EducationApplicationContent selfIntroMotivation="안녕하세요" preferredEducationScheduleLines={['2026년 4월 20일(월) 09:30 ~ 12:20']} />,
    )
    expect(html).toContain('자기소개 및 지원동기')
    expect(html).toContain('안녕하세요')
    expect(html).toContain('진행 희망 교육 일정 1')
    expect(html).not.toContain('봉사 진행 가능 일정')
  })
})
