# Platform — 미구현·준비 중 화면 목록

**기준 브랜치/시점:** `programs/api` (2026-09-20)  
**대상:** `apps/platform`  
**공통 카피 (풀페이지 Temporary):** `페이지 준비 중입니다. 곧 내용을 공개할 예정이에요.`  
**구현 셸:** `apps/platform/src/pages/temporary/page.tsx`  
**경로 SSOT:** `apps/platform/src/shared/config/gnb-temporary-paths.ts`  
**라우트 등록:** `apps/platform/src/app/router/index.tsx`

---

## 1. 풀페이지 Temporary (`TemporaryPage`)

현재 GNB에서 `TemporaryPage`로 연결되는 본 페이지는 없습니다.

**참고:** 같은 GNB 「교육 소개」의 **교재 소개** (`/education/textbooks`)는 구현됨 (`TextbooksPage`). **진로취업** (`/education/career`)도 구현됨 (`EducationCareerPage`). **경제금융** (`/education/finance`)도 구현됨 (`EducationFinancePage`). **기업가 정신** (`/education/entrepreneurship`)도 구현됨 (`EducationEntrepreneurshipPage`). **디지털 리터러시** (`/education/digital-literacy`)도 구현됨 (`EducationDigitalLiteracyPage`).

---

## 2. 구현 완료로 임시 목록에서 제외

| GNB 그룹 | 화면명 | 경로 | 상태 |
|---|---|---|---|
| JA Korea | JA History | `/about/history` | `HistoryPage` 본문 퍼블리싱 완료. `TEMPORARY_PAGE_TITLES`에서 제거됨. |
| 교육 소개 | 기업가 정신 | `/education/entrepreneurship` | `EducationEntrepreneurshipPage` 본문 퍼블리싱 완료. `TEMPORARY_PAGE_TITLES`에서 제거됨. |
| 교육 소개 | 디지털 리터러시 | `/education/digital-literacy` | `EducationDigitalLiteracyPage` 본문 퍼블리싱 완료. `TEMPORARY_PAGE_TITLES`에서 제거됨. |

---

## 3. GNB — 링크 미연결 (외부·추후)

`header-config.ts` 「참여하기」하위. `external: true`이고 **href 없음**.

| 라벨 | 상태 |
|---|---|
| 온라인 학습 | 외부 URL 추후 연결 예정 |
| Alumni | 외부 URL 추후 연결 예정 |

---

## 4. 마이페이지 — 메뉴·영역 미구현

### 4.1 LNB 비활성

| 대상 | 메뉴 | 근거 |
|---|---|---|
| 강사 (`instructor_only` / `instructor_dual`) | **정산현황** | `lnb-config.ts` — `enabled: false` |

강의현황·교육/봉사/문의는 enabled.

### 4.2 상세 탭·섹션 플레이스홀더

페이지는 있으나 **특정 상태/탭**에서 “준비 중” 문구만 노출.

| 화면 | 경로 패턴 | 플레이스홀더 |
|---|---|---|
| 교육현황 상세 | `/mypage/education/:applicationId` | 신청 내용(일부 상태), 교사 정산 탭, 기타 미매핑 탭, “해당 진행 상태의 상세 탭은 준비 중” |
| 봉사현황 상세 | `/mypage/volunteer/:applicationId` | 동일 패턴 |
| 강의현황 상세 | `/mypage/lectures/:applicationId` | 동일 패턴 |

코드: `pages/mypage/{education,volunteer,lecture}/detail/page.tsx`

### 4.3 기능 버튼 → “준비 중” 모달 (페이지는 구현)

| 위치 | 동작 | UI |
|---|---|---|
| 교육 일정 — 과제 제출 등 | `assignment-block.tsx` | `PFAlertModal` 제목 `준비 중` |
| 교육 일정 — 결석 사유 제출 | `schedules/ui/row.tsx` | 동일 |
| 교육 공지 — 일부 액션(수정 등) | `notices/ui/panel.tsx`, `detail-modal.tsx` | 동일 |

---

## 5. 요약 체크리스트 (공개 전)

풀페이지 Temporary (공개 카피 노출)

- [x] `/education/career` — 진로취업
- [x] `/education/finance` — 경제금융
- [x] `/education/entrepreneurship` — 기업가 정신
- [x] `/education/digital-literacy` — 디지털 리터러시

스캐폴드

- [x] `/about/history` — JA History 본문 퍼블리싱 완료

네비게이션

- [ ] 온라인 학습 (외부 URL)
- [ ] Alumni (외부 URL)

마이페이지

- [ ] 강사 LNB 정산현황
- [ ] 교육/봉사/강의 상세 — 신청 내용·미매핑 탭·교사 정산 등
- [ ] 과제 제출 / 결석 사유 / 공지 수정 등 coming-soon 모달

설정 정리

- [x] History를 Temporary 경로 맵에서 제거 (`gnb-temporary-paths.ts`)

---

## 6. 관련 파일

| 역할 | 경로 |
|---|---|
| Temporary 페이지 UI | `src/pages/temporary/page.tsx` |
| Temporary 경로·타이틀 | `src/shared/config/gnb-temporary-paths.ts` |
| GNB | `src/widgets/layout/app-layout/header/header-config.ts` |
| 라우터 | `src/app/router/index.tsx` |
| History 페이지 | `src/pages/about/history/page.tsx` |
| History 피처 | `src/features/history/` |
| 기업가정신 페이지 | `src/pages/education/entrepreneurship/page.tsx` |
| 기업가정신 피처 | `src/features/education-entrepreneurship/` |
| 디지털 리터러시 페이지 | `src/pages/education/digital-literacy/page.tsx` |
| 디지털 리터러시 피처 | `src/features/education-digital-literacy/` |
| 마이페이지 LNB | `src/features/mypage/lib/lnb-config.ts` |

**Last updated:** 2026-09-20
