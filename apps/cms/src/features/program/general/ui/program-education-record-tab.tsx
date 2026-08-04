/**
 * 프로그램 실적 통계 상세 탭
 */

import { Space, Card, Tag, Typography } from 'antd'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { Program } from '@/types/domain'

const { Text } = Typography

const programTypeLabels: Record<string, string> = {
  online: '온라인',
  offline: '오프라인',
  hybrid: '하이브리드',
}

interface ProgramEducationRecordTabProps {
  program: Program
  sponsorNameEn?: string
  schoolInfo?: {
    name: string
    region?: string
  } | null
}

export function ProgramEducationRecordTab({
  program,
  sponsorNameEn,
  schoolInfo,
}: ProgramEducationRecordTabProps) {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* 기본 교육실적 정보 */}
      <Card title="기본 교육실적 정보">
        <DetailInfoForm title="기본 교육실적 정보" hideHeader mode="view">
          {program.businessArea && (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field label="사업분야" view={program.businessArea} />
            </DetailInfoForm.Row>
          )}
          {sponsorNameEn && (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field label="후원사명(영문)" view={<Text ellipsis={{ tooltip: sponsorNameEn }}>{sponsorNameEn}</Text>} />
            </DetailInfoForm.Row>
          )}
          {program.titleEn && (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field label="프로그램명(영문)" view={<Text ellipsis={{ tooltip: program.titleEn }}>{program.titleEn}</Text>} />
            </DetailInfoForm.Row>
          )}
          {program.mainTitle && (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field label="대표 프로그램명(국문)" view={<Text ellipsis={{ tooltip: program.mainTitle }}>{program.mainTitle}</Text>} />
            </DetailInfoForm.Row>
          )}
          {program.textbookName && (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field label="교재명(국문)" view={<Text ellipsis={{ tooltip: program.textbookName }}>{program.textbookName}</Text>} />
            </DetailInfoForm.Row>
          )}
          {program.textbookNameEn && (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field label="교재명(영문)" view={<Text ellipsis={{ tooltip: program.textbookNameEn }}>{program.textbookNameEn}</Text>} />
            </DetailInfoForm.Row>
          )}
          {schoolInfo && (
            <>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field label="학교명 (기관)" view={<Text ellipsis={{ tooltip: schoolInfo.name }}>{schoolInfo.name}</Text>} />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field label="시군구" view={<Text ellipsis={{ tooltip: schoolInfo.region || program.district || '-' }}>{schoolInfo.region || program.district || '-'}</Text>} />
              </DetailInfoForm.Row>
            </>
          )}
          {program.ipOwned && (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field label="IP Owned" view={program.ipOwned} />
            </DetailInfoForm.Row>
          )}
          {program.courseDeliveredBy && (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="Course Delivered By"
                view={program.courseDeliveredBy === 'JA' ? 'JA' : program.courseDeliveredBy === 'Jointly' ? 'Jointly' : program.courseDeliveredBy}
              />
            </DetailInfoForm.Row>
          )}
          {program.partnerInvolvement !== undefined && (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field label="Partner Involvement" view={program.partnerInvolvement ? 'Yes' : 'No'} />
            </DetailInfoForm.Row>
          )}
          {program.ips && (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field label="IPS 분류" view={<Tag>{program.ips}</Tag>} />
            </DetailInfoForm.Row>
          )}
          {program.targetLevel && (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="대상 구분"
                view={program.targetLevel === 'elementary' ? '초' : program.targetLevel === 'middle' ? '중' : program.targetLevel === 'high' ? '고' : program.targetLevel}
              />
            </DetailInfoForm.Row>
          )}
          {program.institutionType && (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field label="기관 구분" view={program.institutionType === 'inside_school' ? '학교 안' : '학교 밖'} />
            </DetailInfoForm.Row>
          )}
          {program.ips === 'Succeed' && program.programCategory && (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field label="프로그램 종류" view={<Text ellipsis={{ tooltip: program.programCategory }}>{program.programCategory}</Text>} />
            </DetailInfoForm.Row>
          )}
          {program.ips === 'Inspire' && program.programChannel && (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field label="프로그램 채널 및 형식" view={<Text ellipsis={{ tooltip: program.programChannel }}>{program.programChannel}</Text>} />
            </DetailInfoForm.Row>
          )}
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field label="교육 형태" view={<Tag>{programTypeLabels[program.type] || program.type}</Tag>} />
          </DetailInfoForm.Row>
          {program.educationTime && (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field label="교육시간" view={`${program.educationTime}시간`} />
            </DetailInfoForm.Row>
          )}
          {program.rounds && program.rounds[0]?.classCount && (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field label="학급수" view={program.rounds[0].classCount} />
            </DetailInfoForm.Row>
          )}
          {program.managerName && (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field label="담당자명" view={program.managerName} />
            </DetailInfoForm.Row>
          )}
        </DetailInfoForm>
      </Card>

      {/* 참가자 통계 */}
      {(program.maleParticipants !== undefined ||
        program.femaleParticipants !== undefined ||
        program.totalParticipants !== undefined) && (
        <Card title="참가자 통계">
          <DetailInfoForm title="참가자 통계" hideHeader mode="view">
            {(program.maleParticipants !== undefined || program.femaleParticipants !== undefined) && (
              <DetailInfoForm.Row type="double">
                {program.maleParticipants !== undefined && (
                  <DetailInfoForm.Field label="남성 참가자" view={`${program.maleParticipants}명`} />
                )}
                {program.femaleParticipants !== undefined && (
                  <DetailInfoForm.Field label="여성 참가자" view={`${program.femaleParticipants}명`} />
                )}
              </DetailInfoForm.Row>
            )}
            {program.totalParticipants !== undefined && (
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="총 참가자"
                  view={<Text strong style={{ fontSize: 16 }}>{program.totalParticipants}명</Text>}
                />
              </DetailInfoForm.Row>
            )}
          </DetailInfoForm>
        </Card>
      )}

      {/* 자원봉사자 통계 */}
      {(program.generalVolunteers !== undefined ||
        program.staffVolunteers !== undefined ||
        program.returningVolunteers !== undefined) && (
        <Card title="자원봉사자 통계">
          <DetailInfoForm title="자원봉사자 통계" hideHeader mode="view">
            <DetailInfoForm.Row type="double">
              {program.generalVolunteers !== undefined && (
                <DetailInfoForm.Field label="일반 자원봉사자" view={`${program.generalVolunteers}명`} />
              )}
              {program.staffVolunteers !== undefined && (
                <DetailInfoForm.Field label="임직원 자원봉사자" view={`${program.staffVolunteers}명`} />
              )}
            </DetailInfoForm.Row>
            {program.returningVolunteers !== undefined && (
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field label="재참여 자원봉사자" view={`${program.returningVolunteers}명`} />
              </DetailInfoForm.Row>
            )}
          </DetailInfoForm>
        </Card>
      )}

      {/* 교사/강사 통계 */}
      {(program.generalTeachers !== undefined ||
        program.educatedTeachers !== undefined ||
        program.instructors !== undefined) && (
        <Card title="교사/강사 통계">
          <DetailInfoForm title="교사/강사 통계" hideHeader mode="view">
            <DetailInfoForm.Row type="double">
              {program.generalTeachers !== undefined && (
                <DetailInfoForm.Field label="일반담당교사" view={`${program.generalTeachers}명`} />
              )}
              {program.educatedTeachers !== undefined && (
                <DetailInfoForm.Field label="교육받은교사" view={`${program.educatedTeachers}명`} />
              )}
            </DetailInfoForm.Row>
            {program.instructors !== undefined && (
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field label="강사" view={`${program.instructors}명`} />
              </DetailInfoForm.Row>
            )}
          </DetailInfoForm>
        </Card>
      )}
    </Space>
  )
}
