import { describe, expect, it } from 'vitest'
import {
  mapGeminiOrganizationApplicationToRow,
  mapGeminiRecruitmentDetailToDetail,
  mapGeminiRecruitmentDetailToUpdateRequest,
  mapGeminiRecruitmentItemToApprovedRow,
  mapGeminiRecruitmentItemToRow,
  mapGeminiRecruitmentSnapshotToCreateRequest,
  toGeminiNumericIds,
} from './adapters'

describe('gemini visiting-training adapters', () => {
  it('maps recruitment list item', () => {
    const row = mapGeminiRecruitmentItemToRow(
      {
        programId: 12,
        nameKo: '찾아가는 연수',
        businessStartDate: '2026-03-01',
        businessEndDate: '2026-03-31',
        draftStatus: 'DRAFT',
      },
      0
    )
    expect(row.id).toBe('12')
    expect(row.title).toBe('찾아가는 연수')
    expect(row.isDraft).toBe(true)
    expect(row.applicationPeriodStart).toBe('2026-03-01')
    expect(row.organizationApplicationCount).toBe(0)
  })

  it('maps application counts used to block recruitment delete', () => {
    const row = mapGeminiRecruitmentItemToRow(
      {
        programId: 4,
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
    expect(detail.minStudentCount).toBe(20)
    expect(detail.applicationPeriodStart).toBe('2026-01-01')
    expect(detail.applicationPeriodEnd).toBe('2026-02-01')
    expect(detail.trainingRequestPeriodStart).toBe('2026-03-01')
    expect(detail.trainingRequestPeriodEnd).toBe('2026-04-01')
    expect(detail.educationTargetLevels).toEqual(['adult'])
    expect(detail.educationTargetDetail).toBe('성인 학습자')
    expect(detail.educationForm).toBe('offline')
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

    const app = mapGeminiOrganizationApplicationToRow(
      {
        applicationId: 9,
        organizationName: '학교',
        applicationStatus: 'APPROVED',
        requestedStudentCount: 30,
        resultNotificationSentAt: '2026-09-27T05:00:00Z',
        availableActions: ['RESEND_NOTIFICATION'],
      },
      2
    )
    expect(app.id).toBe('9')
    expect(app.no).toBe(3)
    expect(app.approvalStatus).toBe('APPROVED')
    expect(app.studentCount).toBe(30)
    expect(app.availableActions).toContain('RESEND_NOTIFICATION')
    expect(app.resultNotificationSentAt).toBe('2026-09-27T05:00:00Z')
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

  it('maps approved list with gaps filled by defaults', () => {
    const row = mapGeminiRecruitmentItemToApprovedRow(
      {
        id: 3,
        recruitmentTitle: '승인 연수',
        institutionName: '한국중학교',
        trainingDate: '2026-05-01',
      },
      0
    )
    expect(row.id).toBe('3')
    expect(row.institutionName).toBe('한국중학교')
    expect(row.instructorName).toBe('미지정')
    expect(row.trainingDate).toBe('2026-05-01')
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
      recruitmentGuide: '',
      applicationMethod: '',
      learningSupportContent: '',
      additionalContentMarkdown: '',
      attachmentFileNames: [],
      institutionSectionDescription: '',
      detailSectionDescription: '',
    })
    expect(create.programType).toBe('GEMINI_TRAINING')
    expect(create.title).toBe('공고')
    expect(create.educationStructure).toBe('SCHEDULE')
    expect(create.targetLevels).toEqual(['adult', 'university'])
    expect(create.targetLevel).toBe('adult')
    expect(create.detailedProgramId).toBeUndefined()
    expect((create as { contactName?: string }).contactName).toBe('홍길동')
    expect((create as { otherMatters?: string }).otherMatters).toBe('준비물')
    expect((create as { recruitmentTargetDetail?: string }).recruitmentTargetDetail).toBe(
      '중학생'
    )
    expect(toGeminiNumericIds(['1', 'x', '2'])).toEqual([1, 2])
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
    expect(update.clearFields ?? []).not.toContain('educationStructure')
    expect(update.contactName).toBeUndefined()
    expect(update.otherMatters).toBeUndefined()
    expect(update.recruitmentTargetDetail).toBeUndefined()
    expect(update.targetLevels).toEqual([])
    expect(update.targetLevel).toBeUndefined()
    expect(update.clearFields).toEqual(
      expect.arrayContaining([
        'contactName',
        'otherMatters',
        'recruitmentTargetDetail',
        'targetLevel',
      ])
    )
  })
})
