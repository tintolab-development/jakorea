/**
 * 프로젝트 정보(공통/참여자·강사·봉사) 패널 — 풀페이지 모달 본문
 *
 * 수정 모드에서 넘어오는 `infoForm` | `institutionsForm` | … 는 모두
 * `UseFormReturn<ProgramDetailEditFormValues>` (react-hook-form + `programDetailEditSchema`).
 *
 * 병합 시: `form={isEditModeX ? xForm : undefined}` 패턴을 유지할 것. `form` 만 props 로 받고
 * 내부에서 새 `useForm` 을 만들면 상위 저장/리셋과 폼 상태가 분리됨.
 */
import type { ReactNode } from 'react'
import { Spin, Typography } from 'antd'

import type { Program } from '@/types/domain'
import { BasicInfoSection } from './common-info/basic-info-section'
import { CurriculumSection } from './common-info/curriculum-section'
import { ProgramKpiTargetSection } from './common-info/program-kpi-target-section'
import { ProgramWageInfoSection } from './common-info/program-wage-info-section'
import {
  InstructorRecruitmentSection,
  ParticipantRecruitmentSection,
  VolunteerRecruitmentSection,
} from './recruitment/project-info-recruitment-section'
import {
  DetailInfoSection,
  InstructorDetailInfoSection,
  VolunteerDetailInfoSection,
} from './detail-info/project-info-detail-info-section'
import { TAB_KEYS, TAB_LABELS, type TabKey } from '../../../ui/detail-modal/program-detail-nav-types'
import type { UseFormReturn } from 'react-hook-form'
import type { ProgramDetailEditFormValues } from '../../../model/program-detail-edit-schema'
/* 참여자·강사·봉사 탭 상세(썸네일·테이블) 스타일 — 하위 컴포넌트 import에만 의존하지 않도록 고정 */
import './project-info-form-shared.css'
import { CmsButton } from '@/shared/ui'

type DetailForm = UseFormReturn<ProgramDetailEditFormValues>

type RecruitmentDetailTabKey = Exclude<TabKey, 'info'>

function ProjectRecruitmentTabsContent({
  activeTab,
  program,
  sponsorName,
  isEditModeInstitutions,
  institutionsForm,
  registerInstitutionsAdditionalHtml,
  isEditModeInstructors,
  instructorsForm,
  registerInstructorsAdditionalHtml,
  isEditModeVolunteers,
  volunteersForm,
  registerVolunteersAdditionalHtml,
}: {
  activeTab: RecruitmentDetailTabKey
  program: Program
  sponsorName: string | undefined
  isEditModeInstitutions: boolean
  institutionsForm: DetailForm | undefined
  registerInstitutionsAdditionalHtml: (getter: () => string) => void
  isEditModeInstructors: boolean
  instructorsForm: DetailForm | undefined
  registerInstructorsAdditionalHtml: (getter: () => string) => void
  isEditModeVolunteers: boolean
  volunteersForm: DetailForm | undefined
  registerVolunteersAdditionalHtml: (getter: () => string) => void
}) {
  let recruitment: ReactNode
  let detail: ReactNode

  switch (activeTab) {
    case 'institutions':
      recruitment = (
        <ParticipantRecruitmentSection
          program={program}
          sponsorName={sponsorName}
          isEditMode={isEditModeInstitutions}
          form={isEditModeInstitutions ? institutionsForm : undefined}
        />
      )
      detail = (
        <DetailInfoSection
          program={program}
          isEditMode={isEditModeInstitutions}
          form={isEditModeInstitutions ? institutionsForm : undefined}
          onRegisterGetAdditionalContentHtml={registerInstitutionsAdditionalHtml}
          showThumbnail
        />
      )
      break
    case 'instructors':
      recruitment = (
        <InstructorRecruitmentSection
          program={program}
          sponsorName={sponsorName}
          isEditMode={isEditModeInstructors}
          form={isEditModeInstructors ? instructorsForm : undefined}
        />
      )
      detail = (
        <InstructorDetailInfoSection
          program={program}
          isEditMode={isEditModeInstructors}
          form={isEditModeInstructors ? instructorsForm : undefined}
          onRegisterGetAdditionalContentHtml={registerInstructorsAdditionalHtml}
        />
      )
      break
    case 'volunteers':
      recruitment = (
        <VolunteerRecruitmentSection
          program={program}
          sponsorName={sponsorName}
          isEditMode={isEditModeVolunteers}
          form={isEditModeVolunteers ? volunteersForm : undefined}
        />
      )
      detail = (
        <VolunteerDetailInfoSection
          program={program}
          isEditMode={isEditModeVolunteers}
          form={isEditModeVolunteers ? volunteersForm : undefined}
          onRegisterGetAdditionalContentHtml={registerVolunteersAdditionalHtml}
        />
      )
      break
    default: {
      const _exhaustive: never = activeTab
      return _exhaustive
    }
  }

  return (
    <div>
      {recruitment}
      <div className="detail-info-form--gap">{detail}</div>
    </div>
  )
}

function ProjectInfoDetailTabsRow({
  activeTab,
  onSelectTab,
  displayProgram,
  isEditModeInfo,
  isEditModeInstitutions,
  isEditModeInstructors,
  isEditModeVolunteers,
  onInfoEdit,
  onInfoSave,
  onInstitutionsSave,
  onInstructorsSave,
  onVolunteersSave,
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
  onInfoSave: () => void
  onInstitutionsSave: () => void
  onInstructorsSave: () => void
  onVolunteersSave: () => void
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
              <CmsButton onClick={isEditModeInfo ? onInfoSave : onInfoEdit}>
                {isEditModeInfo ? '정보 저장' : '정보 수정'}
              </CmsButton>
            </>
          ) : activeTab === 'institutions' ? (
            <>
              <CmsButton onClick={isEditModeInstitutions ? onInstitutionsSave : onInfoEdit}>
                {isEditModeInstitutions ? '정보 저장' : '정보 수정'}
              </CmsButton>
            </>
          ) : activeTab === 'volunteers' ? (
            <>
              <CmsButton onClick={isEditModeVolunteers ? onVolunteersSave : onInfoEdit}>
                {isEditModeVolunteers ? '정보 저장' : '정보 수정'}
              </CmsButton>
            </>
          ) : activeTab === 'instructors' ? (
            <>
              <CmsButton onClick={isEditModeInstructors ? onInstructorsSave : onInfoEdit}>
                {isEditModeInstructors ? '정보 저장' : '정보 수정'}
              </CmsButton>
            </>
          ) : null}
          <CmsButton width={180} onClick={onPreview}>
            프로그램 상세 미리보기
          </CmsButton>
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
  /** true면 상단 탭 행·헤더 액션을 렌더하지 않음(UJAT 공통 정보 등 외부에서 탭·버튼을 구성할 때) */
  hideTabsRow?: boolean
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
  onInfoSave: () => void
  onInstitutionsSave: () => void
  onInstructorsSave: () => void
  onVolunteersSave: () => void
  onPreview: () => void
}

export function ProjectInfoDetailPanels({
  program,
  sponsorName,
  isBodyLoading,
  hideTabsRow = false,
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
  onInfoSave,
  onInstitutionsSave,
  onInstructorsSave,
  onVolunteersSave,
  onPreview,
}: ProjectInfoDetailPanelsProps) {
  return (
    <>
      {!hideTabsRow ? (
        <ProjectInfoDetailTabsRow
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          displayProgram={program}
          isEditModeInfo={isEditModeInfo}
          isEditModeInstitutions={isEditModeInstitutions}
          isEditModeInstructors={isEditModeInstructors}
          isEditModeVolunteers={isEditModeVolunteers}
          onInfoEdit={onInfoEdit}
          onInfoSave={onInfoSave}
          onInstitutionsSave={onInstitutionsSave}
          onInstructorsSave={onInstructorsSave}
          onVolunteersSave={onVolunteersSave}
          onPreview={onPreview}
        />
      ) : null}
      {isBodyLoading ? (
        <div className="program-detail-fullpage-modal__loading">
          <Spin size="large" />
        </div>
      ) : program ? (
        <>
          {activeTab === 'info' && (
            <div className="program-detail-fullpage-modal__info-tab">
              <BasicInfoSection // 기본 정보
                program={program}
                sponsorName={sponsorName}
                createdByName={program.createdByName}
                updatedByName={program.updatedByName}
                lifecycleStatus={program.lifecycleStatus ?? undefined}
                isEditMode={isEditModeInfo}
                form={isEditModeInfo ? infoForm : undefined}
              />
              <ProgramKpiTargetSection // 사업 KPI 목표
                programId={program.id}
                isEditMode={isEditModeInfo}
                form={isEditModeInfo ? infoForm : undefined}
              />
              <ProgramWageInfoSection // 임금 정보
                programId={program.id}
                isEditMode={isEditModeInfo}
                form={isEditModeInfo ? infoForm : undefined}
              />
              <CurriculumSection // 교육 커리큘럼
                program={program}
                isEditMode={isEditModeInfo}
                form={isEditModeInfo ? infoForm : undefined}
              />
            </div>
          )}
          {(activeTab === 'institutions' ||
            activeTab === 'instructors' ||
            activeTab === 'volunteers') && (
            <ProjectRecruitmentTabsContent
              activeTab={activeTab}
              program={program}
              sponsorName={sponsorName}
              isEditModeInstitutions={isEditModeInstitutions}
              institutionsForm={institutionsForm}
              registerInstitutionsAdditionalHtml={registerInstitutionsAdditionalHtml}
              isEditModeInstructors={isEditModeInstructors}
              instructorsForm={instructorsForm}
              registerInstructorsAdditionalHtml={registerInstructorsAdditionalHtml}
              isEditModeVolunteers={isEditModeVolunteers}
              volunteersForm={volunteersForm}
              registerVolunteersAdditionalHtml={registerVolunteersAdditionalHtml}
            />
          )}
        </>
      ) : (
        <Typography.Text type="secondary">프로그램 정보를 찾을 수 없습니다.</Typography.Text>
      )}
    </>
  )
}
