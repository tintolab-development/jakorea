import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { createProgramApplicationFormEconomyDraft } from '@/features/template/model/program-application-form-economy-draft'
import { createProgramApplicationFormInstructorDraft } from '@/features/template/model/program-application-form-instructor-draft'
import { FormDocumentPreviewParagraph } from '@/features/template/ui/document-preview/form-document-preview-paragraph'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import '@/features/template/ui/document-preview/form-document-preview-body.css'
import '@/features/template/ui/form-editor/form-editor.css'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'
import './application-view.css'

export type CompanySchoolApplicationInfoTabKey = 'institutions' | 'instructors'

const COMPANY_SCHOOL_APPLICATION_INFO_TABS: {
  key: CompanySchoolApplicationInfoTabKey
  label: string
}[] = [
  { key: 'institutions', label: '참여 기관 신청 정보' },
  { key: 'instructors', label: '강사 신청 정보' },
]

function ApplicationFormPreview({
  draft,
  kind,
}: {
  draft: WritingFormDraft
  kind: CompanySchoolApplicationInfoTabKey
}) {
  return (
    <div className="application-view__preview-panel application-view__preview-panel--readonly">
      {draft.paragraphs.map(paragraph => (
        <FormDocumentPreviewParagraph
          key={paragraph.id}
          paragraph={paragraph}
          allParagraphs={draft.paragraphs}
          titleNumbering={draft.formSettings.titleNumbering}
          editorKind="horizontal_table"
          renderMode="card"
          paragraphBodyOptions={
            kind === 'institutions'
              ? {
                  programApplicationFormEconomyInstitution: true,
                }
              : {
                  programApplicationFormInstructor: {
                    enabled: true,
                    programLinkedPreview: true,
                    readOnlyPreview: true,
                  },
                }
          }
        />
      ))}
    </div>
  )
}

export function CompanySchoolApplicationInfoView({
  activeTab,
  onTabChange,
}: {
  activeTab: CompanySchoolApplicationInfoTabKey
  onTabChange: (tab: CompanySchoolApplicationInfoTabKey) => void
}) {
  const institutionDraft = createProgramApplicationFormEconomyDraft()
  const instructorDraft = createProgramApplicationFormInstructorDraft()

  return (
    <div className="application-view program-detail-fullpage-modal__info-tab">
      <CmsTextTabs
        className="application-view__tabs"
        activeKey={activeTab}
        onChange={key => onTabChange(key as CompanySchoolApplicationInfoTabKey)}
        items={COMPANY_SCHOOL_APPLICATION_INFO_TABS}
      />
      <div className="application-view__body">
        <div className="application-view__notice" role="status">
          <p className="application-view__notice-text">현재 화면은 양식 미리보기 화면입니다.</p>
        </div>
        <ApplicationFormPreview
          draft={activeTab === 'instructors' ? instructorDraft : institutionDraft}
          kind={activeTab}
        />
        <div className="application-view__body-bottom" aria-hidden />
      </div>
    </div>
  )
}
