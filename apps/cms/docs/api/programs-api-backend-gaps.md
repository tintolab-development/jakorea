# 일반 프로그램 API — 백엔드 핸드오프 (갭·미구현)

CMS `/programs/general` mock → `programs` API 전환 시 백엔드 확인·요청 항목입니다.

연동 명세: [programs-api-integration.md](./programs-api-integration.md)  
마이그레이션: [programs-api-migration-guide.md](./programs-api-migration-guide.md)  
상세 완료율 · Phase 5–10: [programs-detail-api-conversion-status.md](./programs-detail-api-conversion-status.md)

**작성일**: 2026-07-09

---

## 요약

| 구분 | 설명 |
|------|------|
| **1차 완료 (FE)** | GET 목록/상세, POST/PATCH/DELETE 코어, URL 쿼리 연동 |
| **P0 갭** | 목록 필터 `lifecycleStatus`·`participantRecruitment`·운영기간 서버 필터 |
| **P1 갭** | `generalCommonInfo`·모집 nested 필드 PATCH 계약 |
| **2차 트랙** | 신청·진행현황·담당자·설문 — 별도 application/progress API |

---

## P0 — 목록·필터

| 항목 | 현재 FE | 백엔드 요청 |
|------|---------|-------------|
| 프로그램명 검색 | `keyword` | 확인 완료 가정 |
| 4카드 status | `periodStatus` RECRUITING/IN_PROGRESS/COMPLETED | `lifecycleStatus` 세분 enum과 매핑표 |
| lifecycleStatus 필터 | 클라이언트 only | query param 추가 또는 `periodStatus` 확장 |
| targetLevel | 클라이언트 only | query param |
| participantRecruitment | 클라이언트 only | query param |
| operationStartDate/EndDate | 클라이언트 only | businessStartDate/EndDate range query |

---

## P1 — 상세 저장 필드

`ProgramCreateRequest` / `ProgramUpdateRequest`에 **없거나 CMS만 쓰는 필드**:

| CMS `Program` 필드 | 비고 |
|--------------------|------|
| `generalCommonInfo` | 교육 일정·급여·모집 설정 nested |
| `generalParticipantTypes` | 참여자 유형 플래그 |
| `generalSurveyMenuKeys` | 설문 메뉴 |
| `targetLevels[]` | 다중 대상 — API는 `targetLevel` 단일 |
| `instructorApplication*` / `volunteerApplication*` | 모집 기간·발표 nested |
| `resultAnnouncement*` | 결과 발표 |

**제안**: `serviceDetailJson`에 CMS nested JSON v1 스키마 합의, 또는 전용 nested DTO 확장.

---

## P1 — enum·상태 매핑

| CMS `lifecycleStatus` | API `periodStatus` (목록) |
|-----------------------|---------------------------|
| recruiting_students 등 | RECRUITING |
| education_in_progress | IN_PROGRESS |
| education_completed | COMPLETED |

상세 `lifecycleStatus` enum 값 전체 목록 백엔드 SSOT 필요.

---

## 2차 트랙 (진행 중)

| 도메인 | FE 상태 | 모듈 키 |
|--------|---------|---------|
| 기관/강사/개인 신청 목록·승인/반려 | `applications` API 연동 (mock fallback) | `applications` (+ `programs` 필수) |
| 진행현황 참여자 목록 | `GET .../participants` 연동 | `programProgress` (+ `programs` 필수) |
| 참여 기관·강사·봉사 진행 목록 | mock 유지 — API 매핑 설계 필요 | — |
| 봉사자 신청·면접 | mock 유지 | `volunteer-interviews` (별도) |
| 담당자·설문 | mock / forms-surveys | — |

**활성화 예시**

```env
VITE_REAL_API_MODULES=...,programs,applications,programProgress
```

상세: [programs-api-migration-guide.md](./programs-api-migration-guide.md) 2차 섹션

---

## 스모크 테스트 (백엔드)

1. `GET /api/admin/programs?programType=GENERAL&periodStatus=RECRUITING`
2. `POST /api/admin/programs` — 최소 `title`, `sponsorId`, `type`, `lifecycleStatus`
3. `PATCH /api/admin/programs/{id}` — `title` 변경 후 GET 일치
4. `DELETE /api/admin/programs/{id}` — 목록에서 제거
