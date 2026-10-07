# Cursor prompt — 프로그램 설문 바인딩 진행 상태 판정 · 삭제/수정 서버 가드 (JABACK)

아래 지시를 **백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 탐색하지 말고, **이 문서의 계약과 재현만** 사용하라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/program-survey-binding-progress-status-delete-guard-backend-cursor-prompt-2026-10-07.md`

> **긴급도: 중간 (기획 불일치 · 기능 도달 불가).**
> CMS 프로그램 상세 → 설문 관리에서 등록한 설문은 등록 직후부터 "진행 중"으로 판정된다.
> 기획상 "진행 전"에만 허용되는 **설문 삭제 · 양식 수정**을 할 수 있는 시점이 없다.
> FE 화면 분기 오류는 FE에서 따로 고친다. 이 문서는 **서버 상태 판정과 서버 가드**만 다룬다.

---

## 기획 기준 (Notion CMS 어드민 기능정의서, 2026-10-07 교차검증)

일반(기관) 설문조사 · 만족도조사는 "UJAT의 설문관리와 동일"로 정의되어 있다. UJAT 원문 기준:

| 상태 | 본문 | 삭제 | 양식 수정 | 결과 다운로드 |
|---|---|---|---|---|
| 진행 전 | 「아직 진행 전」 안내 | **가능** | **가능** | 없음 |
| 진행 중 | 현재 답변 기준 설문 결과 | 불가 | 불가 | 모두 참여 완료 시 활성 |
| 완료 | 최종 설문 결과 | 불가 | 불가 | 활성 |

- 원문: "삭제 버튼은 설문 진행 전에만 선택 가능하며, 설문 진행 시 비활성화"
- 원문: 진행 전 "양식 수정 버튼 노출" / 진행 중·완료 "양식 수정 버튼 없음"
- **응답 수(0건 여부)는 삭제·수정 가능 조건이 아니다.** 상태만 기준이다.
- **기획 미정의:** 응답 시작일시가 없는 설문을 진행 전으로 볼지, 진행 중으로 볼지 (기획 확인 요청 중)

---

## 현재 계약과 재현

### 계약 (OpenAPI v9, `ProgramFormBindingResponse`)

```text
submissionStartAt / submissionEndAt
  없으면 null. 시작·종료가 모두 null이면 기간 없음이며 화면 상태는 진행 중(in_progress)이다.
  서버가 종료 시각을 만들어 finished로 두지 않는다.
availableActions?: string[]
```

### CMS 등록 흐름 (FE 현재)

- `POST /api/admin/programs/{programId}/form-bindings`
- body: `formType`(SURVEY / SATISFACTION / LECTURE_EVALUATION), `templateId`, `templateVersionId`, `targetRole`, `targetScope`, `targetScopeId`, `active: true`, `required: false`
- **`submissionStartAt` / `submissionEndAt`은 보내지 않는다.** CMS 설문 관리에는 응답 기간 입력 UI가 없다.

### 결과

- 등록 직후 바인딩: `submissionStartAt = null`, `submissionEndAt = null` → 계약상 **진행 중**
- FE 판정: `현재 < submissionStartAt`일 때만 진행 전 → 진행 전에 도달하지 못함
- 재현: `programId=186046`, 설문조사 「만족도조사 (학생용) 복사본」. 응답 0건인데 삭제가 비활성이다.

### FE가 쓰는 삭제 API

- `DELETE /api/admin/programs/{programId}/form-bindings/{bindingId}`
- 현재 FE만 상태를 막는다. **서버가 진행 중·완료 바인딩 삭제를 거부하는지는 FE에서 확인하지 못했다.**

---

## 요청

### A. [확정] 진행 상태를 서버가 판정해 내려준다

`GET /api/admin/programs/{programId}/form-bindings` 응답 항목에 아래 필드를 **추가(additive)** 한다.

```text
progressStatus: "BEFORE_START" | "IN_PROGRESS" | "FINISHED"
```

- 판정 규칙은 서버 한 곳에 둔다. 판정할 때는 서버 시각(KST)을 쓴다.
  - `now < submissionStartAt` → `BEFORE_START`
  - `submissionEndAt != null && now > submissionEndAt` → `FINISHED`
  - 그 외 → `IN_PROGRESS`
- **시작일시가 null인 경우의 판정은 C 항목의 기획 확정 전까지 현재 계약(`IN_PROGRESS`)을 유지한다.**
- 대상 `formType`: `SURVEY`, `SATISFACTION`, `LECTURE_EVALUATION`. 그 외 formType은 필드를 생략하거나 null로 둔다.

### B. [확정] 허용 동작을 `availableActions`로 내려준다

설문류 바인딩의 `availableActions`에 아래 값을 상태 기준으로 채운다.

| progressStatus | availableActions에 포함 |
|---|---|
| BEFORE_START | `DELETE`, `UPDATE_TEMPLATE` |
| IN_PROGRESS | (둘 다 미포함) |
| FINISHED | (둘 다 미포함) |

- 이미 `availableActions`를 다른 의미로 채우고 있다면 기존 값은 유지하고 위 두 값만 추가·제거한다.
- 응답 수(`submittedCount`)로 허용 여부를 바꾸지 않는다. 다만 아래 C에서 서버 가드는 둔다.

### C. [확정] 서버 가드 — 진행 전이 아닌 설문류 바인딩은 삭제 거부

`DELETE /api/admin/programs/{programId}/form-bindings/{bindingId}`

- 대상 formType이 설문류(`SURVEY` / `SATISFACTION` / `LECTURE_EVALUATION`)이고 `progressStatus != BEFORE_START`이면 **409**로 거부한다.
- 방어 차원에서, 상태와 무관하게 `submittedCount > 0`이어도 **409**로 거부한다(응답 데이터 유실 방지).
- 에러 응답 예:

```json
{
  "code": "FORM_BINDING_NOT_DELETABLE",
  "message": "진행 중이거나 종료된 설문은 삭제할 수 없습니다."
}
```

- 신청서·동의서 등 설문류가 아닌 바인딩의 기존 삭제 동작은 바꾸지 않는다.
- 먼저 현재 코드에 이미 같은 가드가 있는지 확인하라. 있으면 에러 코드와 메시지만 맞추고, 없으면 추가하라.

### D. [확인 후 결정] 진행 중 설문의 양식 수정 경로

- CMS는 진행 전 설문에서 바인딩된 템플릿을 수정(새 버전 게시 / 바인딩 버전 교체)할 수 있다.
- 바인딩의 `templateVersionId`를 바꾸거나, 바인딩된 템플릿 버전 내용을 수정하는 서버 경로가 있으면 나열하라.
- 각 경로가 `progressStatus != BEFORE_START`일 때 거부되는지 확인하라.
- **이 항목은 수정 전에 경로 목록과 현재 동작을 먼저 보고**하라. 가드 추가 여부는 보고를 본 뒤 정한다.

### E. [기획 확정 대기 — 구현 금지] 응답 기간이 없는 설문의 상태

기획에 아래 질문을 보냈다. 답이 오기 전까지 **현재 계약을 바꾸지 마라.**

> 설문이 등록되었지만 응답 시작일시가 설정되지 않은 경우, 진행 전과 진행 중 중 어느 상태로 판단해야 하는가?

선택지별 백엔드 영향만 미리 정리해 보고하라(코드 수정 없이).

| 선택지 | 백엔드 영향 (보고 대상) |
|---|---|
| 진행 전으로 본다 | 언제 진행 중으로 바뀌는가(공유·게시·첫 응답 등)? Platform 사용자 응답 허용 여부와 충돌하지 않는가? |
| 진행 중으로 본다(현행) | 진행 전 상태는 기간이 설정된 경우에만 생긴다. CMS 등록 시 기간 입력이 필요하다(FE·기획 작업). `POST form-bindings`가 기간을 받아 저장하는지 확인 |

---

## 하지 말 것

- 응답 수 0건만으로 삭제·수정을 허용하는 규칙을 만들지 마라(기획 불일치).
- 기간이 null인 바인딩에 서버가 임의 시작·종료 시각을 채우지 마라.
- 설문류가 아닌 form-binding의 삭제·수정 동작을 바꾸지 마라.
- 기존 응답 필드 이름과 의미를 바꾸지 마라. 추가만 한다.

---

## 완료 보고 형식

1. A~C 변경 파일과 요약
2. D: 양식 수정 서버 경로 목록 + 각 경로의 현재 진행 상태 가드 유무
3. E: 선택지별 영향 정리 (코드 변경 없음)
4. OpenAPI 변경점 (`ProgramFormBindingResponse.progressStatus`, `availableActions` 값 설명, DELETE 409 응답)
5. 재현 확인
   - 기간 null 바인딩: `progressStatus = IN_PROGRESS`, `availableActions`에 `DELETE` 없음, DELETE → 409
   - 시작일시가 미래인 바인딩: `BEFORE_START`, `DELETE` 포함, DELETE → 204/200
   - `submittedCount > 0` 바인딩: DELETE → 409

---

## FE 후속 (참고 · 백엔드 작업 아님)

- 설문조사 탭 본문 분기를 `응답 0건` 대신 `progressStatus`로 바꾼다. 진행 중 + 0건이면 결과 화면을 보여준다.
- 본문 「설문 양식 보기」 수정 권한을 진행 전에만 허용한다.
- 삭제 버튼·양식 수정 노출을 `availableActions`(`DELETE` / `UPDATE_TEMPLATE`) 기준으로 전환한다.
