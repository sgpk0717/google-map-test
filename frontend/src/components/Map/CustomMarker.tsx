import { useEffect, useRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import type { Marker, MarkerStyle } from '../../types';
import './CustomMarker.css';

interface CustomMarkerProps {
  marker: Marker;
  map: google.maps.Map | null;
}

// 마커 컴포넌트 (실제 렌더링될 내용)
const MarkerContent = ({ style }: { style: MarkerStyle }) => {
  const { type, color, size = 40 } = style;

  const renderMarkerIcon = () => {
    switch (type) {
      case 'pin':
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            className="marker-icon"
          >
            <path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
              fill={color}
              stroke="white"
              strokeWidth="1"
            />
          </svg>
        );
      case 'circle':
        return (
          <div
            className="marker-circle"
            style={{
              width: size,
              height: size,
              backgroundColor: color,
              border: '3px solid white',
              borderRadius: '50%',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            }}
          />
        );
      case 'square':
        return (
          <div
            className="marker-square"
            style={{
              width: size,
              height: size,
              backgroundColor: color,
              border: '3px solid white',
              borderRadius: '4px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            }}
          />
        );
      case 'star':
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            className="marker-icon"
          >
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={color}
              stroke="white"
              strokeWidth="1"
            />
          </svg>
        );
      case 'custom':
        return (
          <div
            className="marker-custom"
            style={{
              width: size,
              height: size,
              backgroundColor: color,
              border: '3px solid white',
              borderRadius: '50%',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: size * 0.5,
            }}
          >
            {style.icon || '📍'}
          </div>
        );
      default:
        return null;
    }
  };

  return <div className="custom-marker-content">{renderMarkerIcon()}</div>;
};

// 커스텀 마커 오버레이 클래스
class CustomMarkerOverlay extends google.maps.OverlayView {
  private marker: Marker;
  private div: HTMLDivElement | null = null;
  private root: Root | null = null;

  constructor(marker: Marker, map: google.maps.Map) {
    super();
    this.marker = marker;
    this.setMap(map);
  }

  onAdd() {
    this.div = document.createElement('div');
    this.div.style.position = 'absolute';
    this.div.style.cursor = 'pointer';
    this.div.className = 'custom-marker-overlay';

    // React 루트 생성 및 렌더링
    this.root = createRoot(this.div);
    this.root.render(<MarkerContent style={this.marker.style} />);

    const panes = this.getPanes();
    if (panes) {
      panes.overlayMouseTarget.appendChild(this.div);
    }
  }

  draw() {
    if (!this.div) return;

    const projection = this.getProjection();
    if (!projection) return;

    const position = new google.maps.LatLng(
      this.marker.coordinate.lat,
      this.marker.coordinate.lng
    );
    const point = projection.fromLatLngToDivPixel(position);

    if (point) {
      const size = this.marker.style.size || 40;
      // 마커의 중심이 좌표 위치에 오도록 조정
      this.div.style.left = `${point.x - size / 2}px`;
      this.div.style.top = `${point.y - size}px`; // pin 스타일을 위해 위쪽으로 올림
    }
  }

  onRemove() {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
    if (this.div && this.div.parentNode) {
      this.div.parentNode.removeChild(this.div);
    }
    this.div = null;
  }

  updateMarker(marker: Marker) {
    this.marker = marker;
    if (this.root) {
      this.root.render(<MarkerContent style={marker.style} />);
    }
    this.draw();
  }
}

export const CustomMarker = ({ marker, map }: CustomMarkerProps) => {
  const overlayRef = useRef<CustomMarkerOverlay | null>(null);

  useEffect(() => {
    if (!map || !marker) return;

    // 오버레이 생성
    overlayRef.current = new CustomMarkerOverlay(marker, map);

    return () => {
      // 오버레이 제거
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
    };
  }, [map, marker.id]); // marker.id가 변경되면 재생성

  useEffect(() => {
    // marker 속성이 변경되면 업데이트
    if (overlayRef.current) {
      overlayRef.current.updateMarker(marker);
    }
  }, [marker]);

  return null; // 이 컴포넌트는 DOM을 직접 렌더링하지 않음
};
