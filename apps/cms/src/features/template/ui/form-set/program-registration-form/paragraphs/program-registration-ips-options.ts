/** IPS 유형 1차(대분류) — `ProgramRegistrationIpsTypeFields` 1번 셀렉트 */
export type ProgramRegistrationIpsCategory = 'succeed' | 'inspire' | 'prepare'

/** 드롭다운 표시 순서 고정: Inspire → Prepare → Succeed */
const PROGRAM_REGISTRATION_IPS_CATEGORY_DISPLAY_ORDER = [
  'inspire',
  'prepare',
  'succeed',
] as const satisfies readonly ProgramRegistrationIpsCategory[]

const PROGRAM_REGISTRATION_IPS_CATEGORY_LABEL: Record<ProgramRegistrationIpsCategory, string> = {
  inspire: 'Inspire',
  prepare: 'Prepare',
  succeed: 'Succeed',
}

export const PROGRAM_REGISTRATION_EDUCATION_COURSE_OPTIONS = [
  { value: 'traditional_paper', label: 'Traditional (Paper)' },
  { value: 'digital_computer', label: 'Digital (Computer)' },
  { value: 'blended_paper_computer', label: 'Blended (Paper & Computer)' },
] as const

export const PROGRAM_REGISTRATION_IP_OWNED_OPTIONS = [
  { value: 'ja', label: 'JA' },
  { value: 'partner', label: 'Partner' },
  { value: 'jointly', label: 'Jointly' },
] as const

export const PROGRAM_REGISTRATION_COURSE_DELIVERED_BY_OPTIONS = [
  { value: 'ja', label: 'JA' },
  { value: 'partner', label: 'Partner' },
  { value: 'jointly', label: 'Jointly' },
] as const

export const PROGRAM_REGISTRATION_IPS_CATEGORY_OPTIONS: {
  value: ProgramRegistrationIpsCategory
  label: string
}[] = PROGRAM_REGISTRATION_IPS_CATEGORY_DISPLAY_ORDER.map(value => ({
  value,
  label: PROGRAM_REGISTRATION_IPS_CATEGORY_LABEL[value],
}))

/** IPS → Succeed — 2차 셀렉트 (프로그램 종류) */
export const PROGRAM_REGISTRATION_IPS_SUCCEED_PROGRAM_KIND_OPTIONS = [
  { value: 'none', label: '해당 없음' },
  { value: 'alumni_experiences', label: 'Alumni Experiences (동문회 활동)' },
  { value: 'award', label: 'Award (시상)' },
  { value: 'competition', label: 'Competition (대회+시상)' },
  { value: 'conference', label: 'Conference (컨퍼런스)' },
  { value: 'credential', label: 'Credential (자격증 수여)' },
  { value: 'job_fairs', label: 'Job Fairs (직업 박람회)' },
  { value: 'launching_a_business', label: 'Launching a business (사업 런칭)' },
  { value: 'scholarship', label: 'Scholarship (장학 프로그램)' },
  { value: 'trade_shows', label: 'Trade Shows (무역 박람회)' },
  { value: 'work_experience', label: 'Work Experience (직업 체험)' },
  { value: 'workshop', label: 'Workshop (워크숍)' },
] as const

/** IPS → Inspire — 2차 셀렉트 (프로그램 채널) */
export const PROGRAM_REGISTRATION_IPS_INSPIRE_PROGRAM_CHANNEL_OPTIONS = [
  { value: 'none', label: '해당 없음' },
  { value: 'downloaded_resource', label: 'Downloaded resource (다운받을 자료)' },
  { value: 'kick_off_event', label: 'Kick-Off event (킥오프 행사)' },
  { value: 'live_video_social_media_post', label: 'Live video social media post (실시간영상 업로드)' },
  { value: 'mobile_app', label: 'Mobile app (휴대폰 앱)' },
  { value: 'content_social_media_post', label: 'Content social media post (SNS 포스트)' },
  { value: 'online_resource', label: 'Online resource (온라인 자료)' },
  { value: 'podcast', label: 'Podcast (팟캐스트)' },
  { value: 'radio', label: 'Radio (라디오)' },
  { value: 'recorded_video_social_media_post', label: 'Recorded video social media post (녹화영상 업로드)' },
  { value: 'tv', label: 'TV (TV)' },
] as const

/** IPS → Prepare — 2차 셀렉트 고정 (disabled + placeholder 해당 없음) */
export const PROGRAM_REGISTRATION_IPS_PREPARE_ONLY_OPTIONS = [{ value: 'none', label: '해당 없음' }] as const
