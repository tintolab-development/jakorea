import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import {
  INSTITUTION_SIDO_FILTER_OPTIONS,
  getInstitutionSigunguSelectOptions,
} from '@/shared/config/institution-address-region-data'

export const GEMINI_APPROVED_TRAINING_FILTER_FIELDS: FilterFieldConfig[] = [
  {
    key: 'institutionName',
    type: 'search',
    label: '기관명',
    placeholder: '기관명을 입력하세요',
    width: '18%',
  },
  {
    key: 'institutionAddress',
    type: 'addressRegion',
    label: '기관 소재지',
    width: '24%',
    addressRegion: {
      sidoKey: 'institutionSido',
      sigunguKey: 'institutionSigungu',
      sidoOptions: INSTITUTION_SIDO_FILTER_OPTIONS,
      getSigunguOptions: getInstitutionSigunguSelectOptions,
      sidoPlaceholder: '시/도',
      sigunguPlaceholder: '시/군/구',
    },
  },
  {
    key: 'status',
    type: 'select',
    label: '프로그램 진행 현황',
    placeholder: '전체',
    width: '16%',
    options: [
      { label: '전체', value: 'ALL' },
      { label: '프로그램 진행 예정', value: 'SCHEDULED' },
      { label: '프로그램 진행 중', value: 'IN_PROGRESS' },
      { label: '프로그램 진행 종료', value: 'ENDED' },
    ],
  },
  {
    key: 'officialDocumentRequired',
    type: 'select',
    label: '공문 필요 여부',
    placeholder: '전체',
    width: '14%',
    options: [
      { label: '전체', value: 'ALL' },
      { label: '필요', value: 'Y' },
      { label: '불필요', value: 'N' },
    ],
  },
  {
    key: 'trainingDateRange',
    type: 'dateRange',
    label: '연수일',
    width: '28%',
    defaultValue: null,
  },
]

