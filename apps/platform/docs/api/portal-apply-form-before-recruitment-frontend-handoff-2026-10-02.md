# 신청 양식 GET은 모집 시작 전에도 200

`GET /api/portal/programs/{programId}/form-bindings/{bindingId}` 는 모집 시작 전과 종료 후에도 발행된 신청 양식을 반환합니다. 제출 가능 여부는 바꾸지 않습니다.

출처: BE handoff `portal-apply-form-before-recruitment-frontend-handoff-2026-10-02.md` (2026-10-02).

요청 문서: [portal-apply-form-bindings-before-recruitment-backend-request-2026-10-02.md](./portal-apply-form-bindings-before-recruitment-backend-request-2026-10-02.md)

## 조회

```http
GET /api/portal/programs/{programId}/form-bindings/{bindingId}?recruitmentId={recruitmentId}&applicationType={applicationType}
Authorization: Bearer <회원>
```

- 모집 시작 전·모집 중·모집 종료 후 모두 HTTP 200.
- `data` 모양은 기존 `ApplicationFormResponse` 그대로입니다. `form.paragraphs` 는 배열이고, 임시저장이 없으면 `draftAnswers` 는 `{}` 입니다.
- `form` 은 해당 `formBindingId` 의 발행 버전입니다.
- `RECRUITMENT_NOT_STARTED` / `RECRUITMENT_CLOSED` 는 이 GET 의 `error.code` 로 내려가지 않습니다.

## 그대로인 계약

| API | 모집 시작 전 | 모집 종료 후 |
|-----|-------------|-------------|
| `GET .../application-options` | `canApply=false`, `blockedReason=RECRUITMENT_NOT_STARTED`, `formBindingId` 유지 | `canApply=false`, `blockedReason=RECRUITMENT_CLOSED`, `formBindingId` 유지 |
| `PUT .../applications/draft` | `409` `RECRUITMENT_NOT_STARTED` | `409` `RECRUITMENT_ENDED` |
| `POST .../applications` | `409` `RECRUITMENT_NOT_STARTED` | `409` `RECRUITMENT_ENDED` |

종료 후 제출 거절 코드는 기존 `RECRUITMENT_ENDED` 입니다. options 의 `blockedReason` `RECRUITMENT_CLOSED` 와 다릅니다.

신청하기 화면은 `canApply=false` 여도 이 GET 으로 양식을 그립니다. 제출 버튼은 `canApply` 와 POST 결과를 따릅니다.
