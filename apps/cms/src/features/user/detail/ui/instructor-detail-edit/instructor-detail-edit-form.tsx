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
import { socialView } from '@/features/user/detail/ui/user-basic-info/display'
import { InstructorJaEvaluationGradeField } from '@/features/user/detail/ui/user-basic-info/instructor-ja-grade-field'
import {
  PermissionApprovalStatusWithResend,
  settlementStatusView,
} from '@/features/user/detail/ui/user-basic-info/status'
import {
  InstructorProfileFormBody,
  type InstructorProfileFormValues,
} from '@/features/user/shared/ui/instructor-profile-form'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsSelect } from '@/shared/ui'
import { INSTRUCTOR_FEE_GRADE_OPTIONS } from '@/data/mock/program-wage-info'
import { formatDate } from '@/shared/utils'
import '@/features/user/shared/ui/instructor-register-modal.css'
import './instructor-detail-edit-form.css'

/**
 * 강사 상세 기본 정보의 **수정 UI SSOT 판정** — 조회 카드
 * (`InstructorMetaSection`/`InstructorSection`) 대신 이 폼을 렌더할지.
 *
 * 수정 진입 자체가 `startBasicInfoEdit`에서 `role === 'INSTRUCTOR' && bodyKey === 'instructor'`
 * 로만 허용되므로, 강사 편집 중에는 항상 이 폼이 조회 카드를 대체한다.
 * draft·onChange를 함께 반환해 호출부에서 별도 non-null 처리가 필요 없다.
 */
export function resolveInstructorRegisterLikeEdit(params: {
  user: Pick<Omit<User, 'password'>, 'role'>
  memberInfoEditing?: boolean
  memberInfoDraft?: AdminProvisionedMemberBasicInfoDraft | null
  onMemberInfoDraftChange?: (partial: Partial<AdminProvisionedMemberBasicInfoDraft>) => void
}): Pick<InstructorDetailEditFormProps, 'memberInfoDraft' | 'onMemberInfoDraftChange'> | null {
  const { user, memberInfoEditing, memberInfoDraft, onMemberInfoDraftChange } = params
  if (!memberInfoEditing || user.role !== 'INSTRUCTOR') return null
  if (memberInfoDraft == null || onMemberInfoDraftChange == null) return null
  return { memberInfoDraft, onMemberInfoDraftChange }
}

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

  /** setFieldValue(동의서 완료)는 onValuesChange를 안 타므로 form 전체로 draft flush */
  const flushDraftFromForm = () => {
    syncDraftFromForm(form.getFieldsValue(true) as InstructorProfileFormValues)
  }

  const jaEvaluationGradeDisplay = (
    <InstructorJaEvaluationGradeField
      user={user}
      wrapClassName="instructor-detail-edit-form__ja-grade"
      onOpenJaGradeEvaluation={onOpenJaGradeEvaluation}
    />
  )

  const permissionApprovalStatus = (
    <PermissionApprovalStatusWithResend user={user} notifyPermissionRole="instructor" />
  )

  const basicInfoPrefix = (
    <>
      <DetailInfoForm.Row type="double">
        {isInstructorPermissionDetail ? (
          <DetailInfoForm.Field
            label="권한 승인 현황"
            view={permissionApprovalStatus}
            edit={permissionApprovalStatus}
          />
        ) : (
          <DetailInfoForm.Field
            label="정산 현황"
            view={settlementStatusView(user)}
            edit={<span>{settlementStatusView(user)}</span>}
          />
        )}
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
        onConsentValuesCommit={flushDraftFromForm}
      />
    </Form>
  )
}
