/**
 * MapPolygon 컴포넌트
 *
 * Google Maps 폴리곤 스타일을 생성하는 유틸리티
 * 이미지 기반 청록색 테두리 디자인
 */

export interface PolygonStyleOptions {
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWeight?: number;
  clickable?: boolean;
}

/**
 * 기본 폴리곤 스타일 생성
 *
 * @returns Google Maps Polygon 옵션 객체
 */
export const createPolygonStyle = (
  customOptions?: PolygonStyleOptions
): google.maps.PolygonOptions => {
  // 이미지 기반 기본 스타일 (청록색 테두리)
  const defaultStyle: google.maps.PolygonOptions = {
    fillColor: '#4FC3F7', // 청록색 채우기
    fillOpacity: 0.12, // 매우 연한 채우기
    strokeColor: '#4FC3F7', // 청록색 테두리
    strokeOpacity: 1.0, // 완전 불투명 테두리
    strokeWeight: 3, // 테두리 두께
    clickable: false, // 클릭 비활성화
  };

  return {
    ...defaultStyle,
    ...customOptions,
  };
};

/**
 * 여러 색상의 폴리곤 스타일 프리셋
 */
export const PolygonPresets = {
  // 청록색 (기본, 이미지와 동일)
  cyan: createPolygonStyle({
    fillColor: '#4FC3F7',
    strokeColor: '#4FC3F7',
  }),

  // 파란색
  blue: createPolygonStyle({
    fillColor: '#2196F3',
    strokeColor: '#2196F3',
  }),

  // 녹색
  green: createPolygonStyle({
    fillColor: '#4CAF50',
    strokeColor: '#4CAF50',
  }),

  // 빨간색
  red: createPolygonStyle({
    fillColor: '#F44336',
    strokeColor: '#F44336',
  }),

  // 노란색
  yellow: createPolygonStyle({
    fillColor: '#FFC107',
    strokeColor: '#FFC107',
  }),

  // 보라색
  purple: createPolygonStyle({
    fillColor: '#9C27B0',
    strokeColor: '#9C27B0',
  }),
};

/**
 * 폴리곤 생성 헬퍼 함수
 *
 * @param map - Google Maps 인스턴스
 * @param coordinates - 좌표 배열
 * @param styleOptions - 스타일 옵션
 * @returns 생성된 Polygon 인스턴스
 */
export const createPolygon = (
  map: google.maps.Map,
  coordinates: Array<{ lat: number; lng: number }>,
  styleOptions?: PolygonStyleOptions
): google.maps.Polygon => {
  const polygon = new google.maps.Polygon({
    paths: coordinates,
    map: map,
    ...createPolygonStyle(styleOptions),
  });

  return polygon;
};
