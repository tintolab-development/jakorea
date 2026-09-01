import type { Program } from '@/types/domain'
import type { UjatRegistrationBasicInfoDisplay } from '@/features/program/ujat/lib/ujat-registration-basic-info-display'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { formatDate } from '@/features/program/shared/lib/program-detail-info-constants'
import { UjatProgramListProgressCell } from '@/features/program/ujat/ui/list/ujat-program-list-progress-cell'
import { UjatInlineDividedSegments } from '../shared/ujat-inline-divided-segments'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

const BLOCK_GAP_STYLE = { marginTop: 16 } as const

function UjatProgressStatusView({ program }: { program: Program }) {
  return <UjatProgramListProgressCell program={program} />
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
              view={
                <UjatInlineDividedSegments
                  segments={[formatDate(program.createdAt), program.createdByName]}
                />
              }
            />
            <DetailInfoForm.Field
              label="마지막 수정일"
              view={
                <UjatInlineDividedSegments
                  segments={[formatDate(program.updatedAt), program.updatedByName]}
                />
              }
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
          <DetailInfoForm.Field label="공고용 프로그램명" view={display.publicProgramTitle} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field label="세부 프로그램명" fullRow view={display.detailedProgramName} />
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
          <DetailInfoForm.Field label="후원사" view={display.sponsorName} />
          <DetailInfoForm.Field label="후원사 담당자" view={display.sponsorManager} />
        </DetailInfoForm.Row>
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
