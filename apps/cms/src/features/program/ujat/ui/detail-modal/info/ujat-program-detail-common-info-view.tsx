/**
 * UJAT 프로그램 상세 — 공통 정보(조회 전용)
 * UJAT 프로그램 등록 폼 단락 순서·DetailInfoForm 레이아웃과 맞춤.
 * 등록 폼 단락은 overlay 기반이라 상세는 Program + KPI API 등으로 표시한다.
 */
import type { Program } from '@/types/domain'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { programToDetailEditValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { ProgramKpiTargetSection } from '@/features/program/shared/ui/program-detail/project-info/common-info/program-kpi-target-section'
import {
  BUSINESS_AREA_OPTIONS,
  CATEGORY_LABEL,
  COURSE_DELIVERED_BY_OPTIONS,
  EDUCATION_PROCESS_OPTIONS,
  formatDate,
  formatDateRange,
  IP_OWNED_OPTIONS,
  IPS_OPTIONS,
  PARTNER_INVOLVEMENT_OPTIONS,
  TARGET_LEVEL_LABEL,
} from '@/features/program/shared/lib/program-detail-info-constants'
import { StatusBadge } from '@/shared/components/status-badge'
import { FEATURE_COMING_SOON_ALERT_MESSAGE } from '@/shared/constants/messages'
import { getUjatProgramProgressDisplayStatus } from './ujat-program-info-edit'
import {
  UjatHalfEducationScheduleReadonly,
  UJAT_FIRST_HALF_SCHEDULE_ROWS,
  UJAT_SECOND_HALF_SCHEDULE_ROWS,
} from './ujat-half-education-schedule-readonly'
import { UjatEducationScheduleSettingsReadonly } from './ujat-education-schedule-settings-readonly'
import { UjatRegionCapacityReadonly } from './ujat-region-capacity-readonly'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'
import './ujat-program-detail-common-info-view.css'

function optionLabel<T extends { value: string; label: string }>(
  options: readonly T[],
  value: string | undefined | null
): string {
  if (value == null || value === '') return '-'
  return options.find(o => o.value === value)?.label ?? value
}

function UjatProgressStatusView({ program }: { program: Program }) {
  const status = getUjatProgramProgressDisplayStatus(program)
  return <StatusBadge domain="programEnrollment" status={status} variant="text" />
}

function participantTypeSummary(program: Program): string {
  const cat = CATEGORY_LABEL[program.category] ?? program.category ?? '-'
  const level = program.targetLevel
    ? (TARGET_LEVEL_LABEL[program.targetLevel] ?? program.targetLevel)
    : null
  return level ? `${cat}, ${level}` : cat
}

function normalizeExternalUrl(url: string): string {
  const trimmed = url.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

/** 후원사명 — 클릭 시 홈페이지(데이터 연동 전: 준비 중 알림) */
function UjatSponsorLink({
  name,
  homepageUrl,
}: {
  name: string
  homepageUrl?: string | null
}) {
  const handleClick = () => {
    const url = homepageUrl?.trim()
    if (url) {
      window.open(normalizeExternalUrl(url), '_blank', 'noopener,noreferrer')
      return
    }
    window.alert(FEATURE_COMING_SOON_ALERT_MESSAGE)
  }

  return (
    <button
      type="button"
      className="ujat-program-detail-common-info-view__sponsor-link"
      onClick={handleClick}
    >
      {name}
    </button>
  )
}

/** 기본 정보 — 스크린샷 5블록(각각 DetailInfoForm) */
function UjatBasicInfoFiveBlocks({
  program,
  sponsorName,
  sponsorHomepageUrl,
  v,
  operationRange,
}: {
  program: Program
  sponsorName?: string
  sponsorHomepageUrl?: string | null
  v: ReturnType<typeof programToDetailEditValues>
  operationRange: string
}) {
  const managerLine = [v.managerName, v.contactPhone].filter(Boolean).join(' | ') || '-'
  const sponsorDisplay = sponsorName?.trim() ? (
    <UjatSponsorLink name={sponsorName.trim()} homepageUrl={sponsorHomepageUrl} />
  ) : (
    '-'
  )

  return (
    <div
      className="ujat-program-detail-common-info-view__basic-info"
      role="group"
      aria-label="기본 정보"
    >
      {/* 1. 등록·수정 */}
      <DetailInfoForm title="기본 정보" mode="view" className="program-registration-paragraph">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="최초 등록일"
            view={
              <>
                {formatDate(program.createdAt)}
                {program.createdByName ? ` | ${program.createdByName}` : null}
              </>
            }
          />
          <DetailInfoForm.Field
            label="마지막 수정일"
            view={
              <>
                {formatDate(program.updatedAt)}
                {program.updatedByName ? ` | ${program.updatedByName}` : null}
              </>
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      {/* 2. 프로그램명 */}
      <DetailInfoForm
        title="기본 정보 — 프로그램명"
        hideHeader
        mode="view"
        className="program-registration-paragraph ujat-program-detail-common-info-view__basic-info-block"
      >
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="대표 프로그램명 (국문)" view={v.mainTitle?.trim() || '-'} />
          <DetailInfoForm.Field
            label="대표 프로그램명 (영문)"
            view={program.titleEn?.trim() || '-'}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="프로그램 관리명" view={v.title?.trim() || '-'} />
          <DetailInfoForm.Field
            label="세부 프로그램명"
            view={program.teamDivision?.trim() || program.textbookName?.trim() || '-'}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      {/* 3. 운영·진행 현황 */}
      <DetailInfoForm
        title="기본 정보 — 운영"
        hideHeader
        mode="view"
        className="program-registration-paragraph ujat-program-detail-common-info-view__basic-info-block"
      >
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="사업 운영 기간" view={operationRange} />
          <DetailInfoForm.Field
            label="프로그램 진행 현황"
            view={program.ujatProgressStatus || program.lifecycleStatus ? (
              <UjatProgressStatusView program={program} />
            ) : (
              '-'
            )}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="참여자 유형" view={participantTypeSummary(program)} />
          <DetailInfoForm.Field
            label="사업 분야"
            view={optionLabel(BUSINESS_AREA_OPTIONS, v.businessArea)}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      {/* 4. 후원·설문 */}
      <DetailInfoForm
        title="기본 정보 — 후원"
        hideHeader
        mode="view"
        className="program-registration-paragraph ujat-program-detail-common-info-view__basic-info-block"
      >
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="후원사" view={sponsorDisplay} />
          <DetailInfoForm.Field label="후원사 담당자" view={managerLine} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="설문 진행 항목"
            fullRow
            view="설문조사, 학생 만족도조사, 교사 만족도조사, 강의평가"
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      {/* 5. 교육·IPS */}
      <DetailInfoForm
        title="기본 정보 — 교육·IPS"
        hideHeader
        mode="view"
        className="program-registration-paragraph ujat-program-detail-common-info-view__basic-info-block"
      >
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="교육 과정"
            view={optionLabel(EDUCATION_PROCESS_OPTIONS, v.educationProcess ?? program.curriculum)}
          />
          <DetailInfoForm.Field label="IP Owned" view={optionLabel(IP_OWNED_OPTIONS, v.ipOwned)} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="Course Delivered By"
            view={optionLabel(COURSE_DELIVERED_BY_OPTIONS, v.courseDeliveredBy ?? undefined)}
          />
          <DetailInfoForm.Field
            label="Partner Involvement"
            view={
              program.partnerInvolvement == null
                ? '-'
                : (PARTNER_INVOLVEMENT_OPTIONS.find(o => o.value === program.partnerInvolvement)
                    ?.label ?? '-')
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="IPS 유형"
            view={program.ips ? optionLabel(IPS_OPTIONS, program.ips) : '-'}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}

export interface UjatProgramDetailCommonInfoViewProps {
  program: Program
  sponsorName?: string
  /** 후원사 홈페이지 URL — 없으면 클릭 시 준비 중 알림 */
  sponsorHomepageUrl?: string | null
}

export function UjatProgramDetailCommonInfoView({
  program,
  sponsorName,
  sponsorHomepageUrl,
}: UjatProgramDetailCommonInfoViewProps) {
  const v = programToDetailEditValues(program)
  const operationRange = formatDateRange(program.startDate, program.endDate)

  return (
    <div className="ujat-program-detail-common-info-view program-detail-fullpage-modal__info-tab">
      <UjatBasicInfoFiveBlocks
        program={program}
        sponsorName={sponsorName}
        sponsorHomepageUrl={sponsorHomepageUrl}
        v={v}
        operationRange={operationRange}
      />

      <ProgramKpiTargetSection programId={program.id} isEditMode={false} />

      <div className="ujat-program-detail-common-info-view__section">
        <DetailInfoForm title="임금 정보" mode="view" className="program-registration-paragraph">
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field label="지급 항목" view="봉사활동비" />
            <DetailInfoForm.Field label="공제 항목" view="일용근로자 원천징수세액" />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>

      <UjatHalfEducationScheduleReadonly title="상반기 교육 일정" rows={UJAT_FIRST_HALF_SCHEDULE_ROWS} />

      <UjatHalfEducationScheduleReadonly title="하반기 교육 일정" rows={UJAT_SECOND_HALF_SCHEDULE_ROWS} />

      <UjatEducationScheduleSettingsReadonly />

      <UjatRegionCapacityReadonly />
    </div>
  )
}
