/**
 * 실적 관리 목록 테이블 컬럼 정의 (AntD)
 * - 32개 컬럼 (기존 33개 중 `상태` 제외)
 * - 모든 셀은 **plain text** 렌더 (Tag/Tooltip/strong 래퍼 제거)
 * - 텍스트 정렬/컬러/폰트 스펙은 `education-record-list-page.css` 에서 일괄 적용
 * - 컬럼 width 는 대표 컨텐츠 길이가 잘리지 않도록 넉넉히 산정
 */

import type { ColumnsType } from 'antd/es/table'
import type { Program, Sponsor } from '@/types/domain'
import type { EducationRecordProgramRegion } from '../lib/education-record-region'

const TARGET_LEVEL_LABELS: Record<string, string> = {
  elementary: '초',
  middle: '중',
  high: '고',
}

const INSTITUTION_TYPE_LABELS: Record<string, string> = {
  inside_school: '학교 안',
  outside_school: '학교 밖',
}

const PROGRAM_TYPE_LABELS: Record<string, string> = {
  online: '온라인',
  offline: '오프라인',
  hybrid: '하이브리드',
}

export type EducationRecordColumnDeps = {
  sponsors: Sponsor[]
  sponsorMap: Map<string, Sponsor>
  /** Program → 학교·지역 정보 Map (없으면 `district`로 fallback) */
  programRegionMap: Map<string, EducationRecordProgramRegion>
}

export function createEducationRecordColumns({
  sponsors,
  sponsorMap,
  programRegionMap,
}: EducationRecordColumnDeps): ColumnsType<Program> {
  const getSponsorNameKo = (id?: string) => {
    if (!id) return '-'
    const sponsor = sponsorMap.get(id) ?? sponsors.find(s => s.id === id)
    return sponsor?.name || '-'
  }
  const getSponsorNameEn = (id?: string) => {
    if (!id) return '-'
    const sponsor = sponsorMap.get(id) ?? sponsors.find(s => s.id === id)
    return sponsor?.nameEn || '-'
  }

  return [
    {
      title: '교육 월',
      dataIndex: 'startDate',
      key: 'educationMonth',
      width: 90,
      align: 'center',
      render: (date?: string) => {
        if (!date) return '-'
        const parsed = new Date(date)
        if (Number.isNaN(parsed.getTime())) return '-'
        return `${parsed.getMonth() + 1}월`
      },
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
      title: '후원사명(영문)',
      dataIndex: 'sponsorId',
      key: 'sponsorNameEn',
      width: 220,
      align: 'center',
      render: (sponsorId: string) => getSponsorNameEn(sponsorId),
    },
    {
      title: '프로그램명(영문)',
      dataIndex: 'titleEn',
      key: 'titleEn',
      width: 260,
      align: 'center',
      render: (value?: string) => value || '-',
    },
    {
      title: '후원사명(국문)',
      dataIndex: 'sponsorId',
      key: 'sponsorNameKo',
      width: 200,
      align: 'center',
      render: (sponsorId: string) => getSponsorNameKo(sponsorId),
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
      title: '학교명 (기관)',
      key: 'schoolName',
      width: 220,
      align: 'center',
      render: (_: unknown, record: Program) => {
        const info = programRegionMap.get(record.id)
        return info?.schoolName || '-'
      },
    },
    {
      title: '시군구',
      key: 'district',
      width: 140,
      align: 'center',
      render: (_: unknown, record: Program) => {
        const info = programRegionMap.get(record.id)
        return info?.region || record.district || '-'
      },
    },
    {
      title: '대상 구분',
      dataIndex: 'targetLevel',
      key: 'targetLevel',
      width: 110,
      align: 'center',
      render: (value?: string) => (value ? (TARGET_LEVEL_LABELS[value] ?? value) : '-'),
    },
    {
      title: 'IP Owned',
      dataIndex: 'ipOwned',
      key: 'ipOwned',
      width: 110,
      align: 'center',
      render: (value?: string) => value || 'JA',
    },
    {
      title: 'Course Delivered By',
      dataIndex: 'courseDeliveredBy',
      key: 'courseDeliveredBy',
      width: 190,
      align: 'center',
      render: (value?: string) => value || '-',
    },
    {
      title: 'Partner Involvement',
      dataIndex: 'partnerInvolvement',
      key: 'partnerInvolvement',
      width: 190,
      align: 'center',
      render: (value?: boolean) => (value ? 'Yes' : 'No'),
    },
    {
      title: '기관 구분',
      dataIndex: 'institutionType',
      key: 'institutionType',
      width: 120,
      align: 'center',
      render: (value?: string) => (value ? (INSTITUTION_TYPE_LABELS[value] ?? value) : '-'),
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
      render: (value: string | null | undefined, record: Program) =>
        record.ips === 'Succeed' ? value || '-' : '-',
    },
    {
      title: '프로그램 채널 및 형식',
      dataIndex: 'programChannel',
      key: 'programChannel',
      width: 200,
      align: 'center',
      render: (value: string | null | undefined, record: Program) =>
        record.ips === 'Inspire' ? value || '-' : '-',
    },
    {
      title: '교육 형태',
      dataIndex: 'type',
      key: 'type',
      width: 130,
      align: 'center',
      render: (value: string) => PROGRAM_TYPE_LABELS[value] ?? value ?? '-',
    },
    {
      title: '교육시간',
      dataIndex: 'educationTime',
      key: 'educationTime',
      width: 110,
      align: 'center',
      render: (value?: number) => (value != null ? `${value}시간` : '-'),
    },
    {
      title: '학급수',
      key: 'classCount',
      width: 100,
      align: 'center',
      render: (_: unknown, record: Program) => {
        const count = record.rounds?.[0]?.classCount
        return count != null ? count : '-'
      },
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
