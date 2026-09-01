import { describe, expect, it } from 'vitest'
import {
  mapGeminiOrganizationApplicationToRow,
  mapGeminiRecruitmentDetailToDetail,
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
  })

  it('maps detail and organization application', () => {
    const detail = mapGeminiRecruitmentDetailToDetail({
      programId: 1,
      nameKo: '연수 A',
      description: '설명',
      minimumParticipantCount: 20,
      businessStartDate: '2026-01-01',
      businessEndDate: '2026-02-01',
    })
    expect(detail.programDescription).toBe('설명')
    expect(detail.minStudentCount).toBe(20)

    const app = mapGeminiOrganizationApplicationToRow(
      {
        applicationId: 9,
        organizationName: '학교',
        applicationStatus: 'APPROVED',
        requestedStudentCount: 30,
      },
      2
    )
    expect(app.id).toBe('9')
    expect(app.no).toBe(3)
    expect(app.approvalStatus).toBe('APPROVED')
    expect(app.studentCount).toBe(30)
  })

  it('maps approved list with gaps filled by defaults', () => {
    const row = mapGeminiRecruitmentItemToApprovedRow(
      { programId: 3, nameKo: '승인 연수', businessStartDate: '2026-05-01' },
      0
    )
    expect(row.id).toBe('3')
    expect(row.instructorName).toBe('미지정')
    expect(row.trainingDate).toBe('2026-05-01')
  })

  it('maps create request and numeric ids', () => {
    const create = mapGeminiRecruitmentSnapshotToCreateRequest({
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
      inquiryContactName: '홍길동',
      inquiryTel: '010',
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
      institutionSectionDescription: '',
      detailSectionDescription: '',
    })
    expect(create.programType).toBe('GEMINI_TRAINING')
    expect(create.title).toBe('공고')
    expect(toGeminiNumericIds(['1', 'x', '2'])).toEqual([1, 2])
  })
})
