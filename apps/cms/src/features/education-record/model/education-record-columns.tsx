/**
 * 실적 관리 목록 테이블 컬럼 정의 (AntD)
 * - 33개 컬럼 (노션: 취약계층 학생 포함, `상태` 제외). Figma 「실적 테이블 전체 columns」(12432:542578)는
 *   32열(시군구 없음) — 헤더 문구·폭·셀 표기는 시안 기준, 시군구 열은 기획 확인 전까지 유지(폭 140)
 * - 모든 셀은 **plain text** 렌더 (Tag/Tooltip/strong 래퍼 제거)
 * - 텍스트 정렬/컬러/폰트 스펙은 `education-record-list-page.css` 에서 일괄 적용
 * - 컬럼 width 는 대표 컨텐츠 길이가 잘리지 않도록 넉넉히 산정
 */

import type { ColumnsType } from 'antd/es/table'
import {
  formatEducationRecordEducationType,
  formatEducationRecordInstitutionType,
  formatEducationRecordTargetLevel,
} from '../lib/education-record-labels'
import type { EducationRecordRow } from '../model/education-record-types'

/** 시안: IPS 구분 조건에 해당하지 않는 셀 표기 */
const NOT_APPLICABLE = '해당 없음'

/** 시안: 교육 월은 숫자만(`6`), 단위 없음 */
function formatEducationMonth(record: EducationRecordRow): string {
  if (record.educationMonth) {
    const parts = record.educationMonth.trim().split('-')
    if (parts.length >= 2) {
      const month = Number(parts[1])
      if (month >= 1 && month <= 12) return String(month)
    }
    const digits = record.educationMonth.replace(/\D/g, '')
    if (digits.length >= 6) {
      const month = Number(digits.slice(4, 6))
      if (month >= 1 && month <= 12) return String(month)
    }
  }
  if (record.startDate) {
    const parsed = new Date(record.startDate)
    if (!Number.isNaN(parsed.getTime())) return String(parsed.getMonth() + 1)
  }
  return '-'
}

function formatPartnerInvolvement(value?: boolean | string): string {
  if (value === true || value === 'Yes' || value === 'YES') return 'Yes'
  if (value === false || value === 'No' || value === 'NO') return 'No'
  if (value == null || value === '') return 'No'
  return String(value)
}

export function createEducationRecordColumns(): ColumnsType<EducationRecordRow> {
  return [
    {
      title: '교육 월',
      key: 'educationMonth',
      width: 80,
      align: 'center',
      render: (_: unknown, record: EducationRecordRow) => formatEducationMonth(record),
    },
    {
      title: '사업 분야',
      dataIndex: 'businessArea',
      key: 'businessArea',
      width: 140,
      align: 'center',
      render: (value?: string) => value || '-',
    },
    {
      title: '후원사명(국문)',
      dataIndex: 'sponsorNameKo',
      key: 'sponsorNameKo',
      width: 240,
      align: 'center',
      render: (value?: string) => value || '-',
    },
    {
      title: '후원사명(영문)',
      dataIndex: 'sponsorNameEn',
      key: 'sponsorNameEn',
      width: 240,
      align: 'center',
      render: (value?: string) => value || '-',
    },
    {
      title: '대표 프로그램명(국문)',
      dataIndex: 'mainTitle',
      key: 'mainTitle',
      width: 240,
      align: 'center',
      render: (value?: string) => value || '-',
    },
    {
      title: '대표 프로그램명(영문)',
      dataIndex: 'titleEn',
      key: 'titleEn',
      width: 240,
      align: 'center',
      render: (value?: string) => value || '-',
    },
    {
      title: '세부 프로그램명(국문)',
      dataIndex: 'title',
      key: 'title',
      width: 240,
      align: 'center',
      render: (value?: string) => value || '-',
    },
    {
      title: '교재명(국문)',
      dataIndex: 'textbookName',
      key: 'textbookName',
      width: 240,
      align: 'center',
      render: (value?: string) => value || '-',
    },
    {
      title: '교재명(영문)',
      dataIndex: 'textbookNameEn',
      key: 'textbookNameEn',
      width: 240,
      align: 'center',
      render: (value?: string) => value || '-',
    },
    {
      title: '기관명',
      dataIndex: 'schoolOrOrganizationName',
      key: 'schoolName',
      width: 180,
      align: 'center',
      render: (value?: string) => value || '-',
    },
    {
      title: '시군구',
      dataIndex: 'district',
      key: 'district',
      width: 140,
      align: 'center',
      render: (value?: string) => value || '-',
    },
    {
      title: '대상 구분',
      dataIndex: 'targetLevel',
      key: 'targetLevel',
      width: 140,
      align: 'center',
      render: (value?: string) => formatEducationRecordTargetLevel(value),
    },
    {
      title: 'IP Owned',
      dataIndex: 'ipOwned',
      key: 'ipOwned',
      width: 140,
      align: 'center',
      render: (value?: string) => value || 'JA',
    },
    {
      title: 'Course Delivered By',
      dataIndex: 'courseDeliveredBy',
      key: 'courseDeliveredBy',
      width: 160,
      align: 'center',
      render: (value?: string) => value || '-',
    },
    {
      title: 'Partner Involvement',
      dataIndex: 'partnerInvolvement',
      key: 'partnerInvolvement',
      width: 160,
      align: 'center',
      render: (value?: boolean | string) => formatPartnerInvolvement(value),
    },
    {
      title: '기관 구분',
      dataIndex: 'institutionType',
      key: 'institutionType',
      width: 140,
      align: 'center',
      render: (value?: string) => formatEducationRecordInstitutionType(value),
    },
    {
      title: 'IPS',
      dataIndex: 'ips',
      key: 'ips',
      width: 140,
      align: 'center',
      render: (value?: string) => value || '-',
    },
    {
      title: (
        <>
          프로그램 종류
          <br />
          (IPS 구분이 Succeed 일 경우만)
        </>
      ),
      dataIndex: 'programCategory',
      key: 'programCategory',
      width: 240,
      align: 'center',
      render: (value: string | null | undefined, record: EducationRecordRow) =>
        record.ips === 'Succeed' ? value || NOT_APPLICABLE : NOT_APPLICABLE,
    },
    {
      title: (
        <>
          프로그램 채널 및 형식
          <br />
          (IPS 구분이 Inspire일 경우만)
        </>
      ),
      dataIndex: 'programChannel',
      key: 'programChannel',
      width: 240,
      align: 'center',
      render: (value: string | null | undefined, record: EducationRecordRow) =>
        record.ips === 'Inspire' ? value || NOT_APPLICABLE : NOT_APPLICABLE,
    },
    {
      title: '교육 형태',
      dataIndex: 'educationType',
      key: 'educationType',
      width: 140,
      align: 'center',
      render: (value?: string) => formatEducationRecordEducationType(value),
    },
    {
      title: '교육 시간',
      dataIndex: 'educationHours',
      key: 'educationHours',
      width: 100,
      align: 'center',
      render: (value?: number) => (value != null ? value : '-'),
    },
    {
      title: '학급 수',
      dataIndex: 'classCount',
      key: 'classCount',
      width: 100,
      align: 'center',
      render: (value?: number) => (value != null ? value : '-'),
    },
    {
      title: '남',
      dataIndex: 'maleParticipants',
      key: 'maleParticipants',
      width: 100,
      align: 'center',
      render: (value?: number) => value ?? '-',
    },
    {
      title: '여',
      dataIndex: 'femaleParticipants',
      key: 'femaleParticipants',
      width: 100,
      align: 'center',
      render: (value?: number) => value ?? '-',
    },
    {
      title: '총 참가자',
      dataIndex: 'totalParticipants',
      key: 'totalParticipants',
      width: 100,
      align: 'center',
      render: (value?: number) => value ?? '-',
    },
    {
      title: '일반 자원봉사자',
      dataIndex: 'generalVolunteers',
      key: 'generalVolunteers',
      width: 140,
      align: 'center',
      render: (value?: number) => value ?? '-',
    },
    {
      title: '임직원 자원봉사자',
      dataIndex: 'staffVolunteers',
      key: 'staffVolunteers',
      width: 140,
      align: 'center',
      render: (value?: number) => value ?? '-',
    },
    {
      title: '재참여 자원봉사자',
      dataIndex: 'returningVolunteers',
      key: 'returningVolunteers',
      width: 140,
      align: 'center',
      render: (value?: number) => value ?? '-',
    },
    {
      title: '일반 담당교사',
      dataIndex: 'generalTeachers',
      key: 'generalTeachers',
      width: 120,
      align: 'center',
      render: (value?: number) => value ?? '-',
    },
    {
      title: '교육 받은 교사',
      dataIndex: 'educatedTeachers',
      key: 'educatedTeachers',
      width: 120,
      align: 'center',
      render: (value?: number) => value ?? '-',
    },
    {
      title: '강사',
      dataIndex: 'instructors',
      key: 'instructors',
      width: 100,
      align: 'center',
      render: (value?: number) => value ?? '-',
    },
    {
      title: '취약계층 학생',
      dataIndex: 'vulnerableStudents',
      key: 'vulnerableStudents',
      width: 120,
      align: 'center',
      render: (value?: number) => value ?? '-',
    },
    {
      title: '담당자명',
      dataIndex: 'managerName',
      key: 'managerName',
      width: 140,
      align: 'center',
      render: (value?: string) => value || '-',
    },
  ]
}
