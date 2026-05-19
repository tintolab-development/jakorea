import { Fragment, type ReactNode } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { UjatInstitutionApplicationStatusBadge } from './ujat-institution-application-status-badge'
import type { UjatInstitutionApplicationDetail } from './ujat-institution-application-detail-types'

const TABLE_BORDER = '1px solid #e8e8e8'
const TABLE_LABEL_BG = '#f5f5f5'

function PipeSeparatedValues({ parts }: { parts: ReactNode[] }) {
  return (
    <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap">
      {parts.map((part, index) => (
        <Fragment key={index}>
          {index > 0 ? <DetailInfoForm.InputsSeparator /> : null}
          {part}
        </Fragment>
      ))}
    </div>
  )
}

function ClassTimeTable({
  rows,
}: {
  rows: UjatInstitutionApplicationDetail['classTimeRows']
}) {
  const cellStyle = {
    border: TABLE_BORDER,
    padding: '12px 16px',
    fontSize: 16,
    lineHeight: '150%',
    textAlign: 'center' as const,
  }
  const labelCellStyle = { ...cellStyle, background: TABLE_LABEL_BG, fontWeight: 500 }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
      <thead>
        <tr>
          <th style={{ ...labelCellStyle, width: '20%' }}>학년 / 교시</th>
          {['1교시', '2교시', '3교시', '4교시'].map(period => (
            <th key={period} style={labelCellStyle}>
              {period}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <tr key={row.gradeRangeLabel}>
            <td style={labelCellStyle}>{row.gradeRangeLabel}</td>
            {row.periods.map((period, index) => (
              <td key={`${row.gradeRangeLabel}-${index}`} style={cellStyle}>
                {period}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function UjatInstitutionApplicationDetailView({
  detail,
  personalInfoRevealed,
}: {
  detail: UjatInstitutionApplicationDetail
  personalInfoRevealed: boolean
}) {
  const teacherInfo = personalInfoRevealed
    ? detail.teacherInfoRevealed
    : detail.teacherInfoMasked

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
      <DetailInfoForm title="기본 정보" mode="view">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="임시 배정 현황"
            fullRow
            view={<UjatInstitutionApplicationStatusBadge status={detail.tempAssignmentStatus} />}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="신청 기관명" view={detail.institutionName} />
          <DetailInfoForm.Field label="신청 지역" view={detail.regionLabel} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="기관 소재지" view={detail.address} />
          <DetailInfoForm.Field label="상세 주소" view={detail.addressDetail} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field label="담당 교사 정보" fullRow view={teacherInfo} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field label="기타 요청사항" fullRow view={detail.otherRequests} />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <DetailInfoForm title="학년 별 신청 정보" mode="view">
        {detail.gradeBlocks.map((block, blockIndex) => (
          <Fragment key={`${block.gradeLabel}-${blockIndex}`}>
            <div
              className="detail-info-form--text-bold"
              style={{ marginTop: blockIndex > 0 ? 16 : 0, marginBottom: 8 }}
            >
              ■ 신청 학년 {String(blockIndex + 1).padStart(2, '0')}
            </div>
            <DetailInfoForm title="학년 별 신청 정보" hideHeader mode="view">
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="신청 학년 및 학급 수"
                  fullRow
                  view={
                    <PipeSeparatedValues
                      parts={[
                        <span key="grade">{block.gradeLabel}</span>,
                        <span key="count">{block.classCount}학급</span>,
                      ]}
                    />
                  }
                />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="학급 별 학생 수"
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
            </DetailInfoForm>
          </Fragment>
        ))}
      </DetailInfoForm>

      <DetailInfoForm title="학년 별 수업 시간" mode="view">
        <DetailInfoForm.Row type="custom">
          <ClassTimeTable rows={detail.classTimeRows} />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <DetailInfoForm title="진행 희망 교육 일정" mode="view">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="교육 진행 희망일"
            fullRow
            view={
              detail.preferredEducationDates.length > 0 ? (
                <PipeSeparatedValues
                  parts={detail.preferredEducationDates.map(date => (
                    <span key={date}>{date}</span>
                  ))}
                />
              ) : (
                '-'
              )
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}

