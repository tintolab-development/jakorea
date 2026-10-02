# Cursor prompt — UJAT 설문 4종 저장 계약 (JABACK)

이 문서는 CMS 백엔드(JABACK)에 넘기는 UJAT 설문 4종 저장 계약이다.  
프론트 저장소는 수정하지 않는다. 프론트 코드를 탐색하지 말고 **이 계약만** 구현하라.

| 항목 | 값 |
|---|---|
| 대상 API | `POST /api/admin/programs` · `PATCH /api/admin/programs/{programId}` · `GET /api/admin/programs/{programId}` |
| 대상 유형 | `programType = UJAT` 만 |
| 비대상 | 일반·교사·1사1교. 이 유형의 `satisfaction` 한 키는 그대로 둔다 |
| 작성일 | 2026-10-02 |

## 계약

UJAT 등록은 이미 설문 4종을 나눠 보낸다.

| 키 | 화면 |
|---|---|
| `survey` | 설문조사 |
| `volunteer_satisfaction` | 봉사단 만족도조사 |
| `school_satisfaction` | 학교 만족도조사 |
| `lecture_evaluation` | 강의평가 |

체크된 항목만 `serviceDetailJson.program.generalSurveyMenuKeys`에 들어간다. 같은 상태가 `registration.overlay["ujat.basicInfo.surveyItems"]` boolean 4개와 맞는다.

- 학교만 켜면 `school_satisfaction`만 간다.
- 전부 해제면 `[]`와 boolean 4개 `false`다.

예 (학교 만족도 + 설문 + 강의평가, 봉사단은 끔):

```json
{
  "version": 1,
  "program": {
    "generalSurveyMenuKeys": ["survey", "school_satisfaction", "lecture_evaluation"]
  },
  "registration": {
    "overlay": {
      "ujat.basicInfo.surveyItems": {
        "survey": true,
        "volunteer_satisfaction": false,
        "school_satisfaction": true,
        "lecture_evaluation": true
      }
    }
  }
}
```

`serviceDetailJson`은 요청 body의 문자열 JSON이다.

## 백엔드가 할 일

이 JSON을 통째로 저장하고 GET에서 그대로 돌려준다.

- `volunteer_satisfaction`과 `school_satisfaction`을 `satisfaction`으로 합치지 않는다.
- deep merge로 이전 값을 되살리지 않는다. UJAT `serviceDetailJson`은 요청 문서 기준으로 교체한다.
- `volunteer_satisfaction` / `school_satisfaction`을 400으로 거절하지 않는다.
- 다른 필드만 PATCH할 때 기존 설문 키와 overlay surveyItems를 `[]`나 누락으로 지우지 않는다.
- 일반·교사·1사1교의 `satisfaction` 한 키 계약은 바꾸지 않는다.

`volunteer_satisfaction`과 `school_satisfaction`을 `satisfaction`으로 합치거나, deep merge로 이전 값을 되살리면 상세 왼쪽 메뉴가 다시 어긋난다.

## 과거 데이터

예전에 `satisfaction`만 저장된 행은 어느 쪽 만족도였는지 알 수 없다. 화면은 그 한 키로 봉사단·학교 만족도를 둘 다 그리지 않는다. 그 행을 추측해서 나누지 않는다.

overlay에 4종 boolean이 있는 행은 그 객체를 유지한다. 옆에 `satisfaction`이 있어도 overlay를 덮어쓰지 않는다.

## 검증

- [ ] UJAT 생성: 학교만 켜고 봉사단은 끔 → GET `generalSurveyMenuKeys`에 `school_satisfaction`만 있고 `volunteer_satisfaction`은 없다. overlay boolean도 같다.
- [ ] 같은 프로그램 PATCH로 봉사단만 켜기 → GET이 바뀐 4종과 일치한다. 이전 값이 merge로 되살아나지 않는다.
- [ ] 4종 전부 해제 → `generalSurveyMenuKeys: []`, overlay boolean 4개 모두 `false`.
- [ ] 일반 프로그램의 `satisfaction` 저장·조회는 기존과 같다.
- [ ] UJAT 요청에 `volunteer_satisfaction`이 있어도 400이 아니다.
