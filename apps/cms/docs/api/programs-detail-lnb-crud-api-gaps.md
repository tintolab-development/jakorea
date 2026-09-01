# 프로그램 상세 LNB — 백엔드 미구현(BE gap) CRUD 목록

**작성일**: 2026-07-30  
**갱신**: 2026-07-30 — FE 전환 가능 항목 분리. **본 문서는 BE 미구현·계약 부재만 유지**  
**목적**: 프로그램 상세에서 **백엔드 API가 없거나 계약이 불충분**해 FE가 실연동할 수 없는 CRUD를 SSOT로 관리한다.  
**범위**: 일반 · 1사1교 · UJAT · Gemini(찾아가는 연수) · 교육받은 교사  

> FE 완료율·하이브리드 상태는 유형별 전환 문서를 본다.  
> - 일반: [programs-detail-api-conversion-status.md](./programs-detail-api-conversion-status.md) · [programs-api-backend-gaps.md](./programs-api-backend-gaps.md)  
> - 1사1교: [programs-company-school-detail-api-conversion-status.md](./programs-company-school-detail-api-conversion-status.md)  
> - UJAT: [programs-ujat-detail-api-conversion-status.md](./programs-ujat-detail-api-conversion-status.md)  
> - Gemini: [programs-gemini-visiting-training-api-conversion-status.md](./programs-gemini-visiting-training-api-conversion-status.md)  
> - 교육받은 교사: [programs-trained-teachers-api-conversion-status.md](./programs-trained-teachers-api-conversion-status.md)

---

## 0. 표기

| 기호 | 의미 |
|------|------|
| **C / R / U / D** | Create / Read / Update / Delete |
| `⛔` | OpenAPI 미등재 또는 요청 DTO가 화면 payload를 충족하지 않음 |
| `—` | 해당 연산 없음 |

**본 문서에 넣지 않는 것**

- OpenAPI가 있고 FE hybrid/remote로 이미 연결된 표면
- FE 측만 미연결이었던 항목(예: Gemini 모집 POST/PATCH/DELETE · 기관 approve/reject — **2026-07-30 FE 연동**)
- gate OFF 시 mock 폴백만 쓰는 정상 hybrid

---

## 1. 일반 프로그램 (`/programs/general`)

| LNB / 기능 | C | R | U | D | BE 요청 | 비고 |
|------------|---|---|---|---|---------|------|
| **프로그램 정보 — 신청경로 CRUD** | ⛔ | ⛔ | ⛔ | ⛔ | path 리소스 CRUD 또는 nested DTO | `applicationPathId` PATCH만 존재 (P2-4) |
| **면접 슬롯 목록 GET** | — | ⛔ | — | — | `GET …/interview-slots` OpenAPI 등재 | POST create/assign는 있음. FE hand-wrap 실패 시 mock (P2-1) |
| **신청자 상세 body PATCH** | — | ✅(목록) | ⛔ | — | organization/instructor/individual/volunteer application detail PATCH | approve/reject만 존재 (P2-6) |
| **진행 — 참여 기관 중첩 mutation** | ⛔ | 🟡목록 | ⛔ | ⛔ | 학생 명단·배정·출석·신청 상세 mutation | participants 목록만 |
| **진행 — 참여 강사 중첩·정산** | ⛔ | 🟡목록 | ⛔ | — | 기관 배정·강의보고 저장·정산(교통/숙박/100km) | lecture-reports 목록 일부만 |
| **진행 — 참여 봉사자 C/U/D** | ⛔ | ✅목록 | ⛔ | ⛔ | 회원→참여 봉사자 등록, 임직원 세션 인원, 삭제, 확인서 | 목록 `participants?VOLUNTEER`만 |
| **진행 — 정식 schedules GET** | — | ⛔ | — | — | `GET …/programs/{id}/schedules` | 출석은 dashboard schedules 우회 (P2-2) |
| **진행 — 과제** | ⛔ | ⛔ | ⛔ | ⛔ | 프로그램 단위 과제 세션·제출 admin API | 회원 assignment-submissions만 (P2-5) |
| **게시글 댓글/반응 UI 계약** | — | 부분 | — | — | 목록 DTO에 content·comment/reaction count 보강 | PATCH/DELETE post FE hook 준비됨. 댓글 UI는 DTO 확인 후 |

---

## 2. 1사1교 (`/programs/company-school`)

제품 제외(의도적 비구현): 봉사자 LNB · 과제 · 합반 — **BE gap이 아님**.

| LNB / 기능 | C | R | U | D | BE 요청 |
|------------|---|---|---|---|---------|
| **참여 기관 중첩 mutation** | ⛔ | 🟡목록 | ⛔ | ⛔ | 신청 PATCH · 강사 배정 · 학생 · 출석 (Phase 7) |
| **참여 강사 중첩·정산** | ⛔ | 🟡목록 | ⛔ | — | 배정 · 강의보고 · wagePolicies/paymentItems (Phase 8) |
| **설문 문항 answers** | — | 🟡 | ⛔ | — | satisfaction answers remote 계약 |
| **Excel/export 서버** | — | ⛔ | — | — | 서버 export (Phase 10) |

담당자 CRUD는 OpenAPI `…/managers` + 공유 hook으로 FE 가능 — **BE gap 제외**(스테이징 스모크만).

---

## 3. UJAT (`/programs/ujat`)

코어 programs CRUD는 FE hybrid. 아래는 **상세 운영 LNB** BE/계약 갭.

| LNB / 기능 | C | R | U | D | BE 요청 |
|------------|---|---|---|---|---------|
| **학교(기관) 신청** | ⛔ | ⛔ | ⛔ | ⛔ | 공통 applications의 UJAT scope·필드(지역·반기) 보장 또는 전용 API |
| **봉사자 상·하반기 선발** | ⛔ | ⛔ | ⛔ | ⛔ | 서류/면접/평가/최종 결과 UJAT 전용 계약 |
| **교육 진행**(출석·과제·1365·수료) | ⛔ | ⛔ | ⛔ | ⛔ | UJAT execution APIs |
| **partner-assignments** | ⛔ | 부분 OpenAPI | ⛔ | 부분 | `scheduleId`를 주는 schedules[] round-trip · FE client는 schedule ID 확보 후 연결 가능 |
| **설문** | ⛔ | ⛔ | ⛔ | ⛔ | UJAT 상세 설문 바인딩·응답 계약 |

---

## 4. Gemini 찾아가는 연수

| 항목 | 상태 | 비고 |
|------|------|------|
| 모집 POST/PATCH/DELETE · 기관 approve/reject | **FE 연동됨** (2026-07-30) | OpenAPI 존재. gate: `geminiVisitingTraining` |
| `GEMINI` vs `GEMINI_TRAINING` enum 확정 | ⛔ 계약 | FE는 잠정 `GEMINI_TRAINING` |
| 승인 목록 DTO vs `GeminiApprovedTrainingRow` | ⛔ 스키마 | 모집 item 재사용 → 컬럼 매핑 빈약 |
| 승인 상세 GET 외 필드·강사 신청 목록 UI 매핑 | ⛔ / 부분 | `GET …/approved/{id}` · `…/instructor-applications` OpenAPI 있음. **승인 상세·강사 신청 UI는 아직 mock 데이터 층** — 필드 계약·어댑터 보강 후 FE 잔여 |
| 강사 approve/reject | OpenAPI 있음 | FE instructor 탭 remote wiring 잔여(승인 상세 mock과 연동) |

BE에 남는 핵심: **enum 확정**, **approved list/detail 스키마**, **강사 신청 list DTO ↔ UI**.

---

## 5. 교육받은 교사 (`/programs/trained-teachers`)

| LNB / 기능 | C | R | U | D | BE 요청 |
|------------|---|---|---|---|---------|
| **설문 answers** | — | 🟡 | ⛔ | — | 문항 answers remote |
| **기관 중첩 기타 mutation** | ⛔ | 🟡 | ⛔ | — | 진행 목록 외 상세 mutation |
| **교육일지 POST UI 계약** | 🟡서비스 | ✅list | — | — | `EducationJournalCreateRequest` 필수 필드(파일·일정·기관신청 ID)를 CMS 업로드 UI가 충족하는지 BE/FE 합의 |

managers는 generic `…/managers` — **BE gap 제외**(스테이징 검증).

---

## 6. 우선순위 (BE)

| 우선 | 유형 | 요청 |
|------|------|------|
| P0 | UJAT | 신청·선발·교육 진행 전용/공통 scope 계약 |
| P0 | 일반 | 참여 봉사자 C/U/D · 중첩 mutation · 과제(P2-5) |
| P1 | 일반 | interview-slots GET · schedules GET · application detail PATCH · 신청경로 |
| P1 | 1사1교 | Phase 7–8 중첩·정산 |
| P1 | Gemini | approved/instructor DTO · enum 확정 |
| P2 | TT/공통 | 설문 answers · 교육일지 create 필드 |

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07-30 | 초안 — 미전환·API 미존재 인벤토리 |
| 2026-07-30 | **BE gap only**로 축소. Gemini 모집·기관 mutation FE 연동 반영. FE-mock/partial 제거 |
