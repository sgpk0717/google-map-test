/**
 * MapMarker 컴포넌트
 *
 * Google Maps 마커 아이콘을 생성하는 유틸리티
 * - 일반 상태: 청록색 큐브 아이콘 (isometric)
 * - 선택 상태: 빨간/핑크 핀 모양 아이콘
 */

export interface MarkerIconOptions {
  selected?: boolean;
  size?: number;
}

/**
 * 일반 마커 아이콘 SVG (청록색 큐브)
 *
 * Isometric 스타일의 3D 큐브 디자인
 */
const createCubeIconSVG = (size = 32): string => {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <!-- 큐브 윗면 -->
      <path
        d="M16 4 L26 10 L16 16 L6 10 Z"
        fill="#4FC3F7"
        stroke="#2196F3"
        stroke-width="1.5"
        stroke-linejoin="round"
      />
      <!-- 큐브 왼쪽면 -->
      <path
        d="M6 10 L6 22 L16 28 L16 16 Z"
        fill="#0288D1"
        stroke="#2196F3"
        stroke-width="1.5"
        stroke-linejoin="round"
      />
      <!-- 큐브 오른쪽면 -->
      <path
        d="M16 16 L16 28 L26 22 L26 10 Z"
        fill="#039BE5"
        stroke="#2196F3"
        stroke-width="1.5"
        stroke-linejoin="round"
      />
    </svg>
  `;
};

/**
 * 선택된 마커 아이콘 SVG (빨간/핑크 핀)
 *
 * Google Maps 스타일의 핀 모양 디자인
 */
const createPinIconSVG = (size = 48): string => {
  return `
    <svg width="${size}" height="${size * 1.4}" viewBox="0 0 48 67" xmlns="http://www.w3.org/2000/svg">
      <!-- 핀 그림자 -->
      <ellipse
        cx="24"
        cy="64"
        rx="8"
        ry="3"
        fill="#00000020"
      />
      <!-- 핀 본체 -->
      <path
        d="M24 0 C14 0 6 8 6 18 C6 30 24 50 24 50 C24 50 42 30 42 18 C42 8 34 0 24 0 Z"
        fill="#E91E63"
        stroke="#C2185B"
        stroke-width="1.5"
      />
      <!-- 핀 중앙 흰색 원 -->
      <circle
        cx="24"
        cy="18"
        r="8"
        fill="white"
      />
      <!-- 핀 중앙 작은 원 (깊이감) -->
      <circle
        cx="24"
        cy="18"
        r="5"
        fill="#F8BBD0"
      />
    </svg>
  `;
};

/**
 * SVG를 Data URL로 변환
 */
const svgToDataURL = (svg: string): string => {
  const encoded = encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22');
  return `data:image/svg+xml,${encoded}`;
};

/**
 * 마커 아이콘 생성
 *
 * @param selected - 선택 상태 여부
 * @param size - 아이콘 크기 (기본: 일반 32px, 선택 48px)
 * @returns Google Maps Icon 객체
 */
export const createMarkerIcon = (options: MarkerIconOptions = {}): google.maps.Icon => {
  const { selected = false, size } = options;

  // 선택 상태에 따라 다른 아이콘 사용
  const iconSize = size || (selected ? 48 : 32);
  const svgString = selected ? createPinIconSVG(iconSize) : createCubeIconSVG(iconSize);

  // 앵커 포인트 계산 (아이콘의 중심 하단)
  const anchorX = iconSize / 2;
  const anchorY = selected ? iconSize * 1.4 - 3 : iconSize; // 핀은 더 아래쪽

  return {
    url: svgToDataURL(svgString),
    scaledSize: new google.maps.Size(iconSize, selected ? iconSize * 1.4 : iconSize),
    anchor: new google.maps.Point(anchorX, anchorY),
  };
};

/**
 * 마커 생성 헬퍼 함수
 *
 * @param map - Google Maps 인스턴스
 * @param position - 마커 위치
 * @param selected - 선택 상태
 * @param options - 추가 마커 옵션
 * @returns 생성된 Marker 인스턴스
 */
export const createMarker = (
  map: google.maps.Map,
  position: { lat: number; lng: number },
  selected = false,
  options?: Partial<google.maps.MarkerOptions>
): google.maps.Marker => {
  const marker = new google.maps.Marker({
    position,
    map,
    icon: createMarkerIcon({ selected }),
    ...options,
  });

  return marker;
};

/**
 * 마커 선택 상태 변경
 *
 * 기존 마커의 아이콘을 선택/비선택 상태로 변경
 *
 * @param marker - 변경할 마커
 * @param selected - 선택 상태
 */
export const updateMarkerSelection = (marker: google.maps.Marker, selected: boolean): void => {
  marker.setIcon(createMarkerIcon({ selected }));

  // 선택된 마커는 z-index를 높여서 위에 표시
  if (selected) {
    marker.setZIndex(google.maps.Marker.MAX_ZINDEX + 1);
  } else {
    marker.setZIndex(undefined);
  }
};

/**
 * 마커 프리셋 (색상별)
 */
export const MarkerPresets = {
  // 청록색 큐브 (기본)
  cube: createMarkerIcon({ selected: false }),

  // 빨간 핀 (선택됨)
  pin: createMarkerIcon({ selected: true }),
};

/**
 * 커스텀 색상 큐브 마커 생성
 */
export const createCustomCubeIcon = (color: string, size = 32): google.maps.Icon => {
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16 4 L26 10 L16 16 L6 10 Z"
        fill="${color}"
        stroke="${color}"
        stroke-width="1.5"
        stroke-linejoin="round"
        opacity="0.9"
      />
      <path
        d="M6 10 L6 22 L16 28 L16 16 Z"
        fill="${color}"
        stroke="${color}"
        stroke-width="1.5"
        stroke-linejoin="round"
        opacity="0.6"
      />
      <path
        d="M16 16 L16 28 L26 22 L26 10 Z"
        fill="${color}"
        stroke="${color}"
        stroke-width="1.5"
        stroke-linejoin="round"
        opacity="0.75"
      />
    </svg>
  `;

  return {
    url: svgToDataURL(svg),
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size),
  };
};
