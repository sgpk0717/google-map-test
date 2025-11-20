/**
 * Google Maps 커스텀 기능 샘플 코드
 *
 * 주요 기능:
 * 1. 영역 세팅: 좌표 중심 이동 + 100m 축적
 * 2. 구역 세팅: 지도 클릭 → Convex Hull 폴리곤 생성
 * 3. 마커 세팅: 지도 클릭 → 커스텀 아이콘 마커 생성
 */

import { useEffect, useState, useRef } from 'react';
import styled from '@emotion/styled';
import './App.css';

// ============================================================================
// 타입 정의
// ============================================================================

/**
 * 좌표 타입
 */
interface Coordinate {
  lat: number; // 위도
  lng: number; // 경도
}

/**
 * 마커 스타일 타입
 */
type MarkerStyleType = 'pin' | 'circle' | 'square' | 'star';

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled.div`
  display: flex;
  width: 100%;
  height: 100vh;
`;

const LeftPanel = styled.div`
  width: 400px;
  height: 100%;
  background-color: #f5f5f5;
  padding: 20px;
  overflow-y: auto;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
`;

const MapContainer = styled.div`
  flex: 1;
  height: 100%;
`;

const MapDiv = styled.div`
  width: 100%;
  height: 100%;
`;

const Title = styled.h2`
  font-size: 20px;
  margin-bottom: 15px;
  color: #333;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
  font-size: 14px;
`;

const Input = styled.input`
  width: 48%;
  padding: 8px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  color: #333;
  font-size: 14px;

  &:first-of-type {
    margin-right: 4%;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 12px;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 10px;
`;

const CoordInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
`;

const DeleteButton = styled.button`
  padding: 8px 12px;
  background-color: #ff4444;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
`;

const AddButton = styled.button`
  width: 100%;
  padding: 10px;
  background-color: white;
  color: #667eea;
  border: 2px dashed #667eea;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 10px;
`;

const ToggleButton = styled.button<{ active: boolean }>`
  width: 100%;
  padding: 12px;
  background-color: ${props => props.active ? '#28a745' : '#667eea'};
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  margin-bottom: 15px;
`;

const ColorPicker = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 15px;
  flex-wrap: wrap;
`;

const ColorButton = styled.button<{ color: string; selected: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${props => props.color};
  border: 3px solid ${props => props.selected ? '#333' : 'white'};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  cursor: pointer;
`;

const StylePicker = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
`;

const StyleButton = styled.button<{ selected: boolean }>`
  flex: 1;
  padding: 12px;
  background-color: ${props => props.selected ? '#667eea' : 'white'};
  color: ${props => props.selected ? 'white' : '#333'};
  border: 2px solid ${props => props.selected ? '#667eea' : '#ddd'};
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
`;

const Divider = styled.div`
  height: 1px;
  background-color: #ddd;
  margin: 30px 0;
`;

// ============================================================================
// 메인 컴포넌트
// ============================================================================

function App() {
  // --------------------------------------------------------------------------
  // State 선언
  // --------------------------------------------------------------------------

  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // 영역 세팅: 기본 좌표 4개 (애리조나)
  const [areaCoords, setAreaCoords] = useState<Coordinate[]>([
    { lat: 33.2829905, lng: -111.5539719 },
    { lat: 33.2829747, lng: -111.5512963 },
    { lat: 33.2800504, lng: -111.5539479 },
    { lat: 33.2800301, lng: -111.5512648 },
  ]);

  // 구역 세팅: 좌표 배열, 색상, 폴리곤 배열, 클릭 모드
  const [zoneCoords, setZoneCoords] = useState<Coordinate[]>([
    { lat: 37.5665, lng: 126.978 },
    { lat: 37.5700, lng: 126.985 },
    { lat: 37.5630, lng: 126.990 },
  ]);
  const [zoneColor, setZoneColor] = useState('#FF6B6B');
  const [polygons, setPolygons] = useState<google.maps.Polygon[]>([]);
  const [isZoneClickMode, setIsZoneClickMode] = useState(false);

  // 마커 세팅: 좌표, 스타일, 색상, 마커 배열, 클릭 모드
  const [markerCoord, setMarkerCoord] = useState<Coordinate>({ lat: 37.5665, lng: 126.978 });
  const [markerStyle, setMarkerStyle] = useState<MarkerStyleType>('pin');
  const [markerColor, setMarkerColor] = useState('#FF6B6B');
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [isMarkerClickMode, setIsMarkerClickMode] = useState(false);

  // 색상 팔레트
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];

  // --------------------------------------------------------------------------
  // Google Maps 초기화
  // --------------------------------------------------------------------------

  useEffect(() => {
    /**
     * 지도 초기화 함수
     * Google Maps API가 로드될 때까지 대기한 후 지도 생성
     */
    const initMap = async () => {
      // async defer로 로드된 API가 준비될 때까지 대기
      while (!window.google || !window.google.maps) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // 지도 생성 (1회만)
      if (mapRef.current && !map) {
        const newMap = new google.maps.Map(mapRef.current, {
          center: { lat: 37.5665, lng: 126.978 }, // 서울 시청
          zoom: 12,
        });
        setMap(newMap);
        console.log('✅ 지도 초기화 완료');
      }
    };

    initMap();
  }, []); // 빈 배열: 컴포넌트 마운트 시 1회만 실행

  // --------------------------------------------------------------------------
  // 지도 클릭 이벤트 리스너
  // --------------------------------------------------------------------------

  useEffect(() => {
    if (!map) return;

    // 구역 또는 마커 클릭 모드가 활성화된 경우
    if (isZoneClickMode || isMarkerClickMode) {
      const listener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          const newCoord: Coordinate = {
            lat: e.latLng.lat(),
            lng: e.latLng.lng()
          };

          if (isZoneClickMode) {
            // 구역 클릭 모드: 좌표 누적
            setZoneCoords(prev => [...prev, newCoord]);
            console.log('📍 구역 좌표 추가:', newCoord);
          } else if (isMarkerClickMode) {
            // 마커 클릭 모드: 좌표 1개만 선택 후 모드 해제
            setMarkerCoord(newCoord);
            setIsMarkerClickMode(false);
            console.log('📍 마커 좌표 선택:', newCoord);
          }
        }
      });

      // cleanup: 이벤트 리스너 제거 (메모리 누수 방지)
      return () => {
        google.maps.event.removeListener(listener);
      };
    }
  }, [map, isZoneClickMode, isMarkerClickMode]);

  // --------------------------------------------------------------------------
  // Convex Hull 알고리즘
  // --------------------------------------------------------------------------

  /**
   * Convex Hull 계산 (Graham Scan 알고리즘)
   *
   * @param points - 좌표 배열 (순서 무관)
   * @returns 볼록 껍질을 이루는 좌표 배열 (반시계 방향)
   */
  const computeConvexHull = (points: Coordinate[]): Coordinate[] => {
    if (points.length < 3) return points;

    // 1단계: 가장 아래쪽/왼쪽 점 찾기 (기준점)
    let lowest = 0;
    for (let i = 1; i < points.length; i++) {
      if (points[i].lat < points[lowest].lat ||
          (points[i].lat === points[lowest].lat && points[i].lng < points[lowest].lng)) {
        lowest = i;
      }
    }

    const p0 = points[lowest];
    const others = points.filter((_, i) => i !== lowest);

    // 2단계: 극각(polar angle) 순으로 정렬
    const sorted = others.sort((a, b) => {
      const angleA = Math.atan2(a.lat - p0.lat, a.lng - p0.lng);
      const angleB = Math.atan2(b.lat - p0.lat, b.lng - p0.lng);
      if (angleA !== angleB) return angleA - angleB;

      // 각도가 같으면 거리순
      const distA = Math.hypot(a.lat - p0.lat, a.lng - p0.lng);
      const distB = Math.hypot(b.lat - p0.lat, b.lng - p0.lng);
      return distA - distB;
    });

    // 3단계: Convex Hull 구성 (왼쪽으로 꺾이는 점만 유지)
    const hull = [p0, sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      // 오른쪽으로 꺾이면 제거
      while (hull.length > 1 && cross(hull[hull.length - 2], hull[hull.length - 1], sorted[i]) <= 0) {
        hull.pop();
      }
      hull.push(sorted[i]);
    }

    return hull;
  };

  /**
   * 외적(cross product) 계산
   * 세 점의 방향 판별: 양수(왼쪽), 0(일직선), 음수(오른쪽)
   */
  const cross = (O: Coordinate, A: Coordinate, B: Coordinate): number => {
    return (A.lng - O.lng) * (B.lat - O.lat) - (A.lat - O.lat) * (B.lng - O.lng);
  };

  // --------------------------------------------------------------------------
  // 영역 세팅 기능
  // --------------------------------------------------------------------------

  /**
   * 영역 세팅: 좌표 중심으로 이동 + 100m 축적
   */
  const handleSetArea = () => {
    if (!map) return;

    if (areaCoords.length < 3) {
      alert('영역을 표시하려면 최소 3개의 좌표가 필요합니다.');
      return;
    }

    // 경계 계산 (모든 좌표 포함)
    const bounds = new google.maps.LatLngBounds();
    areaCoords.forEach(coord => bounds.extend(coord));

    // 중심점 계산
    const latSum = areaCoords.reduce((sum, c) => sum + c.lat, 0);
    const lngSum = areaCoords.reduce((sum, c) => sum + c.lng, 0);
    const center = {
      lat: latSum / areaCoords.length,
      lng: lngSum / areaCoords.length
    };

    // 지도 이동
    map.fitBounds(bounds);
    setTimeout(() => {
      map.setCenter(center);
      map.setZoom(16); // Zoom 16 = 약 100m 축적
    }, 300);

    console.log('✅ 영역 세팅 완료:', center);
  };

  // 영역 좌표 추가
  const addAreaCoord = () => {
    setAreaCoords([...areaCoords, { lat: 0, lng: 0 }]);
  };

  // 영역 좌표 삭제
  const removeAreaCoord = (index: number) => {
    setAreaCoords(areaCoords.filter((_, i) => i !== index));
  };

  // 영역 좌표 수정
  const updateAreaCoord = (index: number, field: 'lat' | 'lng', value: number) => {
    const newCoords = [...areaCoords];
    newCoords[index] = { ...newCoords[index], [field]: value };
    setAreaCoords(newCoords);
  };

  // --------------------------------------------------------------------------
  // 구역 세팅 기능
  // --------------------------------------------------------------------------

  /**
   * 구역 표시: Convex Hull 계산 후 폴리곤 생성
   */
  const handleShowZone = () => {
    if (!map) return;

    if (zoneCoords.length < 3) {
      alert('구역을 표시하려면 최소 3개의 좌표가 필요합니다.');
      return;
    }

    // Convex Hull 계산
    const hullCoords = computeConvexHull(zoneCoords);
    console.log(`🔷 Convex Hull: ${zoneCoords.length}개 → ${hullCoords.length}개`);

    // 폴리곤 생성
    const polygon = new google.maps.Polygon({
      paths: hullCoords,
      strokeColor: zoneColor,
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: zoneColor,
      fillOpacity: 0.35,
      clickable: false, // 폴리곤 위 클릭도 지도 클릭으로 처리
      map: map,
    });

    setPolygons([...polygons, polygon]);
    setIsZoneClickMode(false); // 구역 표시 후 클릭 모드 해제
    console.log('✅ 구역 표시 완료');
  };

  // 구역 좌표 추가
  const addZoneCoord = () => {
    setZoneCoords([...zoneCoords, { lat: 0, lng: 0 }]);
  };

  // 구역 좌표 삭제
  const removeZoneCoord = (index: number) => {
    setZoneCoords(zoneCoords.filter((_, i) => i !== index));
  };

  // 구역 좌표 수정
  const updateZoneCoord = (index: number, field: 'lat' | 'lng', value: number) => {
    const newCoords = [...zoneCoords];
    newCoords[index] = { ...newCoords[index], [field]: value };
    setZoneCoords(newCoords);
  };

  // 구역 클릭 모드 토글
  const toggleZoneClickMode = () => {
    setIsZoneClickMode(!isZoneClickMode);
  };

  // --------------------------------------------------------------------------
  // 마커 세팅 기능
  // --------------------------------------------------------------------------

  /**
   * 마커 표시: 커스텀 SVG 아이콘으로 마커 생성
   */
  const handleShowMarker = () => {
    if (!map) return;

    let icon;

    // 스타일별 커스텀 SVG 아이콘
    if (markerStyle === 'pin') {
      // 물방울 모양 핀
      icon = {
        path: 'M 0,-30 C -8,-30 -15,-23 -15,-15 C -15,-8 -8,0 0,10 C 8,0 15,-8 15,-15 C 15,-23 8,-30 0,-30 Z M 0,-20 C -3,-20 -5,-18 -5,-15 C -5,-12 -3,-10 0,-10 C 3,-10 5,-12 5,-15 C 5,-18 3,-20 0,-20 Z',
        fillColor: markerColor,
        fillOpacity: 0.9,
        strokeColor: '#ffffff',
        strokeWeight: 3,
        scale: 1.2,
        anchor: new google.maps.Point(0, 10),
      };
    } else if (markerStyle === 'circle') {
      // 3중 동심원
      icon = {
        path: 'M 0,0 m -12,0 a 12,12 0 1,0 24,0 a 12,12 0 1,0 -24,0 M 0,0 m -8,0 a 8,8 0 1,0 16,0 a 8,8 0 1,0 -16,0 M 0,0 m -3,0 a 3,3 0 1,0 6,0 a 3,3 0 1,0 -6,0',
        fillColor: markerColor,
        fillOpacity: 0.85,
        strokeColor: '#ffffff',
        strokeWeight: 2.5,
        scale: 1.5,
        anchor: new google.maps.Point(0, 0),
      };
    } else if (markerStyle === 'square') {
      // 3D 큐브
      icon = {
        path: 'M 0,-10 L 8,-5 L 8,5 L 0,10 L -8,5 L -8,-5 Z M 0,-10 L 0,0 M 8,-5 L 0,0 M -8,-5 L 0,0 M 0,0 L 0,10 M -8,5 L 0,10 M 8,5 L 0,10',
        fillColor: markerColor,
        fillOpacity: 0.9,
        strokeColor: '#ffffff',
        strokeWeight: 2.5,
        scale: 1.3,
        anchor: new google.maps.Point(0, 10),
      };
    } else {
      // 이중 별
      icon = {
        path: 'M 0,-15 L 4,-4 L 15,-4 L 6,3 L 10,14 L 0,7 L -10,14 L -6,3 L -15,-4 L -4,-4 Z M 0,-8 L 2,-3 L 7,-3 L 3,0 L 5,5 L 0,2 L -5,5 L -3,0 L -7,-3 L -2,-3 Z',
        fillColor: markerColor,
        fillOpacity: 0.95,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 1.2,
        anchor: new google.maps.Point(0, 7),
      };
    }

    // 마커 생성
    const marker = new google.maps.Marker({
      position: markerCoord,
      map: map,
      icon: icon,
    });

    setMarkers([...markers, marker]);
    console.log('✅ 마커 표시 완료:', markerCoord);
  };

  // 마커 클릭 모드 토글
  const toggleMarkerClickMode = () => {
    setIsMarkerClickMode(!isMarkerClickMode);
  };

  // --------------------------------------------------------------------------
  // JSX 렌더링
  // --------------------------------------------------------------------------

  return (
    <Container>
      {/* 좌측 컨트롤 패널 */}
      <LeftPanel>
        {/* === 1. 영역 세팅 === */}
        <Title>1. 영역 세팅</Title>

        {/* 동적 좌표 입력 */}
        {areaCoords.map((coord, index) => (
          <CoordInputWrapper key={index}>
            <div style={{ flex: 1 }}>
              <Label>좌표 {index + 1}</Label>
              <div style={{ display: 'flex', gap: '4%' }}>
                <Input
                  type="number"
                  step="any"
                  placeholder="위도"
                  value={coord.lat}
                  onChange={e => updateAreaCoord(index, 'lat', parseFloat(e.target.value))}
                />
                <Input
                  type="number"
                  step="any"
                  placeholder="경도"
                  value={coord.lng}
                  onChange={e => updateAreaCoord(index, 'lng', parseFloat(e.target.value))}
                />
              </div>
            </div>
            <DeleteButton onClick={() => removeAreaCoord(index)}>
              삭제
            </DeleteButton>
          </CoordInputWrapper>
        ))}

        <AddButton onClick={addAreaCoord}>
          + 좌표 추가
        </AddButton>

        <Button onClick={handleSetArea}>
          영역 세팅 (100m 축적)
        </Button>

        <Divider />

        {/* === 2. 구역 세팅 === */}
        <Title>2. 구역 세팅</Title>

        {/* 지도 클릭 모드 토글 */}
        <ToggleButton active={isZoneClickMode} onClick={toggleZoneClickMode}>
          {isZoneClickMode ? '✅ 클릭 모드 활성화됨' : '📍 지도에서 클릭'}
        </ToggleButton>

        {/* 색상 선택 */}
        <Label>구역 색상</Label>
        <ColorPicker>
          {colors.map((color) => (
            <ColorButton
              key={color}
              color={color}
              selected={zoneColor === color}
              onClick={() => setZoneColor(color)}
            />
          ))}
        </ColorPicker>

        {/* 동적 좌표 입력 */}
        {zoneCoords.map((coord, index) => (
          <CoordInputWrapper key={index}>
            <div style={{ flex: 1 }}>
              <Label>좌표 {index + 1}</Label>
              <div style={{ display: 'flex', gap: '4%' }}>
                <Input
                  type="number"
                  step="any"
                  placeholder="위도"
                  value={coord.lat}
                  onChange={e => updateZoneCoord(index, 'lat', parseFloat(e.target.value))}
                />
                <Input
                  type="number"
                  step="any"
                  placeholder="경도"
                  value={coord.lng}
                  onChange={e => updateZoneCoord(index, 'lng', parseFloat(e.target.value))}
                />
              </div>
            </div>
            <DeleteButton onClick={() => removeZoneCoord(index)}>
              삭제
            </DeleteButton>
          </CoordInputWrapper>
        ))}

        <AddButton onClick={addZoneCoord}>
          + 좌표 추가
        </AddButton>

        <Button onClick={handleShowZone}>
          구역 표시 (Convex Hull)
        </Button>

        <Divider />

        {/* === 3. 마커 세팅 === */}
        <Title>3. 마커 세팅</Title>

        {/* 마커 스타일 선택 */}
        <Label>마커 스타일</Label>
        <StylePicker>
          <StyleButton
            selected={markerStyle === 'pin'}
            onClick={() => setMarkerStyle('pin')}
          >
            📍 핀
          </StyleButton>
          <StyleButton
            selected={markerStyle === 'circle'}
            onClick={() => setMarkerStyle('circle')}
          >
            ⚫ 원
          </StyleButton>
          <StyleButton
            selected={markerStyle === 'square'}
            onClick={() => setMarkerStyle('square')}
          >
            ◼️ 사각
          </StyleButton>
          <StyleButton
            selected={markerStyle === 'star'}
            onClick={() => setMarkerStyle('star')}
          >
            ⭐ 별
          </StyleButton>
        </StylePicker>

        {/* 마커 색상 선택 */}
        <Label>마커 색상</Label>
        <ColorPicker>
          {colors.map((color) => (
            <ColorButton
              key={color}
              color={color}
              selected={markerColor === color}
              onClick={() => setMarkerColor(color)}
            />
          ))}
        </ColorPicker>

        {/* 지도 클릭 선택 */}
        <ToggleButton active={isMarkerClickMode} onClick={toggleMarkerClickMode}>
          {isMarkerClickMode ? '✅ 지도에서 선택 중...' : '📍 지도에서 선택'}
        </ToggleButton>

        {/* 마커 좌표 입력 */}
        <Label>좌표</Label>
        <div style={{ display: 'flex', gap: '4%', marginBottom: '10px' }}>
          <Input
            type="number"
            step="any"
            placeholder="위도"
            value={markerCoord.lat}
            onChange={e => setMarkerCoord({ ...markerCoord, lat: parseFloat(e.target.value) })}
          />
          <Input
            type="number"
            step="any"
            placeholder="경도"
            value={markerCoord.lng}
            onChange={e => setMarkerCoord({ ...markerCoord, lng: parseFloat(e.target.value) })}
          />
        </div>

        <Button onClick={handleShowMarker}>
          마커 표시
        </Button>
      </LeftPanel>

      {/* 우측 지도 영역 */}
      <MapContainer>
        <MapDiv ref={mapRef} />
      </MapContainer>
    </Container>
  );
}

export default App;
