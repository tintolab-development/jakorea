import { InfoCircleOutlined } from '@ant-design/icons'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsButton } from '@/shared/ui'
import type { TemplateRow } from '@/features/template/model/template.schema'
import {
  WritingTemplateSelectModal,
  type WritingTemplateSelectCategory,
} from '@/features/program/shared/ui/registration/writing-template-select-modal'
import './step-template-banner.css'

export type RegistrationStepTemplateChromeProps = {
  templateName: string
  isDefault: boolean
  category: WritingTemplateSelectCategory
  familyBaseTemplateCode?: string
  allowedFamilyBaseTemplateCode?: string
  pickerOpen: boolean
  onOpenPicker: () => void
  onClosePicker: () => void
  onUseTemplate: (row: TemplateRow) => void
}

export function RegistrationStepTemplateBanner({
  templateName,
  isDefault,
  onChangeTemplate,
}: {
  templateName: string
  isDefault: boolean
  onChangeTemplate: () => void
}) {
  return (
    <div className="step-template-banner">
      <p className="step-template-banner__hint">
        탭별로 기본 템플릿이 자동으로 적용됩니다. 템플릿 변경 시 해당 탭에 작성된 내용이
        초기화됩니다.
      </p>
      <DetailInfoForm title="템플릿" hideHeader mode="view">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="템플릿"
            readOnlyDisplay
            view={
              <div className="step-template-banner__value">
                <span className="step-template-banner__name-wrap">
                  {isDefault ? <span className="step-template-banner__badge">기본</span> : null}
                  <span className="step-template-banner__name">{templateName}</span>
                </span>
                <span className="step-template-banner__divider" aria-hidden />
                <CmsButton
                  type="button"
                  variant="secondary"
                  size="small"
                  onClick={onChangeTemplate}
                >
                  템플릿 변경
                </CmsButton>
              </div>
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}

export function RegistrationStepTemplateFollowHint() {
  return (
    <p className="registration-body-header__template-follow">
      <InfoCircleOutlined className="registration-body-header__template-follow-icon" aria-hidden />
      아래 항목은 선택된 템플릿 기준으로 구성됩니다.
    </p>
  )
}

export function RegistrationStepTemplateChrome({
  templateName,
  isDefault,
  category,
  familyBaseTemplateCode,
  allowedFamilyBaseTemplateCode,
  pickerOpen,
  onOpenPicker,
  onClosePicker,
  onUseTemplate,
}: RegistrationStepTemplateChromeProps) {
  return (
    <>
      <div className="registration-body-header__banner">
        <RegistrationStepTemplateBanner
          templateName={templateName}
          isDefault={isDefault}
          onChangeTemplate={onOpenPicker}
        />
      </div>
      <RegistrationStepTemplateFollowHint />
      {pickerOpen ? (
        <WritingTemplateSelectModal
          open
          category={category}
          familyBaseTemplateCode={familyBaseTemplateCode}
          allowedFamilyBaseTemplateCode={allowedFamilyBaseTemplateCode}
          currentTemplateName={templateName}
          onClose={onClosePicker}
          onUse={onUseTemplate}
        />
      ) : null}
    </>
  )
}
