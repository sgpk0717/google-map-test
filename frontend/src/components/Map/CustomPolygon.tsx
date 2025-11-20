import { useEffect, useRef } from 'react';
import type { Zone } from '../../types';

interface CustomPolygonProps {
  zone: Zone;
  map: google.maps.Map | null;
}

// 커스텀 폴리곤 오버레이 클래스
class CustomPolygonOverlay extends google.maps.OverlayView {
  private zone: Zone;
  private div: HTMLDivElement | null = null;

  constructor(zone: Zone, map: google.maps.Map) {
    super();
    this.zone = zone;
    this.setMap(map);
  }

  onAdd() {
    // SVG 컨테이너 생성
    this.div = document.createElement('div');
    this.div.style.position = 'absolute';
    this.div.style.pointerEvents = 'auto';
    this.div.style.cursor = 'pointer';

    // SVG 요소 생성
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.position = 'absolute';
    svg.style.overflow = 'visible';

    // 폴리곤 패스 생성
    const polygon = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'polygon'
    );
    polygon.setAttribute('fill', this.zone.color);
    polygon.setAttribute('fill-opacity', String(this.zone.fillOpacity || 0.4));
    polygon.setAttribute(
      'stroke',
      this.zone.strokeColor || this.zone.color
    );
    polygon.setAttribute('stroke-width', String(this.zone.strokeWidth || 2));
    polygon.setAttribute('stroke-linejoin', 'round');

    svg.appendChild(polygon);
    this.div.appendChild(svg);

    // 오버레이 레이어에 추가
    const panes = this.getPanes();
    if (panes) {
      panes.overlayLayer.appendChild(this.div);
    }
  }

  draw() {
    if (!this.div) return;

    const projection = this.getProjection();
    if (!projection) return;

    // 모든 좌표를 픽셀 좌표로 변환
    const points = this.zone.coordinates.map((coord) => {
      const latLng = new google.maps.LatLng(coord.lat, coord.lng);
      return projection.fromLatLngToDivPixel(latLng);
    });

    if (points.length < 3 || points.some((p) => !p)) return;

    // SVG viewBox 및 크기 계산
    const minX = Math.min(...points.map((p) => p!.x));
    const minY = Math.min(...points.map((p) => p!.y));
    const maxX = Math.max(...points.map((p) => p!.x));
    const maxY = Math.max(...points.map((p) => p!.y));

    const width = maxX - minX;
    const height = maxY - minY;
    const padding = 20; // 테두리 여유 공간

    // SVG 위치 및 크기 설정
    const svg = this.div.querySelector('svg');
    if (svg) {
      svg.style.left = `${minX - padding}px`;
      svg.style.top = `${minY - padding}px`;
      svg.style.width = `${width + padding * 2}px`;
      svg.style.height = `${height + padding * 2}px`;
      svg.setAttribute(
        'viewBox',
        `${minX - padding} ${minY - padding} ${width + padding * 2} ${
          height + padding * 2
        }`
      );
    }

    // 폴리곤 포인트 설정
    const polygon = svg?.querySelector('polygon');
    if (polygon) {
      const pointsString = points
        .map((p) => `${p!.x},${p!.y}`)
        .join(' ');
      polygon.setAttribute('points', pointsString);
    }
  }

  onRemove() {
    if (this.div && this.div.parentNode) {
      this.div.parentNode.removeChild(this.div);
    }
    this.div = null;
  }

  updateZone(zone: Zone) {
    this.zone = zone;
    this.draw();
  }
}

export const CustomPolygon = ({ zone, map }: CustomPolygonProps) => {
  const overlayRef = useRef<CustomPolygonOverlay | null>(null);

  useEffect(() => {
    if (!map || !zone || zone.coordinates.length < 3) return;

    // 오버레이 생성
    overlayRef.current = new CustomPolygonOverlay(zone, map);

    return () => {
      // 오버레이 제거
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
    };
  }, [map, zone.id]); // zone.id가 변경되면 재생성

  useEffect(() => {
    // zone 속성이 변경되면 업데이트
    if (overlayRef.current) {
      overlayRef.current.updateZone(zone);
    }
  }, [zone]);

  return null; // 이 컴포넌트는 DOM을 직접 렌더링하지 않음
};
