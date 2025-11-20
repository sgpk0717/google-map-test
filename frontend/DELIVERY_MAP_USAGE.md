# DeliveryMapView 사용 가이드

부모 컴포넌트로부터 props를 받아 지도를 렌더링하는 컴포넌트입니다.

## 📦 파일 구조

```
src/
├── components/
│   ├── MapPolygon.tsx                  # 폴리곤 스타일 유틸리티
│   ├── MapMarker.tsx                   # 마커 아이콘 유틸리티
│   ├── DeliveryMapView.tsx            # 배송 지도 메인 컴포넌트
│   └── DeliveryMapViewExample.tsx     # 사용 예제 (목데이터 포함)
└── AppWithExample.tsx                  # 예제 실행용 App
```

## 🚀 빠른 시작

### 1. 예제 화면 보기

`src/main.tsx`를 수정하여 예제를 실행:

```typescript
import AppWithExample from './AppWithExample';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppWithExample />
  </React.StrictMode>
);
```

브라우저에서 "조회" 버튼을 누르면 목데이터로 지도가 표시됩니다.

---

## 📖 사용법

### 기본 사용

```typescript
import DeliveryMapView, { Zone, MarkerData } from './components/DeliveryMapView';

function MyComponent() {
  const [mapData, setMapData] = useState(null);

  const handleFetch = async () => {
    // API 호출
    const response = await fetchDeliveryData();
    setMapData(response);
  };

  return (
    <div>
      <button onClick={handleFetch}>조회</button>

      {mapData && (
        <DeliveryMapView
          areaCoordinates={mapData.areaCoordinates}
          zones={mapData.zones}
          markers={mapData.markers}
          height="600px"  // 선택 사항
        />
      )}
    </div>
  );
}
```

---

## 🔧 Props 인터페이스

### DeliveryMapViewProps

| Prop | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `areaCoordinates` | `Array<{lat, lng}>` | ✅ | - | 영역 좌표 (최소 3개) |
| `zones` | `Zone[]` | ✅ | - | 구역 목록 |
| `markers` | `MarkerData[]` | ✅ | - | 마커 목록 |
| `height` | `string` | ❌ | `"600px"` | 지도 높이 |

### Zone 인터페이스

```typescript
interface Zone {
  id: string;                                      // 고유 ID
  name: string;                                    // 구역 이름
  coordinates: Array<{ lat: number; lng: number }>; // 좌표 (최소 3개)
  color?: 'cyan' | 'blue' | 'green' | 'red' | 'yellow' | 'purple'; // 색상
}
```

### MarkerData 인터페이스

```typescript
interface MarkerData {
  id: string;                         // 고유 ID
  name: string;                       // 마커 이름
  position: { lat: number; lng: number }; // 위치
  selected: boolean;                  // 선택 여부 (true: 빨간 핀, false: 청록 큐브)
}
```

---

## 💡 데이터 예제

### 영역 좌표

```typescript
const areaCoordinates = [
  { lat: 33.2829905, lng: -111.5539719 },
  { lat: 33.2829747, lng: -111.5512963 },
  { lat: 33.2800504, lng: -111.5539479 },
  { lat: 33.2800301, lng: -111.5512648 },
];
```

### 구역 데이터

```typescript
const zones: Zone[] = [
  {
    id: 'zone-1',
    name: 'Zone A',
    color: 'cyan',
    coordinates: [
      { lat: 33.2825, lng: -111.5538 },
      { lat: 33.2825, lng: -111.5528 },
      { lat: 33.2818, lng: -111.5528 },
      { lat: 33.2818, lng: -111.5538 },
    ],
  },
  {
    id: 'zone-2',
    name: 'Zone B',
    color: 'blue',
    coordinates: [
      { lat: 33.2825, lng: -111.5524 },
      { lat: 33.2825, lng: -111.5514 },
      { lat: 33.2818, lng: -111.5514 },
      { lat: 33.2818, lng: -111.5524 },
    ],
  },
];
```

### 마커 데이터

```typescript
const markers: MarkerData[] = [
  {
    id: 'marker-1',
    name: '배송지 1',
    position: { lat: 33.2822, lng: -111.5533 },
    selected: true,  // 빨간 핀
  },
  {
    id: 'marker-2',
    name: '배송지 2',
    position: { lat: 33.2820, lng: -111.5535 },
    selected: false, // 청록 큐브
  },
];
```

---

## 🎨 디자인 상세

### 영역 폴리곤
- **색상**: 회색 (`#9E9E9E`)
- **테두리**: 회색 (`#757575`)
- **투명도**: 매우 연함 (10%)
- **용도**: 전체 배송 가능 영역 표시

### 구역 폴리곤
- **색상**: 6가지 프리셋 (cyan, blue, green, red, yellow, purple)
- **기본값**: cyan (청록색)
- **투명도**: 12%
- **테두리**: 3px, 완전 불투명
- **용도**: 세부 구역 구분

### 마커
- **일반 (selected: false)**: 청록색 3D 큐브
- **선택 (selected: true)**: 빨간/핑크 핀 모양
- **호버**: 마커 이름 툴팁 표시
- **용도**: 배송지 위치 표시

---

## 🔄 동작 방식

### 1. 초기 렌더링
컴포넌트가 마운트되면 Google Maps를 초기화합니다.

### 2. Props 변경 감지
`areaCoordinates`, `zones`, `markers` props가 변경되면:
1. 기존 폴리곤/마커 제거
2. 영역 폴리곤 생성
3. 영역에 맞춰 자동 zoom/center 조정
4. 구역 폴리곤 생성
5. 마커 생성

### 3. 메모리 관리
컴포넌트 언마운트 시 모든 폴리곤/마커를 자동으로 제거합니다.

---

## 🛠️ 커스터마이징

### 지도 높이 변경

```typescript
<DeliveryMapView
  {...props}
  height="800px"  // 기본 600px → 800px
/>
```

### 구역 색상 변경

```typescript
const zones: Zone[] = [
  {
    id: 'zone-1',
    name: 'VIP 구역',
    color: 'red',    // 빨간색
    coordinates: [...],
  },
  {
    id: 'zone-2',
    name: '일반 구역',
    color: 'blue',   // 파란색
    coordinates: [...],
  },
];
```

### 사용 가능한 색상
- `'cyan'` - 청록색 (기본)
- `'blue'` - 파란색
- `'green'` - 녹색
- `'red'` - 빨간색
- `'yellow'` - 노란색
- `'purple'` - 보라색

---

## 📌 주의사항

### 1. 좌표 최소 개수
- 영역: 최소 3개
- 구역: 최소 3개
- 3개 미만 시 해당 폴리곤은 렌더링되지 않습니다.

### 2. 좌표 순서
- 좌표는 시계방향 또는 반시계방향으로 정렬되어야 합니다.
- 순서가 뒤섞이면 이상한 모양의 폴리곤이 그려집니다.
- **자동 Convex Hull 계산은 하지 않습니다** (서버에서 정렬된 좌표를 전달해야 함)

### 3. Google Maps API 키
`index.html`에 Google Maps API 키가 포함되어 있어야 합니다:

```html
<script
  src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places"
  async
  defer
></script>
```

### 4. Props 업데이트
- Props가 변경될 때마다 지도가 완전히 다시 그려집니다.
- 빈번한 업데이트는 성능 저하를 유발할 수 있습니다.

---

## 🔍 트러블슈팅

### 지도가 표시되지 않음
1. Google Maps API 키 확인
2. `index.html`에 스크립트 태그 포함 여부 확인
3. 브라우저 콘솔에서 에러 메시지 확인

### 폴리곤이 이상하게 그려짐
- 좌표 순서를 확인하세요
- 시계방향 또는 반시계방향으로 정렬해야 합니다

### 마커가 표시되지 않음
- `position` 좌표가 영역 내부에 있는지 확인
- `markers` 배열이 빈 배열이 아닌지 확인

### 자동 zoom이 동작하지 않음
- `areaCoordinates`가 올바르게 전달되었는지 확인
- 최소 3개 이상의 좌표가 필요합니다

---

## 📚 관련 문서

- [MapPolygon 사용 가이드](./MAP_COMPONENTS_USAGE.md)
- [MapMarker 사용 가이드](./MAP_COMPONENTS_USAGE.md)
- [Google Maps API 문서](https://developers.google.com/maps/documentation/javascript)

---

## 🎯 실전 통합 예제

### React Query와 함께 사용

```typescript
import { useQuery } from '@tanstack/react-query';
import DeliveryMapView from './components/DeliveryMapView';

function DeliveryMapPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['deliveryMap'],
    queryFn: fetchDeliveryMapData,
    enabled: false, // 수동 호출
  });

  return (
    <div>
      <button onClick={() => refetch()} disabled={isLoading}>
        {isLoading ? '조회 중...' : '조회'}
      </button>

      {data && (
        <DeliveryMapView
          areaCoordinates={data.areaCoordinates}
          zones={data.zones}
          markers={data.markers}
        />
      )}
    </div>
  );
}
```

### 상태 관리 (Zustand)와 함께 사용

```typescript
import { create } from 'zustand';
import DeliveryMapView from './components/DeliveryMapView';

interface MapStore {
  mapData: any | null;
  fetchMapData: () => Promise<void>;
}

const useMapStore = create<MapStore>((set) => ({
  mapData: null,
  fetchMapData: async () => {
    const data = await fetchDeliveryMapData();
    set({ mapData: data });
  },
}));

function DeliveryMapPage() {
  const { mapData, fetchMapData } = useMapStore();

  return (
    <div>
      <button onClick={fetchMapData}>조회</button>

      {mapData && (
        <DeliveryMapView
          areaCoordinates={mapData.areaCoordinates}
          zones={mapData.zones}
          markers={mapData.markers}
        />
      )}
    </div>
  );
}
```

---

## ✅ 체크리스트

배포 전 확인사항:

- [ ] Google Maps API 키가 올바르게 설정되어 있음
- [ ] API 응답 데이터 구조가 Props 인터페이스와 일치함
- [ ] 좌표가 올바른 순서로 정렬되어 있음
- [ ] 모든 필수 Props를 전달하고 있음
- [ ] 에러 처리 (API 실패, 잘못된 데이터 등)가 구현되어 있음
- [ ] 로딩 상태가 적절히 표시됨
- [ ] 지도가 반응형으로 동작함
