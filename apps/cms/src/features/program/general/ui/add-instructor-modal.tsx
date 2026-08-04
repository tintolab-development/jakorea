/**
 * 강사진 추가 모달
 * 프로그램 진행 현황 > 강사 정보 탭에서 "강사 추가" 클릭 시 노출
 * ContentModal 사용, 1400px 대형 레이아웃 스펙
 * 섹션: 기본 정보(프로필 사진 + 2열 필드), 최종 학력, 경력 상세, 자격 및 면허, 수상 및 수료 내역
 */

import { useEffect, useRef, useState } from 'react'
import { Form, Input, DatePicker, Modal, Pagination } from 'antd' // TODO(custom-ui): 주소검색 nested Modal → ContentModal (커스텀 크롬)
import type { InputHTMLAttributes } from 'react'
import { useForm, type Path } from 'react-hook-form'
import {
  getCmsJusoMissingKeyMessage,
  readJusoApiUrlFromEnv,
  readJusoConfmKeyFromEnv,
  useJusoAddressSearch,
  type JusoAddressItem,
} from '@/shared/hooks'

/** 주소 검색용: 아이콘 + 네이티브 input 한 묶음 220×40, Form.Item value/onChange는 input에 전달 */
interface AddressSearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onSearchClick: () => void
}

function AddressSearchInput({ onSearchClick, ...props }: AddressSearchInputProps) {
  return (
    <div className="add-instructor-modal__table-input-wrap add-instructor-modal__table-input-wrap--with-prefix">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        className="add-instructor-modal__table-input-prefix"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M8.15625 1.6875C11.7288 1.6875 14.625 4.58366 14.625 8.15625C14.625 9.73996 14.0538 11.189 13.1089 12.3135L16.1477 15.3523C16.3673 15.572 16.3673 15.9281 16.1477 16.1477C15.9281 16.3674 15.572 16.3673 15.3523 16.1477L12.3135 13.11C11.1891 14.0546 9.73971 14.625 8.15625 14.625C4.58366 14.625 1.6875 11.7288 1.6875 8.15625C1.6875 4.58366 4.58366 1.6875 8.15625 1.6875ZM8.15625 2.8125C5.20498 2.8125 2.8125 5.20498 2.8125 8.15625C2.8125 11.1075 5.20498 13.5 8.15625 13.5C11.1075 13.5 13.5 11.1075 13.5 8.15625C13.5 5.20498 11.1075 2.8125 8.15625 2.8125Z"
          fill="#85969D"
        />
      </svg>
      <input className="add-instructor-modal__table-input" {...props} />
      <button
        type="button"
        className="add-instructor-modal__address-search-btn"
        onClick={onSearchClick}
      >
        주소검색
      </button>
    </div>
  )
}
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton, CmsNumericInput, CmsRadio } from '@/shared/ui'
import type {
  ParticipatingInstructorRow,
  SettlementStatusKey } from '@/data/mock/participating-instructors'
import { INSTRUCTOR_SCHOOL_OPTIONS } from '@/data/mock/participating-instructors'
import { EducationSection } from './add-instructor-education-section'
import { CareerDetailSection } from './add-instructor-career-section'
import { NativeSelect } from './add-instructor-native-select'
import './add-instructor-modal.css'

/** 삭제용 X 아이콘 28×28 (자격·수상 섹션 삭제 버튼) */
function CloseXIcon({ maskId }: { maskId: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden
    >
      <g opacity="0.6">
        <mask
          id={maskId}
          className="add-instructor-modal__close-x-mask"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="28"
          height="28"
        >
          <rect width="28" height="28" fill="#D9D9D9" />
        </mask>
        <g mask={`url(#${maskId})`}>
          <path
            d="M13.9985 15.083L17.5837 18.6685C17.7453 18.8299 17.924 18.9076 18.12 18.9018C18.3159 18.8958 18.4983 18.8083 18.6675 18.6393C18.8365 18.4701 18.921 18.2895 18.921 18.0974C18.921 17.9053 18.8365 17.7246 18.6675 17.5555L15.082 13.9995L18.6675 10.4143C18.8289 10.2527 18.9115 10.0739 18.9154 9.87794C18.9191 9.68213 18.8365 9.49965 18.6675 9.33048C18.4983 9.16151 18.3177 9.07702 18.1256 9.07702C17.9335 9.07702 17.7528 9.16151 17.5837 9.33048L13.9985 12.9159L10.4133 9.33048C10.2518 9.16909 10.0778 9.08645 9.89154 9.08256C9.70546 9.07887 9.52784 9.16151 9.35867 9.33048C9.1897 9.49965 9.10521 9.68028 9.10521 9.8724C9.10521 10.0645 9.1897 10.2451 9.35867 10.4143L12.915 13.9995L9.3295 17.5846C9.16811 17.7462 9.09034 17.9202 9.09617 18.1064C9.1022 18.2925 9.1897 18.4701 9.35867 18.6393C9.52784 18.8083 9.70847 18.8928 9.90059 18.8928C10.0927 18.8928 10.2733 18.8083 10.4425 18.6393L13.9985 15.083ZM14.0005 24.6161C12.5453 24.6161 11.1724 24.3398 9.88192 23.7872C8.59139 23.2346 7.46186 22.4742 6.49334 21.5061C5.52481 20.538 4.76404 19.4089 4.21104 18.119C3.65824 16.829 3.38184 15.4565 3.38184 14.0015C3.38184 12.5269 3.65814 11.1491 4.21075 9.86831C4.76336 8.58751 5.52374 7.46284 6.49188 6.49431C7.46002 5.52578 8.58906 4.76502 9.879 4.21202C11.1689 3.65922 12.5414 3.38281 13.9965 3.38281C15.4711 3.38281 16.8489 3.65912 18.1297 4.21173C19.4105 4.76434 20.5351 5.52472 21.5037 6.49285C22.4722 7.46099 23.233 8.58517 23.786 9.8654C24.3388 11.1456 24.6152 12.523 24.6152 13.9974C24.6152 15.4527 24.3389 16.8255 23.7863 18.1161C23.2336 19.4066 22.4733 20.5361 21.5051 21.5046C20.537 22.4732 19.4128 23.2339 18.1326 23.7869C16.8524 24.3397 15.475 24.6161 14.0005 24.6161Z"
            fill="#3D3D3D"
          />
        </g>
      </g>
    </svg>
  )
}

const BANK_OPTIONS = [
  { label: '국민은행', value: 'kb' },
  { label: '신한은행', value: 'shinhan' },
  { label: '우리은행', value: 'woori' },
  { label: '하나은행', value: 'hana' },
  { label: '농협은행', value: 'nh' },
  { label: '기업은행', value: 'ibk' },
  { label: '카카오뱅크', value: 'kakao' },
]

export interface EducationItem {
  schoolType?: string
  status?: string
  schoolName?: string
  major?: string
  enrollmentYear?: string
  graduationYear?: string
}

export interface CareerItem {
  companyName?: string
  role?: string
  startDate?: string
  endDate?: string
  isCurrent?: boolean
}

export interface QualificationItem {
  name?: string
  issuer?: string
  year?: string
}

export interface AwardItem {
  name?: string
  issuer?: string
  year?: string
}

export interface JaKoreaActivityItem {
  programName?: string
  startDate?: string
  endDate?: string
  remarks?: string
}

export interface AddInstructorFormValues {
  /** 기본 정보 - 목록 행 매핑용 */
  nameKorean?: string
  nameEnglish?: string
  /** 주민등록번호 앞 6자리 / 뒤 7자리 */
  residentRegistrationFirst?: string
  residentRegistrationLast?: string
  contact?: string
  email?: string
  address?: string
  detailAddress?: string
  militaryStatus?: string
  bankName?: string
  accountNumber?: string
  accountHolder?: string
  oneLineIntro?: string
  schoolName?: string
  /** 반복 항목 */
  educations?: EducationItem[]
  careerType?: 'new' | 'experienced'
  careers?: CareerItem[]
  careerTypeSchool?: string
  careerTypeStatus?: string
  jaKoreaExperiences?: JaKoreaActivityItem[]
  qualifications?: QualificationItem[]
  awards?: AwardItem[]
  /** 자유 작성 항목 1~4번 (3장 이내) */
  freeWriting1?: string
  freeWriting2?: string
  freeWriting3?: string
  freeWriting4?: string
  consentOpenProfile?: 'agree' | 'disagree'
  consentOpenEducation?: 'agree' | 'disagree'
  consentOpenCareer?: 'agree' | 'disagree'
  consentOpenJaActivity?: 'agree' | 'disagree'
  consentMarketing?: 'agree' | 'disagree'
  consentWithholdingTax?: 'agree' | 'disagree'
  consentCriminalRecord?: 'agree' | 'disagree'
  consentAdministrativeInfo?: 'agree' | 'disagree'
  /** 교육 진행자 동의 서약 (행정정보 공동이용과 동일 UI) */
  consentEducationFacilitatorPledge?: 'agree' | 'disagree'
}

interface AddInstructorModalProps {
  open: boolean
  onCancel: () => void
  onAdd: (values: AddInstructorFormValues) => void
}

const requiredMark = (labelNode: React.ReactNode, { required }: { required?: boolean }) =>
  required ? (
    <>
      {labelNode}
      <span className="add-instructor-modal__required-asterisk" aria-hidden>
        {' '}
        *
      </span>
    </>
  ) : (
    labelNode
  )

const CONSENT_RADIO_OPTIONS = [
  { label: '동의', value: 'agree' },
  { label: '미동의', value: 'disagree' },
]

const INITIAL_FORM_VALUES: AddInstructorFormValues = {
  nameKorean: '',
  nameEnglish: '',
  residentRegistrationFirst: '',
  residentRegistrationLast: '',
  contact: '',
  email: '',
  address: '',
  detailAddress: '',
  militaryStatus: 'not_completed',
  bankName: undefined,
  accountNumber: '',
  accountHolder: '',
  oneLineIntro: '',
  schoolName: undefined,
  educations: [{}],
  careerType: 'experienced',
  careerTypeSchool: undefined,
  careerTypeStatus: undefined,
  careers: [{}],
  jaKoreaExperiences: [{}],
  qualifications: [{}],
  awards: [{}],
  freeWriting1: '',
  freeWriting2: '',
  freeWriting3: '',
  freeWriting4: '',
  consentOpenProfile: 'agree',
  consentOpenEducation: 'agree',
  consentOpenCareer: 'agree',
  consentOpenJaActivity: 'agree',
  consentMarketing: 'agree',
  consentWithholdingTax: 'agree',
  consentCriminalRecord: 'disagree',
  consentAdministrativeInfo: 'agree',
  consentEducationFacilitatorPledge: 'agree' }

const ADDRESS_SEARCH_COUNT_PER_PAGE = 10

export function AddInstructorModal({ open, onCancel, onAdd }: AddInstructorModalProps) {
  const [form] = Form.useForm<AddInstructorFormValues>()
  const [isAddressPopupOpen, setIsAddressPopupOpen] = useState(false)
  const [addressKeyword, setAddressKeyword] = useState('')
  const [addressPage, setAddressPage] = useState(1)
  const detailAddressInputRef = useRef<HTMLInputElement | null>(null)
  const rhfForm = useForm<AddInstructorFormValues>({
    defaultValues: INITIAL_FORM_VALUES,
    mode: 'onChange' })
  const {
    addresses,
    totalCount,
    loading: addressLoading,
    error: addressError,
    search: searchAddress,
    reset: resetAddressSearch } = useJusoAddressSearch({
    confmKey: readJusoConfmKeyFromEnv(),
    countPerPage: ADDRESS_SEARCH_COUNT_PER_PAGE,
    apiUrl: readJusoApiUrlFromEnv(),
    missingKeyMessage: getCmsJusoMissingKeyMessage(),
  })
  const jaKoreaExperiences = Form.useWatch('jaKoreaExperiences', form) ?? []
  const qualifications = Form.useWatch('qualifications', form) ?? []
  const awards = Form.useWatch('awards', form) ?? []
  const consentWithholdingTax = Form.useWatch('consentWithholdingTax', form)
  const consentCriminalRecord = Form.useWatch('consentCriminalRecord', form)
  const consentAdministrativeInfo = Form.useWatch('consentAdministrativeInfo', form)
  const consentEducationFacilitatorPledge = Form.useWatch('consentEducationFacilitatorPledge', form)
  const jaProgramCount = countRows(jaKoreaExperiences)
  const qualificationCount = countRows(qualifications)
  const awardCount = countRows(awards)

  const syncToReactHookForm = (values: AddInstructorFormValues) => {
    const walk = (target: unknown, basePath = '') => {
      if (Array.isArray(target)) {
        target.forEach((item, index) => {
          const nextPath = basePath ? `${basePath}.${index}` : String(index)
          walk(item, nextPath)
        })
        if (target.length === 0 && basePath) {
          rhfForm.setValue(basePath as Path<AddInstructorFormValues>, [] as never, {
            shouldDirty: true })
        }
        return
      }
      if (target && typeof target === 'object') {
        Object.entries(target).forEach(([key, value]) => {
          const nextPath = basePath ? `${basePath}.${key}` : key
          walk(value, nextPath)
        })
        return
      }
      if (basePath) {
        rhfForm.setValue(basePath as Path<AddInstructorFormValues>, target as never, {
          shouldDirty: true })
      }
    }
    walk(values)
  }

  useEffect(() => {
    if (open) {
      form.resetFields()
      form.setFieldsValue(INITIAL_FORM_VALUES)
      rhfForm.reset(INITIAL_FORM_VALUES)
    }
  }, [open, form, rhfForm])

  const openAddressPopup = () => {
    setAddressKeyword((form.getFieldValue('address') ?? '').trim())
    setAddressPage(1)
    setIsAddressPopupOpen(true)
  }

  const closeAddressPopup = () => {
    setIsAddressPopupOpen(false)
    setAddressKeyword('')
    setAddressPage(1)
    resetAddressSearch()
  }

  const handleAddressSearch = async () => {
    setAddressPage(1)
    await searchAddress(addressKeyword, 1)
  }

  const handleAddressPageChange = async (nextPage: number) => {
    setAddressPage(nextPage)
    await searchAddress(addressKeyword, nextPage)
  }

  const handleAddressSelect = (addressItem: JusoAddressItem) => {
    const selectedAddress = addressItem.roadAddr || addressItem.jibunAddr
    form.setFieldValue('address', selectedAddress)
    rhfForm.setValue('address', selectedAddress)
    closeAddressPopup()
    window.setTimeout(() => detailAddressInputRef.current?.focus(), 0)
  }

  const handleSubmit = (values: AddInstructorFormValues) => {
    syncToReactHookForm(values)
    onAdd(rhfForm.getValues())
    form.resetFields()
    rhfForm.reset(INITIAL_FORM_VALUES)
    onCancel()
  }

  const handleCancel = () => {
    form.resetFields()
    rhfForm.reset(INITIAL_FORM_VALUES)
    onCancel()
  }

  const footer = (
    <div className="add-instructor-modal__footer-actions">
      <CmsButton variant="secondary" size="large" onClick={handleCancel}>
        닫기
      </CmsButton>
      <CmsButton
        type="submit"
        variant="primary"
        size="large"
        form="add-instructor-form"
      >
        신규 등록
      </CmsButton>
    </div>
  )

  return (
    <ContentModal
      open={open}
      onCancel={handleCancel}
      title="강사진 등록"
      footer={footer}
      width={1400}
      size="large"
      className="add-instructor-content-modal"
    >
      <Form
        id="add-instructor-form"
        form={form}
        layout="vertical"
        className="add-instructor-modal__form"
        onFinish={handleSubmit}
        onValuesChange={(_, allValues) => syncToReactHookForm(allValues as AddInstructorFormValues)}
        requiredMark={requiredMark}
        initialValues={INITIAL_FORM_VALUES}
      >
        {/* 기본 정보: 스크린샷 기준 2열 테이블 */}
        <section className="add-instructor-modal__section add-instructor-modal__section--basic">
          <h3 className="add-instructor-modal__section-title">
            기본 정보
            <span className="add-instructor-modal__required-asterisk" aria-hidden>
              {' '}
              *
            </span>
          </h3>
          <div className="add-instructor-modal__basic-info">
            <div className="add-instructor-modal__basic-table-wrap">
              <table className="add-instructor-modal__basic-table">
                <colgroup>
                  <col className="add-instructor-modal__basic-table-col-label" />
                  <col className="add-instructor-modal__basic-table-col-input" />
                  <col className="add-instructor-modal__basic-table-col-label" />
                  <col className="add-instructor-modal__basic-table-col-input" />
                </colgroup>
                <tbody>
                  <tr>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label">
                      <span className="add-instructor-modal__basic-table-label">한글 성명</span>
                    </td>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input">
                      <Form.Item
                        name="nameKorean"
                        noStyle
                      >
                        <input
                          className="add-instructor-modal__table-input"
                          placeholder="한글 성명"
                        />
                      </Form.Item>
                    </td>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label">
                      <span className="add-instructor-modal__basic-table-label">영문 성명</span>
                    </td>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input">
                      <Form.Item
                        name="nameEnglish"
                        noStyle
                      >
                        <input
                          className="add-instructor-modal__table-input"
                          placeholder="영문 성명"
                        />
                      </Form.Item>
                    </td>
                  </tr>
                  <tr>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label">
                      <span className="add-instructor-modal__basic-table-label">주민등록 번호</span>
                    </td>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input">
                      <div className="add-instructor-modal__resident-registration-row">
                        <Form.Item
                          name="residentRegistrationFirst"
                          trigger="onValueChange"
                          noStyle
                        >
                          <CmsNumericInput
                            mode="numericText"
                            inputSize="medium"
                            width={164.5}
                            placeholder="주민등록 앞 6자리"
                            maxLength={6}
                          />
                        </Form.Item>
                        <span
                          className="add-instructor-modal__resident-registration-divider"
                          aria-hidden
                        >
                          -
                        </span>
                        <Form.Item
                          name="residentRegistrationLast"
                          trigger="onValueChange"
                          noStyle
                        >
                          <CmsNumericInput
                            mode="numericText"
                            inputSize="medium"
                            width={164.5}
                            placeholder="주민등록 뒤 7자리"
                            maxLength={7}
                          />
                        </Form.Item>
                      </div>
                    </td>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label">
                      <span className="add-instructor-modal__basic-table-label">소속</span>
                    </td>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input">
                      <Form.Item name="schoolName" noStyle>
                        <NativeSelect
                          placeholder="소속"
                          options={INSTRUCTOR_SCHOOL_OPTIONS.map(school => ({
                            label: school,
                            value: school }))}
                          className="add-instructor-modal__table-input"
                        />
                      </Form.Item>
                    </td>
                  </tr>
                  <tr>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label">
                      <span className="add-instructor-modal__basic-table-label">연락처</span>
                    </td>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input">
                      <Form.Item
                        name="contact"
                        noStyle
                      >
                        <input className="add-instructor-modal__table-input" placeholder="연락처" />
                      </Form.Item>
                    </td>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label">
                      <span className="add-instructor-modal__basic-table-label">이메일</span>
                    </td>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input">
                      <Form.Item
                        name="email"
                        noStyle
                      >
                        <input
                          type="email"
                          className="add-instructor-modal__table-input"
                          placeholder="이메일"
                        />
                      </Form.Item>
                    </td>
                  </tr>
                  <tr>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label">
                      <span className="add-instructor-modal__basic-table-label">자택 주소</span>
                    </td>
                    <td
                      className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input"
                      colSpan={3}
                    >
                      <div className="add-instructor-modal__address-row">
                        <Form.Item
                          name="address"
                          noStyle
                        >
                          <AddressSearchInput
                            placeholder="건물명, 도로명 또는 지번"
                            readOnly
                            onSearchClick={openAddressPopup}
                            onClick={openAddressPopup}
                          />
                        </Form.Item>
                        <span className="add-instructor-modal__address-divider" aria-hidden />
                        <Form.Item name="detailAddress" noStyle>
                          <input
                            ref={detailAddressInputRef}
                            className="add-instructor-modal__table-input"
                            placeholder="상세 주소"
                          />
                        </Form.Item>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label">
                      <span className="add-instructor-modal__basic-table-label">
                        정산 계좌 정보
                      </span>
                    </td>
                    <td
                      className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input"
                      colSpan={3}
                    >
                      <div className="add-instructor-modal__bank-account-row">
                        <Form.Item name="bankName" noStyle>
                          <NativeSelect
                            placeholder="은행명"
                            options={BANK_OPTIONS}
                            className="add-instructor-modal__table-input add-instructor-modal__bank-account-select"
                          />
                        </Form.Item>
                        <Form.Item
                          name="accountNumber"
                          trigger="onValueChange"
                          noStyle
                        >
                          <CmsNumericInput
                            mode="numericText"
                            inputSize="medium"
                            width={160}
                            placeholder="계좌번호(숫자만)"
                          />
                        </Form.Item>
                        <div className="add-instructor-modal__bank-account-divider" aria-hidden />
                        <Form.Item name="accountHolder" noStyle>
                          <input
                            className="add-instructor-modal__table-input add-instructor-modal__bank-account-input--holder"
                            placeholder="예금주명"
                          />
                        </Form.Item>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label">
                      <span className="add-instructor-modal__basic-table-label">한 줄 소개</span>
                    </td>
                    <td
                      className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input"
                      colSpan={3}
                    >
                      <Form.Item name="oneLineIntro" noStyle>
                        <input
                          className="add-instructor-modal__table-input add-instructor-modal__table-input--wide"
                          placeholder="자유롭게 작성해주세요"
                        />
                      </Form.Item>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="add-instructor-modal__section">
          <h3 className="add-instructor-modal__section-title">정보 제공 동의</h3>
          <div className="add-instructor-modal__consent-table-wrap">
            <table className="add-instructor-modal__consent-table add-instructor-modal__basic-table">
              <colgroup>
                <col className="add-instructor-modal__consent-table-col-label" />
                <col className="add-instructor-modal__consent-table-col-input" />
                <col className="add-instructor-modal__consent-table-col-label" />
                <col className="add-instructor-modal__consent-table-col-input" />
              </colgroup>
              <tbody>
                <tr>
                  <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--row-label">
                    <span className="add-instructor-modal__basic-table-label">개인정보 수집 동의</span>
                  </td>
                  <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input">
                    <Form.Item name="consentOpenProfile" noStyle>
                      <CmsRadio.Group
                        options={CONSENT_RADIO_OPTIONS}
                        className="add-instructor-modal__consent-radio-group"
                      />
                    </Form.Item>
                  </td>
                  <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--row-label">
                    <span className="add-instructor-modal__basic-table-label">마케팅 제공 동의</span>
                  </td>
                  <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input">
                    <Form.Item name="consentMarketing" noStyle>
                      <CmsRadio.Group
                        options={CONSENT_RADIO_OPTIONS}
                        className="add-instructor-modal__consent-radio-group"
                      />
                    </Form.Item>
                  </td>
                </tr>
                <tr>
                  <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--row-label">
                    <span className="add-instructor-modal__basic-table-label">지급조서 작성 동의</span>
                  </td>
                  <td
                    className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input"
                    colSpan={3}
                  >
                    <div className="add-instructor-modal__consent-action-row">
                      <Form.Item name="consentWithholdingTax" noStyle>
                        <CmsRadio.Group
                          options={CONSENT_RADIO_OPTIONS}
                          className="add-instructor-modal__consent-radio-group"
                        />
                      </Form.Item>
                      <CmsButton
                        variant="secondary"
                        size="medium"
                        className="add-instructor-modal__consent-btn"
                        disabled={consentWithholdingTax !== 'agree'}
                      >
                        동의서 작성
                      </CmsButton>
                      <div className="add-instructor-modal__consent-description">
                        <p>- 작성 버튼을 눌러 동의서를 작성 및 제출해주세요.</p>
                        <p>- 제출까지 완료되어야 동의된 것으로 간주됩니다.</p>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--row-label">
                    <span className="add-instructor-modal__basic-table-label">성범죄 경력조회 동의</span>
                  </td>
                  <td
                    className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input"
                    colSpan={3}
                  >
                    <div className="add-instructor-modal__consent-action-row">
                      <Form.Item name="consentCriminalRecord" noStyle>
                        <CmsRadio.Group
                          options={CONSENT_RADIO_OPTIONS}
                          className="add-instructor-modal__consent-radio-group"
                        />
                      </Form.Item>
                      <CmsButton
                        variant="secondary"
                        size="medium"
                        className="add-instructor-modal__consent-btn"
                        disabled={consentCriminalRecord !== 'agree'}
                      >
                        동의서 작성
                      </CmsButton>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--row-label">
                    <span className="add-instructor-modal__basic-table-label">행정정보 공동이용 사전 동의</span>
                  </td>
                  <td
                    className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input"
                    colSpan={3}
                  >
                    <div className="add-instructor-modal__consent-action-row">
                      <Form.Item name="consentAdministrativeInfo" noStyle>
                        <CmsRadio.Group
                          options={CONSENT_RADIO_OPTIONS}
                          className="add-instructor-modal__consent-radio-group"
                        />
                      </Form.Item>
                      <CmsButton
                        variant="primary"
                        size="medium"
                        className="add-instructor-modal__consent-btn"
                        disabled={consentAdministrativeInfo !== 'agree'}
                      >
                        동의서 수정
                      </CmsButton>
                      <span
                        className={`add-instructor-modal__consent-complete ${consentAdministrativeInfo === 'agree' ? '' : 'add-instructor-modal__consent-complete--disabled'}`}
                      >
                        {consentAdministrativeInfo === 'agree' ? '제출 완료' : '미제출'}
                      </span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--row-label">
                    <span className="add-instructor-modal__basic-table-label">교육 진행자 동의 서약</span>
                  </td>
                  <td
                    className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input"
                    colSpan={3}
                  >
                    <div className="add-instructor-modal__consent-action-row">
                      <Form.Item name="consentEducationFacilitatorPledge" noStyle>
                        <CmsRadio.Group
                          options={CONSENT_RADIO_OPTIONS}
                          className="add-instructor-modal__consent-radio-group"
                        />
                      </Form.Item>
                      <CmsButton
                        variant="primary"
                        size="medium"
                        className="add-instructor-modal__consent-btn"
                        disabled={consentEducationFacilitatorPledge !== 'agree'}
                      >
                        동의서 수정
                      </CmsButton>
                      <span
                        className={`add-instructor-modal__consent-complete ${consentEducationFacilitatorPledge === 'agree' ? '' : 'add-instructor-modal__consent-complete--disabled'}`}
                      >
                        {consentEducationFacilitatorPledge === 'agree' ? '제출 완료' : '미제출'}
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <EducationSection />

        {/* 경력사항: careerType은 Form.useWatch로 구독, 항목 추가 버튼은 CareerDetailSection 내부에서 관리 */}
        <CareerDetailSection />

        {/* JA Korea 활동 경험: 자격 및 면허와 동일한 UI, 프로그램명·활동시작일·활동종료일·비고 */}
        <section className="add-instructor-modal__section">
          <Form.List name="jaKoreaExperiences">
            {(fields, { add, remove }) => (
              <>
                <div className="add-instructor-modal__section-head add-instructor-modal__section-head--with-btn">
                  <h3 className="add-instructor-modal__section-title">
                    JA Korea 활동 경험
                    <span className="add-instructor-modal__section-summary">
                      총 참여 프로그램 {jaProgramCount}개
                    </span>
                  </h3>
                  <CmsButton
                    type="button"
                    variant="primary"
                    size="medium"
                    className="add-instructor-modal__add-btn"
                    onClick={() => add({})}
                  >
                    항목 추가
                  </CmsButton>
                </div>
                <div className="add-instructor-modal__ja-activity-table-wrap">
                  <table className="add-instructor-modal__ja-activity-table add-instructor-modal__basic-table">
                    <colgroup>
                      <col className="add-instructor-modal__ja-activity-table-col-label" />
                      <col className="add-instructor-modal__ja-activity-table-col-input" />
                    </colgroup>
                    <tbody>
                      {fields.map((field, idx) => {
                        const showDelete = fields.length > 1 && idx > 0
                        return (
                          <tr key={field.key}>
                            <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--row-label">
                              <span className="add-instructor-modal__basic-table-label">
                                활동 {String(idx + 1).padStart(2, '0')}
                              </span>
                            </td>
                            <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input">
                              <div className="add-instructor-modal__ja-activity-row-inputs">
                                <Form.Item
                                  name={[field.name, 'programName']}
                                  noStyle
                                  className="add-instructor-modal__ja-activity-input-wrap"
                                >
                                  <Input
                                    placeholder="프로그램명"
                                    size="large"
                                    allowClear
                                    className="add-instructor-modal__table-input add-instructor-modal__ja-activity-input"
                                  />
                                </Form.Item>
                                <div
                                  className="add-instructor-modal__ja-activity-divider"
                                  aria-hidden
                                />
                                <Form.Item
                                  name={[field.name, 'startDate']}
                                  noStyle
                                  className="add-instructor-modal__ja-activity-input-wrap"
                                >
                                  <DatePicker
                                    placeholder="활동시작일"
                                    size="large"
                                    className="add-instructor-modal__table-input add-instructor-modal__ja-activity-input"
                                  />
                                </Form.Item>
                                <span
                                  className="add-instructor-modal__ja-activity-date-sep"
                                  aria-hidden
                                >
                                  ~
                                </span>
                                <Form.Item
                                  name={[field.name, 'endDate']}
                                  noStyle
                                  className="add-instructor-modal__ja-activity-input-wrap"
                                >
                                  <DatePicker
                                    placeholder="활동종료일"
                                    size="large"
                                    className="add-instructor-modal__table-input add-instructor-modal__ja-activity-input"
                                  />
                                </Form.Item>
                                <div
                                  className="add-instructor-modal__ja-activity-divider"
                                  aria-hidden
                                />
                                <Form.Item
                                  name={[field.name, 'remarks']}
                                  noStyle
                                  className="add-instructor-modal__ja-activity-input-wrap"
                                >
                                  <Input
                                    placeholder="비고"
                                    size="large"
                                    allowClear
                                    className="add-instructor-modal__table-input add-instructor-modal__ja-activity-input"
                                  />
                                </Form.Item>
                                {showDelete && (
                                  <button
                                    type="button"
                                    className="add-instructor-modal__remove-row add-instructor-modal__remove-row--table add-instructor-modal__remove-row--icon"
                                    onClick={() => remove(field.name)}
                                    aria-label="삭제"
                                    title="삭제"
                                  >
                                    <CloseXIcon maskId={`ja-activity-delete-mask-${field.key}`} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Form.List>
        </section>

        {/* 자격 및 면허: 경력사항과 동일한 행목 테이블 스타일, 타이틀·항목 추가 버튼 같은 레벨 */}
        <section className="add-instructor-modal__section">
          <Form.List name="qualifications">
            {(fields, { add, remove }) => (
              <>
                <div className="add-instructor-modal__section-head add-instructor-modal__section-head--with-btn">
                  <h3 className="add-instructor-modal__section-title">
                    자격 및 면허
                    <span className="add-instructor-modal__section-summary">
                      총 취득 개수 {qualificationCount}개
                    </span>
                  </h3>
                  <CmsButton
                    type="button"
                    variant="primary"
                    size="medium"
                    className="add-instructor-modal__add-btn"
                    onClick={() => add({})}
                  >
                    항목 추가
                  </CmsButton>
                </div>
                <div className="add-instructor-modal__qualification-table-wrap">
                  <table className="add-instructor-modal__qualification-table add-instructor-modal__basic-table">
                    <colgroup>
                      <col className="add-instructor-modal__qualification-table-col-label" />
                      <col className="add-instructor-modal__qualification-table-col-input" />
                    </colgroup>
                    <tbody>
                      {fields.map((field, idx) => {
                        const showDelete = fields.length > 1 && idx > 0
                        return (
                          <tr key={field.key}>
                            <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--row-label">
                              <span className="add-instructor-modal__basic-table-label">
                                자격 및 면허 {String(idx + 1).padStart(2, '0')}
                              </span>
                            </td>
                            <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input">
                              <div className="add-instructor-modal__qualification-row-inputs">
                                <Form.Item
                                  name={[field.name, 'name']}
                                  noStyle
                                  className="add-instructor-modal__qualification-input-wrap"
                                >
                                  <Input
                                    placeholder="자격증/면허"
                                    size="large"
                                    allowClear
                                    className="add-instructor-modal__table-input add-instructor-modal__qualification-input"
                                  />
                                </Form.Item>
                                <div
                                  className="add-instructor-modal__qualification-divider"
                                  aria-hidden
                                />
                                <Form.Item
                                  name={[field.name, 'issuer']}
                                  noStyle
                                  className="add-instructor-modal__qualification-input-wrap"
                                >
                                  <Input
                                    placeholder="발행처"
                                    size="large"
                                    allowClear
                                    className="add-instructor-modal__table-input add-instructor-modal__qualification-input"
                                  />
                                </Form.Item>
                                <div
                                  className="add-instructor-modal__qualification-divider"
                                  aria-hidden
                                />
                                <Form.Item
                                  name={[field.name, 'year']}
                                  noStyle
                                  className="add-instructor-modal__qualification-input-wrap"
                                >
                                  <DatePicker
                                    picker="year"
                                    placeholder="취득연도"
                                    size="large"
                                    className="add-instructor-modal__table-input add-instructor-modal__qualification-input"
                                  />
                                </Form.Item>
                                {showDelete && (
                                  <button
                                    type="button"
                                    className="add-instructor-modal__remove-row add-instructor-modal__remove-row--table add-instructor-modal__remove-row--icon"
                                    onClick={() => remove(field.name)}
                                    aria-label="삭제"
                                    title="삭제"
                                  >
                                    <CloseXIcon maskId={`qualification-delete-mask-${field.key}`} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Form.List>
        </section>

        {/* 수상 및 수료 내역: 자격 및 면허와 동일한 행목 테이블, 타이틀·항목 추가 같은 레벨, 인풋 220×40, 2개 이상 시 삭제 아이콘 맨 끝 */}
        <section className="add-instructor-modal__section">
          <Form.List name="awards">
            {(fields, { add, remove }) => (
              <>
                <div className="add-instructor-modal__section-head add-instructor-modal__section-head--with-btn">
                  <h3 className="add-instructor-modal__section-title">
                    수상 및 수료 내역
                    <span className="add-instructor-modal__section-summary">
                      총 수상 개수 {awardCount}개
                    </span>
                  </h3>
                  <CmsButton
                    type="button"
                    variant="primary"
                    size="medium"
                    className="add-instructor-modal__add-btn"
                    onClick={() => add({})}
                  >
                    항목 추가
                  </CmsButton>
                </div>
                <div className="add-instructor-modal__award-table-wrap">
                  <table className="add-instructor-modal__award-table add-instructor-modal__basic-table">
                    <colgroup>
                      <col className="add-instructor-modal__award-table-col-label" />
                      <col className="add-instructor-modal__award-table-col-input" />
                    </colgroup>
                    <tbody>
                      {fields.map((field, idx) => {
                        const showDelete = fields.length > 1 && idx > 0
                        return (
                          <tr key={field.key}>
                            <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--row-label">
                              <span className="add-instructor-modal__basic-table-label">
                                수상 및 수료 {String(idx + 1).padStart(2, '0')}
                              </span>
                            </td>
                            <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input">
                              <div className="add-instructor-modal__award-row-inputs">
                                <Form.Item
                                  name={[field.name, 'name']}
                                  noStyle
                                  className="add-instructor-modal__award-input-wrap"
                                >
                                  <Input
                                    placeholder="수상/수료"
                                    size="large"
                                    allowClear
                                    className="add-instructor-modal__table-input add-instructor-modal__award-input"
                                  />
                                </Form.Item>
                                <div className="add-instructor-modal__award-divider" aria-hidden />
                                <Form.Item
                                  name={[field.name, 'issuer']}
                                  noStyle
                                  className="add-instructor-modal__award-input-wrap"
                                >
                                  <Input
                                    placeholder="발행처"
                                    size="large"
                                    allowClear
                                    className="add-instructor-modal__table-input add-instructor-modal__award-input"
                                  />
                                </Form.Item>
                                <div className="add-instructor-modal__award-divider" aria-hidden />
                                <Form.Item
                                  name={[field.name, 'year']}
                                  noStyle
                                  className="add-instructor-modal__award-input-wrap"
                                >
                                  <DatePicker
                                    picker="year"
                                    placeholder="수상/수료연도"
                                    size="large"
                                    className="add-instructor-modal__table-input add-instructor-modal__award-input"
                                  />
                                </Form.Item>
                                {showDelete && (
                                  <button
                                    type="button"
                                    className="add-instructor-modal__remove-row add-instructor-modal__remove-row--table add-instructor-modal__remove-row--icon"
                                    onClick={() => remove(field.name)}
                                    aria-label="삭제"
                                    title="삭제"
                                  >
                                    <CloseXIcon maskId={`award-delete-mask-${field.key}`} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Form.List>
        </section>

        {/* 자유 작성 항목: 1~4번 문항 3장 이내, 타이틀·설명 row 정렬 */}
        <section className="add-instructor-modal__section add-instructor-modal__section--free-writing">
          <div className="add-instructor-modal__free-writing-head">
            <h3 className="add-instructor-modal__section-title add-instructor-modal__free-writing-title">자유 작성 항목</h3>
            <p className="add-instructor-modal__free-writing-description">
              1~4번 문항은 3장 이내 분량으로 작성, 내용과 형식은 자유롭게 기재 가능합니다.
            </p>
          </div>
          <div className="add-instructor-modal__free-writing-list">
            <div className="add-instructor-modal__free-writing-item">
              <div className="add-instructor-modal__free-writing-question-bar">
                1. 자기소개 및 지원동기
              </div>
              <Form.Item name="freeWriting1" noStyle>
                <Input.TextArea
                  placeholder="자유롭게 작성해주세요"
                  rows={5}
                  className="add-instructor-modal__free-writing-textarea"
                />
              </Form.Item>
            </div>
            <div className="add-instructor-modal__free-writing-item">
              <div className="add-instructor-modal__free-writing-question-bar">
                2. 청소년 경제 교육의 중요성에 대해 본인의 생각을 구체적으로 작성해주세요.
              </div>
              <Form.Item name="freeWriting2" noStyle>
                <Input.TextArea
                  placeholder="자유롭게 작성해주세요"
                  rows={5}
                  className="add-instructor-modal__free-writing-textarea"
                />
              </Form.Item>
            </div>
            <div className="add-instructor-modal__free-writing-item">
              <div className="add-instructor-modal__free-writing-question-bar">
                3. 청소년과 소통할 때 가장 중요하다고 생각하는 점은 무엇이며, 이를 실천하기 위해 어떤 노력을 하는지 작성해주세요.
              </div>
              <Form.Item name="freeWriting3" noStyle>
                <Input.TextArea
                  placeholder="자유롭게 작성해주세요"
                  rows={5}
                  className="add-instructor-modal__free-writing-textarea"
                />
              </Form.Item>
            </div>
            <div className="add-instructor-modal__free-writing-item">
              <div className="add-instructor-modal__free-writing-question-bar">
                4. 교육 중 예기치 않은 상황(예: 수업 분위기 저하, 참여도 부족 등)이 발생했을 때 대처한 사례가 있다면 공유해주세요.
              </div>
              <Form.Item name="freeWriting4" noStyle>
                <Input.TextArea
                  placeholder="자유롭게 작성해주세요"
                  rows={5}
                  className="add-instructor-modal__free-writing-textarea"
                />
              </Form.Item>
            </div>
          </div>
        </section>
      </Form>
      <Modal
        open={isAddressPopupOpen}
        onCancel={closeAddressPopup}
        footer={null}
        title={null}
        width={800}
        className="add-instructor-modal__address-popup-modal"
        destroyOnHidden
      >
        <div className="add-instructor-modal__address-popup pop-address-search">
          <div className="add-instructor-modal__address-popup-inner pop-address-search-inner">
            <div className="add-instructor-modal__address-popup-head">
              <strong className="add-instructor-modal__address-popup-title">주소검색</strong>
              <span className="add-instructor-modal__address-popup-logo logo" aria-hidden>
                JA Korea
              </span>
            </div>
            <div className="add-instructor-modal__address-popup-search wrap">
              <input
                value={addressKeyword}
                onChange={(event) => setAddressKeyword(event.target.value)}
                placeholder="건물명, 도로명 또는 지번을 입력하세요"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void handleAddressSearch()
                  }
                }}
              />
              <CmsButton
                type="button"
                variant="primary"
                size="medium"
                className="add-instructor-modal__address-popup-search-btn"
                onClick={() => void handleAddressSearch()}
              >
                검색
              </CmsButton>
            </div>
            <div className="add-instructor-modal__address-popup-result result">
              <div className="add-instructor-modal__address-popup-result-count">
                검색 결과 {totalCount.toLocaleString()}건
              </div>
              {addressError ? (
                <div className="add-instructor-modal__address-popup-empty">
                  {'주소를 확인해주세요.'}
                </div>
              ) : addressLoading ? (
                <div className="add-instructor-modal__address-popup-empty">검색 중...</div>
              ) : addresses.length === 0 ? (
                <div className="add-instructor-modal__address-popup-empty">
                  검색어를 입력하고 주소를 조회해주세요.
                </div>
              ) : (
                <table className="add-instructor-modal__address-popup-table data-col">
                  <thead>
                    <tr>
                      <th>도로명주소</th>
                      <th>지번주소</th>
                      <th>우편번호</th>
                    </tr>
                  </thead>
                  <tbody>
                    {addresses.map(addressItem => (
                      <tr
                        key={`${addressItem.roadAddr}-${addressItem.zipNo}`}
                        onClick={() => handleAddressSelect(addressItem)}
                      >
                        <td className="subj">{addressItem.roadAddr || '-'}</td>
                        <td>{addressItem.jibunAddr || '-'}</td>
                        <td>{addressItem.zipNo || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {totalCount > ADDRESS_SEARCH_COUNT_PER_PAGE && addresses.length > 0 ? (
                <div className="add-instructor-modal__address-popup-pagination">
                  <Pagination
                    size="small"
                    current={addressPage}
                    total={totalCount}
                    pageSize={ADDRESS_SEARCH_COUNT_PER_PAGE}
                    onChange={p => void handleAddressPageChange(p)}
                    showSizeChanger={false}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </Modal>
    </ContentModal>
  )
}

function countRows(items: unknown[]): number {
  return items.filter(Boolean).length
}

/** 폼 연/월 값(dayjs 또는 문자열)을 YYYY.MM 문자열로 변환 */
function formatYearMonth(val: unknown): string {
  if (val == null) return ''
  if (typeof val === 'string') return val
  const d = val as { format?: (s: string) => string }
  if (typeof d?.format === 'function') return d.format('YYYY.MM')
  return String(val)
}

/** 폼 값으로 새 참여 강사 행 생성 (목록 추가용). 학력·경력·자격·수상·자유작성은 상세 모달 강사 이력서 탭 연동용 */
export function buildInstructorRowFromForm(
  values: AddInstructorFormValues,
  nextNo: number,
  nextId: string
): ParticipatingInstructorRow {
  const instructorName =
    (values.nameKorean ?? '').trim() || (values.nameEnglish ?? '').trim() || '이름 없음'
  const firstEdu = values.educations?.[0]
  const educationLevel = firstEdu?.schoolType ?? '-'
  const educationSchoolName = firstEdu?.schoolName ?? '-'
  const educations = values.educations?.map((e) => ({
    schoolType: e.schoolType,
    status: e.status,
    schoolName: e.schoolName,
    major: e.major,
    enrollmentYear: formatYearMonth(e.enrollmentYear),
    graduationYear: formatYearMonth(e.graduationYear) }))
  return {
    id: nextId,
    no: nextNo,
    instructorName,
    schoolName: values.schoolName ?? INSTRUCTOR_SCHOOL_OPTIONS[0],
    educationGrade: '1학년',
    classCount: 0,
    studentCount: 0,
    lectureRound: '진행 전',
    settlementStatus: 'awaiting_confirmation' as SettlementStatusKey,
    teacherName: '-',
    educationLevel,
    educationSchoolName,
    lectureExperienceYears: 0,
    careerDetails: values.careers?.map((c) => ({
      companyName: c.companyName,
      role: c.role,
      startDate: c.startDate,
      endDate: c.endDate,
      isCurrent: c.isCurrent })),
    qualifications: values.qualifications,
    awards: values.awards,
    educations,
    oneLineIntro: values.oneLineIntro,
    freeWriting1: values.freeWriting1,
    freeWriting2: values.freeWriting2,
    freeWriting3: values.freeWriting3,
    freeWriting4: values.freeWriting4,
    registeredByAdmin: true }
}
