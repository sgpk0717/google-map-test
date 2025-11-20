import { Coordinate } from '../types';

/**
 * Google Maps API가 로드될 때까지 대기
 */
export const waitForGoogleMaps = (): Promise<typeof google> => {
  return new Promise((resolve) => {
    if (window.google && window.google.maps) {
      resolve(window.google);
    } else {
      const checkGoogle = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkGoogle);
          resolve(window.google);
        }
      }, 100);
    }
  });
};

/**
 * 좌표 배열에서 경계(bounds) 계산
 */
export const calculateBounds = (
  coordinates: Coordinate[]
): google.maps.LatLngBounds => {
  const bounds = new google.maps.LatLngBounds();
  coordinates.forEach((coord) => {
    bounds.extend(new google.maps.LatLng(coord.lat, coord.lng));
  });
  return bounds;
};

/**
 * 좌표 배열의 중심점 계산
 */
export const calculateCenter = (coordinates: Coordinate[]): Coordinate => {
  if (coordinates.length === 0) {
    return { lat: 37.5665, lng: 126.978 }; // 기본값: 서울 시청
  }

  const sum = coordinates.reduce(
    (acc, coord) => ({
      lat: acc.lat + coord.lat,
      lng: acc.lng + coord.lng,
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: sum.lat / coordinates.length,
    lng: sum.lng / coordinates.length,
  };
};

/**
 * 100m 축척에 해당하는 줌 레벨 계산
 * (위도에 따라 약간 다를 수 있지만, 일반적으로 zoom level 16-17이 100m 정도)
 */
export const getZoomLevelFor100m = (latitude: number): number => {
  // 위도에 따른 미터당 픽셀 계산
  // zoom level 16은 대략 100m 축척
  return 16;
};

/**
 * 좌표가 유효한지 검증
 */
export const isValidCoordinate = (coord: Coordinate): boolean => {
  return (
    coord.lat >= -90 &&
    coord.lat <= 90 &&
    coord.lng >= -180 &&
    coord.lng <= 180
  );
};

/**
 * 좌표 배열이 유효한지 검증
 */
export const areValidCoordinates = (coordinates: Coordinate[]): boolean => {
  return coordinates.every(isValidCoordinate);
};

/**
 * 두 좌표 간의 거리 계산 (Haversine 공식)
 * @returns 거리 (미터)
 */
export const calculateDistance = (
  coord1: Coordinate,
  coord2: Coordinate
): number => {
  const R = 6371e3; // 지구 반지름 (미터)
  const φ1 = (coord1.lat * Math.PI) / 180;
  const φ2 = (coord2.lat * Math.PI) / 180;
  const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};
