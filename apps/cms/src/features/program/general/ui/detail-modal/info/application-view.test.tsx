/** @vitest-environment jsdom */
import { useState } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Program } from '@/types/domain'
import { queryClient } from '@/shared/lib/query-client'
import { PROGRAM_APPLICATION_FORM_EDIT_BLOCKED_ALERT_TITLE } from '@/shared/lib/program-edit-window-error-message'
import {
  resolveGeneralApplicationEditorVariant,
  type GeneralApplicationTabKey,
} from '@/features/program/general/lib/application-tabs'
import { programForApplicationFormEditor } from '@/features/program/general/lib/operational-form-bindings'
import { assertProgramApplicationFormWritable } from '@/features/program/general/lib/sync-registration-form-bindings'
import { getTemplateIdForParticipantApplicationVariant } from '@/features/template/lib/participant-application-template-id'
import type { ProgramParticipantApplicationEditorVariant } from '@/features/template/hooks/use-program-participant-application-editor'

const showAlert = vi.fn()
const fetchGeneralProgramFormBindings = vi.fn()
const fetchProgramApplicationCountsRemote = vi.fn()

vi.mock('@/features/template/api/admin-form-templates-service', () => ({
  shouldUseFormsSurveysRemoteApi: () => true,
}))

vi.mock('@/features/program/general/api/general-programs-remote-capabilities', () => ({
  shouldUseProgramsHttpRemoteApi: () => true,
}))

vi.mock('@/features/program/ujat/api/capabilities', () => ({
  shouldUseRemoteApi: () => false,
}))

vi.mock('@/features/program/general/api/admin-general-programs-service', () => ({
  fetchGeneralProgramFormBindings: (...args: unknown[]) =>
    fetchGeneralProgramFormBindings(...args),
}))

vi.mock('@/features/program/general/api/application-counts-api-client', () => ({
  fetchProgramApplicationCountsRemote: (...args: unknown[]) =>
    fetchProgramApplicationCountsRemote(...args),
}))

const generalProgram = {
  id: '186100',
  backendProgramType: 'GENERAL',
  generalParticipantTypes: ['school_institution'],
  programRecruitments: [
    {
      id: 31,
      recruitmentType: 'PARTICIPANT',
      applicationType: 'ORGANIZATION',
      applicationFormBindingId: 7,
    },
  ],
} as Program

const trainedTeachersProgram = {
  id: '186200',
  backendProgramType: 'TRAINED_TEACHER',
  generalParticipantTypes: ['school_institution'],
  programRecruitments: [
    {
      id: 51,
      recruitmentType: 'PARTICIPANT',
      applicationType: 'ORGANIZATION',
      applicationFormBindingId: 17,
    },
  ],
} as Program

const companySchoolProgram = {
  id: '170100',
  backendProgramType: 'COMPANY_SCHOOL',
  generalParticipantTypes: ['school_institution', 'teacher_instructor'],
  programRecruitments: [
    {
      id: 41,
      recruitmentType: 'PARTICIPANT',
      applicationType: 'ORGANIZATION',
      applicationFormBindingId: 27,
    },
    {
      id: 42,
      recruitmentType: 'INSTRUCTOR',
      applicationFormBindingId: 28,
    },
  ],
} as Program

function ApplicationEditFormHarness({
  program,
  tab,
  variantOverride,
}: {
  program: Program
  tab: GeneralApplicationTabKey
  variantOverride?: ProgramParticipantApplicationEditorVariant
}) {
  const [editorOpen, setEditorOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const onEditForm = () => {
    if (loading) return
    const variant = variantOverride ?? resolveGeneralApplicationEditorVariant(program, tab)
    const templateCode = getTemplateIdForParticipantApplicationVariant(variant)
    const scopedProgram = programForApplicationFormEditor(program, variant)
    setLoading(true)
    void assertProgramApplicationFormWritable(scopedProgram, templateCode)
      .then(() => setEditorOpen(true))
      .catch(error => {
        void showAlert({
          title: PROGRAM_APPLICATION_FORM_EDIT_BLOCKED_ALERT_TITLE,
          content:
            error instanceof Error && error.message.trim() !== ''
              ? error.message
              : '신청서 현황을 확인하지 못해 양식을 수정할 수 없습니다. 다시 시도해 주세요.',
        })
      })
      .finally(() => setLoading(false))
  }

  return (
    <>
      <button type="button" onClick={onEditForm} disabled={loading}>
        양식 수정
      </button>
      {editorOpen ? <div>application-form-editor</div> : null}
    </>
  )
}

describe('신청 양식 수정 진입 preflight', () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
    queryClient.clear()
  })

  it('신청서가 있는 모집에서 양식 수정을 누르면 counts GET 후 편집기를 열지 않는다', async () => {
    fetchGeneralProgramFormBindings.mockResolvedValue([
      {
        bindingId: 7,
        active: true,
        formType: 'APPLICATION',
        targetRole: 'ORGANIZATION',
        targetScope: 'RECRUITMENT',
        targetScopeId: 31,
        templateId: 55,
        templateVersionId: 501,
        templateName: '기관 신청',
      },
    ])
    fetchProgramApplicationCountsRemote.mockResolvedValue([
      { programId: 186100, recruitmentId: 31, targetType: 'ORGANIZATION', totalCount: 1 },
    ])

    render(<ApplicationEditFormHarness program={generalProgram} tab="institutions" />)
    fireEvent.click(screen.getByRole('button', { name: '양식 수정' }))

    await waitFor(() => {
      expect(fetchProgramApplicationCountsRemote).toHaveBeenCalledWith('186100')
    })
    expect(showAlert).toHaveBeenCalledWith({
      title: PROGRAM_APPLICATION_FORM_EDIT_BLOCKED_ALERT_TITLE,
      content: '모집 시작 이후에는 신청 양식을 수정할 수 없습니다.',
    })
    expect(screen.queryByText('application-form-editor')).toBeNull()
  })

  it('신청 0건 모집은 양식 수정 편집기에 진입한다', async () => {
    fetchGeneralProgramFormBindings.mockResolvedValue([
      {
        bindingId: 7,
        active: true,
        formType: 'APPLICATION',
        targetRole: 'ORGANIZATION',
        targetScope: 'RECRUITMENT',
        targetScopeId: 31,
        templateId: 55,
        templateVersionId: 501,
        templateName: '기관 신청',
      },
    ])
    fetchProgramApplicationCountsRemote.mockResolvedValue([
      { programId: 186100, recruitmentId: 31, targetType: 'ORGANIZATION', totalCount: 0 },
    ])

    render(<ApplicationEditFormHarness program={generalProgram} tab="institutions" />)
    fireEvent.click(screen.getByRole('button', { name: '양식 수정' }))

    await waitFor(() => {
      expect(screen.getByText('application-form-editor')).toBeTruthy()
    })
    expect(fetchProgramApplicationCountsRemote).toHaveBeenCalledWith('186100')
    expect(showAlert).not.toHaveBeenCalled()
  })

  it('교육받은 교사 신청이 있으면 counts GET 후 편집기를 열지 않는다', async () => {
    fetchGeneralProgramFormBindings.mockResolvedValue([
      {
        bindingId: 17,
        active: true,
        formType: 'APPLICATION',
        targetRole: 'ORGANIZATION',
        targetScope: 'RECRUITMENT',
        targetScopeId: 51,
        templateId: 56,
        templateVersionId: 502,
        templateName: '교육받은 교사 신청',
      },
    ])
    fetchProgramApplicationCountsRemote.mockResolvedValue([
      { programId: 186200, recruitmentId: 51, targetType: 'ORGANIZATION', totalCount: 2 },
    ])

    render(
      <ApplicationEditFormHarness
        program={trainedTeachersProgram}
        tab="institutions"
        variantOverride="trained-teachers-application-institution"
      />
    )
    fireEvent.click(screen.getByRole('button', { name: '양식 수정' }))

    await waitFor(() => {
      expect(fetchProgramApplicationCountsRemote).toHaveBeenCalledWith('186200')
    })
    expect(showAlert).toHaveBeenCalledWith({
      title: PROGRAM_APPLICATION_FORM_EDIT_BLOCKED_ALERT_TITLE,
      content: '모집 시작 이후에는 신청 양식을 수정할 수 없습니다.',
    })
    expect(screen.queryByText('application-form-editor')).toBeNull()
  })

  it('교육받은 교사 신청 0건이면 counts GET 후 편집기를 연다', async () => {
    fetchGeneralProgramFormBindings.mockResolvedValue([
      {
        bindingId: 17,
        active: true,
        formType: 'APPLICATION',
        targetRole: 'ORGANIZATION',
        targetScope: 'RECRUITMENT',
        targetScopeId: 51,
        templateId: 56,
        templateVersionId: 502,
        templateName: '교육받은 교사 신청',
      },
    ])
    fetchProgramApplicationCountsRemote.mockResolvedValue([
      { programId: 186200, recruitmentId: 51, targetType: 'ORGANIZATION', totalCount: 0 },
    ])

    render(
      <ApplicationEditFormHarness
        program={trainedTeachersProgram}
        tab="institutions"
        variantOverride="trained-teachers-application-institution"
      />
    )
    fireEvent.click(screen.getByRole('button', { name: '양식 수정' }))

    await waitFor(() => {
      expect(screen.getByText('application-form-editor')).toBeTruthy()
    })
    expect(fetchProgramApplicationCountsRemote).toHaveBeenCalledWith('186200')
    expect(showAlert).not.toHaveBeenCalled()
  })

  it('1사1교 기관 탭은 기관 모집 신청이 있으면 편집기를 열지 않는다', async () => {
    fetchGeneralProgramFormBindings.mockResolvedValue([
      {
        bindingId: 27,
        active: true,
        formType: 'APPLICATION',
        targetRole: 'ORGANIZATION',
        targetScope: 'RECRUITMENT',
        targetScopeId: 41,
        templateId: 57,
        templateVersionId: 503,
        templateName: '1사1교 기관 신청',
      },
      {
        bindingId: 28,
        active: true,
        formType: 'APPLICATION',
        targetRole: 'INSTRUCTOR',
        targetScope: 'RECRUITMENT',
        targetScopeId: 42,
        templateId: 58,
        templateVersionId: 504,
        templateName: '강사 신청',
      },
    ])
    fetchProgramApplicationCountsRemote.mockResolvedValue([
      { programId: 170100, recruitmentId: 41, targetType: 'ORGANIZATION', totalCount: 1 },
      { programId: 170100, recruitmentId: 42, targetType: 'INSTRUCTOR', totalCount: 0 },
    ])

    render(<ApplicationEditFormHarness program={companySchoolProgram} tab="institutions" />)
    fireEvent.click(screen.getByRole('button', { name: '양식 수정' }))

    await waitFor(() => {
      expect(fetchProgramApplicationCountsRemote).toHaveBeenCalledWith('170100')
    })
    expect(showAlert).toHaveBeenCalledWith({
      title: PROGRAM_APPLICATION_FORM_EDIT_BLOCKED_ALERT_TITLE,
      content: '모집 시작 이후에는 신청 양식을 수정할 수 없습니다.',
    })
    expect(screen.queryByText('application-form-editor')).toBeNull()
  })

  it('1사1교 강사 탭은 강사 모집 신청 0건이면 기관 신청이 있어도 편집기를 연다', async () => {
    fetchGeneralProgramFormBindings.mockResolvedValue([
      {
        bindingId: 27,
        active: true,
        formType: 'APPLICATION',
        targetRole: 'ORGANIZATION',
        targetScope: 'RECRUITMENT',
        targetScopeId: 41,
        templateId: 57,
        templateVersionId: 503,
        templateName: '1사1교 기관 신청',
      },
      {
        bindingId: 28,
        active: true,
        formType: 'APPLICATION',
        targetRole: 'INSTRUCTOR',
        targetScope: 'RECRUITMENT',
        targetScopeId: 42,
        templateId: 58,
        templateVersionId: 504,
        templateName: '강사 신청',
      },
    ])
    fetchProgramApplicationCountsRemote.mockResolvedValue([
      { programId: 170100, recruitmentId: 41, targetType: 'ORGANIZATION', totalCount: 1 },
      { programId: 170100, recruitmentId: 42, targetType: 'INSTRUCTOR', totalCount: 0 },
    ])

    render(<ApplicationEditFormHarness program={companySchoolProgram} tab="instructors" />)
    fireEvent.click(screen.getByRole('button', { name: '양식 수정' }))

    await waitFor(() => {
      expect(screen.getByText('application-form-editor')).toBeTruthy()
    })
    expect(fetchProgramApplicationCountsRemote).toHaveBeenCalledWith('170100')
    expect(showAlert).not.toHaveBeenCalled()
  })
})
