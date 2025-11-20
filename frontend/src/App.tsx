import { useEffect, useState, useRef } from 'react';
import styled from '@emotion/styled';
import './App.css';

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

const Title = styled.h1`
  font-size: 24px;
  margin-bottom: 20px;
  color: #333;
`;

const CoordGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
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

  &::placeholder {
    color: #999;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 12px;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;

  &:hover {
    background-color: #5568d3;
  }

  &:active {
    transform: translateY(1px);
  }
`;

const MapContainer = styled.div`
  flex: 1;
  height: 100%;
`;

const MapDiv = styled.div`
  width: 100%;
  height: 100%;
`;

const Divider = styled.div`
  height: 1px;
  background-color: #ddd;
  margin: 30px 0;
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

  &:hover {
    transform: scale(1.1);
  }
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
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background-color: ${props => props.selected ? '#5568d3' : '#f5f5f5'};
  }
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

  &:hover {
    background-color: #cc0000;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const AddButton = styled.button`
  width: 100%;
  padding: 10px;
  background-color: white;
  color: #667eea;
  border: 2px dashed #667eea;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 15px;

  &:hover {
    background-color: #f0f0ff;
  }
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

  &:hover {
    background-color: ${props => props.active ? '#218838' : '#5568d3'};
  }
`;

function App() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // 영역 세팅 좌표 (동적)
  const [areaCoords, setAreaCoords] = useState([
    { lat: 33.2829905, lng: -111.5539719 },
    { lat: 33.2829747, lng: -111.5512963 },
    { lat: 33.2800504, lng: -111.5539479 },
    { lat: 33.2800301, lng: -111.5512648 },
  ]);

  // 구역 세팅 상태
  const [zoneCoords, setZoneCoords] = useState([
    { lat: 37.5665, lng: 126.978 },
    { lat: 37.5700, lng: 126.985 },
    { lat: 37.5630, lng: 126.990 },
  ]);
  const [zoneColor, setZoneColor] = useState('#FF6B6B');
  const [polygons, setPolygons] = useState<google.maps.Polygon[]>([]);
  const [isZoneClickMode, setIsZoneClickMode] = useState(false);

  // 마커 세팅 상태
  const [markerCoord, setMarkerCoord] = useState({ lat: 37.5665, lng: 126.978 });
  const [markerStyle, setMarkerStyle] = useState<'pin' | 'circle' | 'square' | 'star'>('pin');
  const [markerColor, setMarkerColor] = useState('#FF6B6B');
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [isMarkerClickMode, setIsMarkerClickMode] = useState(false);

  useEffect(() => {
    // Google Maps API 로드 및 지도 생성
    const initMap = async () => {
      // Google Maps API 로드 대기
      while (!window.google || !window.google.maps) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // 지도 생성
      if (mapRef.current && !map) {
        const newMap = new google.maps.Map(mapRef.current, {
          center: { lat: 37.5665, lng: 126.978 }, // 서울 시청
          zoom: 12,
        });
        setMap(newMap);
        console.log('지도 생성 완료!');
      }
    };

    initMap();
  }, []);

  // 지도 클릭 이벤트 리스너
  useEffect(() => {
    if (!map) return;

    if (isZoneClickMode || isMarkerClickMode) {
      const listener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          const newCoord = {
            lat: e.latLng.lat(),
            lng: e.latLng.lng()
          };

          if (isZoneClickMode) {
            setZoneCoords(prev => [...prev, newCoord]);
            console.log('구역 좌표 추가:', newCoord);
          } else if (isMarkerClickMode) {
            setMarkerCoord(newCoord);
            setIsMarkerClickMode(false); // 한 번만 선택하고 모드 해제
            console.log('마커 좌표 선택:', newCoord);
          }
        }
      });

      return () => {
        google.maps.event.removeListener(listener);
      };
    }
  }, [map, isZoneClickMode, isMarkerClickMode]);

  // 영역 좌표 추가/삭제
  const addAreaCoord = () => {
    setAreaCoords([...areaCoords, { lat: 0, lng: 0 }]);
  };

  const removeAreaCoord = (index: number) => {
    setAreaCoords(areaCoords.filter((_, i) => i !== index));
  };

  const updateAreaCoord = (index: number, field: 'lat' | 'lng', value: number) => {
    const newCoords = [...areaCoords];
    newCoords[index] = { ...newCoords[index], [field]: value };
    setAreaCoords(newCoords);
  };

  // 영역 세팅 버튼 클릭
  const handleSetArea = () => {
    if (!map) return;

    // 좌표 개수 검증
    if (areaCoords.length < 3) {
      alert('영역을 표시하려면 최소 3개의 좌표가 필요합니다.');
      return;
    }

    // 경계 계산
    const bounds = new google.maps.LatLngBounds();
    areaCoords.forEach(coord => bounds.extend(coord));

    // 중심 계산
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
      map.setZoom(16); // 100m 스케일
    }, 300);

    console.log('영역 세팅 완료!', center);
  };

  // 구역 표시 버튼 클릭
  const handleShowZone = () => {
    if (!map) return;

    // 좌표 개수 검증
    if (zoneCoords.length < 3) {
      alert('구역을 표시하려면 최소 3개의 좌표가 필요합니다.');
      return;
    }

    // Convex Hull 계산
    const hullCoords = computeConvexHull(zoneCoords);
    console.log('Convex Hull 계산 완료:', hullCoords);

    // 폴리곤 생성
    const polygon = new google.maps.Polygon({
      paths: hullCoords,
      strokeColor: zoneColor,
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: zoneColor,
      fillOpacity: 0.35,
      clickable: false, // 폴리곤 클릭 비활성화 (맵 클릭이 동작하도록)
      map: map,
    });

    setPolygons([...polygons, polygon]);
    setIsZoneClickMode(false); // 구역 표시 후 클릭 모드 자동 비활성화
    console.log('구역 표시 완료! 원본:', zoneCoords.length, '→ Hull:', hullCoords.length);
  };

  // 구역 좌표 추가/삭제/업데이트
  const addZoneCoord = () => {
    setZoneCoords([...zoneCoords, { lat: 0, lng: 0 }]);
  };

  const removeZoneCoord = (index: number) => {
    setZoneCoords(zoneCoords.filter((_, i) => i !== index));
  };

  const updateZoneCoord = (index: number, field: 'lat' | 'lng', value: number) => {
    const newCoords = [...zoneCoords];
    newCoords[index] = { ...newCoords[index], [field]: value };
    setZoneCoords(newCoords);
  };

  // Convex Hull 계산 함수 (Graham Scan 알고리즘)
  const computeConvexHull = (points: { lat: number; lng: number }[]) => {
    if (points.length < 3) return points;

    // 1. 가장 아래쪽/왼쪽 점 찾기
    let lowest = 0;
    for (let i = 1; i < points.length; i++) {
      if (points[i].lat < points[lowest].lat ||
          (points[i].lat === points[lowest].lat && points[i].lng < points[lowest].lng)) {
        lowest = i;
      }
    }

    // 기준점을 첫 번째로 이동
    const p0 = points[lowest];
    const others = points.filter((_, i) => i !== lowest);

    // 2. 극각(polar angle) 순으로 정렬
    const sorted = others.sort((a, b) => {
      const angleA = Math.atan2(a.lat - p0.lat, a.lng - p0.lng);
      const angleB = Math.atan2(b.lat - p0.lat, b.lng - p0.lng);
      if (angleA !== angleB) return angleA - angleB;
      // 각도가 같으면 거리순
      const distA = Math.hypot(a.lat - p0.lat, a.lng - p0.lng);
      const distB = Math.hypot(b.lat - p0.lat, b.lng - p0.lng);
      return distA - distB;
    });

    // 3. Convex Hull 구성
    const hull = [p0, sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      // 왼쪽으로 꺾이지 않는 점들 제거
      while (hull.length > 1 && cross(hull[hull.length - 2], hull[hull.length - 1], sorted[i]) <= 0) {
        hull.pop();
      }
      hull.push(sorted[i]);
    }

    return hull;
  };

  // 외적(cross product) 계산 - 방향 판별용
  const cross = (O: { lat: number; lng: number }, A: { lat: number; lng: number }, B: { lat: number; lng: number }) => {
    return (A.lng - O.lng) * (B.lat - O.lat) - (A.lat - O.lat) * (B.lng - O.lng);
  };

  // 지도 클릭 모드 토글
  const toggleZoneClickMode = () => {
    setIsZoneClickMode(!isZoneClickMode);
  };

  const toggleMarkerClickMode = () => {
    setIsMarkerClickMode(!isMarkerClickMode);
  };

  // 마커 표시
  const handleShowMarker = () => {
    if (!map) return;

    // 독특한 SVG 아이콘 생성
    let icon;

    if (markerStyle === 'pin') {
      // 물방울 모양의 핀 (티어드롭)
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
      // 이중 원 + 중심점
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
      // 3D 큐브 모양
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
      // 다이아몬드 + 별 조합
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

    const marker = new google.maps.Marker({
      position: markerCoord,
      map: map,
      icon: icon,
    });

    setMarkers([...markers, marker]);
    console.log('마커 표시 완료!', markerCoord);
  };

  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];

  return (
    <Container>
      <LeftPanel>
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
          영역 세팅
        </Button>

        <Divider />

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
          구역 표시
        </Button>

        <Divider />

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
        <CoordGroup>
          <Label>좌표</Label>
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
        </CoordGroup>

        <Button onClick={handleShowMarker}>
          마커 표시
        </Button>
      </LeftPanel>

      <MapContainer>
        <MapDiv ref={mapRef} />
      </MapContainer>
    </Container>
  );
}

export default App;
