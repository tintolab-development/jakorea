# Cursor prompt — Gemini 승인 연수 목록 필터 쿼리 파라미터 (JABACK)

| 항목 | 값 |
|---|---|
| 대상 레포 | **JABACK만** |
| 주 API | `GET /api/admin/gemini/trainings/approved` |
| 스키마 | `GeminiApprovedTrainingListResponse` · `GeminiApprovedTrainingItem` |
| 대상 화면 | CMS → 제미나이 → 찾아가는 연수 → **승인 연수** 탭 상단 필터 |
| 프로그램 유형 | `GEMINI_TRAINING` 만 |
| 우선순위 | **P1** (무한 스크롤 목록에서 필터가 이미 불러온 페이지에만 적용됨) |
| 작성일 | 2026-10-02 |

---

## 한줄

승인 연수 목록 GET은 현재 `keyword` · `page` · `size`만 받는다 (`localhost:8080/v3/api-docs` 2026-10-02 확인).  
CMS 필터 6개 중 기관명만 서버 필터가 되고, 나머지는 FE가 **로드된 페이지 안에서만** 거른다 → 건수(`totalElements`)·결과 누락 불일치.

## FE 현황 (이미 반영)

FE는 조회 시 아래 쿼리 파라미터를 **이미 전송**한다. BE가 지원하면 FE 수정 없이 서버 필터로 전환된다.

| 쿼리 | 타입 | CMS 필터 | 의미 |
|---|---|---|---|
| `keyword` | string | 기관명 | 기관명 부분 일치 (기존) |
| `institutionSido` | string | 기관 소재지 (시/도) | 정확 일치. 예: `서울특별시` |
| `institutionSigungu` | string | 기관 소재지 (시/군/구) | 정확 일치. `institutionSido`와 함께 옴 |
| `status` | enum | 진행 현황 | `SCHEDULED` · `IN_PROGRESS` · `COMPLETED` · `NOT_CONDUCTED` |
| `officialDocumentRequired` | boolean | 공문 필요 여부 | `true` / `false`. 미전송 = 전체 |
| `trainingDateFrom` | `YYYY-MM-DD` | 연수일 시작 | 포함 |
| `trainingDateTo` | `YYYY-MM-DD` | 연수일 종료 | 포함 |

## 진행 현황(`status`) 판정 — FE 현행 로직과 동일하게

FE `resolveApprovedTrainingStatus` 기준 (오늘 = 서버 기준일, Asia/Seoul):

- 강사 미배정: 마지막 희망일(`lastPreferredDate`) 경과 시 `NOT_CONDUCTED`, 아니면 `SCHEDULED`
- 강사 배정: 연수일(`trainingDate`) 이전 `SCHEDULED`, 당일 `IN_PROGRESS`, 이후 `COMPLETED`

연수일 범위 필터 기준일도 FE `resolveApprovedTrainingFilterDate`와 같게: 강사 배정 시 `trainingDate`, 미배정 시 `lastPreferredDate`.

## 요구사항

1. 위 쿼리 파라미터를 컨트롤러·OpenAPI(`backend.openapi.json`)에 추가하고 서버에서 필터링한다.
2. `totalElements`는 필터 적용 후 건수.
3. 빈 값/미전송은 해당 조건 무시.
4. 잘못된 enum·날짜 형식은 400.

## 검증

- [ ] 각 파라미터 단독·조합으로 200 + 결과가 조건에 맞음
- [ ] `totalElements`가 필터 결과 건수와 일치
- [ ] OpenAPI에 7개 쿼리 노출

## FE 참고

- 클라이언트: `apps/cms/src/features/program/gemini/api/visiting-training/client.ts` (`fetchGeminiApprovedTrainingsRemote`)
- 목록: `apps/cms/src/features/program/gemini/ui/approved/list.tsx` (BE 반영 후 클라이언트 `filterRows` 제거 예정)
