/**
 * 실적 관리 목록 테이블 컬럼 정의 (AntD)
 * - 32개 컬럼 (기존 33개 중 `상태` 제외)
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

function formatEducationMonth(record: EducationRecordRow): string {
  if (record.educationMonth) {
    const parts = record.educationMonth.trim().split('-')
    if (parts.length >= 2) {
      const month = Number(parts[1])
      if (month >= 1 && month <= 12) return `${month}월`
    }
    const digits = record.educationMonth.replace(/\D/g, '')
    if (digits.length >= 6) {
      const month = Number(digits.slice(4, 6))
      if (month >= 1 && month <= 12) return `${month}월`
    }
  }
  if (record.startDate) {
    const parsed = new Date(record.startDate)
    if (!Number.isNaN(parsed.getTime())) return `${parsed.getMonth() + 1}월`
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
      width: 90,
      align: 'center',
      render: (_: unknown, record: EducationRecordRow) => formatEducationMonth(record),
    },
    {
      title: '사업분야',
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
      width: 200,
      align: 'center',
      render: (value?: string) => value || '-',
    },
    {
      title: '후원사명(영문)',
      dataIndex: 'sponsorNameEn',
      key: 'sponsorNameEn',
      width: 220,
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
      width: 260,
      align: 'center',
      render: (value?: string) => value || '-',
    },
    {
      title: '세부 프로그램명(국문)',
      dataIndex: 'title',
      key: 'title',
      width: 260,
      align: 'center',
      render: (value?: string) => value || '-',
    },
    {
      title: '교재명(국문)',
      dataIndex: 'textbookName',
      key: 'textbookName',
      width: 200,
      align: 'center',
      render: (value?: string) => value || '-',
    },
    {
      title: '교재명(영문)',
      dataIndex: 'textbookNameEn',
      key: 'textbookNameEn',
      width: 220,
      align: 'center',
      render: (value?: string) => value || '-',
    },
    {
      title: '기관명',
      dataIndex: 'schoolOrOrganizationName',
      key: 'schoolName',
      width: 220,
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
      width: 110,
      align: 'center',
      render: (value?: string) => formatEducationRecordTargetLevel(value),
    },
    {
      title: 'IP Owned',
      dataIndex: 'ipOwned',
      key: 'ipOwned',
      width: 130,
      align: 'center',
      render: (value?: string) => value || 'JA',
    },
    {
      title: 'Course Delivered By',
      dataIndex: 'courseDeliveredBy',
      key: 'courseDeliveredBy',
      width: 210,
      align: 'center',
      render: (value?: string) => value || '-',
    },
    {
      title: 'Partner Involvement',
      dataIndex: 'partnerInvolvement',
      key: 'partnerInvolvement',
      width: 190,
      align: 'center',
      render: (value?: boolean | string) => formatPartnerInvolvement(value),
    },
    {
      title: '기관 구분',
      dataIndex: 'institutionType',
      key: 'institutionType',
      width: 120,
      align: 'center',
      render: (value?: string) => formatEducationRecordInstitutionType(value),
    },
    {
      title: 'IPS',
      dataIndex: 'ips',
      key: 'ips',
      width: 110,
      align: 'center',
      render: (value?: string) => value || '-',
    },
    {
      title: '프로그램 종류',
      dataIndex: 'programCategory',
      key: 'programCategory',
      width: 170,
      align: 'center',
      render: (value: string | null | undefined, record: EducationRecordRow) =>
        record.ips === 'Succeed' ? value || '-' : '-',
    },
    {
      title: '프로그램 채널 및 형식',
      dataIndex: 'programChannel',
      key: 'programChannel',
      width: 200,
      align: 'center',
      render: (value: string | null | undefined, record: EducationRecordRow) =>
        record.ips === 'Inspire' ? value || '-' : '-',
    },
    {
      title: '교육 형태',
      dataIndex: 'educationType',
      key: 'educationType',
      width: 130,
      align: 'center',
      render: (value?: string) => formatEducationRecordEducationType(value),
    },
    {
      title: '교육시간',
      dataIndex: 'educationHours',
      key: 'educationHours',
      width: 110,
      align: 'center',
      render: (value?: number) => (value != null ? `${value}시간` : '-'),
    },
    {
      title: '학급수',
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
      width: 80,
      align: 'center',
      render: (value?: number) => value ?? '-',
    },
    {
      title: '여',
      dataIndex: 'femaleParticipants',
      key: 'femaleParticipants',
      width: 80,
      align: 'center',
      render: (value?: number) => value ?? '-',
    },
    {
      title: '총 참가자',
      dataIndex: 'totalParticipants',
      key: 'totalParticipants',
      width: 120,
      align: 'center',
      render: (value?: number) => value ?? '-',
    },
    {
      title: '일반 자원봉사자',
      dataIndex: 'generalVolunteers',
      key: 'generalVolunteers',
      width: 150,
      align: 'center',
      render: (value?: number) => value ?? '-',
    },
    {
      title: '임직원 자원봉사자',
      dataIndex: 'staffVolunteers',
      key: 'staffVolunteers',
      width: 170,
      align: 'center',
      render: (value?: number) => value ?? '-',
    },
    {
      title: '재참여 자원봉사자',
      dataIndex: 'returningVolunteers',
      key: 'returningVolunteers',
      width: 170,
      align: 'center',
      render: (value?: number) => value ?? '-',
    },
    {
      title: '일반담당교사',
      dataIndex: 'generalTeachers',
      key: 'generalTeachers',
      width: 140,
      align: 'center',
      render: (value?: number) => value ?? '-',
    },
    {
      title: '교육받은교사',
      dataIndex: 'educatedTeachers',
      key: 'educatedTeachers',
      width: 140,
      align: 'center',
      render: (value?: number) => value ?? '-',
    },
    {
      title: '강사',
      dataIndex: 'instructors',
      key: 'instructors',
      width: 90,
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
