/**
 * 기본 정보 섹션 (프로그램 상세 정보 탭)
 * - 상단 테이블: 등록일, 수정일, 모집 상태, 진행 상태
 * - 하위 테이블: 썸네일 ~ 비고
 * - 수정 모드: react-hook-form Controller, 기존 프로그램 값이 default로 채워짐
 */

import { useEffect, useState } from 'react'
import { Image, Input, Radio, Select, DatePicker } from 'antd'
import { Controller } from 'react-hook-form'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import type { UseFormReturn } from 'react-hook-form'
import type { ProgramDetailEditFormValues } from '../model/program-detail-edit-schema'
import { FileSelectField } from '@/shared/ui/file-select-field'
import {
  formatDate,
  formatDateOnly,
  formatDateRange,
  getRecruitmentStatusValue,
  getThumbnailFilename,
  RECRUITMENT_RADIO_OPTIONS,
  CATEGORY_LABEL,
  CATEGORY_OPTIONS,
  TARGET_LEVEL_LABEL,
  LIFECYCLE_OPTIONS,
  BUSINESS_AREA_OPTIONS,
} from './program-detail-info-constants'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'

const { TextArea } = Input

export interface BasicInfoSectionProps {
  program: Program
  sponsorName?: string
  createdByName?: string
  updatedByName?: string
  lifecycleStatus?: ProgramLifecycleStatus
  onLifecycleStatusChange?: (status: ProgramLifecycleStatus) => void
  isEditMode?: boolean
  /** 수정 모드일 때만 전달, react-hook-form 인스턴스 */
  form?: UseFormReturn<ProgramDetailEditFormValues>
}

const toDayjs = (d: string | Date | undefined) => (d ? dayjs(d) : null)
const toIso = (d: Dayjs | null) => (d ? d.toISOString() : undefined)

export function BasicInfoSection({
  program,
  sponsorName,
  createdByName,
  updatedByName,
  lifecycleStatus,
  onLifecycleStatusChange,
  isEditMode = false,
  form,
}: BasicInfoSectionProps) {
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null)

  const recruitmentValue = getRecruitmentStatusValue(program)
  const thumbnailUrl = program.keyVisualImage || program.posterImage
  const thumbnailFilename = thumbnailUrl ? getThumbnailFilename(thumbnailUrl) : ''

  useEffect(() => {
    if (!selectedThumbnailFile) {
      setThumbnailPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(selectedThumbnailFile)
    setThumbnailPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [selectedThumbnailFile])

  const displayThumbnailUrl = thumbnailPreviewUrl || thumbnailUrl
  const displayThumbnailFilename = selectedThumbnailFile
    ? selectedThumbnailFile.name
    : thumbnailUrl
      ? thumbnailFilename
      : '파일명.jpg'
  const totalCapacity = program.rounds?.reduce((sum, r) => sum + (r.capacity ?? 0), 0) ?? 0
  const categoryLabel = CATEGORY_LABEL[program.category] ?? program.category ?? '-'
  const typeValue = program.type
  const targetLabel = program.targetLevel
    ? TARGET_LEVEL_LABEL[program.targetLevel] ?? program.targetLevel
    : '-'
  const educationTarget = [targetLabel, program.district].filter(Boolean).join(' | ') || '-'
  const contactLine1Parts = [
    sponsorName && `문의처 : ${sponsorName}`,
    program.contactPhone && `Tel : ${program.contactPhone}`,
    program.contactEmail && `E-mail : ${program.contactEmail}`,
  ].filter(Boolean)
  const contactLine1 = contactLine1Parts.length ? contactLine1Parts.join(' | ') : '-'
  const contactLine2 = '운영시간 : 평일 9:00~16:00 (점심시간 12:00~13:00 제외)'

  const isFormEdit = isEditMode && form

  return (
    <section className="program-detail-info-tab__section">
      <h3 className="program-detail-info-tab__section-title">기본 정보</h3>

      <div className="program-detail-info-tab__table-wrapper program-detail-info-tab__table-wrapper--top">
        <table className="program-detail-info-tab__table program-detail-info-tab__table--basic program-detail-info-tab__table--top">
          <tbody>
            <tr>
              <th>최초 등록일</th>
              <td>{formatDate(program.createdAt)} | {createdByName ?? '-'}</td>
              <th>마지막 수정일</th>
              <td>{formatDate(program.updatedAt)} | {updatedByName ?? '-'}</td>
            </tr>
            <tr>
              <th>모집 상태<span className="program-detail-info-tab__required">*</span></th>
              <td>
                {isFormEdit ? (
                  <Controller
                    name="applicationStartDate"
                    control={form.control}
                    render={({ field: _f }) => (
                      <Radio.Group
                        value={recruitmentValue}
                        options={RECRUITMENT_RADIO_OPTIONS}
                        onChange={(e) => {
                          const v = e.target.value
                          const now = dayjs()
                          if (v === 'scheduled') {
                            form.setValue('applicationStartDate', now.add(1, 'day').toISOString())
                            form.setValue('applicationEndDate', now.add(1, 'month').toISOString())
                          } else if (v === 'closed') {
                            form.setValue('applicationStartDate', now.subtract(1, 'month').toISOString())
                            form.setValue('applicationEndDate', now.subtract(1, 'day').toISOString())
                          } else {
                            form.setValue('applicationStartDate', now.subtract(1, 'day').toISOString())
                            form.setValue('applicationEndDate', now.add(1, 'month').toISOString())
                          }
                        }}
                      />
                    )}
                  />
                ) : (
                  <Radio.Group value={recruitmentValue} options={RECRUITMENT_RADIO_OPTIONS} disabled />
                )}
              </td>
              <th>프로그램 진행 상태<span className="program-detail-info-tab__required">*</span></th>
              <td>
                <Select<ProgramLifecycleStatus>
                  value={lifecycleStatus}
                  options={LIFECYCLE_OPTIONS}
                  placeholder="진행 상태 선택"
                  className="program-detail-info-tab__lifecycle-select"
                  disabled={!isEditMode}
                  onChange={value => value != null && onLifecycleStatusChange?.(value)}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="program-detail-info-tab__table-wrapper program-detail-info-tab__table-wrapper--sub">
        <table className="program-detail-info-tab__table program-detail-info-tab__table--basic program-detail-info-tab__table--sub">
          <tbody>
            <tr>
              <th>썸네일 이미지<span className="program-detail-info-tab__required">*</span></th>
              <td colSpan={3}>
                <div className="program-detail-info-tab__thumbnail-wrap">
                  <div className="program-detail-info-tab__thumbnail-row">
                    {displayThumbnailUrl ? (
                      <Image
                        src={displayThumbnailUrl}
                        alt={program.title}
                        className="program-detail-info-tab__thumbnail-img"
                        preview={{ mask: '확대 보기' }}
                      />
                    ) : (
                      <div className="program-detail-info-tab__thumbnail-placeholder-box">
                        이미지 없음
                      </div>
                    )}
                    <div className="program-detail-info-tab__thumbnail-meta">
                      <div className="program-detail-info-tab__thumbnail-filename-row">
                        <span className="program-detail-info-tab__thumbnail-filename">
                          {displayThumbnailFilename}
                        </span>
                      </div>
                      <FileSelectField
                        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                        disabled={!isEditMode}
                        guideLines={[
                          '- 파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다. / 가로 사이즈 500px 권장, 세로 사이즈 무관',
                          '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
                        ]}
                        onFilesChange={(files) => {
                          const file = files[0]
                          setSelectedThumbnailFile(file ?? null)
                          if (file && form) {
                            const url = URL.createObjectURL(file)
                            form.setValue('keyVisualImage', url)
                            form.setValue('posterImage', url)
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <th>프로그램 명<span className="program-detail-info-tab__required">*</span></th>
              <td>
                {isFormEdit ? (
                  <Controller
                    name="title"
                    control={form.control}
                    render={({ field }) => (
                      <Input {...field} placeholder="프로그램명" />
                    )}
                  />
                ) : (
                  program.title
                )}
              </td>
              <th>프로그램 운영 기간<span className="program-detail-info-tab__required">*</span></th>
              <td>
                {isFormEdit ? (
                  <div className="program-detail-info-tab__date-range">
                    <Controller
                      name="startDate"
                      control={form.control}
                      render={({ field }) => (
                        <DatePicker
                          value={toDayjs(field.value)}
                          onChange={d => field.onChange(toIso(d))}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                    <Controller
                      name="endDate"
                      control={form.control}
                      render={({ field }) => (
                        <DatePicker
                          value={toDayjs(field.value)}
                          onChange={d => field.onChange(toIso(d))}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                  </div>
                ) : (
                  formatDateRange(program.startDate, program.endDate)
                )}
              </td>
            </tr>
            <tr>
              <th>수강 유형 구분<span className="program-detail-info-tab__required">*</span></th>
              <td>
                {isFormEdit ? (
                  <Controller
                    name="category"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={CATEGORY_OPTIONS}
                        style={{ width: '100%' }}
                        onChange={v => v && field.onChange(v)}
                      />
                    )}
                  />
                ) : (
                  categoryLabel
                )}
              </td>
              <th>교육 대상</th>
              <td>
                {isFormEdit && form ? (
                  <div className="program-detail-info-tab__education-target">
                    <Controller
                      name="targetLevel"
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          value={field.value ?? undefined}
                          options={Object.entries(TARGET_LEVEL_LABEL).map(([value, label]) => ({ value, label }))}
                          onChange={v => field.onChange((v as 'elementary' | 'middle' | 'high') || undefined)}
                          placeholder="대상"
                          style={{ width: '100%', marginBottom: 8 }}
                          allowClear
                        />
                      )}
                    />
                    <Controller
                      name="district"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          value={field.value ?? ''}
                          onChange={e => field.onChange(e.target.value || undefined)}
                          placeholder="경기, 광주, 대구, ..."
                        />
                      )}
                    />
                  </div>
                ) : (
                  educationTarget
                )}
              </td>
            </tr>
            <tr>
              <th>모집 인원<span className="program-detail-info-tab__required">*</span></th>
              <td>
                {isFormEdit && form ? (
                  <Controller
                    name="rounds"
                    control={form.control}
                    render={({ field }) => {
                      const cap = field.value?.[0]?.capacity ?? 0
                      return (
                        <Input
                          type="number"
                          min={0}
                          value={cap || ''}
                          onChange={e => {
                            const n = parseInt(e.target.value, 10)
                            const next = (field.value ?? []).map((r, i) =>
                              i === 0 ? { ...r, capacity: isNaN(n) ? 0 : n } : r
                            )
                            field.onChange(next)
                          }}
                        />
                      )
                    }}
                  />
                ) : (
                  totalCapacity > 0
                    ? `${totalCapacity} (신청자가 아닌 승인된 수강자 기준)`
                    : '-'
                )}
              </td>
              <th>프로그램 진행 방식<span className="program-detail-info-tab__required">*</span></th>
              <td>
                {isFormEdit ? (
                  <Controller
                    name="type"
                    control={form.control}
                    render={({ field }) => (
                      <Radio.Group
                        value={field.value}
                        options={[
                          { value: 'online', label: '온라인' },
                          { value: 'offline', label: '오프라인' },
                        ]}
                        onChange={e => field.onChange(e.target.value)}
                      />
                    )}
                  />
                ) : (
                  <Radio.Group
                    value={typeValue}
                    options={[
                      { value: 'online', label: '온라인' },
                      { value: 'offline', label: '오프라인' },
                    ]}
                    disabled
                  />
                )}
              </td>
            </tr>
            <tr>
              <th>모집 기간<span className="program-detail-info-tab__required">*</span></th>
              <td>
                {isFormEdit ? (
                  <div className="program-detail-info-tab__date-range">
                    <Controller
                      name="applicationStartDate"
                      control={form.control}
                      render={({ field }) => (
                        <DatePicker
                          value={toDayjs(field.value)}
                          onChange={d => field.onChange(toIso(d))}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                    <Controller
                      name="applicationEndDate"
                      control={form.control}
                      render={({ field }) => (
                        <DatePicker
                          value={toDayjs(field.value)}
                          onChange={d => field.onChange(toIso(d))}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                  </div>
                ) : (
                  program.applicationStartDate && program.applicationEndDate
                    ? `${formatDateOnly(program.applicationStartDate)} ~ ${formatDateOnly(program.applicationEndDate)}`
                    : '-'
                )}
              </td>
              <th>결과 발표일 및 방법<span className="program-detail-info-tab__required">*</span></th>
              <td>
                {isFormEdit ? (
                  <div className="program-detail-info-tab__result-row">
                    <Controller
                      name="applicationEndDate"
                      control={form.control}
                      render={({ field }) => (
                        <DatePicker
                          value={toDayjs(field.value)}
                          onChange={d => field.onChange(toIso(d))}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                    <Input
                      placeholder="홈페이지 공지 및 담당교사 개별 안내"
                      value="홈페이지 공지 및 담당교사 개별 안내"
                      readOnly
                      style={{ flex: 1, minWidth: 0 }}
                    />
                  </div>
                ) : (
                  program.applicationEndDate
                    ? `${formatDateOnly(program.applicationEndDate)} | 홈페이지 공지 및 담당교사 개별 안내`
                    : '-'
                )}
              </td>
            </tr>
            <tr>
              <th>교육 분야<span className="program-detail-info-tab__required">*</span></th>
              <td>
                {isFormEdit ? (
                  <Controller
                    name="businessArea"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        value={field.value ?? undefined}
                        options={BUSINESS_AREA_OPTIONS}
                        onChange={v => field.onChange(v ?? undefined)}
                        style={{ width: '100%' }}
                        allowClear
                      />
                    )}
                  />
                ) : (
                  program.businessArea ?? '-'
                )}
              </td>
              <th>후원사<span className="program-detail-info-tab__required">*</span></th>
              <td>{sponsorName ?? '-'}</td>
            </tr>
            <tr>
              <th>문의처</th>
              <td colSpan={3} className="program-detail-info-tab__contact-cell">
                {isFormEdit ? (
                  <div className="program-detail-info-tab__contact-inputs">
                    <Input
                      placeholder="문의처명"
                      value={sponsorName ?? ''}
                      readOnly
                      style={{ maxWidth: 120 }}
                    />
                    <Controller
                      name="contactPhone"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          placeholder="연락처"
                          style={{ maxWidth: 160 }}
                        />
                      )}
                    />
                    <Controller
                      name="contactEmail"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          placeholder="이메일"
                          style={{ maxWidth: 220 }}
                        />
                      )}
                    />
                    <Input
                      placeholder="운영시간"
                      value="평일 9:00~16:00 (점심시간 12:00~13:00 제외)"
                      readOnly
                      style={{ flex: 1, minWidth: 0 }}
                    />
                  </div>
                ) : (
                  `${contactLine1} | ${contactLine2}`
                )}
              </td>
            </tr>
            <tr>
              <th>비고</th>
              <td colSpan={3}>
                {isFormEdit ? (
                  <Controller
                    name="oneLineIntroduction"
                    control={form.control}
                    render={({ field }) => (
                      <TextArea
                        {...field}
                        value={field.value ?? ''}
                        rows={3}
                        placeholder="비고"
                      />
                    )}
                  />
                ) : (
                  program.oneLineIntroduction ?? '-'
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
