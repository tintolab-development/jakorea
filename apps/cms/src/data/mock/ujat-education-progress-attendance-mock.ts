import type { UjatInstitutionApplicationRegionKey } from '@/features/program/ujat/ui/detail-modal/application-institution/list/regions'
import type { EducationProgressHalfKey } from '@/features/program/ujat/ui/detail-modal/progress/tabs'
import type {
  UjatAttendanceSessionGroup,
  UjatAttendanceStatus,
  UjatAttendanceVolunteerRow,
} from '@/features/program/ujat/ui/detail-modal/progress/attendance/types'
import { formatAttendanceDateLabel } from '@/features/program/ujat/ui/detail-modal/progress/attendance/attendance-display'
import { cloneAttendanceVolunteerRows } from '@/features/program/ujat/ui/detail-modal/progress/attendance/attendance-display'

type VolunteerSeed = {
  name: string
  assignedClass: string
  contact: string
  email: string
  status: UjatAttendanceStatus
  lateMinutes?: number
  checkInTime?: string
  excusedReason?: string
  isDropout?: boolean
}

function buildVolunteerRow(
  sessionId: string,
  index: number,
  seed: VolunteerSeed
): UjatAttendanceVolunteerRow {
  return {
    id: `${sessionId}-vol-${index}`,
    name: seed.name,
    assignedClass: seed.assignedClass,
    contact: seed.contact,
    email: seed.email,
    status: seed.status,
    lateMinutes: seed.lateMinutes,
    checkInTime: seed.checkInTime,
    excusedReason: seed.excusedReason,
    isDropout: seed.isDropout ?? false,
  }
}

function buildVolunteersFromSeeds(
  sessionId: string,
  seeds: VolunteerSeed[]
): UjatAttendanceVolunteerRow[] {
  return seeds.map((seed, index) => buildVolunteerRow(sessionId, index + 1, seed))
}

function sessionGroup(params: {
  id: string
  regionKey: UjatInstitutionApplicationRegionKey
  half: EducationProgressHalfKey
  isoDate: string
  institutionName: string
  district: string
  timeRange?: string
  seeds: VolunteerSeed[]
}): UjatAttendanceSessionGroup {
  const timeRange = params.timeRange ?? '8:00 ~ 13:00'
  return {
    id: params.id,
    regionKey: params.regionKey,
    half: params.half,
    isoDate: params.isoDate,
    dateLabel: formatAttendanceDateLabel(params.isoDate),
    institutionName: params.institutionName,
    district: params.district,
    timeRange,
    volunteers: buildVolunteersFromSeeds(params.id, params.seeds),
  }
}

/** 스크린샷 기준 서울 구일초 24건 */
const SEOUL_GUIL_SESSION_SEEDS: VolunteerSeed[] = [
  { name: '김지윤', assignedClass: '2학년 1반', contact: '010-2847-4821', email: 'jiyun@gmail.com', status: 'present' },
  { name: '이서연', assignedClass: '2학년 2반', contact: '010-3912-7743', email: 'seoyeon@naver.com', status: 'present' },
  { name: '박민준', assignedClass: '2학년 3반', contact: '010-5521-9034', email: 'minjun@gmail.com', status: 'present' },
  { name: '최유진', assignedClass: '2학년 4반', contact: '010-6678-1209', email: 'yujin@gmail.com', status: 'present' },
  { name: '정하은', assignedClass: '2학년 5반', contact: '010-7789-1943', email: 'haeun@naver.com', status: 'present' },
  { name: '강민지', assignedClass: '2학년 6반', contact: '010-8821-0539', email: 'minji@naver.com', status: 'absent' },
  { name: '윤서준', assignedClass: '2학년 7반', contact: '010-9934-6721', email: 'seojun@gmail.com', status: 'present' },
  { name: '임도윤', assignedClass: '3학년 1반', contact: '010-1045-8832', email: 'doyoon@naver.com', status: 'present' },
  { name: '한소율', assignedClass: '3학년 2반', contact: '010-2156-9943', email: 'soyul@gmail.com', status: 'present' },
  { name: '오지후', assignedClass: '3학년 3반', contact: '010-3267-1054', email: 'jihoo@naver.com', status: 'present' },
  { name: '서예린', assignedClass: '3학년 4반', contact: '010-4378-2165', email: 'yerin@gmail.com', status: 'present' },
  { name: '신우진', assignedClass: '3학년 5반', contact: '010-5489-3276', email: 'woojin@naver.com', status: 'present' },
  { name: '권나연', assignedClass: '3학년 6반', contact: '010-6590-4387', email: 'nayeon@gmail.com', status: 'present' },
  { name: '황수진', assignedClass: '5학년 2반', contact: '010-7601-2609', email: 'sujin@gmail.com', status: 'excused_absence', excusedReason: '예비군으로 인한 불참' },
  { name: '조현우', assignedClass: '5학년 3반', contact: '010-8712-3710', email: 'hyunwoo@naver.com', status: 'present' },
  { name: '배서윤', assignedClass: '5학년 4반', contact: '010-9823-4821', email: 'seoyoon@gmail.com', status: 'present' },
  { name: '허유진', assignedClass: '2학년 5반', contact: '010-1934-1943', email: 'yujin@gmail.com', status: 'late', lateMinutes: 30, checkInTime: '9:50' },
  { name: '노승민', assignedClass: '4학년 1반', contact: '010-2045-5932', email: 'seungmin@naver.com', status: 'present' },
  { name: '류지안', assignedClass: '4학년 2반', contact: '010-3156-6043', email: 'jian@gmail.com', status: 'present' },
  { name: '홍태양', assignedClass: '4학년 3반', contact: '010-4267-7154', email: 'taeyang@naver.com', status: 'present' },
  { name: '문채원', assignedClass: '6학년 1반', contact: '010-5378-8265', email: 'chaewon@gmail.com', status: 'present' },
  { name: '양준호', assignedClass: '6학년 2반', contact: '010-6489-9376', email: 'junho@naver.com', status: 'present' },
  { name: '김민토', assignedClass: '1학년 2반', contact: '010-2847-4829', email: 'minto@gmail.com', status: 'present' },
  { name: '박틴토', assignedClass: '5학년 1반', contact: '010-7733-2211', email: 'tinto@gmail.com', status: 'present', isDropout: true },
]

function buildH1Fixtures(): UjatAttendanceSessionGroup[] {
  return [
    sessionGroup({
      id: 'h1-seoul-guil-20260403',
      regionKey: 'seoul',
      half: 'h1',
      isoDate: '2026-04-03',
      institutionName: '구일초등학교',
      district: '구로구',
      seeds: SEOUL_GUIL_SESSION_SEEDS,
    }),
    sessionGroup({
      id: 'h1-seoul-mapo-20260417',
      regionKey: 'seoul',
      half: 'h1',
      isoDate: '2026-04-17',
      institutionName: '마포초등학교',
      district: '마포구',
      seeds: [
        { name: '이민토', assignedClass: '3학년 1반', contact: '010-5521-9034', email: 'leeminto@naver.com', status: 'present' },
        { name: '최준영', assignedClass: '3학년 2반', contact: '010-6678-1209', email: 'junyoung@gmail.com', status: 'late', lateMinutes: 15, checkInTime: '9:15' },
        { name: '정수빈', assignedClass: '4학년 1반', contact: '010-7789-1943', email: 'subin@naver.com', status: 'present' },
        { name: '한지우', assignedClass: '4학년 2반', contact: '010-8821-0539', email: 'jiwoo@gmail.com', status: 'absent' },
        { name: '박서연', assignedClass: '5학년 1반', contact: '010-9934-6721', email: 'seoyeon@gmail.com', status: 'excused_absence', excusedReason: '병원 진료로 인한 불참' },
        { name: '김도영', assignedClass: '5학년 2반', contact: '010-1045-8832', email: 'doyoung@naver.com', status: 'present' },
      ],
    }),
    sessionGroup({
      id: 'h1-seoul-sinsa-20260508',
      regionKey: 'seoul',
      half: 'h1',
      isoDate: '2026-05-08',
      institutionName: '신사초등학교',
      district: '강남구',
      seeds: [
        { name: '윤하린', assignedClass: '2학년 1반', contact: '010-2156-9943', email: 'harin@gmail.com', status: 'present' },
        { name: '송민재', assignedClass: '2학년 2반', contact: '010-3267-1054', email: 'minjae@naver.com', status: 'present' },
        { name: '장예은', assignedClass: '3학년 1반', contact: '010-4378-2165', email: 'yeeun@gmail.com', status: 'late', lateMinutes: 20, checkInTime: '9:20' },
      ],
    }),
    sessionGroup({
      id: 'h1-gyeonggi-suwon-20260410',
      regionKey: 'gyeonggi_south',
      half: 'h1',
      isoDate: '2026-04-10',
      institutionName: '수원초등학교',
      district: '수원시',
      seeds: [
        { name: '강태훈', assignedClass: '2학년 1반', contact: '010-5489-3276', email: 'taehoon@naver.com', status: 'present' },
        { name: '임서아', assignedClass: '2학년 2반', contact: '010-6590-4387', email: 'seoa@gmail.com', status: 'late', lateMinutes: 25, checkInTime: '9:25' },
        { name: '오민석', assignedClass: '3학년 1반', contact: '010-7601-2609', email: 'minseok@naver.com', status: 'absent' },
        { name: '유채린', assignedClass: '3학년 2반', contact: '010-8712-3710', email: 'chaerin@gmail.com', status: 'present' },
        { name: '남지훈', assignedClass: '4학년 1반', contact: '010-9823-4821', email: 'jihoon@naver.com', status: 'present' },
      ],
    }),
    sessionGroup({
      id: 'h1-gyeonggi-seongnam-20260424',
      regionKey: 'gyeonggi_south',
      half: 'h1',
      isoDate: '2026-04-24',
      institutionName: '성남초등학교',
      district: '성남시',
      seeds: [
        { name: '배윤서', assignedClass: '1학년 1반', contact: '010-1934-1943', email: 'yoonseo@gmail.com', status: 'present' },
        { name: '홍지민', assignedClass: '2학년 1반', contact: '010-2045-5932', email: 'jimin@naver.com', status: 'excused_absence', excusedReason: '가족 행사로 인한 불참' },
        { name: '서동현', assignedClass: '3학년 1반', contact: '010-3156-6043', email: 'donghyun@gmail.com', status: 'present' },
        { name: '문하늘', assignedClass: '4학년 1반', contact: '010-4267-7154', email: 'haneul@naver.com', status: 'late', lateMinutes: 10, checkInTime: '9:10' },
      ],
    }),
    sessionGroup({
      id: 'h1-incheon-namdong-20260403',
      regionKey: 'incheon',
      half: 'h1',
      isoDate: '2026-04-03',
      institutionName: '인천남동초등학교',
      district: '남동구',
      seeds: [
        { name: '최은우', assignedClass: '2학년 1반', contact: '010-5378-8265', email: 'eunwoo@gmail.com', status: 'present' },
        { name: '정다은', assignedClass: '2학년 2반', contact: '010-6489-9376', email: 'daeun@naver.com', status: 'excused_absence', excusedReason: '학교 행사 참석' },
        { name: '한승우', assignedClass: '3학년 1반', contact: '010-7590-0487', email: 'seungwoo@gmail.com', status: 'present' },
        { name: '윤소희', assignedClass: '4학년 1반', contact: '010-8601-1598', email: 'sohee@naver.com', status: 'present' },
      ],
    }),
    sessionGroup({
      id: 'h1-incheon-bupyeong-20260417',
      regionKey: 'incheon',
      half: 'h1',
      isoDate: '2026-04-17',
      institutionName: '부평초등학교',
      district: '부평구',
      seeds: [
        { name: '김나래', assignedClass: '1학년 1반', contact: '010-9712-2609', email: 'narae@gmail.com', status: 'present' },
        { name: '이준서', assignedClass: '2학년 1반', contact: '010-1823-3710', email: 'junseo@naver.com', status: 'present' },
        { name: '박하율', assignedClass: '3학년 1반', contact: '010-2934-4821', email: 'hayul@gmail.com', status: 'excused_absence', excusedReason: '개인 사정' },
      ],
    }),
    sessionGroup({
      id: 'h1-daejeon-20260410',
      regionKey: 'daejeon',
      half: 'h1',
      isoDate: '2026-04-10',
      institutionName: '대전중앙초등학교',
      district: '중구',
      seeds: [
        { name: '조민호', assignedClass: '2학년 1반', contact: '010-3045-5932', email: 'minho@naver.com', status: 'present' },
        { name: '신유나', assignedClass: '2학년 2반', contact: '010-4156-6043', email: 'yuna@gmail.com', status: 'present' },
        { name: '권시우', assignedClass: '3학년 1반', contact: '010-5267-7154', email: 'siwoo@naver.com', status: 'late', lateMinutes: 5, checkInTime: '9:05' },
        { name: '황지원', assignedClass: '3학년 2반', contact: '010-6378-8265', email: 'jiwon@gmail.com', status: 'present' },
        { name: '서민아', assignedClass: '4학년 1반', contact: '010-7489-9376', email: 'mina@naver.com', status: 'absent' },
        { name: '노재민', assignedClass: '4학년 2반', contact: '010-8590-0487', email: 'jaemin@gmail.com', status: 'present' },
        { name: '양서진', assignedClass: '5학년 1반', contact: '010-9601-1598', email: 'seojin@naver.com', status: 'present' },
        { name: '허지안', assignedClass: '5학년 2반', contact: '010-0712-2609', email: 'jian@gmail.com', status: 'present' },
      ],
    }),
    sessionGroup({
      id: 'h1-daegu-20260403',
      regionKey: 'daegu',
      half: 'h1',
      isoDate: '2026-04-03',
      institutionName: '대구수성초등학교',
      district: '수성구',
      seeds: [
        { name: '박성민', assignedClass: '2학년 1반', contact: '010-1823-3710', email: 'seongmin@naver.com', status: 'present' },
        { name: '최하린', assignedClass: '3학년 1반', contact: '010-2934-4821', email: 'harin@gmail.com', status: 'present' },
        { name: '정우성', assignedClass: '4학년 1반', contact: '010-3045-5932', email: 'woosung@naver.com', status: 'late', lateMinutes: 40, checkInTime: '10:00' },
        { name: '한예슬', assignedClass: '5학년 1반', contact: '010-4156-6043', email: 'yesul@gmail.com', status: 'present', isDropout: true },
      ],
    }),
    sessionGroup({
      id: 'h1-daegu-20260424',
      regionKey: 'daegu',
      half: 'h1',
      isoDate: '2026-04-24',
      institutionName: '대구달서초등학교',
      district: '달서구',
      seeds: [
        { name: '임채우', assignedClass: '1학년 1반', contact: '010-5267-7154', email: 'chaewoo@naver.com', status: 'present' },
        { name: '오수아', assignedClass: '2학년 1반', contact: '010-6378-8265', email: 'sua@gmail.com', status: 'present' },
        { name: '강민서', assignedClass: '3학년 1반', contact: '010-7489-9376', email: 'minseo@naver.com', status: 'excused_absence', excusedReason: '대회 참가' },
      ],
    }),
    sessionGroup({
      id: 'h1-busan-20260410',
      regionKey: 'busan',
      half: 'h1',
      isoDate: '2026-04-10',
      institutionName: '부산해운대초등학교',
      district: '해운대구',
      seeds: [
        { name: '윤지호', assignedClass: '2학년 1반', contact: '010-8590-0487', email: 'jiho@gmail.com', status: 'present' },
        { name: '송유리', assignedClass: '2학년 2반', contact: '010-9601-1598', email: 'yuri@naver.com', status: 'present' },
        { name: '장민규', assignedClass: '3학년 1반', contact: '010-0712-2609', email: 'mingyu@gmail.com', status: 'present' },
        { name: '배소민', assignedClass: '4학년 1반', contact: '010-1823-3710', email: 'somin@naver.com', status: 'present' },
      ],
    }),
    sessionGroup({
      id: 'h1-busan-20260501',
      regionKey: 'busan',
      half: 'h1',
      isoDate: '2026-05-01',
      institutionName: '부산남포초등학교',
      district: '중구',
      seeds: [
        { name: '홍서준', assignedClass: '1학년 1반', contact: '010-2934-4821', email: 'seojun@gmail.com', status: 'present' },
        { name: '문지유', assignedClass: '2학년 1반', contact: '010-3045-5932', email: 'jiyu@naver.com', status: 'present' },
      ],
    }),
    sessionGroup({
      id: 'h1-gwangju-20260403',
      regionKey: 'gwangju',
      half: 'h1',
      isoDate: '2026-04-03',
      institutionName: '진월초등학교',
      district: '광산구',
      seeds: [
        { name: '김하늘', assignedClass: '2학년 1반', contact: '010-4156-6043', email: 'haneul@gmail.com', status: 'present' },
        { name: '이도현', assignedClass: '3학년 1반', contact: '010-5267-7154', email: 'dohyun@naver.com', status: 'late', lateMinutes: 12, checkInTime: '9:12' },
        { name: '박서윤', assignedClass: '4학년 1반', contact: '010-6378-8265', email: 'seoyoon@gmail.com', status: 'present' },
        { name: '최민재', assignedClass: '5학년 1반', contact: '010-7489-9376', email: 'minjae@naver.com', status: 'excused_absence', excusedReason: '교내 행사' },
      ],
    }),
    sessionGroup({
      id: 'h1-jeonbuk-20260417',
      regionKey: 'jeonbuk_jeonju',
      half: 'h1',
      isoDate: '2026-04-17',
      institutionName: '전주효자초등학교',
      district: '전주시',
      seeds: [
        { name: '정윤아', assignedClass: '2학년 1반', contact: '010-8590-0487', email: 'yuna@gmail.com', status: 'present' },
        { name: '한동욱', assignedClass: '2학년 2반', contact: '010-9601-1598', email: 'dongwook@naver.com', status: 'absent' },
        { name: '윤채원', assignedClass: '3학년 1반', contact: '010-0712-2609', email: 'chaewon@gmail.com', status: 'present' },
        { name: '조성훈', assignedClass: '4학년 1반', contact: '010-1823-3710', email: 'sunghoon@naver.com', status: 'late', lateMinutes: 18, checkInTime: '9:18' },
        { name: '신예진', assignedClass: '5학년 1반', contact: '010-2934-4821', email: 'yejin@gmail.com', status: 'excused_absence', excusedReason: '학교 수련회' },
      ],
    }),
  ]
}

function buildH2Fixtures(): UjatAttendanceSessionGroup[] {
  return [
    sessionGroup({
      id: 'h2-seoul-20260911',
      regionKey: 'seoul',
      half: 'h2',
      isoDate: '2026-09-11',
      institutionName: '서울숭인초등학교',
      district: '종로구',
      seeds: [
        { name: '김지윤', assignedClass: '2학년 1반', contact: '010-2847-4821', email: 'jiyun@gmail.com', status: 'present' },
        { name: '이서연', assignedClass: '2학년 2반', contact: '010-3912-7743', email: 'seoyeon@naver.com', status: 'present' },
        { name: '박민준', assignedClass: '3학년 1반', contact: '010-5521-9034', email: 'minjun@gmail.com', status: 'late', lateMinutes: 22, checkInTime: '9:22' },
      ],
    }),
    sessionGroup({
      id: 'h2-gyeonggi-20260918',
      regionKey: 'gyeonggi_south',
      half: 'h2',
      isoDate: '2026-09-18',
      institutionName: '용인초등학교',
      district: '용인시',
      seeds: [
        { name: '강태훈', assignedClass: '2학년 1반', contact: '010-5489-3276', email: 'taehoon@naver.com', status: 'present' },
        { name: '임서아', assignedClass: '3학년 1반', contact: '010-6590-4387', email: 'seoa@gmail.com', status: 'present' },
      ],
    }),
    sessionGroup({
      id: 'h2-incheon-20260911',
      regionKey: 'incheon',
      half: 'h2',
      isoDate: '2026-09-11',
      institutionName: '인천연수초등학교',
      district: '연수구',
      seeds: [
        { name: '최은우', assignedClass: '2학년 1반', contact: '010-5378-8265', email: 'eunwoo@gmail.com', status: 'present' },
        { name: '정다은', assignedClass: '3학년 1반', contact: '010-6489-9376', email: 'daeun@naver.com', status: 'excused_absence', excusedReason: '학교 행사' },
      ],
    }),
    sessionGroup({
      id: 'h2-daejeon-20260918',
      regionKey: 'daejeon',
      half: 'h2',
      isoDate: '2026-09-18',
      institutionName: '대전유성초등학교',
      district: '유성구',
      seeds: [
        { name: '조민호', assignedClass: '2학년 1반', contact: '010-3045-5932', email: 'minho@naver.com', status: 'present' },
        { name: '신유나', assignedClass: '3학년 1반', contact: '010-4156-6043', email: 'yuna@gmail.com', status: 'present' },
      ],
    }),
    sessionGroup({
      id: 'h2-daegu-20260911',
      regionKey: 'daegu',
      half: 'h2',
      isoDate: '2026-09-11',
      institutionName: '대구북구초등학교',
      district: '북구',
      seeds: [
        { name: '박성민', assignedClass: '2학년 1반', contact: '010-1823-3710', email: 'seongmin@naver.com', status: 'present' },
        { name: '한예슬', assignedClass: '3학년 1반', contact: '010-4156-6043', email: 'yesul@gmail.com', status: 'present', isDropout: true },
      ],
    }),
    sessionGroup({
      id: 'h2-busan-20260918',
      regionKey: 'busan',
      half: 'h2',
      isoDate: '2026-09-18',
      institutionName: '부산서면초등학교',
      district: '부산진구',
      seeds: [
        { name: '윤지호', assignedClass: '2학년 1반', contact: '010-8590-0487', email: 'jiho@gmail.com', status: 'present' },
        { name: '송유리', assignedClass: '3학년 1반', contact: '010-9601-1598', email: 'yuri@naver.com', status: 'present' },
      ],
    }),
    sessionGroup({
      id: 'h2-gwangju-20260911',
      regionKey: 'gwangju',
      half: 'h2',
      isoDate: '2026-09-11',
      institutionName: '진월초등학교',
      district: '광산구',
      seeds: [
        { name: '김하늘', assignedClass: '2학년 1반', contact: '010-4156-6043', email: 'haneul@gmail.com', status: 'present' },
        { name: '이도현', assignedClass: '3학년 1반', contact: '010-5267-7154', email: 'dohyun@naver.com', status: 'present' },
      ],
    }),
    sessionGroup({
      id: 'h2-jeonbuk-20260918',
      regionKey: 'jeonbuk_jeonju',
      half: 'h2',
      isoDate: '2026-09-18',
      institutionName: '전주완산초등학교',
      district: '전주시',
      seeds: [
        { name: '정윤아', assignedClass: '2학년 1반', contact: '010-8590-0487', email: 'yuna@gmail.com', status: 'present' },
        { name: '한동욱', assignedClass: '3학년 1반', contact: '010-9601-1598', email: 'dongwook@naver.com', status: 'late', lateMinutes: 8, checkInTime: '9:08' },
      ],
    }),
  ]
}

const ATTENDANCE_FIXTURES: UjatAttendanceSessionGroup[] = [
  ...buildH1Fixtures(),
  ...buildH2Fixtures(),
]

const sessionStore = new Map<string, UjatAttendanceSessionGroup>()

function cloneSession(session: UjatAttendanceSessionGroup): UjatAttendanceSessionGroup {
  return {
    ...session,
    volunteers: cloneAttendanceVolunteerRows(session.volunteers),
  }
}

function ensureSessionStore(): void {
  if (sessionStore.size > 0) return
  for (const session of ATTENDANCE_FIXTURES) {
    sessionStore.set(session.id, cloneSession(session))
  }
}

export function getUjatEducationProgressAttendanceSessions(
  half: EducationProgressHalfKey,
  regionKey: UjatInstitutionApplicationRegionKey
): UjatAttendanceSessionGroup[] {
  ensureSessionStore()
  return [...sessionStore.values()]
    .filter(s => s.half === half && s.regionKey === regionKey)
    .map(cloneSession)
    .sort((a, b) => a.isoDate.localeCompare(b.isoDate))
}

export function getUjatEducationProgressAttendanceDateOptions(
  half: EducationProgressHalfKey,
  regionKey: UjatInstitutionApplicationRegionKey
): Array<{ label: string; value: string }> {
  const sessions = getUjatEducationProgressAttendanceSessions(half, regionKey)
  return sessions.map(s => ({ label: s.dateLabel, value: s.isoDate }))
}

export function patchUjatEducationProgressAttendanceSession(
  sessionId: string,
  volunteers: UjatAttendanceVolunteerRow[]
): void {
  ensureSessionStore()
  const existing = sessionStore.get(sessionId)
  if (!existing) return
  sessionStore.set(sessionId, {
    ...existing,
    volunteers: cloneAttendanceVolunteerRows(volunteers),
  })
}

export function resetUjatEducationProgressAttendanceMockStore(): void {
  sessionStore.clear()
}
