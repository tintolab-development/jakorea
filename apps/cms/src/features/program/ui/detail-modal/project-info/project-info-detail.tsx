/**
 * 프로젝트 정보(공통/참여자·강사·봉사) 패널 — 풀페이지 모달 본문
 *
 * 수정 모드에서 넘어오는 `infoForm` | `institutionsForm` | … 는 모두
 * `UseFormReturn<ProgramDetailEditFormValues>` (react-hook-form + `programDetailEditSchema`).
 *
 * 병합 시: `form={isEditModeX ? xForm : undefined}` 패턴을 유지할 것. `form` 만 props 로 받고
 * 내부에서 새 `useForm` 을 만들면 상위 저장/리셋과 폼 상태가 분리됨.
 */
import { Spin, Typography } from 'antd'
import { AppButton } from '@/shared/ui/app-button'
import type { Program } from '@/types/domain'
import { BasicInfoSection } from './common-info/basic-info-section'
import { CurriculumSection } from './common-info/curriculum-section'
import { ProgramKpiTargetSection } from './common-info/program-kpi-target-section'
import { ProgramWageInfoSection } from './common-info/program-wage-info-section'
import {
  InstructorRecruitmentSection,
  ParticipantRecruitmentSection,
  ProjectInfoRecruitmentSection,
  VolunteerRecruitmentSection,
} from './project-info-recruitment-section'
import {
  DetailInfoSection,
  InstructorDetailInfoSection,
  VolunteerDetailInfoSection,
} from './project-info-detail-info-section'
import { TAB_KEYS, TAB_LABELS, type TabKey } from '../program-detail-nav-types'
import type { UseFormReturn } from 'react-hook-form'
import type { ProgramDetailEditFormValues } from '../../../model/program-detail-edit-schema'
/* 참여자·강사·봉사 탭 상세(썸네일·테이블) 스타일 — 하위 컴포넌트 import에만 의존하지 않도록 고정 */
import './project-info-form-shared.css'

type DetailForm = UseFormReturn<ProgramDetailEditFormValues>

function ProjectInfoDetailTabsRow({
  activeTab,
  onSelectTab,
  displayProgram,
  isEditModeInfo,
  isEditModeInstitutions,
  isEditModeInstructors,
  isEditModeVolunteers,
  onInfoEdit,
  onInfoCancelEdit,
  onInfoSave,
  onInstitutionsSave,
  onInstitutionsCancelEdit,
  onInstructorsCancelEdit,
  onInstructorsSave,
  onVolunteersSave,
  onVolunteersCancelEdit,
  onPreview,
}: {
  activeTab: TabKey
  onSelectTab: (key: TabKey) => void
  displayProgram: Program | null
  isEditModeInfo: boolean
  isEditModeInstitutions: boolean
  isEditModeInstructors: boolean
  isEditModeVolunteers: boolean
  onInfoEdit: () => void
  onInfoCancelEdit: () => void
  onInfoSave: () => void
  onInstitutionsSave: () => void
  onInstitutionsCancelEdit: () => void
  onInstructorsCancelEdit: () => void
  onInstructorsSave: () => void
  onVolunteersSave: () => void
  onVolunteersCancelEdit: () => void
  onPreview: () => void
}) {
  return (
    <div className="program-detail-fullpage-modal__tabs-row">
      <div className="program-detail-fullpage-modal__tabs">
        {TAB_KEYS.map(key => (
          <button
            key={key}
            type="button"
            className={`program-detail-fullpage-modal__tab ${activeTab === key ? 'program-detail-fullpage-modal__tab--active' : ''}`}
            onClick={() => onSelectTab(key)}
          >
            <span className="program-detail-fullpage-modal__tab-label">{TAB_LABELS[key]}</span>
          </button>
        ))}
      </div>
      {displayProgram && (
        <div className="program-detail-fullpage-modal__header-actions">
          {activeTab === 'info' ? (
            <>
              {isEditModeInfo && (
                <AppButton variant="danger" size="filter" onClick={onInfoCancelEdit}>
                  수정 취소
                </AppButton>
              )}
              <AppButton
                variant="primary"
                size="filter"
                onClick={isEditModeInfo ? onInfoSave : onInfoEdit}
              >
                {isEditModeInfo ? '수정사항 저장' : '정보 수정'}
              </AppButton>
            </>
          ) : activeTab === 'institutions' ? (
            <>
              {isEditModeInstitutions && (
                <AppButton variant="danger" size="filter" onClick={onInstitutionsCancelEdit}>
                  수정 취소
                </AppButton>
              )}
              <AppButton
                variant="primary"
                size="filter"
                onClick={isEditModeInstitutions ? onInstitutionsSave : onInfoEdit}
              >
                {isEditModeInstitutions ? '수정사항 저장' : '정보 수정'}
              </AppButton>
            </>
          ) : activeTab === 'volunteers' ? (
            <>
              {isEditModeVolunteers && (
                <AppButton variant="danger" size="filter" onClick={onVolunteersCancelEdit}>
                  수정 취소
                </AppButton>
              )}
              <AppButton
                variant="primary"
                size="filter"
                onClick={isEditModeVolunteers ? onVolunteersSave : onInfoEdit}
              >
                {isEditModeVolunteers ? '수정사항 저장' : '정보 수정'}
              </AppButton>
            </>
          ) : activeTab === 'instructors' ? (
            <>
              {isEditModeInstructors && (
                <AppButton variant="danger" size="filter" onClick={onInstructorsCancelEdit}>
                  수정 취소
                </AppButton>
              )}
              <AppButton
                variant="primary"
                size="filter"
                onClick={isEditModeInstructors ? onInstructorsSave : onInfoEdit}
              >
                {isEditModeInstructors ? '수정사항 저장' : '정보 수정'}
              </AppButton>
            </>
          ) : null}
          <AppButton
            variant="primary"
            size="filter-wide"
            className="program-detail-fullpage-modal__program-preview-btn"
            onClick={onPreview}
          >
            프로그램 상세 미리보기
          </AppButton>
        </div>
      )}
    </div>
  )
}

export interface ProjectInfoDetailPanelsProps {
  program: Program | null
  sponsorName: string | undefined
  /** `loading && !program` — 본문 영역에 스피너 */
  isBodyLoading: boolean
  activeTab: TabKey
  onSelectTab: (key: TabKey) => void
  isEditModeInfo: boolean
  infoForm: DetailForm | undefined
  isEditModeInstitutions: boolean
  institutionsForm: DetailForm | undefined
  registerInstitutionsAdditionalHtml: (getter: () => string) => void
  isEditModeInstructors: boolean
  instructorsForm: DetailForm | undefined
  registerInstructorsAdditionalHtml: (getter: () => string) => void
  isEditModeVolunteers: boolean
  volunteersForm: DetailForm | undefined
  registerVolunteersAdditionalHtml: (getter: () => string) => void
  onInfoEdit: () => void
  onInfoCancelEdit: () => void
  onInfoSave: () => void
  onInstitutionsSave: () => void
  onInstitutionsCancelEdit: () => void
  onInstructorsCancelEdit: () => void
  onInstructorsSave: () => void
  onVolunteersSave: () => void
  onVolunteersCancelEdit: () => void
  onPreview: () => void
}

export function ProjectInfoDetailPanels({
  program,
  sponsorName,
  isBodyLoading,
  activeTab,
  onSelectTab,
  isEditModeInfo,
  infoForm,
  isEditModeInstitutions,
  institutionsForm,
  registerInstitutionsAdditionalHtml,
  isEditModeInstructors,
  instructorsForm,
  registerInstructorsAdditionalHtml,
  isEditModeVolunteers,
  volunteersForm,
  registerVolunteersAdditionalHtml,
  onInfoEdit,
  onInfoCancelEdit,
  onInfoSave,
  onInstitutionsSave,
  onInstitutionsCancelEdit,
  onInstructorsCancelEdit,
  onInstructorsSave,
  onVolunteersSave,
  onVolunteersCancelEdit,
  onPreview,
}: ProjectInfoDetailPanelsProps) {
  return (
    <>
      <ProjectInfoDetailTabsRow
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        displayProgram={program}
        isEditModeInfo={isEditModeInfo}
        isEditModeInstitutions={isEditModeInstitutions}
        isEditModeInstructors={isEditModeInstructors}
        isEditModeVolunteers={isEditModeVolunteers}
        onInfoEdit={onInfoEdit}
        onInfoCancelEdit={onInfoCancelEdit}
        onInfoSave={onInfoSave}
        onInstitutionsSave={onInstitutionsSave}
        onInstitutionsCancelEdit={onInstitutionsCancelEdit}
        onInstructorsCancelEdit={onInstructorsCancelEdit}
        onInstructorsSave={onInstructorsSave}
        onVolunteersSave={onVolunteersSave}
        onVolunteersCancelEdit={onVolunteersCancelEdit}
        onPreview={onPreview}
      />
      {isBodyLoading ? (
        <div className="program-detail-fullpage-modal__loading">
          <Spin size="large" />
        </div>
      ) : program ? (
        <>
          {activeTab === 'info' && (
            <div className="program-detail-fullpage-modal__info-tab">
              <BasicInfoSection
                program={program}
                sponsorName={sponsorName}
                createdByName={program.createdByName}
                updatedByName={program.updatedByName}
                lifecycleStatus={program.lifecycleStatus ?? undefined}
                isEditMode={isEditModeInfo}
                form={isEditModeInfo ? infoForm : undefined}
                displayMode="commonInfo"
              />
              <ProgramKpiTargetSection
                programId={program.id}
                isEditMode={isEditModeInfo}
                form={isEditModeInfo ? infoForm : undefined}
              />
              <ProgramWageInfoSection
                programId={program.id}
                isEditMode={isEditModeInfo}
                form={isEditModeInfo ? infoForm : undefined}
              />
              <CurriculumSection
                program={program}
                isEditMode={isEditModeInfo}
                form={isEditModeInfo ? infoForm : undefined}
              />
            </div>
          )}
          {activeTab === 'institutions' && (
            <ProjectInfoRecruitmentSection
              recruitment={
                <ParticipantRecruitmentSection
                  program={program}
                  sponsorName={sponsorName}
                  isEditMode={isEditModeInstitutions}
                  form={isEditModeInstitutions ? institutionsForm : undefined}
                />
              }
              detail={
                <DetailInfoSection
                  program={program}
                  isEditMode={isEditModeInstitutions}
                  form={isEditModeInstitutions ? institutionsForm : undefined}
                  onRegisterGetAdditionalContentHtml={registerInstitutionsAdditionalHtml}
                  showThumbnail
                />
              }
            />
          )}
          {activeTab === 'instructors' && (
            <ProjectInfoRecruitmentSection
              recruitment={
                <InstructorRecruitmentSection
                  program={program}
                  sponsorName={sponsorName}
                  isEditMode={isEditModeInstructors}
                  form={isEditModeInstructors ? instructorsForm : undefined}
                />
              }
              detail={
                <InstructorDetailInfoSection
                  program={program}
                  isEditMode={isEditModeInstructors}
                  form={isEditModeInstructors ? instructorsForm : undefined}
                  onRegisterGetAdditionalContentHtml={registerInstructorsAdditionalHtml}
                />
              }
            />
          )}
          {activeTab === 'volunteers' && (
            <ProjectInfoRecruitmentSection
              recruitment={
                <VolunteerRecruitmentSection
                  program={program}
                  sponsorName={sponsorName}
                  isEditMode={isEditModeVolunteers}
                  form={isEditModeVolunteers ? volunteersForm : undefined}
                />
              }
              detail={
                <VolunteerDetailInfoSection
                  program={program}
                  isEditMode={isEditModeVolunteers}
                  form={isEditModeVolunteers ? volunteersForm : undefined}
                  onRegisterGetAdditionalContentHtml={registerVolunteersAdditionalHtml}
                />
              }
            />
          )}
        </>
      ) : (
        <Typography.Text type="secondary">프로그램 정보를 찾을 수 없습니다.</Typography.Text>
      )}
    </>
  )
}
