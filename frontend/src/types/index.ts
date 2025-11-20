// 좌표 타입
export interface Coordinate {
  lat: number;
  lng: number;
}

// 구역(폴리곤) 타입
export interface Zone {
  id: string;
  coordinates: Coordinate[];
  color: string;
  strokeColor?: string;
  strokeWidth?: number;
  fillOpacity?: number;
}

// 마커 스타일 타입
export type MarkerStyleType = 'pin' | 'circle' | 'square' | 'star' | 'custom';

export interface MarkerStyle {
  type: MarkerStyleType;
  color: string;
  size?: number;
  icon?: string;
}

// 마커 타입
export interface Marker {
  id: string;
  coordinate: Coordinate;
  style: MarkerStyle;
}

// Google Maps API 로드 확인 함수 타입
export type MapLoadCallback = () => void;
