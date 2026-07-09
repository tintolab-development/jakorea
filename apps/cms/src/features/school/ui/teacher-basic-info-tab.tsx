/**
 * 교사 회원 상세 모달 — 기본 정보 탭
 */

import { CmsButton } from '@/shared/ui'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import { formatDate } from '@/shared/utils'
import type { TeacherDetailData } from '@/data/mock/school-detail'
import { inlineSegmentsWithDividers } from '@/features/user/detail/ui/user-basic-info/display'
import { renderDetailInfoPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'

export interface TeacherBasicInfoTabProps {
  detail: TeacherDetailData
  onWithdraw: () => void
}

export function TeacherBasicInfoTab({ detail, onWithdraw }: TeacherBasicInfoTabProps) {
  return (
    <div className="teacher-detail-modal__basic-tab-content">
      <div className="teacher-detail-modal__actions-row">
        <span className="teacher-detail-modal__permission-msg">
          회원 본인 및 관리자만 작성/수정이 가능합니다.
        </span>
        <div className="teacher-detail-modal__actions-buttons">
          <CmsButton
            variant="default"
            size="medium"
            className="teacher-detail-modal__btn-withdraw"
            onClick={onWithdraw}
          >
            탈퇴
          </CmsButton>
          <CmsButton
            variant="default"
            size="medium"
            className="teacher-detail-modal__btn-edit"
          >
            수정
          </CmsButton>
        </div>
      </div>

      <div className="teacher-detail-modal__basic-inner">
        <div className="teacher-detail-modal__profile-wrap">
          <div className="teacher-detail-modal__profile-placeholder">
            사진 없음
          </div>
        </div>

        <div className="teacher-detail-modal__basic-table-wrap">
          <table className="teacher-detail-modal__basic-table">
            <colgroup>
              <col className="teacher-detail-modal__col-label-left" />
              <col className="teacher-detail-modal__col-name-sub" />
              <col className="teacher-detail-modal__col-input-left" />
              <col className="teacher-detail-modal__col-label-right" />
              <col className="teacher-detail-modal__col-input-right" />
            </colgroup>
            <tbody>
              <tr>
                <td
                  rowSpan={2}
                  className="teacher-detail-modal__cell--label teacher-detail-modal__cell--name"
                >
                  <span>성명</span>
                </td>
                <td className="teacher-detail-modal__cell--label teacher-detail-modal__cell--name-sub">
                  <span>한글</span>
                </td>
                <td className="teacher-detail-modal__cell--input">
                  {detail.name}
                  {detail.scheduleChangeCount > 0 && (
                    <ScheduleChangeHistoryBadge count={detail.scheduleChangeCount} />
                  )}
                </td>
                <td className="teacher-detail-modal__cell--label teacher-detail-modal__cell--label-right">
                  <span>주민등록번호</span>
                </td>
                <td className="teacher-detail-modal__cell--input">
                  {inlineSegmentsWithDividers([detail.residentNumber, `만 ${detail.age}세`])}
                </td>
              </tr>

              <tr>
                <td className="teacher-detail-modal__cell--label teacher-detail-modal__cell--name-sub">
                  <span>영문</span>
                </td>
                <td className="teacher-detail-modal__cell--input teacher-detail-modal__name-eng">
                  {detail.nameEn}
                </td>
                <td className="teacher-detail-modal__cell--label teacher-detail-modal__cell--label-right">
                  <span>성별 및 병역사항</span>
                </td>
                <td className="teacher-detail-modal__cell--input">
                  {inlineSegmentsWithDividers([detail.gender, detail.militaryStatus])}
                </td>
              </tr>

              <tr>
                <td
                  colSpan={2}
                  className="teacher-detail-modal__cell--label teacher-detail-modal__cell--row-label"
                >
                  <span>연락처</span>
                </td>
                <td className="teacher-detail-modal__cell--input">
                  {detail.phone}
                </td>
                <td className="teacher-detail-modal__cell--label teacher-detail-modal__cell--label-right">
                  <span>이메일</span>
                </td>
                <td className="teacher-detail-modal__cell--input">
                  {detail.email}
                </td>
              </tr>

              <tr>
                <td
                  colSpan={2}
                  className="teacher-detail-modal__cell--label teacher-detail-modal__cell--row-label"
                >
                  <span>주소</span>
                </td>
                <td className="teacher-detail-modal__cell--input">
                  {detail.address}
                </td>
                <td className="teacher-detail-modal__cell--label teacher-detail-modal__cell--label-right">
                  <span>소속 및 강사 경력</span>
                </td>
                <td className="teacher-detail-modal__cell--input">
                  {inlineSegmentsWithDividers([detail.schoolName, detail.instructorExperience])}
                </td>
              </tr>

              <tr>
                <td
                  colSpan={2}
                  className="teacher-detail-modal__cell--label teacher-detail-modal__cell--row-label"
                >
                  <span>정산 계좌 정보</span>
                </td>
                <td colSpan={3} className="teacher-detail-modal__cell--input">
                  {renderDetailInfoPipeSeparated(
                    `${detail.bankName} ${detail.accountNumber} | ${detail.accountHolder}`
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="teacher-detail-modal__full-table-wrap">
        <table className="teacher-detail-modal__full-table">
          <colgroup>
            <col className="teacher-detail-modal__full-table-col-label" />
            <col className="teacher-detail-modal__full-table-col-value" />
            <col className="teacher-detail-modal__full-table-col-label" />
            <col className="teacher-detail-modal__full-table-col-value" />
          </colgroup>
          <tbody>
            <tr>
              <td className="teacher-detail-modal__cell--label">
                <span>연동된 소셜 계정</span>
              </td>
              <td className="teacher-detail-modal__cell--input">
                {inlineSegmentsWithDividers(detail.socialAccounts)}
              </td>
              <td className="teacher-detail-modal__cell--label">
                <span>가입일</span>
              </td>
              <td className="teacher-detail-modal__cell--input">
                {formatDate(new Date(detail.createdAt))}
              </td>
            </tr>
            <tr>
              <td className="teacher-detail-modal__cell--label">
                <span>개인정보 수집 동의</span>
              </td>
              <td className="teacher-detail-modal__cell--input">
                {inlineSegmentsWithDividers([
                  detail.personalInfoConsentDate,
                  detail.personalInfoConsent ? '동의' : '미동의',
                ])}
              </td>
              <td className="teacher-detail-modal__cell--label">
                <span>마케팅 제공 동의</span>
              </td>
              <td className="teacher-detail-modal__cell--input">
                {inlineSegmentsWithDividers([
                  detail.marketingConsentDate,
                  detail.marketingConsent ? '동의' : '미동의',
                ])}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {detail.isInstructorApplicant && (
        <section className="teacher-detail-modal__section">
          <h3 className="teacher-detail-modal__section-title">추가 정보</h3>
          <div className="teacher-detail-modal__extra-table-wrap">
            <table className="teacher-detail-modal__extra-table">
              <colgroup>
                <col className="teacher-detail-modal__extra-table-col-label" />
                <col className="teacher-detail-modal__extra-table-col-value" />
                <col className="teacher-detail-modal__extra-table-col-label" />
                <col className="teacher-detail-modal__extra-table-col-value" />
              </colgroup>
              <tbody>
                <tr>
                  <td className="teacher-detail-modal__cell--label">
                    <span>최종 학력</span>
                  </td>
                  <td colSpan={3} className="teacher-detail-modal__cell--input">
                    {inlineSegmentsWithDividers([detail.education, detail.university])}
                  </td>
                </tr>
                <tr>
                  <td className="teacher-detail-modal__cell--label">
                    <span>한 줄 소개</span>
                  </td>
                  <td colSpan={3} className="teacher-detail-modal__cell--input teacher-detail-modal__bio-value">
                    {detail.bio}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
