import { useMemo } from 'react'
import type { Program } from '@/types/domain'
import type { UjatRegistrationBasicInfoDisplay } from '@/features/program/ujat/lib/ujat-registration-basic-info-display'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { UjatProgramListProgressCell } from '@/features/program/ujat/ui/list/ujat-program-list-progress-cell'
import { ProgramRegistrationAuditValue } from '@/features/program/shared/ui/program-detail/registration-audit-value'
import {
  SponsorManagerContactsView,
  SponsorManagerLinesStackView,
} from '@/features/program/shared/ui/sponsor-manager-inline-view'
import { useGeneralProgramSponsorEditContext } from '@/features/program/general/hooks/use-general-program-sponsor-edit-context'
import { resolveSponsorManagerViewLines } from '@/features/program/general/model/common-info-edit-schema'
import type { SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'
import { ProgramDetailSponsorLink } from '@/features/program/shared/ui/program-detail/program-detail-sponsor-link'
import {
  ProgramSponsorHomepageView,
  ProgramSponsorLogoView,
} from '@/features/program/shared/ui/program-detail/sponsor-assignment-info'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

const BLOCK_GAP_STYLE = { marginTop: 16 } as const

function UjatProgressStatusView({ program }: { program: Program }) {
  return <UjatProgramListProgressCell program={program} />
}

function UjatSponsorManagerFieldView({
  program,
  display,
}: {
  program?: Program
  display: UjatRegistrationBasicInfoDisplay
}) {
  const sponsorIds = program?.generalCommonInfo?.sponsorManagementIds ?? []
  // 조회 전용 — 담당자 직책·연락처는 배정 응답(GET /programs/{id}/sponsors)만 쓴다.
  // 후원사 상세·담당자 API를 부르지 않는다(캐시에 있으면 그 값만 재사용).
  const sponsorEditContext = useGeneralProgramSponsorEditContext(sponsorIds, false)
  const selectedSponsors = useMemo(
    () =>
      sponsorIds
        .map(id => sponsorEditContext.sponsors.find(s => s.id === id))
        .filter((sponsor): sponsor is SponsorManagementRow => sponsor != null),
    [sponsorEditContext.sponsors, sponsorIds]
  )
  const fallbackLines = useMemo(
    () =>
      resolveSponsorManagerViewLines({
        storedLine: display.sponsorManager,
        contactRefs: program?.generalCommonInfo?.sponsorManagerContactIds,
        contactNames: program?.generalCommonInfo?.sponsorManagerContactNames,
        sponsors: selectedSponsors,
        contactsBySponsorId: sponsorEditContext.contactsBySponsorId,
      }),
    [display.sponsorManager, program, selectedSponsors, sponsorEditContext.contactsBySponsorId]
  )

  if (program) {
    return (
      <SponsorManagerContactsView
        program={program}
        sponsorRows={selectedSponsors}
        sponsorNameById={program.generalCommonInfo?.sponsorManagementNames}
        contactsBySponsorId={sponsorEditContext.contactsBySponsorId}
      />
    )
  }
  return <SponsorManagerLinesStackView lines={fallbackLines} />
}

/** UJAT 등록 양식 기본 정보 — 조회(프로그램 상세·미리보기 공통 레이아웃) */
export function UjatBasicInfoReadonlyView({
  display,
  program,
  showRegistrationAudit = false,
}: {
  display: UjatRegistrationBasicInfoDisplay
  program?: Program
  showRegistrationAudit?: boolean
}) {
  return (
    <div className="ujat-basic-info-readonly-view" role="group" aria-label="기본 정보">
      {showRegistrationAudit && program ? (
        <DetailInfoForm title="기본 정보" mode="view" className="program-registration-paragraph">
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="최초 등록일"
              view={<ProgramRegistrationAuditValue at={program.createdAt} name={program.createdByName} />}
            />
            <DetailInfoForm.Field
              label="마지막 수정일"
              view={<ProgramRegistrationAuditValue at={program.updatedAt} name={program.updatedByName} />}
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      ) : null}

      <DetailInfoForm
        title="UJAT 기본 정보 — 프로그램명"
        hideHeader
        mode="view"
        className="program-registration-paragraph"
        style={showRegistrationAudit ? BLOCK_GAP_STYLE : undefined}
      >
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="대표 프로그램명 (국문)" view={display.repKo} />
          <DetailInfoForm.Field label="대표 프로그램명 (영문)" view={display.repEn} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="프로그램 관리명" view={display.programManagementName} />
          <DetailInfoForm.Field label="세부 프로그램명" view={display.detailedProgramName} />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <DetailInfoForm
        title="UJAT 기본 정보 — 운영 및 설문"
        hideHeader
        mode="view"
        className="program-registration-paragraph"
        style={BLOCK_GAP_STYLE}
      >
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="사업 운영 기간" view={display.operationRange} />
          <DetailInfoForm.Field
            label="프로그램 진행 현황"
            view={
              program?.ujatProgressStatus || program?.lifecycleStatus ? (
                <UjatProgressStatusView program={program} />
              ) : (
                '-'
              )
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="참여자 유형" view={display.participantTypes} />
          <DetailInfoForm.Field label="사업 분야" view={display.businessField} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="후원사"
            view={
              display.sponsorName && display.sponsorName !== '-' ? (
                <ProgramDetailSponsorLink
                  name={display.sponsorName}
                  sponsorId={program?.sponsorId}
                  sponsorName={display.sponsorName}
                  className="ujat-program-detail-common-info-view__sponsor-link"
                />
              ) : (
                display.sponsorName || '-'
              )
            }
          />
          <DetailInfoForm.Field
            label="후원사 담당자"
            view={<UjatSponsorManagerFieldView program={program} display={display} />}
          />
        </DetailInfoForm.Row>
        {program ? (
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="후원사 홈페이지"
              view={
                <ProgramSponsorHomepageView
                  sponsorIds={program.generalCommonInfo?.sponsorManagementIds ?? []}
                  sponsorNameById={program.generalCommonInfo?.sponsorManagementNames}
                  details={program.generalCommonInfo?.sponsorAssignmentDetails}
                />
              }
            />
            <DetailInfoForm.Field
              label="후원사 로고"
              view={
                <ProgramSponsorLogoView
                  sponsorIds={program.generalCommonInfo?.sponsorManagementIds ?? []}
                  sponsorNameById={program.generalCommonInfo?.sponsorManagementNames}
                  details={program.generalCommonInfo?.sponsorAssignmentDetails}
                />
              }
            />
          </DetailInfoForm.Row>
        ) : null}
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field label="설문 진행 항목" fullRow view={display.surveyItems} />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <DetailInfoForm
        title="UJAT 기본 정보 — 교육 과정 및 IPS"
        hideHeader
        mode="view"
        className="program-registration-paragraph"
        style={BLOCK_GAP_STYLE}
      >
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="교육 과정" view={display.educationCourse} />
          <DetailInfoForm.Field label="IP Owned" view={display.ipOwned} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="Course Delivered By" view={display.courseDeliveredBy} />
          <DetailInfoForm.Field label="Partner Involvement" view={display.partnerInvolvement} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field label="IPS 유형" fullRow view={display.ipsCategory} />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}
