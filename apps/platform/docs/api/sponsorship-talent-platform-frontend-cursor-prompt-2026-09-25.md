# Cursor prompt — Platform 재능기부 공개 API 연동

아래 지시를 **프론트 레포(`jakorea`)의 `apps/platform`에서 실행**하라.  
백엔드 레포를 탐색·수정하지 마라. path·JSON은 Admin OpenAPI / 아래 계약만 사용하라.

관련:

| 문서 | 용도 |
|------|------|
| [`apps/admin/docs/api/sponsorship-talent-backend-cursor-prompt-2026-09-25.md`](../../../admin/docs/api/sponsorship-talent-backend-cursor-prompt-2026-09-25.md) | 백엔드 API 계약 |
| [`apps/admin/docs/api/sponsorship-talent-platform-seed-backend-cursor-prompt-2026-09-25.md`](../../../admin/docs/api/sponsorship-talent-platform-seed-backend-cursor-prompt-2026-09-25.md) | DB 시드 (Platform 카피 SSOT) |
| `apps/platform/src/features/talent-donation/lib/constants.ts` | FE overlay fallback |

Homepage 공개 API: `:8081`. 인증 없음(`skipAuth`).

---

## Goal

| 화면 | 목표 |
|------|------|
| `/support/talent` | `GET /api/public/sponsorship/talent` → 히어로·방법·인터뷰 |
| `/support/talent/apply` | 첨부 prepare→confirm 후 `POST /api/public/sponsorship/talent-applications` |

완료 조건:

1. `isHomepageApiConfigured()` 일 때만 remote query enable.
2. remote 실패·미설정 시 `constants.ts` fallback. 빈 화면으로 만들지 마라.
3. API 문구가 fallback과 같으면 **디자인 줄바꿈**을 유지한다 (`splitPublicTextLines`).
4. CTA(`Grow together` 등)는 API에 없다 — constants 고정.
5. 첨부 업로드는 talent 전용 path만 쓴다. corporate-consultations attachments 재사용 금지.
6. UI에서 Orval/generated import 금지. feature `api/client.ts` + hooks.

---

## Out of scope / 금지

- Admin talent 소개·신청 관리 화면
- 개인후원·기업후원 path 변경
- CTA·히어로 라벨을 DB 필드로 추가 요청
- mock-data.ts 재도입

---

## API

### 소개

`GET /api/public/sponsorship/talent`

- `banner.mainText` / `subText` (개행 가능)
- `howItems[]` id 1–3 · `title` · `description`
- `interviews[]` id `interview_01`/`interview_02` · `mainText` · `subText` · `buttonLabel` · `linkedStoryId`

매핑: `features/talent-donation/lib/overlay.ts`

### 신청

1. (선택) `POST /api/public/sponsorship/talent-applications/attachments/upload-requests`
2. PUT `uploadUrl`
3. `POST .../attachments/{assetId}/confirm`
4. `POST /api/public/sponsorship/talent-applications`  
   body: Platform apply-form 필드 + `privacyAgreed: true` + 선택 `attachmentAssetId`

enum wire 소문자: `gender` `male`|`female`, `jaParticipation` `yes`|`no`.

---

## 구현 위치

| 파일 | 역할 |
|------|------|
| `api/types.ts` | public wire |
| `api/client.ts` | axios skipAuth |
| `api/hooks.ts` | query Class D / mutation |
| `ui/hero-section.tsx` · `method-section.tsx` | view hooks |
| `ui/apply-form.tsx` | create mutation + attachmentFile |

`platformQueryKeys.sponsorship.talent()` 사용.

---

## 검증

```bash
curl -s http://localhost:8081/api/public/sponsorship/talent | head
pnpm --filter platform typecheck
```

브라우저:

- [ ] `/support/talent` 히어로·방법 3·인터뷰 2 (시드 후 API 문구)
- [ ] fetching 중 텍스트 높이 점프 없음(동일 카피·줄바꿈 유지)
- [ ] `/support/talent/apply` 필수 미입력 검증
- [ ] 동의 후 접수 → 성공 메시지
- [ ] 첨부 포함 접수(선택)

---

## 회신 템플릿

```text
## Platform 재능기부 API
- intro GET: (연동/fallback)
- apply POST + 첨부: (연동)
- typecheck: (pass/fail)
- 시드 의존: (있음/없어도 fallback)
```

**Last updated:** 2026-09-25
