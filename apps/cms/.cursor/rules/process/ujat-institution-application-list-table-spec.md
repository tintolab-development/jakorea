# UJAT 프로그램 상세 — 신청 기관 > 기관 신청 목록 테이블

**Scope:** `ujat-program-detail-fullpage-modal` → LNB **기관 신청** → **신청 기관** (`inst_all`)  
**Code:** `ujat-institution-application-list.tsx`, `ujat-institution-application-columns.tsx`, `ujat-institution-application-education-schedule.ts`, `ujat-institution-application-mock.ts`

---

## 테이블 열 기획

### 총 신청 학급 수

- **정의:** 해당 기관이 신청한 **모든 학년**의 학급 수 **합산**.
- **표시:** `N학급` (예: `17학급`).
- **데이터:** `gradeClassCounts` 각 `classCount` 합 = `totalClassCount`. mock·API 모두 `sumGradeClassCounts()`로 일치 검증.
- **관련 열:** 「학년 별 신청 학급 수」는 `1학년 4학급 | 2학년 7학급 | …` 형태로 상세만 표시.

### 교육 일자

- **열 구성:** 관리자가 프로그램 등록 시 설정한 **교육 일정 기간** 안의 **모든 금요일**이 각각 **독립 열**(헤더: `M월 D일`).
- **셀 값:** 해당 기관이 그 금요일을 신청했으면 **`O`**, 미신청이면 **`-`**.
- **mock 기간:** `UJAT_INSTITUTION_EDUCATION_PERIOD_MOCK` (`2026-04-03` ~ `2026-06-19`) — 12개 금요일 열.
- **캘린더 뷰:** `scheduleSlots`가 `O`인 날짜만 일정 이벤트로 변환 (`ujat-institution-application-calendar-events.ts`).

### 기타 열 (참고)

| 열 | 내용 |
|----|------|
| No. | 역순 번호 |
| 신청 기관명 | 학교명 |
| 임시 배정 평가 | 평가 대기 / 임시 반려 / 임시 배정 / 신청 반려 (텍스트 색) |
| 학년 별 신청 학급 수 | 학년별 학급 수 파이프 구분 |
| 신청 교사명 | 담당 교사 |

---

## 구현 메모

- 교육 일자 열 목록: `UJAT_INSTITUTION_SCHEDULE_COLUMNS` (`listFridayIsoDatesInPeriod` 생성). slot key = ISO `YYYY-MM-DD`.
- 테이블 `scroll.x`: 선택 열 + 고정 열 + `92px × 금요일 열 수`.
- API 연동 시: 프로그램 교육 시작·종료일로 금요일 열 재계산, 기관별 신청 금요일 배열 → `O`/`-` 매핑.

---

## 신청 기관 상세 — 기본 정보

- **레이아웃:** `DetailInfoForm` 2블록 — (1) **임시 배정 현황** 단독, (2) **기본 정보** (기관명·지역·소재지·교사·기타).
- **임시 배정 현황 색:** 목록과 동일 `UjatInstitutionApplicationStatusBadge` / `ujat-institution-application-status-badge.css`.
- **개인정보 마스킹** (`personalInfoRevealed` 전): Tel·M 가운데 4자리 `*`, E-mail `@` 앞 3자리+`***` (`MASKING_POLICY`). **기관 소재지·상세 주소는 마스킹 없음.** 사용자 **자택 주소**만 동·구까지 노출·이후 `blur(5px)` (`HomeAddressPrivacyValue`).

---

**Last updated:** 2026-05-19
