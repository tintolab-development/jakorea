/**
 * 기본 정보 섹션 (프로그램 상세 정보 탭)
 * - 상단 테이블: 최초 등록일, 마지막 수정일, 프로그램 진행 방식, 프로그램 진행 현황
 * - 하위 테이블: 썸네일, 프로그램명, 운영 기간, 수강자 유형, 교육 분야, 교육 대상, 교육 대상 상세, 후원사, 후원사 담당자, 문의처, 비고
 * - 수강자 모집 테이블: 모집 인원, 모집 현황, 모집 기간, 결과 발표일 및 방법
 * - 강사 모집 테이블: 모집 인원, 모집 현황, 기간, 1차/2차/최종 발표 (표시)
 * - 수정 모드: react-hook-form Controller, 기존 프로그램 값이 default로 채워짐
 */

import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CmsRadio } from '@/shared/ui/cms-radio'
import { CmsDateRangePicker } from '@/shared/ui/cms-datepicker'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import { Controller } from 'react-hook-form'
import { useSponsorStore } from '@/features/sponsor/model/sponsor-store'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import type { UseFormReturn } from 'react-hook-form'
import type { ProgramDetailEditFormValues } from '../../../../model/program-detail-edit-schema'
import { DetailInfoForm } from '@/shared/components/detail-info-form/detail-info-form'
import {
  formatDate,
  formatDateRange,
  CATEGORY_LABEL,
  CATEGORY_OPTIONS,
  BUSINESS_AREA_OPTIONS,
  EDUCATION_PROCESS_OPTIONS,
  IP_OWNED_OPTIONS,
  COURSE_DELIVERED_BY_OPTIONS,
  PARTNER_INVOLVEMENT_OPTIONS,
  IPS_OPTIONS,
  PROGRAM_CATEGORY_OPTIONS,
} from '../../../lib/program-detail-info-constants'
import { getProgramProgressPhaseDisplay } from '@/shared/constants/status'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'

function ProgramProgressReadonlyCell({ status }: { status: ProgramLifecycleStatus }) {
  const { label, color } = getProgramProgressPhaseDisplay(status)
  return (
    <span className="program-detail-info-tab__lifecycle-status-text" style={{ color }}>
      {label}
    </span>
  )
}

export interface BasicInfoSectionProps {
  program: Program
  sponsorName?: string
  createdByName?: string
  updatedByName?: string
  lifecycleStatus?: ProgramLifecycleStatus
  isEditMode?: boolean
  /** 수정 모드일 때만 전달, react-hook-form 인스턴스 */
  form?: UseFormReturn<ProgramDetailEditFormValues>
}

const toDayjs = (d: string | Date | undefined) => (d ? dayjs(d) : null)
const toIso = (d: Dayjs | null) => (d ? d.toISOString() : '')

export function BasicInfoSection({
  program,
  sponsorName,
  createdByName,
  updatedByName,
  lifecycleStatus,
  isEditMode = false,
  form,
}: BasicInfoSectionProps) {
  const { sponsors, fetchSponsors } = useSponsorStore()

  useEffect(() => {
    fetchSponsors()
  }, [fetchSponsors])

  const isFormEdit = isEditMode && form
  const categoryLabel = CATEGORY_LABEL[program.category] ?? program.category ?? '-'

  /* 공통 정보 탭 기본 정보 */
  const BOOLEAN_LABEL: Record<string, string> = {
    true: 'Yes',
    false: 'No',
  }
  const partnerLabel =
    program.partnerInvolvement != null ? BOOLEAN_LABEL[String(program.partnerInvolvement)] : '-'

  const COURSE_DELIVERED_LABEL: Record<string, string> = {
    JA: 'JA',
    Jointly: 'Jointly',
    Partner: 'Partner',
  }
  const courseDeliveredLabel = program.courseDeliveredBy
    ? (COURSE_DELIVERED_LABEL[program.courseDeliveredBy] ?? program.courseDeliveredBy)
    : '-'

  const commonInfoFormEdit = isFormEdit && form
  const commonInfoForm =
    form ??
    ({
      control: undefined,
      formState: { errors: {} },
      watch: () => undefined,
      setValue: () => undefined,
    } as unknown as UseFormReturn<ProgramDetailEditFormValues>)

  return (
    <DetailInfoForm title="기본 정보" mode={commonInfoFormEdit ? 'edit' : 'view'}>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="최초 등록일"
          view={
            <>
              {formatDate(program.createdAt)}
              <DetailInfoForm.InputsSeparator />
              {createdByName ?? '-'}
            </>
          }
        />
        <DetailInfoForm.Field
          label="마지막 수정일"
          view={
            <>
              {formatDate(program.updatedAt)}
              <DetailInfoForm.InputsSeparator />
              {updatedByName ?? '-'}
            </>
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="대표 프로그램명"
          required
          view={program.mainTitle ?? '-'}
          edit={
            <>
              <Controller
                name="mainTitle"
                control={commonInfoForm.control}
                render={({ field }) => (
                  <CmsInput
                    {...field}
                    value={field.value ?? ''}
                    placeholder="대표 프로그램명"
                    width={'100%'}
                  />
                )}
              />
            </>
          }
        />
        <DetailInfoForm.Field
          label="세부 프로그램명"
          required
          view={program.title}
          edit={
            <>
              <Controller
                name="title"
                control={commonInfoForm.control}
                render={({ field }) => (
                  <CmsInput
                    {...field}
                    value={field.value ?? ''}
                    placeholder="세부 프로그램명"
                    status={commonInfoForm.formState.errors.title ? 'error' : undefined}
                    width={'100%'}
                  />
                )}
              />
            </>
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="사업 운영 기간"
          required
          view={formatDateRange(program.startDate, program.endDate)}
          edit={
            <Controller
              name="startDate"
              control={commonInfoForm.control}
              render={({ field }) => (
                <CmsDateRangePicker
                  value={[toDayjs(field.value), toDayjs(commonInfoForm.watch('endDate'))]}
                  onChange={dates => {
                    const [start, end] = dates ?? [null, null]
                    field.onChange(toIso(start))
                    commonInfoForm.setValue('endDate', toIso(end))
                  }}
                  format="YYYY. MM. DD"
                  width={'100%'}
                />
              )}
            />
          }
        />
        <DetailInfoForm.Field
          label="프로그램 진행 현황"
          view={lifecycleStatus ? <ProgramProgressReadonlyCell status={lifecycleStatus} /> : '-'}
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="참여자 유형"
          required
          view={categoryLabel}
          edit={
            <Controller
              name="category"
              control={commonInfoForm.control}
              render={({ field }) => (
                <CmsSelect
                  {...field}
                  options={CATEGORY_OPTIONS}
                  width={'100%'}
                  onChange={v => v && field.onChange(v)}
                />
              )}
            />
          }
        />
        <DetailInfoForm.Field
          label="사업 분야"
          required
          view={program.businessArea ?? '-'}
          edit={
            <Controller
              name="businessArea"
              control={commonInfoForm.control}
              render={({ field }) => (
                <CmsSelect
                  value={field.value ?? undefined}
                  options={BUSINESS_AREA_OPTIONS}
                  onChange={v => field.onChange(v ?? undefined)}
                  width={'100%'}
                  allowClear
                />
              )}
            />
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="후원사"
          required
          view={
            program.sponsorId ? (
              <Link to={`/sponsors/${program.sponsorId}`} className="text-decoration-underline">
                {sponsorName ?? '-'}
              </Link>
            ) : (
              (sponsorName ?? '-')
            )
          }
          edit={
            <>
              <Controller
                name="sponsorId"
                control={commonInfoForm.control}
                render={({ field }) => (
                  <CmsSelect
                    {...field}
                    placeholder="후원사 선택"
                    allowClear={false}
                    showSearch
                    optionFilterProp="label"
                    options={sponsors.map(s => ({ value: s.id, label: s.name }))}
                    onChange={v => field.onChange(v ?? '')}
                    width={'100%'}
                    status={commonInfoForm.formState.errors.sponsorId ? 'error' : undefined}
                  />
                )}
              />
            </>
          }
        />
        <DetailInfoForm.Field
          label="후원사 담당자"
          required
          view={
            program.managerName || program.contactPhone ? (
              <>
                {program.managerName ?? ''}
                {program.managerName && program.contactPhone ? (
                  <DetailInfoForm.InputsSeparator />
                ) : null}
                {program.contactPhone ? <span>{program.contactPhone}</span> : null}
              </>
            ) : (
              '-'
            )
          }
          edit={
            <div>
              {(() => {
                const sponsorId = commonInfoForm.watch('sponsorId')
                const selectedSponsor = sponsors.find(s => s.id === sponsorId)
                const managers = selectedSponsor?.managers ?? []
                return (
                  <>
                    <div className="detail-info-form-inputs-wrapper">
                      <Controller
                        name="managerName"
                        control={commonInfoForm.control}
                        render={({ field }) => {
                          const currentName = field.value ?? ''
                          const currentPhone = commonInfoForm.watch('contactPhone') ?? ''
                          const selectedIndex =
                            managers.length > 0
                              ? managers.findIndex(
                                  m => m.name === currentName || m.phone === currentPhone
                                )
                              : -1
                          return (
                            <CmsSelect
                              placeholder="담당자 선택"
                              allowClear
                              value={selectedIndex >= 0 ? selectedIndex : undefined}
                              options={managers.map((m, i) => ({
                                value: i,
                                label: m.name,
                              }))}
                              onChange={idx => {
                                if (idx !== undefined && idx >= 0 && managers[idx]) {
                                  commonInfoForm.setValue('managerName', managers[idx].name)
                                  commonInfoForm.setValue('contactPhone', managers[idx].phone)
                                } else {
                                  commonInfoForm.setValue('managerName', '')
                                  commonInfoForm.setValue('contactPhone', undefined)
                                }
                              }}
                              width={'50%'}
                              status={
                                commonInfoForm.formState.errors.managerName ? 'error' : undefined
                              }
                            />
                          )
                        }}
                      />
                      <div>
                        <DetailInfoForm.InputsSeparator />
                        <span>{commonInfoForm.watch('contactPhone') || '-'}</span>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="교육 과정"
          required
          view={program.educationProcess ?? '-'}
          edit={
            <Controller
              name="educationProcess"
              control={commonInfoForm.control}
              render={({ field }) => (
                <CmsSelect
                  value={field.value ?? undefined}
                  options={EDUCATION_PROCESS_OPTIONS}
                  onChange={v => field.onChange(v ?? undefined)}
                  width={'100%'}
                  allowClear
                  placeholder="교육 과정 선택"
                />
              )}
            />
          }
        />
        <DetailInfoForm.Field
          label="IP Owned"
          required
          view={program.ipOwned ?? 'JA'}
          edit={
            <Controller
              name="ipOwned"
              control={commonInfoForm.control}
              render={({ field }) => (
                <CmsSelect
                  value={field.value ?? undefined}
                  options={IP_OWNED_OPTIONS}
                  onChange={v => field.onChange(v ?? undefined)}
                  width={'100%'}
                  allowClear
                  placeholder="JA"
                />
              )}
            />
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="Course Delivered By"
          required
          view={courseDeliveredLabel}
          edit={
            <Controller
              name="courseDeliveredBy"
              control={commonInfoForm.control}
              render={({ field }) => (
                <CmsSelect
                  value={field.value ?? undefined}
                  options={COURSE_DELIVERED_BY_OPTIONS}
                  onChange={v => field.onChange(v ?? undefined)}
                  width={'100%'}
                  allowClear
                  placeholder="JA"
                />
              )}
            />
          }
        />
        <DetailInfoForm.Field
          label="Partner Involvement"
          required
          view={partnerLabel}
          edit={
            <Controller
              name="partnerInvolvement"
              control={commonInfoForm.control}
              render={({ field }) => (
                <CmsRadio.Group
                  value={field.value}
                  options={PARTNER_INVOLVEMENT_OPTIONS}
                  onChange={e => field.onChange(e.target.value)}
                />
              )}
            />
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="IPS"
          required
          view={program.ips ?? '-'}
          edit={
            <Controller
              name="ips"
              control={commonInfoForm.control}
              render={({ field }) => (
                <CmsRadio.Group
                  value={field.value}
                  options={IPS_OPTIONS}
                  onChange={e => field.onChange(e.target.value)}
                />
              )}
            />
          }
        />
        <DetailInfoForm.Field
          label="프로그램 종류"
          required
          view={program.ips === 'Succeed' ? (program.programCategory ?? '-') : '-'}
          edit={
            <Controller
              name="programCategory"
              control={commonInfoForm.control}
              render={({ field }) => (
                <CmsSelect
                  value={field.value ?? undefined}
                  options={PROGRAM_CATEGORY_OPTIONS}
                  onChange={v => field.onChange(v ?? undefined)}
                  width={'100%'}
                  allowClear
                  placeholder="프로그램 종류 선택"
                  disabled={commonInfoForm.watch('ips') !== 'Succeed'}
                />
              )}
            />
          }
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
