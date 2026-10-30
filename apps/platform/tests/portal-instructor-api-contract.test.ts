import { afterEach, describe, expect, it, vi } from 'vitest'

const getMock = vi.fn()
const postMock = vi.fn()
const putMock = vi.fn()

vi.mock('@/shared/api/axios-instance', () => ({
  axiosClient: {
    get: (...args: unknown[]) => getMock(...args),
    post: (...args: unknown[]) => postMock(...args),
    put: (...args: unknown[]) => putMock(...args),
  },
}))

import {
  fetchPortalApplicationForm,
  fetchPortalApplicationOptions,
  submitPortalApplication,
} from '../src/features/program/api/application-client'
import {
  getLectureReportAssignments,
  getLectureReportBinding,
  getLectureReportState,
  renderLectureReport,
  submitLectureReport,
} from '../src/features/mypage/education/schedules/api/lecture-report-client'
import { mapLectureReportAssignmentToInstructorItem } from '../src/features/mypage/education/schedules/api/instructor-assignment-client'

afterEach(() => {
  getMock.mockReset()
  postMock.mockReset()
  putMock.mockReset()
})

describe('portal instructor application API contract', () => {
  it('loads application-options then form-bindings with recruitmentId and applicationType', async () => {
    getMock.mockResolvedValueOnce({
      data: {
        success: true,
        data: [
          {
            recruitmentId: 186893,
            applicationType: 'INSTRUCTOR',
            formBindingId: 189682,
            formTemplateVersionId: 1,
            canApply: true,
          },
        ],
      },
    })
    getMock.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          programId: 186416,
          recruitmentId: 186893,
          applicationType: 'INSTRUCTOR',
          formBindingId: 189682,
          templateVersionId: 1,
          form: { paragraphs: [], runtimeContext: {} },
          draftApplicationId: null,
          draftFormResponseId: null,
          draftAnswers: {},
          draftAttachments: [],
        },
      },
    })

    const options = await fetchPortalApplicationOptions(186416)
    expect(getMock).toHaveBeenCalledWith(
      '/api/portal/programs/186416/application-options',
      expect.objectContaining({ signal: undefined }),
    )
    expect(options[0]?.formBindingId).toBe(189682)
    expect(options[0]?.recruitmentId).toBe(186893)

    const form = await fetchPortalApplicationForm(186416, 189682, {
      recruitmentId: 186893,
      applicationType: 'INSTRUCTOR',
    })
    expect(getMock).toHaveBeenCalledWith(
      '/api/portal/programs/186416/form-bindings/189682',
      expect.objectContaining({
        params: {
          recruitmentId: 186893,
          applicationType: 'INSTRUCTOR',
        },
      }),
    )
    expect(form.draftAnswers).toEqual({})
    expect(form.draftAttachments).toEqual([])
    expect(form.draftApplicationId).toBeNull()
    expect(form.draftFormResponseId).toBeNull()

    const urls = getMock.mock.calls.map(call => String(call[0]))
    expect(urls.some(url => url.includes('/me/programs/') && url.includes('/render'))).toBe(false)
  })

  it('normalizes missing draft fields to null / {} / []', async () => {
    getMock.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          programId: 186416,
          formBindingId: 189682,
          form: { paragraphs: [] },
        },
      },
    })
    const form = await fetchPortalApplicationForm(186416, 189682, {
      recruitmentId: 186893,
      applicationType: 'INSTRUCTOR',
    })
    expect(form.draftApplicationId).toBeNull()
    expect(form.draftFormResponseId).toBeNull()
    expect(form.draftAnswers).toEqual({})
    expect(form.draftAttachments).toEqual([])
  })

  it('submits applications without inventing ids', async () => {
    postMock.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          applicationId: 99,
          applicationType: 'INSTRUCTOR',
          applicationStatus: 'SUBMITTED',
          formResponseId: 1,
          formResponseStatus: 'SUBMITTED',
          submittedAt: '2026-10-01T00:00:00Z',
          reusedExisting: false,
        },
      },
    })
    await submitPortalApplication(186416, {
      recruitmentId: 186893,
      applicationType: 'INSTRUCTOR',
      formBindingId: 189682,
      answers: {},
    })
    expect(postMock).toHaveBeenCalledWith(
      '/api/portal/programs/186416/applications',
      expect.objectContaining({
        recruitmentId: 186893,
        applicationType: 'INSTRUCTOR',
        formBindingId: 189682,
        answers: {},
      }),
    )
    const body = postMock.mock.calls[0]?.[1] as Record<string, unknown>
    expect(body).not.toHaveProperty('applicationId')
    expect(body).not.toHaveProperty('templateVersionId')
    expect(body).not.toHaveProperty('contextType')
    expect(body).not.toHaveProperty('contextId')
  })
})

describe('portal lecture-report assignment API contract', () => {
  it('lists lecture-report-assignments with page from 0 and size max 10', async () => {
    getMock.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          items: [],
          page: 0,
          size: 10,
          totalElements: 0,
          totalPages: 0,
        },
      },
    })
    const page = await getLectureReportAssignments(186416, 0)
    expect(getMock).toHaveBeenCalledWith(
      '/api/portal/me/programs/186416/lecture-report-assignments',
      expect.objectContaining({
        params: { page: 0, size: 10 },
      }),
    )
    expect(page.items).toEqual([])

    const urls = getMock.mock.calls.map(call => String(call[0]))
    expect(urls.some(url => url.includes('instructor-assignments') && !url.includes('lecture-report'))).toBe(
      false,
    )
    expect(urls.some(url => url.includes('instructor-assignment-waitings'))).toBe(false)
  })

  it('clamps assignment page size to 10', async () => {
    getMock.mockResolvedValueOnce({
      data: {
        success: true,
        data: { items: [], page: 0, size: 10, totalElements: 0, totalPages: 0 },
      },
    })
    await getLectureReportAssignments(186416, 0, undefined, 50)
    expect(getMock.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({ params: { page: 0, size: 10 } }),
    )
  })

  it('submits lecture report without binding/context fields in body', async () => {
    postMock.mockResolvedValueOnce({
      data: { success: true, data: { reportId: 1, formResponseId: 2 } },
    })
    await submitLectureReport(9001, {
      templateVersionId: 12345,
      formResponseId: null,
      attachmentGroupId: null,
      answers: { q1: 'a' },
      fileObjectIdsByQuestion: {},
    })
    expect(postMock).toHaveBeenCalledWith(
      '/api/portal/me/instructor-assignments/9001/lecture-report',
      {
        templateVersionId: 12345,
        formResponseId: null,
        attachmentGroupId: null,
        answers: { q1: 'a' },
        fileObjectIdsByQuestion: {},
      },
    )
    const body = postMock.mock.calls[0]?.[1] as Record<string, unknown>
    expect(body).not.toHaveProperty('bindingId')
    expect(body).not.toHaveProperty('contextType')
    expect(body).not.toHaveProperty('contextId')
    expect(body).not.toHaveProperty('programId')
  })

  it('maps distanceFromHome as number for assignment panel', () => {
    const mapped = mapLectureReportAssignmentToInstructorItem({
      assignmentId: 1,
      instructorApplicationId: null,
      programId: 186416,
      scheduleId: 10,
      startAt: null,
      endAt: null,
      scheduleName: null,
      sessionNo: 1,
      institutionName: '서울초',
      grade: '3',
      lectureStatus: 'COMPLETED',
      reportStatus: 'AVAILABLE',
      submitDueAt: null,
      canSubmit: true,
      reportId: null,
      instructorRole: 'LEAD',
      institutionAddress: '서울',
      distanceFromHome: 12.4,
    })
    expect(mapped.distanceKm).toBe(12.4)
    expect(typeof mapped.distanceKm).toBe('number')
  })

  it('loads write context in status → form-binding → render order without inventing ids', async () => {
    const assignmentId = 1694870
    getMock
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            assignmentId,
            instructorApplicationId: 1694793,
            programId: 186416,
            programScheduleId: 187447,
            reportId: null,
            submitted: false,
            submittedAt: null,
            formResponseId: null,
            templateVersionId: 81,
            attachmentGroupId: null,
            reportStatus: 'AVAILABLE',
            scheduleStatus: 'COMPLETED',
            submitDueAt: null,
            canSubmit: true,
            bindingId: 189751,
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            assignmentId,
            programId: 186416,
            programScheduleId: 187447,
            bindingId: 189751,
            templateVersionId: 81,
            contextType: 'INSTRUCTOR_APPLICATION',
            contextId: 1694793,
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: { paragraphs: [], answers: {} },
        },
      })

    const state = await getLectureReportState(assignmentId)
    const binding = await getLectureReportBinding(assignmentId)
    const form = await renderLectureReport(binding.programId, binding.bindingId)

    expect(getMock.mock.calls.map(call => String(call[0]))).toEqual([
      `/api/portal/me/instructor-assignments/${assignmentId}/lecture-report`,
      `/api/portal/me/instructor-assignments/${assignmentId}/lecture-report/form-binding`,
      `/api/portal/me/programs/${binding.programId}/form-bindings/${binding.bindingId}/render`,
    ])
    expect(state.canSubmit).toBe(true)
    expect(binding.bindingId).toBe(189751)
    expect(binding.templateVersionId).toBe(81)
    expect(form).toEqual({ paragraphs: [], answers: {} })

    const urls = getMock.mock.calls.map(call => String(call[0]))
    expect(urls.some(url => url.includes('form-bindings/189682'))).toBe(false)
    expect(urls.some(url => url.includes('instructor-assignment-waitings'))).toBe(false)
    expect(urls.some(url => url.includes('instructor-assignment-availability'))).toBe(false)
    getMock.mock.calls.forEach(call => {
      const config = call[1] as { params?: Record<string, unknown> } | undefined
      if (config?.params == null) return
      expect(config.params).not.toHaveProperty('memberId')
      expect(config.params).not.toHaveProperty('participantId')
      expect(config.params).not.toHaveProperty('instructorMemberId')
      expect(config.params).not.toHaveProperty('assignmentId')
    })
  })

  it('does not treat participant id 1695005 as member id in lecture-report list params', async () => {
    getMock.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          items: [
            {
              assignmentId: 1694870,
              instructorApplicationId: 1694793,
              programId: 186416,
              scheduleId: 187447,
              startAt: null,
              endAt: null,
              scheduleName: null,
              sessionNo: 1,
              institutionName: null,
              grade: null,
              lectureStatus: 'COMPLETED',
              reportStatus: 'AVAILABLE',
              submitDueAt: null,
              canSubmit: true,
              reportId: null,
            },
          ],
          page: 0,
          size: 10,
          totalElements: 1,
          totalPages: 1,
        },
      },
    })
    const page = await getLectureReportAssignments(186416, 0)
    expect(page.items[0]?.assignmentId).toBe(1694870)
    expect(getMock).toHaveBeenCalledWith(
      '/api/portal/me/programs/186416/lecture-report-assignments',
      expect.objectContaining({ params: { page: 0, size: 10 } }),
    )
    const params = getMock.mock.calls[0]?.[1] as { params: Record<string, unknown> }
    expect(Object.keys(params.params)).toEqual(['page', 'size'])
  })
})
