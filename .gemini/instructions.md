# Project Instructions

## UI 컴포넌트 규칙

### SelectBox
- 새로운 SelectBox(드롭다운)를 만들 때는 반드시 `src/renderer/src/components/common/SearchableSelect.jsx` 컴포넌트를 사용할 것.
- 일반 `<select>` HTML 태그를 직접 사용하지 말 것.
- SearchableSelect는 검색/필터 기능, 선택 항목 자동 스크롤, 호버/선택 상태 시각 표시를 지원함.

### Tab UI
- 새로운 Tab UI를 만들 때는 `src/renderer/src/components/common/TabCommon.css`의 클래스와 스타일을 기반으로 구성할 것.
- 기존 Tab들과 일관된 디자인을 유지하기 위해 TabCommon.css에 정의된 공통 클래스(`.tab-detail-container`, `.info-card`, `.field-group`, `.modern-input`, `.section-label` 등)를 활용할 것.
