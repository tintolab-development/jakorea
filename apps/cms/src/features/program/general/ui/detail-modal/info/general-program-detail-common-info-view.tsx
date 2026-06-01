/**
 * 일반 프로그램 상세 — 공통 정보 (조회 전용)
 * 프로그램 등록 양식 overlay(단락 title + DetailInfoForm hideHeader)와 동일 레이아웃
 */

import { Fragment, type ReactNode } from 'react'
import type { Program } from '@/types/domain'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { programToDetailEditValues } from '@/features/program/shared/model/program-detail-edit-schema'
import {
  BUSINESS_AREA_OPTIONS,
  COURSE_DELIVERED_BY_OPTIONS,
  EDUCATION_PROCESS_OPTIONS,
  formatDate,
  formatDateRange,
  IP_OWNED_OPTIONS,
  PARTNER_INVOLVEMENT_OPTIONS,
} from '@/features/program/shared/lib/program-detail-info-constants'
import { getProgramProgressPhaseDisplay } from '@/shared/constants/status'
import { FEATURE_COMING_SOON_ALERT_MESSAGE } from '@/shared/constants/messages'
import { ProgramDetailSponsorLink } from '@/features/program/shared/ui/program-detail/program-detail-sponsor-link'
import {
  formatGeneralParticipantTypesSummary,
  formatGeneralSurveyItemsSummary,
  resolveGeneralProgramCommonInfo,
} from '@/features/program/general/lib/general-program-detail-common-info-display'
import {
  GENERAL_PROGRAM_EDUCATION_STRUCTURE_LABELS,
  GENERAL_PROGRAM_SESSION_ROUND_LABELS,
  resolveGeneralProgramVariantFromProgram,
} from '@/features/program/general/lib/general-program-variant'
import { CmsButton } from '@/shared/ui'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'
import './general-program-detail-common-info-view.css'

function optionLabel<T extends { value: string; label: string }>(
  options: readonly T[],
  value: string | undefined | null
): string {
  if (value == null || value === '') return '-'
  return options.find(o => o.value === value)?.label ?? value
}

/** 등록 양식 단락 title + 본문(DetailInfoForm hideHeader) */
function ProgramRegistrationDetailSection({
  title,
  children,
  bodyClassName,
}: {
  title: string
  children: ReactNode
  bodyClassName?: string
}) {
  return (
    <section className="general-program-detail-common-info-view__section" aria-label={title}>
      <header className="detail-info-form__header">
        <div className="detail-info-form__header-lead">
          <h2 className="detail-info-form__title">{title}</h2>
        </div>
      </header>
      <div
        className={['general-program-detail-common-info-view__section-body', bodyClassName]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </div>
    </section>
  )
}

function PipeSeparatedInlineView({ text }: { text: string | undefined | null }) {
  const trimmed = text?.trim()
  if (!trimmed || trimmed === '-') return <>-</>
  const parts = trimmed.split(/\s*\|\s*/)
  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={`${part}-${index}`}>
          {index > 0 ? <DetailInfoForm.InputsSeparator /> : null}
          {part}
        </Fragment>
      ))}
    </>
  )
}

function ProgramProgressView({ program }: { program: Program }) {
  const status = program.lifecycleStatus
  if (!status) return <>-</>
  const { label, color } = getProgramProgressPhaseDisplay(status)
  return (
    <span className="general-program-detail-common-info-view__progress-status" style={{ color }}>
      {label}
    </span>
  )
}

function KpiBoldNumber({ value }: { value: number }) {
  return <span className="general-program-detail-common-info-view__kpi-number">{value}</span>
}

function BasicInfoSection({
  program,
  sponsorName,
  v,
  operationRange,
  commonInfo,
}: {
  program: Program
  sponsorName?: string
  v: ReturnType<typeof programToDetailEditValues>
  operationRange: string
  commonInfo: ReturnType<typeof resolveGeneralProgramCommonInfo>
}) {
  const announcementTitle = commonInfo.announcementTitle ?? program.title
  const detailedName =
    commonInfo.detailedProgramName?.trim() ||
    program.textbookName?.trim() ||
    program.teamDivision?.trim() ||
    '-'
  const venueType =
    program.institutionType === 'inside_school'
      ? '기관 안'
      : program.institutionType === 'outside_school'
        ? '기관 밖'
        : program.venue?.trim() || '기관 안'
  const venueLine = [venueType, commonInfo.venueDetail?.trim() || '-'].join(' | ')
  const resolvedSponsorName =
    commonInfo.sponsorDisplayName?.trim() || sponsorName?.trim() || ''
  const sponsorDisplay = resolvedSponsorName ? (
    <ProgramDetailSponsorLink
      name={resolvedSponsorName}
      sponsorId={program.sponsorId}
      sponsorName={resolvedSponsorName}
      sponsorManagementId={commonInfo.sponsorManagementId}
    />
  ) : (
    '-'
  )

  return (
    <ProgramRegistrationDetailSection title="기본 정보">
      <DetailInfoForm title="기본 정보" hideHeader mode="view" className="program-registration-paragraph">
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
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="대표 프로그램명 (국문)" view={v.mainTitle?.trim() || '-'} />
          <DetailInfoForm.Field label="대표 프로그램명 (영문)" view={program.titleEn?.trim() || '-'} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="공고용 프로그램명" view={announcementTitle} />
          <DetailInfoForm.Field label="세부 프로그램명" view={detailedName} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="사업 운영 기간" view={operationRange} />
          <DetailInfoForm.Field
            label="프로그램 진행 현황"
            view={<ProgramProgressView program={program} />}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="참여자 유형"
            view={formatGeneralParticipantTypesSummary(program)}
          />
          <DetailInfoForm.Field
            label="사업 분야"
            view={optionLabel(BUSINESS_AREA_OPTIONS, v.businessArea)}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="후원사" view={sponsorDisplay} />
          <DetailInfoForm.Field
            label="후원사 담당자"
            view={commonInfo.sponsorManagerLine?.trim() || program.managerName || '-'}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field label="교육 장소" fullRow view={venueLine} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="설문 진행 항목"
            fullRow
            view={formatGeneralSurveyItemsSummary(program)}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="교육 과정"
            view={optionLabel(
              EDUCATION_PROCESS_OPTIONS,
              v.educationProcess ?? program.educationProcess
            )}
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
      </DetailInfoForm>
    </ProgramRegistrationDetailSection>
  )
}

function KpiSection({
  commonInfo,
}: {
  commonInfo: ReturnType<typeof resolveGeneralProgramCommonInfo>
}) {
  const kpi = commonInfo.kpi
  if (!kpi) return null

  return (
    <ProgramRegistrationDetailSection title="사업 KPI 목표">
      <DetailInfoForm title="사업 KPI 목표" hideHeader mode="view" className="program-registration-paragraph">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="참여자 최종 인원"
            view={<KpiBoldNumber value={kpi.finalParticipants} />}
          />
          <DetailInfoForm.Field
            label="교육진행자 최종 인원"
            view={
              <div className="detail-info-form-inputs-wrapper">
                <span className="detail-info-form--text">강사 :</span>
                <KpiBoldNumber value={kpi.instructorCount} />
                <DetailInfoForm.InputsSeparator />
                <span className="detail-info-form--text">봉사자 :</span>
                <KpiBoldNumber value={kpi.volunteerCount} />
              </div>
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="최종 파견 학교 수"
            view={<KpiBoldNumber value={kpi.finalSchools} />}
          />
          <DetailInfoForm.Field
            label="최종 파견 학급 수"
            view={<KpiBoldNumber value={kpi.finalClasses} />}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </ProgramRegistrationDetailSection>
  )
}

function WageSection({
  commonInfo,
}: {
  commonInfo: ReturnType<typeof resolveGeneralProgramCommonInfo>
}) {
  const rows = commonInfo.wageGradeRows ?? []

  return (
    <ProgramRegistrationDetailSection title="임금 정보">
      <DetailInfoForm title="임금 정보" hideHeader mode="view" className="program-registration-paragraph">
        {rows.map(row => (
          <DetailInfoForm.Row key={row.grade} type="single">
            <DetailInfoForm.Field
              label={row.grade}
              fullRow
              view={<PipeSeparatedInlineView text={row.pricing} />}
            />
          </DetailInfoForm.Row>
        ))}
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="지급 항목" view={commonInfo.paymentItems ?? '-'} />
          <DetailInfoForm.Field label="공제 항목" view={commonInfo.deductionItems ?? '-'} />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </ProgramRegistrationDetailSection>
  )
}

function TypeSettingsSection({ program }: { program: Program }) {
  const variant = resolveGeneralProgramVariantFromProgram(program)
  const commonInfo = resolveGeneralProgramCommonInfo(program)
  const educationStructure =
    (variant
      ? GENERAL_PROGRAM_EDUCATION_STRUCTURE_LABELS[variant.educationStructure]
      : undefined) ??
    (commonInfo.curriculumSessions?.length ? '커리큘럼형' : '-')
  const sessionRound =
    (variant ? GENERAL_PROGRAM_SESSION_ROUND_LABELS[variant.sessionRound] : undefined) ??
    ((commonInfo.curriculumSessions?.length ?? 0) > 1 ? '복수 회차' : '단일 회차')
  const isSingle =
    variant?.sessionRound === 'single' || Boolean(commonInfo.educationFormLabel || commonInfo.ipsTypeSummary)
  const isOrganization = variant?.audience !== 'individual'

  return (
    <ProgramRegistrationDetailSection title="프로그램 유형 설정">
      <DetailInfoForm
        title="프로그램 유형 설정"
        hideHeader
        mode="view"
        className="program-registration-paragraph"
      >
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="교육 진행 구조" view={educationStructure} />
          <DetailInfoForm.Field label="수업 회차 유형" view={sessionRound} />
        </DetailInfoForm.Row>
        {isSingle ? (
          <>
            <DetailInfoForm.Row type={isOrganization ? 'single' : 'double'}>
              <DetailInfoForm.Field
                label="교육 형태"
                fullRow={isOrganization}
                view={commonInfo.educationFormLabel ?? '-'}
              />
              {!isOrganization ? (
                <DetailInfoForm.Field label="참여 방식" view="개인" />
              ) : null}
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="IPS 유형"
                fullRow
                view={<PipeSeparatedInlineView text={commonInfo.ipsTypeSummary} />}
              />
            </DetailInfoForm.Row>
          </>
        ) : null}
      </DetailInfoForm>
    </ProgramRegistrationDetailSection>
  )
}

function CurriculumSection({
  program,
  commonInfo,
}: {
  program: Program
  commonInfo: ReturnType<typeof resolveGeneralProgramCommonInfo>
}) {
  const variant = resolveGeneralProgramVariantFromProgram(program)
  const sessions = commonInfo.curriculumSessions ?? []
  if (variant?.educationStructure && variant.educationStructure !== 'curriculum') return null
  if (sessions.length === 0) return null

  return (
    <ProgramRegistrationDetailSection
      title="교육 진행 (커리큘럼)"
      bodyClassName="general-program-detail-common-info-view__section-body--curriculum"
    >
      {sessions.map(session => (
        <Fragment key={session.sessionLabel}>
          <div className="program-registration-curriculum__session-heading">
            ■ {session.sessionLabel}
          </div>
          <DetailInfoForm
            title={`${session.sessionLabel} 커리큘럼`}
            hideHeader
            mode="view"
            className="program-registration-paragraph"
          >
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="단원명 및 교육 내용"
                fullRow
                view={
                  <>
                    {session.title}
                    <DetailInfoForm.InputsSeparator />
                    {session.description}
                  </>
                }
              />
            </DetailInfoForm.Row>
          </DetailInfoForm>
        </Fragment>
      ))}
    </ProgramRegistrationDetailSection>
  )
}

function ScheduleSettingsSection({
  commonInfo,
}: {
  commonInfo: ReturnType<typeof resolveGeneralProgramCommonInfo>
}) {
  const lines = commonInfo.educationScheduleLines ?? []
  if (lines.length === 0) return null

  return (
    <ProgramRegistrationDetailSection title="교육 진행 일정 설정">
      <DetailInfoForm
        title="교육 진행 일정 설정"
        hideHeader
        mode="view"
        className="program-registration-paragraph"
      >
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="교육 진행 예정일"
            fullRow
            view={
              <div className="detail-info-form-inputs-wrapper">
                {lines.map((line, index) => (
                  <Fragment key={line}>
                    {index > 0 ? <DetailInfoForm.InputsSeparator /> : null}
                    <span className="detail-info-form--text nowrap">{line}</span>
                  </Fragment>
                ))}
              </div>
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </ProgramRegistrationDetailSection>
  )
}

export interface GeneralProgramDetailCommonInfoViewProps {
  program: Program
  sponsorName?: string
}

export function GeneralProgramDetailCommonInfoView({
  program,
  sponsorName,
}: GeneralProgramDetailCommonInfoViewProps) {
  const v = programToDetailEditValues(program)
  const operationRange = formatDateRange(program.startDate, program.endDate)
  const commonInfo = resolveGeneralProgramCommonInfo(program)

  return (
    <div className="general-program-detail-common-info-view program-detail-fullpage-modal__info-tab">
      <div className="general-program-detail-common-info-view__header">
        <CmsButton
          onClick={() => window.alert(FEATURE_COMING_SOON_ALERT_MESSAGE)}
          aria-label="공통 정보 수정"
        >
          정보 수정
        </CmsButton>
      </div>

      <BasicInfoSection
        program={program}
        sponsorName={sponsorName}
        v={v}
        operationRange={operationRange}
        commonInfo={commonInfo}
      />

      <KpiSection commonInfo={commonInfo} />
      <WageSection commonInfo={commonInfo} />
      <TypeSettingsSection program={program} />
      <CurriculumSection program={program} commonInfo={commonInfo} />
      <ScheduleSettingsSection commonInfo={commonInfo} />
    </div>
  )
}
