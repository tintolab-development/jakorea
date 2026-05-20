/**
 * 프로그램 실적 통계 상세 탭
 */

import { Space, Card, Descriptions, Tag, Typography } from 'antd'
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
        <Descriptions column={1} bordered>
          {program.businessArea && (
            <Descriptions.Item label="사업분야">{program.businessArea}</Descriptions.Item>
          )}
          {sponsorNameEn && (
            <Descriptions.Item label="후원사명(영문)">
              <Text ellipsis={{ tooltip: sponsorNameEn }}>{sponsorNameEn}</Text>
            </Descriptions.Item>
          )}
          {program.titleEn && (
            <Descriptions.Item label="프로그램명(영문)">
              <Text ellipsis={{ tooltip: program.titleEn }}>{program.titleEn}</Text>
            </Descriptions.Item>
          )}
          {program.mainTitle && (
            <Descriptions.Item label="대표 프로그램명(국문)">
              <Text ellipsis={{ tooltip: program.mainTitle }}>{program.mainTitle}</Text>
            </Descriptions.Item>
          )}
          {program.textbookName && (
            <Descriptions.Item label="교재명(국문)">
              <Text ellipsis={{ tooltip: program.textbookName }}>{program.textbookName}</Text>
            </Descriptions.Item>
          )}
          {program.textbookNameEn && (
            <Descriptions.Item label="교재명(영문)">
              <Text ellipsis={{ tooltip: program.textbookNameEn }}>
                {program.textbookNameEn}
              </Text>
            </Descriptions.Item>
          )}
          {schoolInfo && (
            <>
              <Descriptions.Item label="학교명 (기관)">
                <Text ellipsis={{ tooltip: schoolInfo.name }}>{schoolInfo.name}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="시군구">
                <Text ellipsis={{ tooltip: schoolInfo.region || program.district || '-' }}>
                  {schoolInfo.region || program.district || '-'}
                </Text>
              </Descriptions.Item>
            </>
          )}
          {program.ipOwned && (
            <Descriptions.Item label="IP Owned">{program.ipOwned}</Descriptions.Item>
          )}
          {program.courseDeliveredBy && (
            <Descriptions.Item label="Course Delivered By">
              {program.courseDeliveredBy === 'JA'
                ? 'JA'
                : program.courseDeliveredBy === 'Jointly'
                  ? 'Jointly'
                  : program.courseDeliveredBy}
            </Descriptions.Item>
          )}
          {program.partnerInvolvement !== undefined && (
            <Descriptions.Item label="Partner Involvement">
              {program.partnerInvolvement ? 'Yes' : 'No'}
            </Descriptions.Item>
          )}
          {program.ips && (
            <Descriptions.Item label="IPS 분류">
              <Tag>{program.ips}</Tag>
            </Descriptions.Item>
          )}
          {program.targetLevel && (
            <Descriptions.Item label="대상 구분">
              {program.targetLevel === 'elementary'
                ? '초'
                : program.targetLevel === 'middle'
                  ? '중'
                  : program.targetLevel === 'high'
                    ? '고'
                    : program.targetLevel}
            </Descriptions.Item>
          )}
          {program.institutionType && (
            <Descriptions.Item label="기관 구분">
              {program.institutionType === 'inside_school' ? '학교 안' : '학교 밖'}
            </Descriptions.Item>
          )}
          {program.ips === 'Succeed' && program.programCategory && (
            <Descriptions.Item label="프로그램 종류">
              <Text ellipsis={{ tooltip: program.programCategory }}>
                {program.programCategory}
              </Text>
            </Descriptions.Item>
          )}
          {program.ips === 'Inspire' && program.programChannel && (
            <Descriptions.Item label="프로그램 채널 및 형식">
              <Text ellipsis={{ tooltip: program.programChannel }}>
                {program.programChannel}
              </Text>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="교육 형태">
            <Tag>{programTypeLabels[program.type] || program.type}</Tag>
          </Descriptions.Item>
          {program.educationTime && (
            <Descriptions.Item label="교육시간">{program.educationTime}시간</Descriptions.Item>
          )}
          {program.rounds && program.rounds[0]?.classCount && (
            <Descriptions.Item label="학급수">
              {program.rounds[0].classCount}
            </Descriptions.Item>
          )}
          {program.managerName && (
            <Descriptions.Item label="담당자명">{program.managerName}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* 참가자 통계 */}
      {(program.maleParticipants !== undefined ||
        program.femaleParticipants !== undefined ||
        program.totalParticipants !== undefined) && (
        <Card title="참가자 통계">
          <Descriptions column={2} bordered>
            {program.maleParticipants !== undefined && (
              <Descriptions.Item label="남성 참가자">
                {program.maleParticipants}명
              </Descriptions.Item>
            )}
            {program.femaleParticipants !== undefined && (
              <Descriptions.Item label="여성 참가자">
                {program.femaleParticipants}명
              </Descriptions.Item>
            )}
            {program.totalParticipants !== undefined && (
              <Descriptions.Item label="총 참가자" span={2}>
                <Text strong style={{ fontSize: 16 }}>
                  {program.totalParticipants}명
                </Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {/* 자원봉사자 통계 */}
      {(program.generalVolunteers !== undefined ||
        program.staffVolunteers !== undefined ||
        program.returningVolunteers !== undefined) && (
        <Card title="자원봉사자 통계">
          <Descriptions column={2} bordered>
            {program.generalVolunteers !== undefined && (
              <Descriptions.Item label="일반 자원봉사자">
                {program.generalVolunteers}명
              </Descriptions.Item>
            )}
            {program.staffVolunteers !== undefined && (
              <Descriptions.Item label="임직원 자원봉사자">
                {program.staffVolunteers}명
              </Descriptions.Item>
            )}
            {program.returningVolunteers !== undefined && (
              <Descriptions.Item label="재참여 자원봉사자">
                {program.returningVolunteers}명
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {/* 교사/강사 통계 */}
      {(program.generalTeachers !== undefined ||
        program.educatedTeachers !== undefined ||
        program.instructors !== undefined) && (
        <Card title="교사/강사 통계">
          <Descriptions column={2} bordered>
            {program.generalTeachers !== undefined && (
              <Descriptions.Item label="일반담당교사">
                {program.generalTeachers}명
              </Descriptions.Item>
            )}
            {program.educatedTeachers !== undefined && (
              <Descriptions.Item label="교육받은교사">
                {program.educatedTeachers}명
              </Descriptions.Item>
            )}
            {program.instructors !== undefined && (
              <Descriptions.Item label="강사">{program.instructors}명</Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}
    </Space>
  )
}
