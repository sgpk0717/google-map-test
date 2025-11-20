# Google Maps 커스텀 기능 구현 가이드

> 내부망 환경에서 Google Maps를 사용한 지도 기능 구현을 위한 실무 코드 가이드

---

## 📋 목차

1. [사전 준비](#1-사전-준비)
2. [좌표 중심점 계산 및 지도 이동 (100m 축적)](#2-좌표-중심점-계산-및-지도-이동-100m-축적)
3. [Convex Hull 폴리곤 그리기](#3-convex-hull-폴리곤-그리기)
4. [폴리곤 커스텀 스타일 적용](#4-폴리곤-커스텀-스타일-적용)
5. [마커 생성 및 커스텀 아이콘](#5-마커-생성-및-커스텀-아이콘)
6. [지도 클릭으로 좌표 누적 입력](#6-지도-클릭으로-좌표-누적-입력)
7. [전체 예제 코드](#7-전체-예제-코드)
8. [주의사항 및 트러블슈팅](#8-주의사항-및-트러블슈팅)

---

## 1. 사전 준비

### 1.1 HTML에 Google Maps API 로드

```html
<!DOCTYPE html>
<html>
  <head>
    <script
      src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&language=ko"
      async
      defer
    ></script>
  </head>
  <body>
    <div id="map" style="width: 100%; height: 100vh;"></div>
  </body>
</html>
```

### 1.2 TypeScript 타입 정의

```typescript
// 좌표 타입 정의
interface Coordinate {
  lat: number;  // 위도
  lng: number;  // 경도
}

// React Component에서 필요한 state 선언
import { useEffect, useRef, useState } from 'react';

const [map, setMap] = useState<google.maps.Map | null>(null);
const [polygons, setPolygons] = useState<google.maps.Polygon[]>([]);
const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
const [clickedCoords, setClickedCoords] = useState<Coordinate[]>([]);
const [isClickMode, setIsClickMode] = useState(false);
const mapRef = useRef<HTMLDivElement>(null);
```

### 1.3 Google Maps API 초기화

```typescript
useEffect(() => {
  const initMap = async () => {
    // Google Maps API가 로드될 때까지 대기
    // async defer로 로드했기 때문에 window.google가 준비될 때까지 기다려야 함
    while (!window.google || !window.google.maps) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 지도 생성
    if (mapRef.current && !map) {
      const newMap = new google.maps.Map(mapRef.current, {
        center: { lat: 37.5665, lng: 126.978 }, // 초기 중심점 (서울 시청)
        zoom: 12, // 초기 줌 레벨
      });
      setMap(newMap);
      console.log('지도 생성 완료');
    }
  };

  initMap();
}, []); // 빈 배열: 컴포넌트 마운트 시 1회만 실행
```

**주의**: `async defer`로 스크립트를 로드하면 비동기로 로드되므로, while 루프로 API가 준비될 때까지 기다려야 합니다.

---

## 2. 좌표 중심점 계산 및 지도 이동 (100m 축적)

### 2.1 기능 설명
- 여러 좌표의 중심점을 계산
- 해당 중심점으로 지도 이동
- Zoom level 16 = 약 100m 축적

### 2.2 완전한 코드

```typescript
/**
 * 좌표 배열의 중심점을 계산하고 지도를 해당 위치로 이동
 * 100m 축적(zoom 16)으로 설정
 *
 * @param coordinates - 좌표 배열 (최소 1개 이상)
 */
const setAreaAndMove = (coordinates: Coordinate[]) => {
  if (!map) {
    console.error('지도가 초기화되지 않았습니다');
    return;
  }

  if (coordinates.length === 0) {
    console.error('좌표가 없습니다');
    return;
  }

  // 1. 경계(Bounds) 계산
  // 모든 좌표를 포함하는 최소 영역을 계산
  const bounds = new google.maps.LatLngBounds();
  coordinates.forEach(coord => bounds.extend(coord));

  // 2. 중심점 계산
  // 모든 좌표의 평균값으로 중심점 계산
  const latSum = coordinates.reduce((sum, c) => sum + c.lat, 0);
  const lngSum = coordinates.reduce((sum, c) => sum + c.lng, 0);
  const center = {
    lat: latSum / coordinates.length,
    lng: lngSum / coordinates.length
  };

  // 3. 지도 이동
  // fitBounds: 모든 좌표가 화면에 들어오도록 자동 줌 조정
  map.fitBounds(bounds);

  // setTimeout을 사용하는 이유:
  // fitBounds가 비동기로 동작하므로, 즉시 setZoom을 호출하면 무시됨
  // 300ms 대기 후 중심점과 줌 레벨을 강제로 설정
  setTimeout(() => {
    map.setCenter(center);
    map.setZoom(16); // Zoom 16 = 약 100m 축적
  }, 300);

  console.log('영역 세팅 완료:', center);
};

// 사용 예제
const exampleCoords = [
  { lat: 33.2829905, lng: -111.5539719 },
  { lat: 33.2829747, lng: -111.5512963 },
  { lat: 33.2800504, lng: -111.5539479 },
  { lat: 33.2800301, lng: -111.5512648 },
];

// 버튼 클릭 시 실행
const handleSetArea = () => {
  setAreaAndMove(exampleCoords);
};
```

**Google Maps Zoom Level 참고:**
- Zoom 15: 약 200m
- **Zoom 16: 약 100m** ← 사용
- Zoom 17: 약 50m
- Zoom 18: 약 25m

---

## 3. Convex Hull 폴리곤 그리기

### 3.1 기능 설명
- 순서와 관계없이 입력된 좌표들의 볼록 껍질(Convex Hull) 계산
- Graham Scan 알고리즘 사용 (시간 복잡도: O(n log n))
- 항상 볼록한(convex) 다각형 생성

### 3.2 Convex Hull 알고리즘 구현

```typescript
/**
 * Convex Hull 계산 함수 (Graham Scan 알고리즘)
 *
 * @param points - 좌표 배열 (순서 무관)
 * @returns 볼록 껍질을 이루는 좌표 배열 (반시계 방향 정렬)
 */
const computeConvexHull = (points: Coordinate[]): Coordinate[] => {
  // 3개 미만이면 그대로 반환
  if (points.length < 3) return points;

  // 1단계: 가장 아래쪽/왼쪽 점 찾기
  // 이 점이 Convex Hull에 반드시 포함되므로 기준점(pivot)으로 사용
  let lowest = 0;
  for (let i = 1; i < points.length; i++) {
    // 위도(lat)가 작을수록 아래쪽
    // 위도가 같으면 경도(lng)가 작은 쪽을 선택
    if (points[i].lat < points[lowest].lat ||
        (points[i].lat === points[lowest].lat && points[i].lng < points[lowest].lng)) {
      lowest = i;
    }
  }

  // 기준점 분리
  const p0 = points[lowest];
  const others = points.filter((_, i) => i !== lowest);

  // 2단계: 극각(polar angle) 순으로 정렬
  // 기준점에서 각 점까지의 각도를 계산하여 반시계방향으로 정렬
  const sorted = others.sort((a, b) => {
    // atan2: 아크탄젠트 함수, 각도 계산
    const angleA = Math.atan2(a.lat - p0.lat, a.lng - p0.lng);
    const angleB = Math.atan2(b.lat - p0.lat, b.lng - p0.lng);

    if (angleA !== angleB) {
      return angleA - angleB;
    }

    // 각도가 같으면 거리가 가까운 순으로 정렬
    const distA = Math.hypot(a.lat - p0.lat, a.lng - p0.lng);
    const distB = Math.hypot(b.lat - p0.lat, b.lng - p0.lng);
    return distA - distB;
  });

  // 3단계: Convex Hull 구성
  // 스택을 사용하여 왼쪽으로 꺾이는 점들만 유지
  const hull = [p0, sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    // 오른쪽으로 꺾이는 점들 제거
    // cross product가 0 이하면 오른쪽으로 꺾이거나 일직선
    while (hull.length > 1 &&
           cross(hull[hull.length - 2], hull[hull.length - 1], sorted[i]) <= 0) {
      hull.pop();
    }
    hull.push(sorted[i]);
  }

  return hull;
};

/**
 * 외적(cross product) 계산 - 세 점의 방향 판별
 *
 * @returns 양수: 왼쪽으로 꺾임 (반시계), 0: 일직선, 음수: 오른쪽으로 꺾임 (시계)
 */
const cross = (O: Coordinate, A: Coordinate, B: Coordinate): number => {
  // 벡터 OA와 OB의 외적
  // (A - O) × (B - O) = (A.lng - O.lng) * (B.lat - O.lat) - (A.lat - O.lat) * (B.lng - O.lng)
  return (A.lng - O.lng) * (B.lat - O.lat) - (A.lat - O.lat) * (B.lng - O.lng);
};
```

### 3.3 Convex Hull로 폴리곤 생성

```typescript
/**
 * 좌표 배열로 Convex Hull 폴리곤 생성
 *
 * @param coordinates - 원본 좌표 배열 (순서 무관)
 * @param color - 폴리곤 색상 (hex)
 */
const createConvexHullPolygon = (
  coordinates: Coordinate[],
  color: string = '#FF6B6B'
) => {
  if (!map) {
    console.error('지도가 초기화되지 않았습니다');
    return null;
  }

  if (coordinates.length < 3) {
    alert('폴리곤을 그리려면 최소 3개의 좌표가 필요합니다.');
    return null;
  }

  // Convex Hull 계산
  const hullCoords = computeConvexHull(coordinates);
  console.log(`Convex Hull 계산: ${coordinates.length}개 → ${hullCoords.length}개`);

  // 폴리곤 생성
  const polygon = new google.maps.Polygon({
    paths: hullCoords,           // Convex Hull 좌표
    strokeColor: color,          // 테두리 색상
    strokeOpacity: 0.8,          // 테두리 불투명도
    strokeWeight: 2,             // 테두리 두께
    fillColor: color,            // 채우기 색상
    fillOpacity: 0.35,           // 채우기 불투명도
    clickable: false,            // ⚠️ 중요: 폴리곤 클릭 비활성화 (지도 클릭이 동작하도록)
    map: map,                    // 폴리곤을 표시할 지도
  });

  return polygon;
};

// 사용 예제
const handleShowZone = () => {
  const coords = [
    { lat: 33.283, lng: -111.554 },
    { lat: 33.282, lng: -111.551 },
    { lat: 33.280, lng: -111.554 },
    { lat: 33.280, lng: -111.551 },
  ];

  const polygon = createConvexHullPolygon(coords, '#4ECDC4');

  if (polygon) {
    // 생성된 폴리곤을 배열에 저장 (나중에 제거 가능)
    setPolygons(prev => [...prev, polygon]);
  }
};
```

**중요**: `clickable: false`를 반드시 설정해야 폴리곤 위를 클릭해도 지도 클릭 이벤트가 정상 동작합니다.

---

## 4. 폴리곤 커스텀 스타일 적용

### 4.1 다양한 폴리곤 스타일 예제

```typescript
/**
 * 폴리곤 스타일 프리셋
 */
const POLYGON_STYLES = {
  // 반투명 빨강
  danger: {
    strokeColor: '#FF6B6B',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#FF6B6B',
    fillOpacity: 0.35,
    clickable: false,
  },

  // 반투명 청록
  info: {
    strokeColor: '#4ECDC4',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#4ECDC4',
    fillOpacity: 0.35,
    clickable: false,
  },

  // 반투명 파랑
  primary: {
    strokeColor: '#45B7D1',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#45B7D1',
    fillOpacity: 0.35,
    clickable: false,
  },

  // 굵은 테두리 + 반투명 노랑
  warning: {
    strokeColor: '#F7DC6F',
    strokeOpacity: 1.0,
    strokeWeight: 4,
    fillColor: '#F7DC6F',
    fillOpacity: 0.2,
    clickable: false,
  },

  // 점선 테두리 + 투명
  outline: {
    strokeColor: '#333333',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#333333',
    fillOpacity: 0.05,
    clickable: false,
  },
};

// 사용 예제
const createStyledPolygon = (coords: Coordinate[], styleName: keyof typeof POLYGON_STYLES) => {
  const hullCoords = computeConvexHull(coords);

  return new google.maps.Polygon({
    paths: hullCoords,
    ...POLYGON_STYLES[styleName],
    map: map,
  });
};

// 호출
const dangerZone = createStyledPolygon(coordinates, 'danger');
const infoZone = createStyledPolygon(coordinates, 'info');
```

### 4.2 동적 색상 변경

```typescript
/**
 * 이미 생성된 폴리곤의 색상 동적 변경
 */
const changePolygonColor = (polygon: google.maps.Polygon, newColor: string) => {
  polygon.setOptions({
    strokeColor: newColor,
    fillColor: newColor,
  });
};

// 사용 예제
const polygon = createConvexHullPolygon(coords, '#FF6B6B');

// 3초 후 색상 변경
setTimeout(() => {
  if (polygon) {
    changePolygonColor(polygon, '#4ECDC4');
  }
}, 3000);
```

---

## 5. 마커 생성 및 커스텀 아이콘

### 5.1 기본 마커 생성

```typescript
/**
 * 기본 마커 생성
 */
const createBasicMarker = (coordinate: Coordinate) => {
  if (!map) return null;

  const marker = new google.maps.Marker({
    position: coordinate,
    map: map,
  });

  return marker;
};
```

### 5.2 커스텀 SVG 아이콘 마커

```typescript
/**
 * 커스텀 SVG 아이콘으로 마커 생성
 * 4가지 스타일 지원: pin(핀), circle(원), square(사각), star(별)
 */
const createCustomMarker = (
  coordinate: Coordinate,
  style: 'pin' | 'circle' | 'square' | 'star',
  color: string = '#FF6B6B'
) => {
  if (!map) {
    console.error('지도가 초기화되지 않았습니다');
    return null;
  }

  let icon;

  if (style === 'pin') {
    // 스타일 1: 물방울 모양의 핀 (티어드롭)
    icon = {
      // SVG path: 물방울 모양 + 내부 원형 디테일
      path: 'M 0,-30 C -8,-30 -15,-23 -15,-15 C -15,-8 -8,0 0,10 C 8,0 15,-8 15,-15 C 15,-23 8,-30 0,-30 Z M 0,-20 C -3,-20 -5,-18 -5,-15 C -5,-12 -3,-10 0,-10 C 3,-10 5,-12 5,-15 C 5,-18 3,-20 0,-20 Z',
      fillColor: color,
      fillOpacity: 0.9,
      strokeColor: '#ffffff',   // 흰색 테두리
      strokeWeight: 3,
      scale: 1.2,               // 크기 조정
      anchor: new google.maps.Point(0, 10),  // 앵커: 핀의 끝점
    };
  } else if (style === 'circle') {
    // 스타일 2: 3중 동심원
    icon = {
      // SVG path: 외곽원 + 중간원 + 중심점
      path: 'M 0,0 m -12,0 a 12,12 0 1,0 24,0 a 12,12 0 1,0 -24,0 M 0,0 m -8,0 a 8,8 0 1,0 16,0 a 8,8 0 1,0 -16,0 M 0,0 m -3,0 a 3,3 0 1,0 6,0 a 3,3 0 1,0 -6,0',
      fillColor: color,
      fillOpacity: 0.85,
      strokeColor: '#ffffff',
      strokeWeight: 2.5,
      scale: 1.5,
      anchor: new google.maps.Point(0, 0),  // 앵커: 중심
    };
  } else if (style === 'square') {
    // 스타일 3: 3D 큐브 모양
    icon = {
      // SVG path: 등각투상도 큐브
      path: 'M 0,-10 L 8,-5 L 8,5 L 0,10 L -8,5 L -8,-5 Z M 0,-10 L 0,0 M 8,-5 L 0,0 M -8,-5 L 0,0 M 0,0 L 0,10 M -8,5 L 0,10 M 8,5 L 0,10',
      fillColor: color,
      fillOpacity: 0.9,
      strokeColor: '#ffffff',
      strokeWeight: 2.5,
      scale: 1.3,
      anchor: new google.maps.Point(0, 10),
    };
  } else {
    // 스타일 4: 이중 별 구조
    icon = {
      // SVG path: 큰 별 + 작은 별 중첩
      path: 'M 0,-15 L 4,-4 L 15,-4 L 6,3 L 10,14 L 0,7 L -10,14 L -6,3 L -15,-4 L -4,-4 Z M 0,-8 L 2,-3 L 7,-3 L 3,0 L 5,5 L 0,2 L -5,5 L -3,0 L -7,-3 L -2,-3 Z',
      fillColor: color,
      fillOpacity: 0.95,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 1.2,
      anchor: new google.maps.Point(0, 7),
    };
  }

  // 마커 생성
  const marker = new google.maps.Marker({
    position: coordinate,
    map: map,
    icon: icon,
  });

  console.log(`${style} 마커 생성 완료:`, coordinate);
  return marker;
};

// 사용 예제
const showMarkers = () => {
  const coord = { lat: 33.283, lng: -111.554 };

  // 4가지 스타일로 마커 생성
  const pinMarker = createCustomMarker(coord, 'pin', '#FF6B6B');
  const circleMarker = createCustomMarker(coord, 'circle', '#4ECDC4');
  const squareMarker = createCustomMarker(coord, 'square', '#45B7D1');
  const starMarker = createCustomMarker(coord, 'star', '#F7DC6F');

  // 생성된 마커 저장
  setMarkers([pinMarker, circleMarker, squareMarker, starMarker]);
};
```

### 5.3 SVG Path 커스터마이징 가이드

SVG Path 문법 기본:
- `M x,y`: 이동 (Move)
- `L x,y`: 직선 (Line)
- `C x1,y1 x2,y2 x,y`: 베지어 곡선
- `Z`: 경로 닫기

온라인 SVG 편집기를 사용하면 복잡한 아이콘을 쉽게 만들 수 있습니다:
- https://yqnn.github.io/svg-path-editor/
- 위 사이트에서 path를 그린 후 복사하여 사용

---

## 6. 지도 클릭으로 좌표 누적 입력

### 6.1 완전한 코드

```typescript
/**
 * 지도 클릭 이벤트로 좌표 누적 입력
 * useEffect cleanup으로 메모리 누수 방지
 */
const [isClickMode, setIsClickMode] = useState(false);
const [clickedCoords, setClickedCoords] = useState<Coordinate[]>([]);

useEffect(() => {
  if (!map) return;

  // 클릭 모드가 활성화되어 있을 때만 이벤트 리스너 등록
  if (isClickMode) {
    // 지도 클릭 이벤트 리스너 등록
    const listener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        // 클릭한 위치의 좌표 추출
        const newCoord = {
          lat: e.latLng.lat(),
          lng: e.latLng.lng()
        };

        // 좌표 배열에 추가 (기존 배열 유지)
        setClickedCoords(prev => [...prev, newCoord]);
        console.log('좌표 추가:', newCoord);
      }
    });

    // cleanup 함수: 컴포넌트 언마운트 또는 의존성 변경 시 실행
    // 이벤트 리스너를 제거하여 메모리 누수 방지
    return () => {
      google.maps.event.removeListener(listener);
      console.log('이벤트 리스너 제거');
    };
  }
}, [map, isClickMode]); // map 또는 isClickMode가 변경될 때마다 재실행

// 클릭 모드 토글 함수
const toggleClickMode = () => {
  setIsClickMode(!isClickMode);
};

// 누적된 좌표 초기화
const clearClickedCoords = () => {
  setClickedCoords([]);
};

// 누적된 좌표로 폴리곤 생성
const createPolygonFromClicks = () => {
  if (clickedCoords.length < 3) {
    alert('최소 3개의 좌표가 필요합니다');
    return;
  }

  const polygon = createConvexHullPolygon(clickedCoords, '#FF6B6B');

  if (polygon) {
    setPolygons(prev => [...prev, polygon]);
    setIsClickMode(false); // 폴리곤 생성 후 클릭 모드 자동 해제
    // clearClickedCoords(); // 필요시 좌표 초기화
  }
};
```

### 6.2 JSX 버튼 예제

```tsx
<button onClick={toggleClickMode}>
  {isClickMode ? '✅ 클릭 모드 활성화됨' : '📍 지도 클릭 모드'}
</button>

<button onClick={clearClickedCoords}>
  좌표 초기화 ({clickedCoords.length}개)
</button>

<button onClick={createPolygonFromClicks}>
  폴리곤 생성
</button>

{/* 클릭한 좌표 목록 표시 */}
<div>
  <h3>클릭한 좌표 ({clickedCoords.length}개)</h3>
  {clickedCoords.map((coord, index) => (
    <div key={index}>
      좌표 {index + 1}: {coord.lat.toFixed(6)}, {coord.lng.toFixed(6)}
    </div>
  ))}
</div>
```

---

## 7. 전체 예제 코드

### 7.1 완전한 React Component

```typescript
import { useEffect, useRef, useState } from 'react';

interface Coordinate {
  lat: number;
  lng: number;
}

function MapComponent() {
  // State
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [polygons, setPolygons] = useState<google.maps.Polygon[]>([]);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [clickedCoords, setClickedCoords] = useState<Coordinate[]>([]);
  const [isClickMode, setIsClickMode] = useState(false);

  // 1. 지도 초기화
  useEffect(() => {
    const initMap = async () => {
      while (!window.google || !window.google.maps) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (mapRef.current && !map) {
        const newMap = new google.maps.Map(mapRef.current, {
          center: { lat: 33.283, lng: -111.554 },
          zoom: 14,
        });
        setMap(newMap);
      }
    };

    initMap();
  }, []);

  // 2. 지도 클릭 이벤트
  useEffect(() => {
    if (!map || !isClickMode) return;

    const listener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const newCoord = {
          lat: e.latLng.lat(),
          lng: e.latLng.lng()
        };
        setClickedCoords(prev => [...prev, newCoord]);
      }
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map, isClickMode]);

  // 3. Convex Hull 계산
  const computeConvexHull = (points: Coordinate[]): Coordinate[] => {
    if (points.length < 3) return points;

    let lowest = 0;
    for (let i = 1; i < points.length; i++) {
      if (points[i].lat < points[lowest].lat ||
          (points[i].lat === points[lowest].lat && points[i].lng < points[lowest].lng)) {
        lowest = i;
      }
    }

    const p0 = points[lowest];
    const others = points.filter((_, i) => i !== lowest);

    const sorted = others.sort((a, b) => {
      const angleA = Math.atan2(a.lat - p0.lat, a.lng - p0.lng);
      const angleB = Math.atan2(b.lat - p0.lat, b.lng - p0.lng);
      if (angleA !== angleB) return angleA - angleB;
      const distA = Math.hypot(a.lat - p0.lat, a.lng - p0.lng);
      const distB = Math.hypot(b.lat - p0.lat, b.lng - p0.lng);
      return distA - distB;
    });

    const hull = [p0, sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      while (hull.length > 1 &&
             cross(hull[hull.length - 2], hull[hull.length - 1], sorted[i]) <= 0) {
        hull.pop();
      }
      hull.push(sorted[i]);
    }

    return hull;
  };

  const cross = (O: Coordinate, A: Coordinate, B: Coordinate): number => {
    return (A.lng - O.lng) * (B.lat - O.lat) - (A.lat - O.lat) * (B.lng - O.lng);
  };

  // 4. 영역 세팅 (중심 이동 + 100m 축적)
  const handleSetArea = () => {
    if (!map || clickedCoords.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    clickedCoords.forEach(coord => bounds.extend(coord));

    const latSum = clickedCoords.reduce((sum, c) => sum + c.lat, 0);
    const lngSum = clickedCoords.reduce((sum, c) => sum + c.lng, 0);
    const center = {
      lat: latSum / clickedCoords.length,
      lng: lngSum / clickedCoords.length
    };

    map.fitBounds(bounds);
    setTimeout(() => {
      map.setCenter(center);
      map.setZoom(16); // 100m 축적
    }, 300);
  };

  // 5. 폴리곤 생성
  const handleCreatePolygon = () => {
    if (!map || clickedCoords.length < 3) {
      alert('최소 3개의 좌표가 필요합니다');
      return;
    }

    const hullCoords = computeConvexHull(clickedCoords);

    const polygon = new google.maps.Polygon({
      paths: hullCoords,
      strokeColor: '#FF6B6B',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF6B6B',
      fillOpacity: 0.35,
      clickable: false,
      map: map,
    });

    setPolygons(prev => [...prev, polygon]);
    setIsClickMode(false);
  };

  // 6. 마커 생성
  const handleCreateMarker = () => {
    if (!map || clickedCoords.length === 0) return;

    const lastCoord = clickedCoords[clickedCoords.length - 1];

    const icon = {
      path: 'M 0,-30 C -8,-30 -15,-23 -15,-15 C -15,-8 -8,0 0,10 C 8,0 15,-8 15,-15 C 15,-23 8,-30 0,-30 Z M 0,-20 C -3,-20 -5,-18 -5,-15 C -5,-12 -3,-10 0,-10 C 3,-10 5,-12 5,-15 C 5,-18 3,-20 0,-20 Z',
      fillColor: '#4ECDC4',
      fillOpacity: 0.9,
      strokeColor: '#ffffff',
      strokeWeight: 3,
      scale: 1.2,
      anchor: new google.maps.Point(0, 10),
    };

    const marker = new google.maps.Marker({
      position: lastCoord,
      map: map,
      icon: icon,
    });

    setMarkers(prev => [...prev, marker]);
  };

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, background: 'white', padding: '10px' }}>
        <button onClick={() => setIsClickMode(!isClickMode)}>
          {isClickMode ? '✅ 클릭 모드 ON' : '📍 클릭 모드 OFF'}
        </button>
        <button onClick={handleSetArea}>영역 세팅 (100m)</button>
        <button onClick={handleCreatePolygon}>폴리곤 생성</button>
        <button onClick={handleCreateMarker}>마커 생성</button>
        <button onClick={() => setClickedCoords([])}>좌표 초기화</button>
        <div>클릭한 좌표: {clickedCoords.length}개</div>
      </div>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

export default MapComponent;
```

---

## 8. 주의사항 및 트러블슈팅

### 8.1 자주 발생하는 오류

#### 오류 1: "google is not defined"
```
원인: Google Maps API가 로드되기 전에 코드 실행
해결: while 루프로 API 로딩 대기 (위 코드 참고)
```

#### 오류 2: setTimeout 없이 setZoom이 무시됨
```
원인: fitBounds가 비동기로 동작
해결: setTimeout으로 300ms 대기 후 setCenter + setZoom 실행
```

#### 오류 3: 폴리곤 위 클릭이 안 됨
```
원인: 폴리곤의 clickable 기본값이 true
해결: clickable: false로 설정
```

#### 오류 4: useEffect cleanup 없이 메모리 누수
```
원인: 이벤트 리스너가 제거되지 않음
해결: return () => { google.maps.event.removeListener(listener); }
```

### 8.2 성능 최적화

```typescript
// ❌ 나쁜 예: 매번 새로운 폴리곤 생성
coordinates.forEach(coord => {
  new google.maps.Polygon({ paths: [coord], map: map });
});

// ✅ 좋은 예: 하나의 폴리곤에 여러 경로
const polygon = new google.maps.Polygon({
  paths: coordinates,
  map: map
});

// 폴리곤/마커 제거 시 반드시 setMap(null) 호출
polygon.setMap(null);
marker.setMap(null);
```

### 8.3 TypeScript 타입 에러 해결

```typescript
// index.html에서 API를 로드하면 window.google가 전역으로 선언됨
// TypeScript에서 인식하려면 타입 선언 필요

// src/global.d.ts 파일 생성
declare global {
  interface Window {
    google: typeof google;
  }
}

export {};
```

### 8.4 API 키 보안

```typescript
// ❌ 나쁜 예: 코드에 직접 하드코딩
const API_KEY = 'your_api_key_here';

// ✅ 좋은 예: 환경 변수 사용
const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

// .env 파일
REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### 8.5 좌표 정밀도

```typescript
// 위도/경도는 소수점 6자리까지가 약 0.1m 정밀도
const roundCoord = (coord: Coordinate): Coordinate => ({
  lat: Math.round(coord.lat * 1000000) / 1000000,
  lng: Math.round(coord.lng * 1000000) / 1000000,
});
```

---

## 9. 참고 자료

- [Google Maps JavaScript API 공식 문서](https://developers.google.com/maps/documentation/javascript)
- [Convex Hull 알고리즘 설명](https://en.wikipedia.org/wiki/Graham_scan)
- [SVG Path 편집기](https://yqnn.github.io/svg-path-editor/)
- [Google Maps Zoom Level 표](https://wiki.openstreetmap.org/wiki/Zoom_levels)

---

**작성일**: 2025-11-20
**버전**: 1.0
**테스트 환경**: React 18 + TypeScript + Google Maps JavaScript API
