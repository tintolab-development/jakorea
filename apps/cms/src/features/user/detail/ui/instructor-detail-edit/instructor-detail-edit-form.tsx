/**
 * 강사 상세 — 정보 수정 모드
 * 신규 등록(`InstructorProfileFormBody`)과 동일 구성 + 상세 전용 메타/강사비 등급
 */

import { useEffect, useMemo } from 'react'
import { Form } from 'antd'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import type { User } from '@/types/user'
import type { AdminProvisionedMemberBasicInfoDraft } from '@/features/user/detail/lib/admin-provisioned-member-basic-info-draft'
import {
  mapInstructorProfileFormToBasicInfoDraftPartial,
  mapUserToInstructorProfileFormValues,
} from '@/features/user/detail/lib/map-user-to-instructor-profile-form'
import {
  jaEvaluationGradeLine,
  socialView,
} from '@/features/user/detail/ui/user-basic-info/display'
import { settlementStatusView } from '@/features/user/detail/ui/user-basic-info/status'
import {
  InstructorProfileFormBody,
  type InstructorProfileFormValues,
} from '@/features/user/shared/ui/instructor-profile-form'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsButton, CmsSelect } from '@/shared/ui'
import { INSTRUCTOR_FEE_GRADE_OPTIONS } from '@/data/mock/program-wage-info'
import { formatDate } from '@/shared/utils'
import '@/features/user/shared/ui/instructor-register-modal.css'
import './instructor-detail-edit-form.css'

export interface InstructorDetailEditFormProps {
  user: Omit<User, 'password'>
  instructorResumeApplicantRow: ApplicantInstructorRow | null
  memberInfoDraft: AdminProvisionedMemberBasicInfoDraft
  onMemberInfoDraftChange: (partial: Partial<AdminProvisionedMemberBasicInfoDraft>) => void
  onOpenJaGradeEvaluation?: () => void
  isInstructorPermissionDetail?: boolean
}

export function InstructorDetailEditForm({
  user,
  instructorResumeApplicantRow,
  memberInfoDraft,
  onMemberInfoDraftChange,
  onOpenJaGradeEvaluation,
  isInstructorPermissionDetail = false,
}: InstructorDetailEditFormProps) {
  const [form] = Form.useForm<InstructorProfileFormValues>()

  const initialValues = useMemo(
    () => mapUserToInstructorProfileFormValues(user, instructorResumeApplicantRow),
    [user, instructorResumeApplicantRow]
  )

  useEffect(() => {
    form.setFieldsValue(initialValues)
    onMemberInfoDraftChange(mapInstructorProfileFormToBasicInfoDraftPartial(initialValues))
  }, [form, initialValues, onMemberInfoDraftChange])

  const syncDraftFromForm = (values: InstructorProfileFormValues) => {
    onMemberInfoDraftChange(mapInstructorProfileFormToBasicInfoDraftPartial(values))
  }

  const gradeEvaluateButton = (
    <CmsButton
      type="button"
      variant="secondary"
      size="small"
      onClick={() => onOpenJaGradeEvaluation?.()}
    >
      등급 평가
    </CmsButton>
  )
  const jaEvaluationGradeDisplay = user.listMetrics?.jaEvaluationGrade?.trim() ? (
    <span className="instructor-detail-edit-form__ja-grade">
      <span>{jaEvaluationGradeLine(user)}</span>
      <DetailInfoForm.InputsSeparator />
      {gradeEvaluateButton}
    </span>
  ) : (
    gradeEvaluateButton
  )

  const basicInfoPrefix = (
    <>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label={isInstructorPermissionDetail ? '권한 승인 현황' : '정산 현황'}
          view={settlementStatusView(user)}
          edit={<span>{settlementStatusView(user)}</span>}
        />
        <DetailInfoForm.Field
          label="JA 평가 등급"
          view={jaEvaluationGradeDisplay}
          edit={jaEvaluationGradeDisplay}
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="가입일"
          view={formatDate(user.createdAt)}
          edit={<span>{formatDate(user.createdAt)}</span>}
        />
        <DetailInfoForm.Field
          label="연동된 소셜 계정"
          view={socialView(user)}
          edit={<span>{socialView(user)}</span>}
        />
      </DetailInfoForm.Row>
    </>
  )

  const basicInfoExtraBeforeBusinessIncome = !isInstructorPermissionDetail ? (
    <DetailInfoForm.Row type="single">
      <DetailInfoForm.Field
        label="강사비 등급"
        fullRow
        view="-"
        edit={
          <CmsSelect
            value={memberInfoDraft.instructorFeeGrade || undefined}
            onChange={v =>
              onMemberInfoDraftChange({
                instructorFeeGrade: v != null ? String(v) : '',
              })
            }
            options={INSTRUCTOR_FEE_GRADE_OPTIONS}
            placeholder="선택"
            inputSize="medium"
            width={240}
          />
        }
      />
    </DetailInfoForm.Row>
  ) : null

  return (
    <Form<InstructorProfileFormValues>
      form={form}
      layout="vertical"
      initialValues={initialValues}
      requiredMark={false}
      className="instructor-detail-edit-form"
      onValuesChange={(_, all) => syncDraftFromForm(all)}
    >
      <InstructorProfileFormBody
        form={form}
        layoutVariant="detailEdit"
        basicInfoPrefix={basicInfoPrefix}
        basicInfoExtraBeforeBusinessIncome={basicInfoExtraBeforeBusinessIncome}
      />
    </Form>
  )
}
