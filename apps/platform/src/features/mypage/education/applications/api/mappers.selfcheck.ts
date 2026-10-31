import assert from 'node:assert/strict'
import {
  mapApplicationRecruitmentStatus,
  mapTeacherAssignedInstructors,
  mapPortalProgramApplicationDetail,
  mapPortalProgramApplicationListItem,
} from './mappers.ts'

const generalOrganization = mapPortalProgramApplicationListItem({
  applicationId: 1,
  applicationType: 'ORGANIZATION',
  programId: 100,
  programType: 'GENERAL_ORGANIZATION',
  programGroup: 'GENERAL',
  programTitle: '일반 기관 프로그램',
  displayStatus: '진행 중',
})
assert.ok(generalOrganization)
assert.equal(generalOrganization.categoryLabel, '기관')

const generalYouth = mapPortalProgramApplicationListItem({
  applicationId: 2,
  applicationType: 'INDIVIDUAL',
  programId: 101,
  programType: 'GENERAL_INDIVIDUAL',
  programGroup: 'GENERAL',
  programTitle: '일반 청소년 프로그램',
  displayStatus: '진행 중',
})
assert.ok(generalYouth)
assert.equal(generalYouth.categoryLabel, '청소년 · 청년')

const ujatVolunteer = mapPortalProgramApplicationListItem({
  applicationId: 3,
  applicationType: 'VOLUNTEER',
  programId: 102,
  programType: 'UJAT',
  programGroup: 'UJAT',
  programTitle: 'UJAT 봉사 프로그램',
  displayStatus: '진행 중',
})
assert.ok(ujatVolunteer)
assert.equal(ujatVolunteer.categoryLabel, '청소년 · 청년')

const companySchool = mapPortalProgramApplicationListItem({
  applicationId: 4,
  applicationType: 'ORGANIZATION',
  programId: 103,
  programType: 'COMPANY_SCHOOL',
  programGroup: 'ONE_COMPANY_ONE_SCHOOL',
  portalCategories: ['ORGANIZATION'],
  programTitle: '1사1교 프로그램',
  displayStatus: '진행 중',
})
assert.ok(companySchool)
assert.equal(companySchool.categoryLabel, '기관')

const mixedCategories = mapPortalProgramApplicationListItem({
  applicationId: 5,
  applicationType: 'VOLUNTEER',
  programId: 104,
  programType: 'GENERAL_INDIVIDUAL',
  programGroup: 'GENERAL',
  portalCategories: ['ORGANIZATION', 'YOUTH_YOUNG'],
  programTitle: '복수 카테고리 프로그램',
  displayStatus: '진행 중',
})
assert.ok(mixedCategories)
assert.equal(mixedCategories.categoryLabel, '기관 · 청소년 · 청년')

const mapped = mapPortalProgramApplicationDetail({
  applicationId: 1691620,
  applicationType: 'VOLUNTEER',
  programId: 186290,
  recruitmentId: 186674,
  programTitle: '신청 상세 API 제목',
  programGroup: 'UJAT',
  applicationStatus: 'SUBMITTED',
  displayStatus: '승인대기',
  program: {
    programId: 999999,
    title: '다른 nested 프로그램 제목',
    programGroup: 'GENERAL',
  },
})

assert.ok(mapped)
assert.equal(mapped.id, '1691620')
assert.equal(mapped.applicationType, 'VOLUNTEER')
assert.equal(mapped.programId, '186290')
assert.equal(mapped.recruitmentId, 186674)
assert.equal(mapped.title, '신청 상세 API 제목')
assert.equal(mapped.detailCase, 'ujat-volunteer')
assert.equal(mapped.ujatPortalBannerState, undefined)
assert.equal(mapped.ujatVolunteerApplicationContent, undefined)

const mappedVolunteerAnswers = mapPortalProgramApplicationDetail({
  applicationId: 1691621,
  applicationType: 'VOLUNTEER',
  programId: 186290,
  programTitle: 'UJAT 봉사자 신청 내용',
  programGroup: 'UJAT',
  applicationStatus: 'SUBMITTED',
  displayStatus: '승인대기',
  answers: {
    'ujatVolunteerApplication.preferredRegion': '서울',
    'ujatVolunteerApplication.universityName': '한국대학교',
    'ujatVolunteerApplication.grade': '2',
    'ujatVolunteerApplication.major': '경영학',
    'ujatVolunteerApplication.hasExperience': 'yes',
    'ujatVolunteerApplication.applicationRoute': 'instagram',
  },
})
assert.ok(mappedVolunteerAnswers)
assert.deepEqual(mappedVolunteerAnswers.ujatVolunteerApplicationContent, {
  preferredRegion: '서울',
  universityName: '한국대학교',
  gradeLabel: '2학년',
  major: '경영학',
  educationExperienceLabel: '있음',
  applicationRouteLabel: '인스타그램',
  previousTermLabel: '',
  interviewScheduleLabel: '',
})

const teacherOrganization = mapPortalProgramApplicationDetail({
  applicationId: 1691483,
  applicationType: 'ORGANIZATION',
  programId: 186310,
  programTitle: '교사 ORGANIZATION 신청',
  programGroup: 'GENERAL',
  applicationStatus: 'APPROVED',
  displayStatus: '진행 중',
  teacherAssignment: {
    textbook: {
      textbookId: 12345,
      title: '교육 교재',
      kitCount: 1,
      volumeCount: 1,
      kitCountLabel: '1키트',
      volumeCountLabel: '1권',
      deliveryStatus: 'PREPARING',
    },
  },
})
assert.ok(teacherOrganization?.teacherAssignment)
assert.deepEqual(teacherOrganization.teacherAssignment?.textbook, {
  title: '교육 교재',
  kitCountLabel: '1키트',
  volumeCountLabel: '1권',
  deliveryStatus: 'before',
})

const volunteerTeacherAssignment = mapPortalProgramApplicationDetail({
  applicationId: 1691622,
  applicationType: 'VOLUNTEER',
  programId: 186310,
  programTitle: '봉사 신청',
  programGroup: 'UJAT',
  applicationStatus: 'APPROVED',
  teacherAssignment: {
    textbook: {
      textbookId: 12345,
      title: '잘못 연결된 교재',
      deliveryStatus: 'DELIVERED',
    },
  },
})
assert.equal(volunteerTeacherAssignment?.teacherAssignment, undefined)

const individualCaseD = mapPortalProgramApplicationDetail({
  applicationId: 1694691,
  applicationType: 'INDIVIDUAL',
  programId: 186339,
  programTitle: '개인 참여 신청',
  applicationStatus: 'APPROVED',
  teacherAssignment: {
    textbook: null,
    sourceApplicationType: 'INSTRUCTOR',
    sourceApplicationId: 1694773,
    assignments: [
      {
        assignmentId: 1694860,
        instructorMemberId: 190001,
        instructorName: '이건희',
        programId: 186339,
        programScheduleId: 187274,
        assignmentStatus: 'ASSIGNED',
      },
      {
        assignmentId: 1694861,
        instructorMemberId: 190001,
        instructorName: '이건희',
        programId: 186339,
        programScheduleId: 187310,
        assignmentStatus: 'COMPLETED',
      },
    ],
  },
})
assert.deepEqual(individualCaseD?.teacherAssignment?.instructors, [
  {
    id: '190001',
    instructorMemberId: 190001,
    name: '이건희',
  },
])

assert.deepEqual(
  mapTeacherAssignedInstructors([
    {
      assignmentId: 1694860,
      instructorMemberId: 190001,
      instructorName: '이건희',
      programScheduleId: 187274,
      assignmentStatus: 'ASSIGNED',
    },
    {
      assignmentId: 1694861,
      instructorMemberId: 190001,
      instructorName: '이건희',
      programScheduleId: 187310,
      assignmentStatus: 'COMPLETED',
    },
    {
      assignmentId: 1694862,
      instructorMemberId: 190002,
      instructorName: '김땡땡',
      programScheduleId: 187311,
      assignmentStatus: 'ASSIGNED',
    },
    {
      assignmentId: 1694863,
      instructorMemberId: 190003,
      instructorName: '박땡땡',
      programScheduleId: 187312,
      assignmentStatus: 'COMPLETED',
    },
  ]),
  [
    { id: '190001', instructorMemberId: 190001, name: '이건희' },
    { id: '190002', instructorMemberId: 190002, name: '김땡땡' },
    { id: '190003', instructorMemberId: 190003, name: '박땡땡' },
  ],
)

const ujatOrg = mapPortalProgramApplicationDetail({
  applicationId: 1691621,
  applicationType: 'ORGANIZATION',
  programId: 186291,
  programTitle: 'UJAT 기관 신청',
  programGroup: 'UJAT',
  applicationStatus: 'SUBMITTED',
  displayStatus: '승인 대기',
  supplement: {
    ujat: {
      portalBannerState: 'ACTION_REQUIRED',
      assignmentRevision: 3,
      preferredEducationDateOptions: [
        { id: 'h1:2026-11-06', date: '2026-11-06', label: '2026년 11월 6일(금)' },
        { id: 'h2:2026-11-13', date: '2026-11-13', label: '2026년 11월 13일(금)' },
      ],
      temporarySchedule: {
        slots: [
          {
            scheduleId: 87611,
            scheduleStartAt: '2027-03-12T10:00:00+09:00',
            grade: '1',
            className: '1반',
            studentCount: 28,
            assignmentStatus: 'TEMPORARY',
          },
        ],
      },
    },
  },
})
assert.ok(ujatOrg)
assert.equal(ujatOrg.detailCase, 'ujat-participant')
assert.equal(ujatOrg.ujatPortalBannerState, 'ACTION_REQUIRED')
assert.equal(ujatOrg.ujatAssignmentRevision, 3)
assert.equal(ujatOrg.ujatRevisionReason, undefined)
assert.deepEqual(ujatOrg.ujatPreferredEducationDateOptions, [
  { id: 'h1:2026-11-06', date: '2026-11-06', label: '2026년 11월 6일(금)' },
  { id: 'h2:2026-11-13', date: '2026-11-13', label: '2026년 11월 13일(금)' },
])
assert.deepEqual(ujatOrg.ujatTemporarySchedule, {
  slots: [
    {
      scheduleId: 87611,
      scheduleStartAt: '2027-03-12T10:00:00+09:00',
      grade: '1',
      className: '1반',
      studentCount: 28,
      assignmentStatus: 'TEMPORARY',
    },
  ],
})

const ujatRevision = mapPortalProgramApplicationDetail({
  applicationId: 1691622,
  applicationType: 'ORGANIZATION',
  programId: 186292,
  programTitle: 'UJAT 기관 수정요청',
  programGroup: 'UJAT',
  applicationStatus: 'SUBMITTED',
  displayStatus: '진행 중',
  supplement: {
    ujat: {
      portalBannerState: 'REVISION_REQUIRED',
      revisionReason: '기간에 대한 협의가 필요합니다.',
    },
  },
})
assert.ok(ujatRevision)
assert.equal(ujatRevision.ujatPortalBannerState, 'REVISION_REQUIRED')
assert.equal(ujatRevision.ujatRevisionReason, '기간에 대한 협의가 필요합니다.')
assert.equal(ujatOrg.displayStatus, 'waiting_result')

const missingRootIdentity = mapPortalProgramApplicationDetail({
  applicationId: 1691620,
  applicationType: 'VOLUNTEER',
  recruitmentId: 186674,
  applicationStatus: 'SUBMITTED',
  program: {
    programId: 186290,
    title: 'nested fallback 금지',
    programGroup: 'UJAT',
  },
})
assert.equal(missingRootIdentity, null)

const missingRootTitle = mapPortalProgramApplicationDetail({
  applicationId: 1691620,
  applicationType: 'VOLUNTEER',
  programId: 186290,
  recruitmentId: 186674,
  programGroup: 'UJAT',
  applicationStatus: 'SUBMITTED',
  program: { title: 'nested title fallback 금지' },
})
assert.equal(missingRootTitle, null)

// 모집 배지는 신청 상태가 아니라 모집기간 기준
{
  const day = (offset: number) => {
    const d = new Date()
    d.setDate(d.getDate() + offset)
    return d.toISOString()
  }
  assert.equal(
    mapApplicationRecruitmentStatus({
      recruitmentStartAt: day(-1),
      recruitmentEndAt: day(20),
      displayStatus: 'completed' as never,
    }),
    'recruiting'
  )
  assert.equal(
    mapApplicationRecruitmentStatus({
      recruitmentStartAt: day(3),
      recruitmentEndAt: day(20),
      displayStatus: 'in_progress' as never,
    }),
    'scheduled'
  )
  assert.equal(
    mapApplicationRecruitmentStatus({
      recruitmentStartAt: day(-20),
      recruitmentEndAt: day(-2),
      displayStatus: 'in_progress' as never,
    }),
    'closed'
  )
  assert.equal(
    mapApplicationRecruitmentStatus({ displayStatus: 'in_progress' as never }),
    'recruiting'
  )
}

const geminiOrgNameFromOrganizationApplication = mapPortalProgramApplicationDetail({
  applicationId: 1691535,
  applicationType: 'ORGANIZATION',
  programId: 186425,
  programType: 'GEMINI_TRAINING',
  programGroup: 'SEMINAR',
  programTitle: '이건희',
  displayStatus: '신청 반려',
  answers: {
    'gemini-vt-inst-seed-contact': { jobTitle: '13131', subject: '1532153' },
    'gemini-vt-inst-seed-training-info': {
      organizationRegion: '서울특별시 중구 세종대로 110',
      regionLabel: '서울특별시 중구 세종대로 110',
      studentCount: 15,
    },
  },
  organizationApplication: {
    organizationName: 'QA 제휴학교',
    institutionAddress: '서울특별시 중구 세종대로 110',
    institutionAddressDetail: null,
    requestedGrade: null,
    teacherPosition: null,
  },
})
assert.ok(geminiOrgNameFromOrganizationApplication)
assert.equal(
  geminiOrgNameFromOrganizationApplication.teacherApplicationContent?.institution.name,
  'QA 제휴학교',
)
assert.equal(
  geminiOrgNameFromOrganizationApplication.teacherApplicationContent?.institution.studentCount,
  '15명',
)
assert.equal(
  geminiOrgNameFromOrganizationApplication.teacherApplicationContent?.institution.jobTitle,
  '13131',
)
assert.equal(
  geminiOrgNameFromOrganizationApplication.teacherApplicationContent?.institution.subject,
  '1532153',
)
assert.equal(
  geminiOrgNameFromOrganizationApplication.teacherApplicationContent?.institution.address,
  '서울특별시 중구 세종대로 110',
)
assert.equal(
  geminiOrgNameFromOrganizationApplication.teacherApplicationContent?.institution.grade,
  '',
)

console.log('portal application mappers.selfcheck: ok')
