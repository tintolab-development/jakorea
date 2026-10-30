import { describe, expect, it } from 'vitest'
import { asOpenApiFixture } from '@/shared/test/openapi-fixture-cast'
import type { GeminiRecruitmentItem } from '@/shared/api/generated/dashboard/schemas/geminiRecruitmentItem'
import type { GeminiRecruitmentDetailResponse } from '@/shared/api/generated/dashboard/schemas/geminiRecruitmentDetailResponse'
import {
  buildGeminiRecruitmentPersistSnapshot,
  mapGeminiOrganizationApplicationToRow,
  mapGeminiRecruitmentDetailToDetail,
  mapGeminiRecruitmentDetailToUpdateRequest,
  mapGeminiRecruitmentItemToApprovedRow,
  mapGeminiRecruitmentItemToRow,
  mapGeminiRecruitmentSnapshotToCreateRequest,
  toGeminiNumericIds,
} from './adapters'
import {
  GEMINI_RECRUIT_FIELD_KEYS,
  pickGeminiRecruitFields,
  restoreGeminiRecruitForm,
  getGeminiRecruitFormRecord,
  resetGeminiRecruitForm,
} from '@/features/template/ui/form-set/recruit-form/gemini/gemini-recruit-form-rhf'
import {
  getGeneralRecruitOverlayRecord,
  patchGeneralRecruitOverlay,
  resetGeneralRecruitOverlay,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'

describe('gemini visiting-training adapters', () => {
  it('maps recruitment list item', () => {
    const row = mapGeminiRecruitmentItemToRow(
      asOpenApiFixture<GeminiRecruitmentItem>({
        programId: 12,
        programType: 'GEMINI_TRAINING',
        nameKo: '찾아가는 연수',
        businessStartDate: '2026-03-01',
        businessEndDate: '2026-03-31',
        applicationStartDate: '2026-03-01',
        applicationEndDate: '2026-03-31',
        trainingRequestStartDate: '2026-04-01',
        trainingRequestEndDate: '2026-04-30',
        draftStatus: 'DRAFT',
      }),
      0
    )
    expect(row.id).toBe('12')
    expect(row.title).toBe('찾아가는 연수')
    expect(row.isDraft).toBe(true)
    expect(row.applicationPeriodStart).toBe('2026-03-01')
    expect(row.applicationPeriodEnd).toBe('2026-03-31')
    expect(row.trainingRequestPeriodStart).toBe('2026-04-01')
    expect(row.trainingRequestPeriodEnd).toBe('2026-04-30')
    expect(row.organizationApplicationCount).toBe(0)
  })

  it('목록 GET은 모집기간을 business 기간으로 채우지 않는다', () => {
    const row = mapGeminiRecruitmentItemToRow(
      asOpenApiFixture<GeminiRecruitmentItem>({
        programId: 8,
        programType: 'GEMINI_TRAINING',
        nameKo: '',
        businessStartDate: '2026-01-01',
        businessEndDate: '2026-12-31',
        applicationStartDate: null,
        applicationEndDate: null,
        trainingRequestStartDate: null,
        trainingRequestEndDate: null,
      }),
      0
    )
    expect(row.title).toBe('-')
    expect(row.applicationPeriodStart).toBe('')
    expect(row.applicationPeriodEnd).toBe('')
    expect(row.trainingRequestPeriodStart).toBe('')
    expect(row.trainingRequestPeriodEnd).toBe('')
  })

  it('maps application counts used to block recruitment delete', () => {
    const row = mapGeminiRecruitmentItemToRow(
      {
        programId: 4,
        programType: 'GEMINI_TRAINING',
        nameKo: '신청 있는 공고',
        organizationApplicationCount: 2,
        approvedOrganizationApplicationCount: 1,
      },
      0
    )
    expect(row.organizationApplicationCount).toBe(2)
    expect(row.approvedOrganizationApplicationCount).toBe(1)
  })

  it('maps detail and organization application', () => {
    const detail = mapGeminiRecruitmentDetailToDetail({
      programId: 1,
      programCode: 'GEMINI_TRAINING-2026-01-01-000001',
      programType: 'GEMINI_TRAINING',
      draftStatus: 'PUBLISHED',
      periodStatus: 'SCHEDULED',
      nameKo: '연수 A',
      description: '설명',
      certificateDisabled: true,
      minimumParticipantCount: 20,
      businessStartDate: '2026-01-01',
      businessEndDate: '2026-02-01',
      applicationStartDate: '2026-01-01',
      applicationEndDate: '2026-02-01',
      trainingRequestStartDate: '2026-03-01',
      trainingRequestEndDate: '2026-04-01',
      targetLevels: ['adult'],
      recruitmentTargetDetail: '성인 학습자',
      educationForm: 'offline',
      contactName: 'JA Korea 연수팀',
      contactPhone: '02-1234-5678',
      contactEmail: 'gemini@jakorea.org',
      otherMatters: null,
      thumbnailFileName: null,
      recruitmentGuide: '홈페이지에서 신청',
      applicationMethod: '온라인 신청',
      learningSupportContent: '교재 제공',
      additionalContentHtml: '추가 HTML',
      attachmentFileNames: ['안내.pdf'],
      createdAt: '2026-09-30T04:02:00Z',
      createdByName: '관리자',
      updatedAt: '2026-09-30T05:00:00Z',
      updatedByName: null,
    })
    expect(detail.programDescription).toBe('설명')
    expect(detail.thumbnailFileName).toBeNull()
    expect(detail.minStudentCount).toBe(20)
    expect(detail.applicationPeriodStart).toBe('2026-01-01')
    expect(detail.applicationPeriodEnd).toBe('2026-02-01')
    expect(detail.trainingRequestPeriodStart).toBe('2026-03-01')
    expect(detail.trainingRequestPeriodEnd).toBe('2026-04-01')
    expect(detail.educationTargetLevels).toEqual(['adult'])
    expect(detail.educationTargetDetail).toBe('성인 학습자')
    expect(detail.educationForm).toBe('offline')
    expect(detail.educationStructure).toBeNull()
    expect(detail.inquiryContactName).toBe('JA Korea 연수팀')
    expect(detail.inquiryTel).toBe('02-1234-5678')
    expect(detail.inquiryEmail).toBe('gemini@jakorea.org')
    expect(detail.notesNotApplicable).toBe(true)
    expect(detail.notes).toBe('')
    expect(detail.recruitmentGuide).toBe('홈페이지에서 신청')
    expect(detail.applicationMethod).toBe('온라인 신청')
    expect(detail.learningSupportContent).toBe('교재 제공')
    expect(detail.additionalContentMarkdown).toBe('추가 HTML')
    expect(detail.attachmentFileNames).toEqual(['안내.pdf'])
    expect(detail.createdAt).toBe('2026-09-30T04:02:00Z')
    expect(detail.createdByName).toBe('관리자')
    expect(detail.updatedAt).toBe('2026-09-30T05:00:00Z')
    expect(detail.updatedByName).toBe('-')
    expect(
      mapGeminiRecruitmentDetailToDetail({
        programId: 2,
        thumbnailFileName: 'null',
      }).thumbnailFileName
    ).toBeNull()

    const app = mapGeminiOrganizationApplicationToRow(
      {
        applicationId: 9,
        organizationName: '학교',
        applicationStatus: 'APPROVED',
        requestedStudentCount: 30,
        regionSido: '서울특별시',
        regionSigungu: '강서구',
        teacherName: '김교사',
        preferredLectureScheduleText:
          '1지망 : 2026.01.09(금) 15:30 ~ 16:40 | 2차시',
        resultNotificationSentAt: '2026-09-27T05:00:00Z',
        availableActions: ['RESEND_NOTIFICATION'],
      },
      2
    )
    expect(app.id).toBe('9')
    expect(app.no).toBe(3)
    expect(app.approvalStatus).toBe('APPROVED')
    expect(app.studentCount).toBe(30)
    expect(app.institutionSido).toBe('서울특별시')
    expect(app.institutionSigungu).toBe('강서구')
    expect(app.teacherName).toBe('김교사')
    expect(app.preferredLectureSchedule).toBe(
      '1지망 : 2026.01.09(금) 15:30 ~ 16:40 | 2차시'
    )
    expect(app.availableActions).toContain('RESEND_NOTIFICATION')
    expect(app.resultNotificationSentAt).toBe('2026-09-27T05:00:00Z')

    expect(
      mapGeminiOrganizationApplicationToRow(
        { applicationId: 11, applicationStatus: 'REJECTED' },
        0
      ).approvalStatus
    ).toBe('REJECTED')
    expect(
      mapGeminiOrganizationApplicationToRow(
        { applicationId: 12, applicationStatus: 'REJECTION_CANCELLED' },
        0
      ).approvalStatus
    ).toBe('PENDING')
  })

  it('maps preferredScheduleBlocks when preferredLectureScheduleText is absent', () => {
    const app = mapGeminiOrganizationApplicationToRow(
      {
        applicationId: 10,
        organizationName: '학교B',
        applicationStatus: 'PENDING',
        preferredScheduleBlocks: [
          {
            preferenceRank: 1,
            date: '2026-01-09',
            dayOfWeek: '금',
            sessionCount: 2,
            sessionTimes: [{ startTime: '15:30', endTime: '16:40' }],
          },
        ],
      },
      0
    )
    expect(app.preferredLectureSchedule).toBe(
      '1지망 : 2026.01.09(금) 15:30 ~ 16:40 | 2차시'
    )
    expect(app.teacherName).toBe('-')
    expect(app.institutionSido).toBe('')
  })

  it('maps otherMatters into notes when present', () => {
    const detail = mapGeminiRecruitmentDetailToDetail({
      programId: 2,
      programCode: 'GEMINI_TRAINING-2026-01-01-000002',
      programType: 'GEMINI_TRAINING',
      draftStatus: 'PUBLISHED',
      periodStatus: 'SCHEDULED',
      nameKo: '연수 B',
      certificateDisabled: true,
      targetLevels: [],
      attachmentFileNames: [],
      otherMatters: '준비물 지참',
      educationForm: 'online',
    })
    expect(detail.notesNotApplicable).toBe(false)
    expect(detail.notes).toBe('준비물 지참')
    expect(detail.educationForm).toBe('online')
  })

  it('상세 GET은 summary·business 기간·현재시각으로 빈 값을 메우지 않는다', () => {
    const detail = mapGeminiRecruitmentDetailToDetail({
      programId: 3,
      nameKo: '',
      summary: '목록용 요약',
      description: '',
      businessStartDate: '2026-01-01',
      businessEndDate: '2026-12-31',
      applicationStartDate: undefined,
      applicationEndDate: undefined,
      trainingRequestStartDate: undefined,
      trainingRequestEndDate: undefined,
      otherMatters: undefined,
      educationForm: 'online',
      targetLevels: [],
      attachmentFileNames: [],
    })
    expect(detail.title).toBe('-')
    expect(detail.programDescription).toBe('')
    expect(detail.applicationPeriodStart).toBe('')
    expect(detail.applicationPeriodEnd).toBe('')
    expect(detail.trainingRequestPeriodStart).toBe('')
    expect(detail.trainingRequestPeriodEnd).toBe('')
    expect(detail.createdAt).toBe('-')
    expect(detail.updatedAt).toBe('-')
    expect(detail.minStudentCount).toBe(0)
    expect(detail.notesNotApplicable).toBe(true)
  })

  it('maps approved list — 강사 미지정이어도 서버 trainingDate를 유지한다', () => {
    const unmatched = mapGeminiRecruitmentItemToApprovedRow(
      {
        id: 185344,
        recruitmentTitle: '승인 연수',
        institutionName: '한국중학교',
        trainingDate: '2026-05-01',
        trainingTimeText: '10:00~12:00',
        instructorName: undefined,
      },
      0
    )
    expect(unmatched.id).toBe('185344')
    expect(unmatched.instructorAssigned).toBe(false)
    expect(unmatched.instructorName).toBe('미지정')
    expect(unmatched.trainingDate).toBe('2026-05-01')
    expect(unmatched.trainingTimeText).toBe('10:00~12:00')
    expect(unmatched.lastPreferredDate).toBe('')

    const matched = mapGeminiRecruitmentItemToApprovedRow(
      {
        id: 185341,
        institutionName: '서울고',
        trainingDate: '2026-06-01',
        trainingTimeText: '14:00~16:00',
        instructorName: '김성재',
        lastPreferredDate: '2026-05-20',
        officialDocumentRequired: false,
      },
      1
    )
    expect(matched.instructorAssigned).toBe(true)
    expect(matched.trainingDate).toBe('2026-06-01')
    expect(matched.lastPreferredDate).toBe('2026-05-20')
    expect(matched.officialDocumentRequired).toBe(false)
  })

  it('maps approved list — 희망 일정 후보를 버리고 확정일만 비우지 않는다', () => {
    const unmatched = mapGeminiRecruitmentItemToApprovedRow(
      {
        id: 1,
        institutionName: 'QA 배정학교',
        instructorName: '디디딤',
        trainingDate: null,
        trainingTimeText: undefined,
        trainingDateCandidates: [
          {
            preferenceRank: 1,
            trainingDate: '2026-10-29',
            trainingStartTime: '10:00',
            trainingEndTime: '12:00',
          },
        ],
      },
      0
    )
    expect(unmatched.instructorAssigned).toBe(true)
    expect(unmatched.trainingDate).toBe('')
    expect(unmatched.trainingDateCandidates).toEqual([
      { preferenceRank: 1, trainingDate: '2026-10-29', trainingTimeText: '10:00~12:00' },
    ])
    expect(unmatched.lastPreferredDate).toBe('2026-10-29')
  })

  it('maps create request and numeric ids', () => {
    const create = mapGeminiRecruitmentSnapshotToCreateRequest({
      title: '공고',
      announcementPublished: 'published',
      educationTargetLevels: [' adult ', 'university'],
      educationTargetDetail: '중학생',
      applicationPeriodStart: '2026-03-01',
      applicationPeriodEnd: '2026-03-31',
      trainingRequestPeriodStart: '2026-04-01',
      trainingRequestPeriodEnd: '2026-04-30',
      minStudentCount: 15,
      educationForm: 'offline',
      educationStructure: 'SCHEDULE',
      inquiryContactName: '홍길동',
      inquiryTel: '010',
      inquiryEmail: 'a@b.c',
      notesNotApplicable: false,
      notes: '준비물',
      thumbnailFileName: null,
      programDescription: '설명',
      recruitmentGuide: '모집 안내',
      applicationMethod: '온라인 신청',
      learningSupportContent: '',
      additionalContentMarkdown: '',
      attachmentFileNames: [],
      institutionSectionDescription: '',
      detailSectionDescription: '',
    })
    expect(create.programType).toBe('GEMINI_TRAINING')
    expect(create.title).toBe('공고')
    expect(create.educationStructure).toBe('SCHEDULE')
    expect(create.educationForm).toBe('offline')
    expect(create.trainingRequestStartDate).toBe('2026-04-01')
    expect(create.trainingRequestEndDate).toBe('2026-04-30')
    expect(create.applicationStartDate).toBe('2026-03-01')
    expect(create.applicationEndDate).toBe('2026-03-31')
    expect(create.businessStartDate).toBe('2026-03-01')
    expect(create.businessEndDate).toBe('2026-04-30')
    expect(create.targetLevels).toEqual(['adult', 'university'])
    expect(create.targetLevel).toBe('adult')
    expect(create.keyVisualImage).toBeUndefined()
    expect(create.attachmentFileNames).toEqual([])
    expect(create.detailedProgramId).toBeUndefined()
    expect(create.contactName).toBe('홍길동')
    expect(create.otherMatters).toBe('준비물')
    expect(create.recruitmentTargetDetail).toBe('중학생')
    expect(create.applicationMethod).toBe('온라인 신청')
    expect(create.draftStatus).toBe('PUBLISHED')
    expect(create.totalParticipants).toBe(15)
    expect(create).not.toHaveProperty('minimumParticipantCount')
    expect(
      mapGeminiRecruitmentSnapshotToCreateRequest({
        title: '공고',
        announcementPublished: 'unpublished',
        educationTargetLevels: ['adult'],
        educationTargetDetail: '',
        applicationPeriodStart: '2026-03-01',
        applicationPeriodEnd: '2026-03-31',
        trainingRequestPeriodStart: '2026-04-01',
        trainingRequestPeriodEnd: '2026-04-30',
        minStudentCount: 15,
        educationForm: 'offline',
        educationStructure: 'SCHEDULE',
        inquiryContactName: '',
        inquiryTel: '',
        inquiryEmail: '',
        notesNotApplicable: true,
        notes: '',
        thumbnailFileName: null,
        programDescription: '',
        recruitmentGuide: '',
        applicationMethod: '',
        learningSupportContent: '',
        additionalContentMarkdown: '',
        attachmentFileNames: [],
        institutionSectionDescription: '',
        detailSectionDescription: '',
      }).draftStatus
    ).toBe('DRAFT')
    expect(create.applicationPathId).toBeUndefined()
    expect(toGeminiNumericIds(['1', 'x', '2'])).toEqual([1, 2])
  })

  it('빈 educationTargetLevels는 상세 라벨로 되살리지 않는다', () => {
    const create = mapGeminiRecruitmentSnapshotToCreateRequest({
      title: '공고',
      announcementPublished: 'published',
      educationTargetLevels: [],
      educationTargetDetail: '중학생',
      applicationPeriodStart: '2026-03-01',
      applicationPeriodEnd: '2026-03-31',
      trainingRequestPeriodStart: '2026-04-01',
      trainingRequestPeriodEnd: '2026-04-30',
      minStudentCount: 15,
      educationForm: 'offline',
      educationStructure: 'SCHEDULE',
      inquiryContactName: '홍길동',
      inquiryTel: '010',
      inquiryEmail: 'a@b.c',
      notesNotApplicable: false,
      notes: '준비물',
      thumbnailFileName: null,
      programDescription: '설명',
      recruitmentGuide: '',
      applicationMethod: '',
      learningSupportContent: '',
      additionalContentMarkdown: '',
      attachmentFileNames: [],
      institutionSectionDescription: '',
      detailSectionDescription: '',
    })
    expect(create.targetLevels).toEqual([])
    expect(create.targetLevel).toBeUndefined()
  })

  it('maps update request with clearFields when inquiry fields are empty', () => {
    const update = mapGeminiRecruitmentDetailToUpdateRequest({
      title: '공고',
      announcementPublished: 'published',
      educationTargetLevels: [],
      educationTargetDetail: '',
      applicationPeriodStart: '2026-03-01',
      applicationPeriodEnd: '2026-03-31',
      trainingRequestPeriodStart: '2026-04-01',
      trainingRequestPeriodEnd: '2026-04-30',
      minStudentCount: 15,
      educationForm: 'offline',
      educationStructure: 'SCHEDULE',
      inquiryContactName: '',
      inquiryTel: '',
      inquiryEmail: '',
      notesNotApplicable: true,
      notes: '',
      thumbnailFileName: null,
      programDescription: '설명',
      recruitmentGuide: '',
      applicationMethod: '',
      learningSupportContent: '',
      additionalContentMarkdown: '',
      attachmentFileNames: [],
    })
    expect(update.educationStructure).toBe('SCHEDULE')
    expect(update.draftStatus).toBe('PUBLISHED')
    expect(update.educationForm).toBe('offline')
    expect(update.trainingRequestStartDate).toBe('2026-04-01')
    expect(update.trainingRequestEndDate).toBe('2026-04-30')
    expect(update.clearFields ?? []).not.toContain('educationStructure')
    expect(update.clearFields ?? []).not.toContain('trainingRequestStartDate')
    expect(update.contactName).toBeUndefined()
    expect(update.otherMatters).toBeUndefined()
    expect(update.recruitmentTargetDetail).toBeUndefined()
    expect(update.applicationMethod).toBeUndefined()
    expect(update.targetLevels).toEqual([])
    expect(update.targetLevel).toBeUndefined()
    expect(update.clearFields).toEqual(
      expect.arrayContaining([
        'contactName',
        'managerName',
        'otherMatters',
        'recruitmentTargetDetail',
        'applicationMethod',
        'contactPhone',
        'contactEmail',
        'recruitmentGuide',
        'learningSupportContent',
        'additionalContentHtml',
        'targetLevel',
      ])
    )
    expect(update.clearFields ?? []).not.toContain('announcementPublished')
    expect(update).not.toHaveProperty('announcementPublished')
    expect(update.keyVisualImage).toBeUndefined()
    expect(update.clearFields ?? []).toContain('keyVisualImage')
    expect(update.attachmentFileNames).toEqual([])
  })

  it('GET educationStructure null이면 PATCH에 educationStructure를 넣지 않는다', () => {
    const detail = mapGeminiRecruitmentDetailToDetail(
      asOpenApiFixture<GeminiRecruitmentDetailResponse>({
        programId: 1,
        nameKo: '공고',
        educationStructure: null,
        educationForm: 'hybrid',
        draftStatus: 'PUBLISHED',
      })
    )
    expect(detail.educationStructure).toBeNull()
    expect(detail.educationForm).toBe('offline')

    const update = mapGeminiRecruitmentDetailToUpdateRequest({
      title: '공고',
      announcementPublished: 'published',
      educationTargetLevels: [],
      educationTargetDetail: '',
      applicationPeriodStart: '2026-03-01',
      applicationPeriodEnd: '2026-03-31',
      trainingRequestPeriodStart: '2026-04-01',
      trainingRequestPeriodEnd: '2026-04-30',
      minStudentCount: 15,
      educationForm: 'offline',
      educationStructure: null,
      inquiryContactName: '담당',
      inquiryTel: '02-1',
      inquiryEmail: 'a@b.c',
      notesNotApplicable: true,
      notes: '',
      thumbnailFileName: null,
      programDescription: '설명',
      recruitmentGuide: '',
      applicationMethod: '',
      learningSupportContent: '',
      additionalContentMarkdown: '',
      attachmentFileNames: [],
    })
    expect(update.educationStructure).toBeUndefined()
    expect(update.clearFields ?? []).not.toContain('educationStructure')
  })

  it('GET educationStructure CURRICULUM이면 PATCH에 CURRICULUM을 왕복한다', () => {
    const detail = mapGeminiRecruitmentDetailToDetail(
      asOpenApiFixture<GeminiRecruitmentDetailResponse>({
        programId: 2,
        nameKo: '공고',
        educationStructure: 'CURRICULUM',
        draftStatus: 'PUBLISHED',
      })
    )
    expect(detail.educationStructure).toBe('CURRICULUM')

    const update = mapGeminiRecruitmentDetailToUpdateRequest({
      title: '공고',
      announcementPublished: 'published',
      educationTargetLevels: ['adult'],
      educationTargetDetail: '',
      applicationPeriodStart: '2026-03-01',
      applicationPeriodEnd: '2026-03-31',
      trainingRequestPeriodStart: '2026-04-01',
      trainingRequestPeriodEnd: '2026-04-30',
      minStudentCount: 15,
      educationForm: 'offline',
      educationStructure: 'CURRICULUM',
      inquiryContactName: '담당',
      inquiryTel: '02-1',
      inquiryEmail: 'a@b.c',
      notesNotApplicable: true,
      notes: '',
      thumbnailFileName: null,
      programDescription: '설명',
      recruitmentGuide: '',
      applicationMethod: '',
      learningSupportContent: '',
      additionalContentMarkdown: '',
      attachmentFileNames: [],
    })
    expect(update.educationStructure).toBe('CURRICULUM')
  })

  it('edit body carries every recruitment field the detail screen edits', () => {
    const update = mapGeminiRecruitmentDetailToUpdateRequest({
      title: '수정 공고',
      announcementPublished: 'published',
      educationTargetLevels: ['성인', 'university'],
      educationTargetDetail: '성인·대학생',
      applicationPeriodStart: '2026-10-07',
      applicationPeriodEnd: '2026-10-28',
      trainingRequestPeriodStart: '2026-10-30',
      trainingRequestPeriodEnd: '2026-12-29',
      minStudentCount: 20,
      educationForm: 'online',
      educationStructure: 'SCHEDULE',
      inquiryContactName: '연수팀',
      inquiryTel: '02-1234-5678',
      inquiryEmail: 'gemini@jakorea.org',
      notesNotApplicable: false,
      notes: '교재 현장 배부',
      thumbnailFileName: 'thumb.png',
      programDescription: '프로그램 설명',
      recruitmentGuide: '모집 안내',
      applicationMethod: '온라인 신청',
      learningSupportContent: '활동지 제공',
      additionalContentMarkdown: '<p>추가</p>',
      attachmentFileNames: ['안내.pdf', 'poster.png'],
    })
    expect(update.title).toBe('수정 공고')
    expect(update.description).toBe('프로그램 설명')
    expect(update.targetLevels).toEqual(['adult', 'university'])
    expect(update.targetLevel).toBe('adult')
    expect(update.recruitmentTargetDetail).toBe('성인·대학생')
    expect(update.applicationStartDate).toBe('2026-10-07')
    expect(update.applicationEndDate).toBe('2026-10-28')
    expect(update.businessStartDate).toBe('2026-10-07')
    expect(update.businessEndDate).toBe('2026-12-29')
    expect(update.trainingRequestStartDate).toBe('2026-10-30')
    expect(update.trainingRequestEndDate).toBe('2026-12-29')
    expect(update.totalParticipants).toBe(20)
    expect(update.educationForm).toBe('online')
    expect(update.contactName).toBe('연수팀')
    expect(update.contactPhone).toBe('02-1234-5678')
    expect(update.contactEmail).toBe('gemini@jakorea.org')
    expect(update.otherMatters).toBe('교재 현장 배부')
    expect(update.keyVisualImage).toBe('thumb.png')
    expect(update.recruitmentGuide).toBe('모집 안내')
    expect(update.applicationMethod).toBe('온라인 신청')
    expect(update.learningSupportContent).toBe('활동지 제공')
    expect(update.additionalContentHtml).toBe('<p>추가</p>')
    expect(update.attachmentFileNames).toEqual(['안내.pdf', 'poster.png'])
    const snapshot = JSON.parse(update.serviceDetailJson ?? '{}') as {
      geminiRecruitment?: { educationTargetLevels?: string[]; thumbnailFileName?: string }
    }
    expect(snapshot.geminiRecruitment?.educationTargetLevels).toEqual(['adult', 'university'])
    expect(snapshot.geminiRecruitment?.thumbnailFileName).toBe('thumb.png')
  })

  it('모집 시작 후에는 참여자 모집 창을 PATCH에서 뺀다', () => {
    const update = mapGeminiRecruitmentDetailToUpdateRequest(
      {
        title: '수정 공고',
        announcementPublished: 'published',
        educationTargetLevels: ['adult'],
        educationTargetDetail: '성인·대학생',
        applicationPeriodStart: '2026-09-30T15:00:00.000Z',
        applicationPeriodEnd: '2026-09-30T15:00:00.000Z',
        trainingRequestPeriodStart: '2026-10-01T15:00:00.000Z',
        trainingRequestPeriodEnd: '2026-10-29T15:00:00.000Z',
        minStudentCount: 15,
        educationForm: 'offline',
        educationStructure: 'SCHEDULE',
        inquiryContactName: '연수팀',
        inquiryTel: '02-1234-5678',
        inquiryEmail: 'gemini@jakorea.org',
        notesNotApplicable: false,
        notes: '비고',
        thumbnailFileName: null,
        programDescription: '프로그램 설명',
        recruitmentGuide: '모집 안내',
        applicationMethod: '온라인 신청',
        learningSupportContent: '활동지 제공',
        additionalContentMarkdown: '<p>추가</p>',
        attachmentFileNames: [],
      },
      { recruitmentWindowLocked: true }
    )
    expect(update.applicationStartDate).toBeUndefined()
    expect(update.applicationEndDate).toBeUndefined()
    expect(update.businessStartDate).toBeUndefined()
    expect(update.businessEndDate).toBeUndefined()
    expect(update.description).toBe('프로그램 설명')
    expect(update.trainingRequestStartDate).toBe('2026-10-01T15:00:00.000Z')
    expect(update.trainingRequestEndDate).toBe('2026-10-29T15:00:00.000Z')
    const snapshot = JSON.parse(update.serviceDetailJson ?? '{}') as {
      geminiRecruitment?: {
        applicationPeriodStart?: string
        applicationPeriodEnd?: string
        programDescription?: string
      }
    }
    expect(snapshot.geminiRecruitment?.applicationPeriodStart).toBeUndefined()
    expect(snapshot.geminiRecruitment?.applicationPeriodEnd).toBeUndefined()
    expect(snapshot.geminiRecruitment?.programDescription).toBe('프로그램 설명')
  })

  it('persist snapshot 정규화는 컬럼과 같고 연수 요청 기간을 모집 기간과 합치지 않는다', () => {
    const persist = buildGeminiRecruitmentPersistSnapshot({
      title: '공고',
      announcementPublished: 'published',
      educationTargetLevels: ['성인', 'university'],
      educationTargetDetail: '',
      applicationPeriodStart: '2026-03-01',
      applicationPeriodEnd: '2026-03-31',
      trainingRequestPeriodStart: '2026-04-01',
      trainingRequestPeriodEnd: '2026-04-30',
      minStudentCount: 10,
      educationForm: 'offline',
      educationStructure: 'CURRICULUM',
      inquiryContactName: '담당',
      inquiryTel: '02-1',
      inquiryEmail: 'a@b.c',
      notesNotApplicable: false,
      notes: '비고',
      thumbnailFileName: null,
      programDescription: '설명',
      recruitmentGuide: '',
      applicationMethod: '',
      learningSupportContent: '',
      additionalContentMarkdown: '<p>html</p>',
      attachmentFileNames: [],
    })
    expect(persist.educationTargetLevels).toEqual(['adult', 'university'])
    expect(persist.educationForm).toBe('offline')
    expect(persist.educationStructure).toBe('SCHEDULE')
    expect(persist.applicationPeriodStart).toBe('2026-03-01')
    expect(persist.trainingRequestPeriodStart).toBe('2026-04-01')
    const create = mapGeminiRecruitmentSnapshotToCreateRequest(persist)
    expect(create.targetLevels).toEqual(['adult', 'university'])
    expect(create.applicationStartDate).toBe('2026-03-01')
    expect(create.trainingRequestStartDate).toBe('2026-04-01')
    expect(create.applicationStartDate).not.toBe(create.trainingRequestStartDate)
    expect(create.businessStartDate).toBe('2026-03-01')
    expect(create.businessEndDate).toBe('2026-04-30')
  })

  it('create business period covers training request so editor image PATCH is not period-ended', () => {
    const create = mapGeminiRecruitmentSnapshotToCreateRequest({
      title: '제미나이 이미지',
      announcementPublished: 'published',
      educationTargetLevels: ['adult'],
      educationTargetDetail: '성인 학습 기관',
      applicationPeriodStart: '2026-09-30T15:00:00.000Z',
      applicationPeriodEnd: '2026-10-11T15:00:00.000Z',
      trainingRequestPeriodStart: '2026-10-01T15:00:00.000Z',
      trainingRequestPeriodEnd: '2026-10-29T15:00:00.000Z',
      minStudentCount: 15,
      educationForm: 'offline',
      educationStructure: 'SCHEDULE',
      inquiryContactName: 'JA Korea 찾아가는 연수',
      inquiryTel: '02-1234-5678',
      inquiryEmail: 'gemini-dev@jakorea.org',
      notesNotApplicable: false,
      notes: '희망 연수일은 연수 요청 가능기간 안에서 기관과 조율합니다.',
      thumbnailFileName: null,
      programDescription: '설명',
      recruitmentGuide: '<p><img src="/api/admin/files/2056231/content" /></p>',
      applicationMethod: '홈페이지에서 신청',
      learningSupportContent: '활동지',
      additionalContentMarkdown: '추가',
      attachmentFileNames: [],
      institutionSectionDescription: '',
      detailSectionDescription: '',
    })
    expect(create.applicationEndDate).toBe('2026-10-11T15:00:00.000Z')
    expect(create.businessStartDate).toBe('2026-09-30T15:00:00.000Z')
    expect(create.businessEndDate).toBe('2026-10-29T15:00:00.000Z')
  })

  it('gemini overlay restore는 일반 recruit.* 와 섞이지 않는다', () => {
    resetGeminiRecruitForm()
    resetGeneralRecruitOverlay()
    patchGeneralRecruitOverlay({ 'recruit.individual.notes': '일반 leftover' })
    restoreGeminiRecruitForm({
      [GEMINI_RECRUIT_FIELD_KEYS.title]: '제미니 공고',
      'recruit.individual.notes': '섞이면 안 됨',
    })
    expect(getGeminiRecruitFormRecord()[GEMINI_RECRUIT_FIELD_KEYS.title]).toBe('제미니 공고')
    expect(getGeneralRecruitOverlayRecord()['recruit.individual.notes']).toBe('일반 leftover')
    expect(pickGeminiRecruitFields({
      [GEMINI_RECRUIT_FIELD_KEYS.title]: 'a',
      'recruit.targetLevels': ['high'],
    })).toEqual({ [GEMINI_RECRUIT_FIELD_KEYS.title]: 'a' })
  })
})
