/**
 * LNB 1뎁스 메뉴 아이콘 — 원본 `shared/assets/icons/lnb/*.svg` (Figma `Icon / LNB / w24`, 24 프레임).
 * mask로 그려 색은 currentColor(LNB 글자색)를 따른다.
 */

import adjustmentUrl from '@/shared/assets/icons/lnb/adjustment.svg'
import chartUrl from '@/shared/assets/icons/lnb/chart.svg'
import dashboardUrl from '@/shared/assets/icons/lnb/dashboard.svg'
import dataUrl from '@/shared/assets/icons/lnb/data.svg'
import mailUrl from '@/shared/assets/icons/lnb/mail.svg'
import memberUrl from '@/shared/assets/icons/lnb/member.svg'
import postUrl from '@/shared/assets/icons/lnb/post.svg'
import programUrl from '@/shared/assets/icons/lnb/program.svg'
import securityUrl from '@/shared/assets/icons/lnb/security.svg'
import templateUrl from '@/shared/assets/icons/lnb/template.svg'
import { MaskIcon, type MaskIconProps } from './MaskIcon'

export type LnbIconProps = MaskIconProps

/** 대시보드 홈 */
export function LnbDashboardIcon(props: LnbIconProps) {
  return <MaskIcon src={dashboardUrl} {...props} />
}

/** 프로그램 관리 */
export function LnbProgramIcon(props: LnbIconProps) {
  return <MaskIcon src={programUrl} {...props} />
}

/** 회원 관리 */
export function LnbMemberIcon(props: LnbIconProps) {
  return <MaskIcon src={memberUrl} {...props} />
}

/** 정산 관리 */
export function LnbAdjustmentIcon(props: LnbIconProps) {
  return <MaskIcon src={adjustmentUrl} {...props} />
}

/** 템플릿 관리 */
export function LnbTemplateIcon(props: LnbIconProps) {
  return <MaskIcon src={templateUrl} {...props} />
}

/** 게시글 관리 */
export function LnbPostIcon(props: LnbIconProps) {
  return <MaskIcon src={postUrl} {...props} />
}

/** 데이터 관리 */
export function LnbDataIcon(props: LnbIconProps) {
  return <MaskIcon src={dataUrl} {...props} />
}

/** 알림 메시지 관리 */
export function LnbMailIcon(props: LnbIconProps) {
  return <MaskIcon src={mailUrl} {...props} />
}

/** 실적 관리 */
export function LnbChartIcon(props: LnbIconProps) {
  return <MaskIcon src={chartUrl} {...props} />
}

/** 로그 관리 */
export function LnbSecurityIcon(props: LnbIconProps) {
  return <MaskIcon src={securityUrl} {...props} />
}
