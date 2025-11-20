/**
 * DeliveryMapViewExample 컴포넌트
 *
 * DeliveryMapView 사용 예제
 * 조회 버튼을 누르면 목데이터를 불러와 지도에 표시합니다.
 */

import { useState } from 'react';
import styled from '@emotion/styled';
import DeliveryMapView, { Zone, MarkerData } from './DeliveryMapView';

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled.div`
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
`;

const FetchButton = styled.button`
  padding: 10px 24px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #1976d2;
  }

  &:active {
    background-color: #1565c0;
  }
`;

const InfoBox = styled.div`
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
`;

const MapWrapper = styled.div`
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
`;

// ============================================================================
// 목데이터 정의
// ============================================================================

/**
 * 목데이터 생성 함수
 *
 * 실제로는 API 호출로 받아올 데이터를 시뮬레이션합니다.
 */
const getMockData = () => {
  // 영역 좌표 (Arizona, 현재 프로젝트와 동일)
  const areaCoordinates = [
    { lat: 33.2829905, lng: -111.5539719 },
    { lat: 33.2829747, lng: -111.5512963 },
    { lat: 33.2800504, lng: -111.5539479 },
    { lat: 33.2800301, lng: -111.5512648 },
  ];

  // 구역 3개 (직사각형, 영역 내부)
  const zones: Zone[] = [
    {
      id: 'zone-1',
      name: 'Zone A (북서)',
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
      name: 'Zone B (북동)',
      color: 'blue',
      coordinates: [
        { lat: 33.2825, lng: -111.5524 },
        { lat: 33.2825, lng: -111.5514 },
        { lat: 33.2818, lng: -111.5514 },
        { lat: 33.2818, lng: -111.5524 },
      ],
    },
    {
      id: 'zone-3',
      name: 'Zone C (남부 중앙)',
      color: 'green',
      coordinates: [
        { lat: 33.2810, lng: -111.5532 },
        { lat: 33.2810, lng: -111.5520 },
        { lat: 33.2803, lng: -111.5520 },
        { lat: 33.2803, lng: -111.5532 },
      ],
    },
  ];

  // 마커 6개 (각 구역에 분산 배치)
  const markers: MarkerData[] = [
    {
      id: 'marker-1',
      name: '배송지 1 (Zone A)',
      position: { lat: 33.2822, lng: -111.5533 },
      selected: true, // 선택됨 (빨간 핀)
    },
    {
      id: 'marker-2',
      name: '배송지 2 (Zone A)',
      position: { lat: 33.2820, lng: -111.5535 },
      selected: false, // 일반 (청록 큐브)
    },
    {
      id: 'marker-3',
      name: '배송지 3 (Zone B)',
      position: { lat: 33.2822, lng: -111.5519 },
      selected: false,
    },
    {
      id: 'marker-4',
      name: '배송지 4 (Zone B)',
      position: { lat: 33.2820, lng: -111.5517 },
      selected: true, // 선택됨
    },
    {
      id: 'marker-5',
      name: '배송지 5 (Zone C)',
      position: { lat: 33.2807, lng: -111.5526 },
      selected: false,
    },
    {
      id: 'marker-6',
      name: '배송지 6 (Zone C)',
      position: { lat: 33.2805, lng: -111.5524 },
      selected: false,
    },
  ];

  return {
    areaCoordinates,
    zones,
    markers,
  };
};

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export default function DeliveryMapViewExample() {
  // --- State ---
  const [mapData, setMapData] = useState<{
    areaCoordinates: Array<{ lat: number; lng: number }>;
    zones: Zone[];
    markers: MarkerData[];
  } | null>(null);

  // --- 조회 버튼 핸들러 ---
  const handleFetchData = () => {
    // 실제로는 여기서 API 호출
    // const response = await fetchDeliveryMapData();

    // 목데이터 로드
    const mockData = getMockData();
    setMapData(mockData);

    console.log('📦 배송 지도 데이터 조회 완료:', mockData);
  };

  // --- JSX 렌더링 ---
  return (
    <Container>
      <Header>
        <Title>배송 지도 조회</Title>
        <FetchButton onClick={handleFetchData}>조회</FetchButton>
      </Header>

      <InfoBox>
        {mapData ? (
          <>
            <strong>✅ 데이터 로드 완료</strong>
            <div style={{ marginTop: 8 }}>
              • 영역 좌표: {mapData.areaCoordinates.length}개
              <br />
              • 구역: {mapData.zones.length}개 (
              {mapData.zones.map(z => z.name).join(', ')})
              <br />
              • 마커: {mapData.markers.length}개 (선택됨:{' '}
              {mapData.markers.filter(m => m.selected).length}개)
            </div>
          </>
        ) : (
          <strong>⚠️ 조회 버튼을 눌러 데이터를 불러오세요</strong>
        )}
      </InfoBox>

      {mapData && (
        <MapWrapper>
          <DeliveryMapView
            areaCoordinates={mapData!.areaCoordinates}
            zones={mapData!.zones}
            markers={mapData!.markers}
            height="600px"
          />
        </MapWrapper>
      )}
    </Container>
  );
}
