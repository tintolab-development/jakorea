import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { DeliveryStatusBadge } from '@/shared/components/delivery-status-badge'
import { UjatInstitutionScheduleConfirmStatusBadge } from './status-badge'
import {
  ClassTimeTable,
  PipeSeparatedValues,
  renderCriminalRecordCheckRequest,
} from '../shared/institution-detail-shared'
import { UjatInstitutionTeacherInfoValue } from '../detail/detail-display'
import type { UjatScheduleConfirmConfirmedDetail } from './confirmed-detail-types'
import './confirmed-detail-view.css'

function TextbookInfoValue({
  textbook,
}: {
  textbook: UjatScheduleConfirmConfirmedDetail['gradeEducationBlocks'][number]['textbook']
}) {
  return (
    <div className="textbook-delivery-info">
      <PipeSeparatedValues
        parts={[
          <span key="name">{textbook.textbookName}</span>,
          <span key="kit">{textbook.kitSummary}</span>,
        ]}
      />
      <DeliveryStatusBadge status={textbook.deliveryStatus} />
    </div>
  )
}

export function UjatScheduleConfirmConfirmedDetailView({
  detail,
  personalInfoRevealed,
  showGuidanceNotes = false,
}: {
  detail: UjatScheduleConfirmConfirmedDetail
  personalInfoRevealed: boolean
  /** `institution_confirmed`일 때만 true — UJAT 기관 안내 사항 폼 제출 내용 */
  showGuidanceNotes?: boolean
}) {
  const { guidanceNotes } = detail

  return (
    <div className="schedule-confirm-confirmed-detail">
      <section className="schedule-confirm-confirmed-detail__section" aria-labelledby="schedule-confirm-basic-info-heading">
        <h2 id="schedule-confirm-basic-info-heading" className="detail-info-form__title">
          기본 정보
        </h2>
        <div className="schedule-confirm-confirmed-detail__form-stack">
          <DetailInfoForm title="일정 확인 현황" hideHeader mode="view">
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="일정 확인 현황"
                fullRow
                view={
                  <UjatInstitutionScheduleConfirmStatusBadge status={detail.scheduleConfirmStatus} />
                }
              />
            </DetailInfoForm.Row>
          </DetailInfoForm>

          <DetailInfoForm title="기본 정보" hideHeader mode="view">
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field label="임시 배정 기관명" view={detail.institutionName} />
              <DetailInfoForm.Field label="교육 지역" view={detail.regionLabel} />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field label="기관 소재지" view={detail.address} />
              <DetailInfoForm.Field label="상세 주소" view={detail.addressDetail} />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="담당 교사 정보"
                fullRow
                view={
                  <UjatInstitutionTeacherInfoValue
                    contact={detail.teacherContact}
                    revealed={personalInfoRevealed}
                  />
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field label="기타 요청사항" fullRow view={detail.otherRequests || '-'} />
            </DetailInfoForm.Row>
          </DetailInfoForm>
        </div>
      </section>

      <section
        className="schedule-confirm-confirmed-detail__section"
        aria-labelledby="schedule-confirm-grade-info-heading"
      >
        <h2 id="schedule-confirm-grade-info-heading" className="detail-info-form__title">
          교육 학년 별 정보
        </h2>
        <div className="schedule-confirm-confirmed-detail__form-stack">
          {detail.gradeEducationBlocks.map((block, blockIndex) => (
            <DetailInfoForm
              key={`${block.gradeLabel}-${blockIndex}`}
              title={`${block.gradeLabel} (${block.classCount}학급)`}
              hideHeader
              mode="view"
            >
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label={`${block.gradeLabel} (${block.classCount}학급)`}
                  fullRow
                  view={
                    <PipeSeparatedValues
                      parts={block.classes.map(classRow => (
                        <span key={classRow.classNo}>
                          {classRow.classNo}반 : {classRow.studentCount}명
                        </span>
                      ))}
                    />
                  }
                />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="교재 정보"
                  fullRow
                  view={<TextbookInfoValue textbook={block.textbook} />}
                />
              </DetailInfoForm.Row>
            </DetailInfoForm>
          ))}
        </div>
      </section>

      <DetailInfoForm title="학년 별 수업 시간" mode="view">
        <DetailInfoForm.Row type="custom">
          <ClassTimeTable rows={detail.classTimeRows} />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <DetailInfoForm title="진행 교육 일정" mode="view">
        {detail.educationScheduleDays.length === 0 ? (
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field label="교육 일정" fullRow view="-" />
          </DetailInfoForm.Row>
        ) : (
          detail.educationScheduleDays.map(day => (
            <DetailInfoForm.Row key={day.dateLabel} type="single">
              <DetailInfoForm.Field
                label={day.dateLabel}
                fullRow
                view={
                  <PipeSeparatedValues
                    parts={day.classLabels.map(label => (
                      <span key={label}>{label}</span>
                    ))}
                  />
                }
              />
            </DetailInfoForm.Row>
          ))
        )}
      </DetailInfoForm>

      {showGuidanceNotes ? (
        <DetailInfoForm title="안내 사항" mode="view">
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="검색 기기 사용 가능 여부 (6학년)"
              fullRow
              view={guidanceNotes.searchDeviceGrade6}
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field label="대기 장소 안내" fullRow view={guidanceNotes.waitingArea} />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="잔여교재 배출 장소"
              fullRow
              view={guidanceNotes.textbookDisposalLocation}
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="기타 특이사항 (주차, 전달사항 등)"
              fullRow
              view={guidanceNotes.otherSpecialNotes}
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="간식 제공 가능 여부"
              fullRow
              view={guidanceNotes.snackAvailability}
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="성범죄 경력 조회서 요청"
              fullRow
              view={renderCriminalRecordCheckRequest(guidanceNotes.sexOffenderCheck)}
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      ) : null}
    </div>
  )
}
