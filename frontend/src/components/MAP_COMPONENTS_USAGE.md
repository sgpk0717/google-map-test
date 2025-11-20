# Map Components 사용 가이드

이미지 기반으로 제작된 Google Maps 폴리곤 및 마커 컴포넌트 사용법

## 📦 포함된 컴포넌트

### 1. MapPolygon.tsx
- **기능**: Google Maps 폴리곤 스타일 생성
- **디자인**: 청록색 테두리, 반투명 채우기
- **용도**: 영역, 구역 표시

### 2. MapMarker.tsx
- **기능**: Google Maps 마커 아이콘 생성
- **디자인**:
  - 일반 상태: 청록색 3D 큐브
  - 선택 상태: 빨간/핑크 핀 모양
- **용도**: 위치 표시, 선택 가능한 마커

---

## 🎨 1. MapPolygon 사용법

### 기본 사용

```typescript
import { createPolygon, createPolygonStyle } from './components/MapPolygon';

// 방법 1: createPolygon 헬퍼 함수 사용
const polygon = createPolygon(
  map,
  [
    { lat: 33.2829905, lng: -111.5539719 },
    { lat: 33.2829747, lng: -111.5512963 },
    { lat: 33.2800504, lng: -111.5539479 },
    { lat: 33.2800301, lng: -111.5512648 },
  ]
);

// 방법 2: 스타일만 가져와서 직접 생성
const polygon = new google.maps.Polygon({
  paths: coordinates,
  map: map,
  ...createPolygonStyle(),
});
```

### 커스텀 색상 사용

```typescript
import { createPolygonStyle, PolygonPresets } from './components/MapPolygon';

// 프리셋 사용
const bluePolygon = new google.maps.Polygon({
  paths: coordinates,
  map: map,
  ...PolygonPresets.blue,
});

// 커스텀 스타일
const customPolygon = createPolygon(map, coordinates, {
  fillColor: '#FF5722',
  strokeColor: '#FF5722',
  fillOpacity: 0.2,
  strokeWeight: 4,
});
```

### 사용 가능한 프리셋

```typescript
PolygonPresets.cyan    // 청록색 (기본)
PolygonPresets.blue    // 파란색
PolygonPresets.green   // 녹색
PolygonPresets.red     // 빨간색
PolygonPresets.yellow  // 노란색
PolygonPresets.purple  // 보라색
```

---

## 📍 2. MapMarker 사용법

### 기본 사용

```typescript
import {
  createMarker,
  createMarkerIcon,
  updateMarkerSelection
} from './components/MapMarker';

// 방법 1: createMarker 헬퍼 함수 (일반 마커)
const marker = createMarker(
  map,
  { lat: 33.2829905, lng: -111.5539719 },
  false  // selected = false (청록색 큐브)
);

// 방법 2: createMarker 헬퍼 함수 (선택된 마커)
const selectedMarker = createMarker(
  map,
  { lat: 33.2829905, lng: -111.5539719 },
  true  // selected = true (빨간 핀)
);
```

### 마커 선택 상태 변경

```typescript
import { updateMarkerSelection } from './components/MapMarker';

// 마커를 선택 상태로 변경 (큐브 → 핀)
updateMarkerSelection(marker, true);

// 마커를 일반 상태로 변경 (핀 → 큐브)
updateMarkerSelection(marker, false);
```

### 마커 클릭 이벤트로 선택 상태 토글

```typescript
import { createMarker, updateMarkerSelection } from './components/MapMarker';

let selectedMarker: google.maps.Marker | null = null;

const marker = createMarker(map, position, false);

marker.addListener('click', () => {
  // 이전에 선택된 마커가 있으면 선택 해제
  if (selectedMarker && selectedMarker !== marker) {
    updateMarkerSelection(selectedMarker, false);
  }

  // 현재 마커 선택
  updateMarkerSelection(marker, true);
  selectedMarker = marker;
});
```

### 아이콘만 가져오기

```typescript
import { createMarkerIcon, MarkerPresets } from './components/MapMarker';

// 직접 아이콘 생성
const marker = new google.maps.Marker({
  position: { lat: 33.2829905, lng: -111.5539719 },
  map: map,
  icon: createMarkerIcon({ selected: false }),
});

// 프리셋 사용
const marker2 = new google.maps.Marker({
  position: { lat: 33.2829905, lng: -111.5539719 },
  map: map,
  icon: MarkerPresets.cube,  // 청록색 큐브
});
```

### 커스텀 색상 큐브 마커

```typescript
import { createCustomCubeIcon } from './components/MapMarker';

const marker = new google.maps.Marker({
  position: { lat: 33.2829905, lng: -111.5539719 },
  map: map,
  icon: createCustomCubeIcon('#4CAF50', 32),  // 녹색 큐브
});
```

---

## 🔥 3. 실전 예제

### App.tsx에서 통합 사용

```typescript
import { useEffect, useRef, useState } from 'react';
import { createPolygon } from './components/MapPolygon';
import { createMarker, updateMarkerSelection } from './components/MapMarker';

function App() {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<google.maps.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // 1. 폴리곤 생성 (영역 표시)
    const areaPolygon = createPolygon(map, [
      { lat: 33.2829905, lng: -111.5539719 },
      { lat: 33.2829747, lng: -111.5512963 },
      { lat: 33.2800504, lng: -111.5539479 },
      { lat: 33.2800301, lng: -111.5512648 },
    ]);

    // 2. 마커 생성 및 클릭 이벤트
    const positions = [
      { lat: 33.2820, lng: -111.5530 },
      { lat: 33.2815, lng: -111.5525 },
      { lat: 33.2810, lng: -111.5520 },
    ];

    positions.forEach(position => {
      const marker = createMarker(map, position, false);

      marker.addListener('click', () => {
        // 이전 선택 마커 해제
        if (selectedMarker) {
          updateMarkerSelection(selectedMarker, false);
        }

        // 현재 마커 선택
        updateMarkerSelection(marker, true);
        setSelectedMarker(marker);
      });
    });
  }, []);

  return <div id="map" style={{ width: '100%', height: '100vh' }} />;
}
```

### 여러 구역을 다른 색상으로 표시

```typescript
import { PolygonPresets } from './components/MapPolygon';

// 구역 1: 청록색
const zone1 = new google.maps.Polygon({
  paths: coordinates1,
  map: map,
  ...PolygonPresets.cyan,
});

// 구역 2: 파란색
const zone2 = new google.maps.Polygon({
  paths: coordinates2,
  map: map,
  ...PolygonPresets.blue,
});

// 구역 3: 녹색
const zone3 = new google.maps.Polygon({
  paths: coordinates3,
  map: map,
  ...PolygonPresets.green,
});
```

### 마커 그룹 관리

```typescript
import { createMarker, updateMarkerSelection } from './components/MapMarker';

class MarkerGroup {
  private markers: google.maps.Marker[] = [];
  private selectedMarker: google.maps.Marker | null = null;

  addMarker(map: google.maps.Map, position: { lat: number; lng: number }) {
    const marker = createMarker(map, position, false);

    marker.addListener('click', () => {
      this.selectMarker(marker);
    });

    this.markers.push(marker);
    return marker;
  }

  selectMarker(marker: google.maps.Marker) {
    // 이전 선택 해제
    if (this.selectedMarker) {
      updateMarkerSelection(this.selectedMarker, false);
    }

    // 새 마커 선택
    updateMarkerSelection(marker, true);
    this.selectedMarker = marker;
  }

  clearSelection() {
    if (this.selectedMarker) {
      updateMarkerSelection(this.selectedMarker, false);
      this.selectedMarker = null;
    }
  }

  removeAllMarkers() {
    this.markers.forEach(marker => marker.setMap(null));
    this.markers = [];
    this.selectedMarker = null;
  }
}

// 사용
const markerGroup = new MarkerGroup();
markerGroup.addMarker(map, { lat: 33.2820, lng: -111.5530 });
markerGroup.addMarker(map, { lat: 33.2815, lng: -111.5525 });
```

---

## 🎯 4. 주요 기능

### MapPolygon
- ✅ 이미지 기반 청록색 디자인
- ✅ 6가지 색상 프리셋 제공
- ✅ 커스텀 스타일 지원
- ✅ 헬퍼 함수로 간편한 생성

### MapMarker
- ✅ 일반/선택 두 가지 상태
- ✅ 3D Isometric 큐브 디자인
- ✅ Google Maps 스타일 핀 디자인
- ✅ 상태 변경 함수 제공
- ✅ 커스텀 색상 지원
- ✅ 선택 시 z-index 자동 조정

---

## 📝 API 레퍼런스

### MapPolygon

#### `createPolygonStyle(options?: PolygonStyleOptions): google.maps.PolygonOptions`
폴리곤 스타일 옵션 객체 생성

#### `createPolygon(map, coordinates, styleOptions?): google.maps.Polygon`
폴리곤 생성 및 맵에 추가

#### `PolygonPresets`
사전 정의된 색상 프리셋 객체

---

### MapMarker

#### `createMarkerIcon(options?: MarkerIconOptions): google.maps.Icon`
마커 아이콘 생성

#### `createMarker(map, position, selected?, options?): google.maps.Marker`
마커 생성 및 맵에 추가

#### `updateMarkerSelection(marker, selected): void`
마커 선택 상태 변경

#### `createCustomCubeIcon(color, size?): google.maps.Icon`
커스텀 색상 큐브 아이콘 생성

#### `MarkerPresets`
사전 정의된 아이콘 프리셋 객체

---

## 🚀 팁

1. **성능 최적화**: 많은 마커를 생성할 때는 MarkerClusterer 사용 고려
2. **메모리 관리**: 사용하지 않는 폴리곤/마커는 `setMap(null)`로 제거
3. **선택 상태 관리**: 단일 선택만 허용하려면 이전 선택을 명시적으로 해제
4. **색상 일관성**: 프리셋 사용으로 디자인 일관성 유지
5. **접근성**: 마커에 title 속성 추가로 접근성 향상

```typescript
const marker = createMarker(map, position, false, {
  title: '배송 거점 1',
  draggable: true,
});
```
