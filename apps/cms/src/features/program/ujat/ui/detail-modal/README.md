# UJAT 프로그램 상세 (`detail-modal`)

LNB 메뉴 구조에 맞춘 폴더 배치입니다. URL·풀페이지 셸은 루트에 두고, 화면별 UI는 하위 폴더에 둡니다.

| 폴더 | LNB (`UjatDetailLnbKey`) | 설명 |
|------|--------------------------|------|
| *(루트)* | — | `ujat-program-detail-sidebar`, `ujat-program-detail-fullpage-modal` |
| `ujat/lib/` | — | `ujat-program-detail-url`, `ujat-program-detail-meta` (URL·mock 분기) |
| `info/` | `info` | 프로그램 정보·모집(참여기관/봉사자) 탭 |
| `application-institution/` | `institution_applications` | 기관 신청 목록·상세 |
| `application-volunteer/` | `volunteer_h1`, `volunteer_h2` | 봉사자 신청·심사 (`screening/` — 상·하반기는 `half` prop으로 분기) |
| `progress/` | `education_progress` | 교육 진행 탭 정의·LNB 아이콘 |
| `progress/progress-status/` | `education_progress` (상·하반기 하위 탭) | 진행 현황 화면 확장용 |
| `progress/progress-summary/` | `edu_summary` | 교육 진행 요약 화면 확장용 |
| `survey-management/` | `survey` | 설문 관리 LNB·화면 확장용 |
| `manager-info/` | `managers` | 담당자 정보 (`ProgramManagersTab`은 general UI 사용) |
