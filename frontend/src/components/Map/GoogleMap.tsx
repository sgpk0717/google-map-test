import {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
} from 'react';
import type { Coordinate, Zone, Marker } from '../../types';
import { waitForGoogleMaps, calculateBounds, calculateCenter, getZoomLevelFor100m } from '../../utils/mapUtils';
import './GoogleMap.css';

interface GoogleMapProps {
  zones?: Zone[];
  markers?: Marker[];
  defaultCenter?: Coordinate;
  defaultZoom?: number;
}

export interface GoogleMapHandle {
  setAreaBounds: (coordinates: Coordinate[]) => void;
  getMap: () => google.maps.Map | null;
}

export const GoogleMap = forwardRef<GoogleMapHandle, GoogleMapProps>(
  ({ zones = [], markers = [], defaultCenter, defaultZoom = 12 }, ref) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<google.maps.Map | null>(null);
    const [isMapLoaded, setIsMapLoaded] = useState(false);

    // 지도 초기화
    useEffect(() => {
      const initMap = async () => {
        try {
          await waitForGoogleMaps();

          if (mapRef.current && !mapInstanceRef.current) {
            const center = defaultCenter || { lat: 37.5665, lng: 126.978 }; // 서울 시청

            mapInstanceRef.current = new google.maps.Map(mapRef.current, {
              center,
              zoom: defaultZoom,
              mapTypeControl: true,
              streetViewControl: false,
              fullscreenControl: true,
              zoomControl: true,
            });

            setIsMapLoaded(true);
          }
        } catch (error) {
          console.error('Failed to initialize Google Maps:', error);
        }
      };

      initMap();
    }, [defaultCenter, defaultZoom]);

    // 영역 세팅: 좌표들을 포함하는 영역으로 지도 이동
    const setAreaBounds = (coordinates: Coordinate[]) => {
      if (!mapInstanceRef.current || coordinates.length === 0) return;

      const bounds = calculateBounds(coordinates);
      const center = calculateCenter(coordinates);

      // 경계 맞추기
      mapInstanceRef.current.fitBounds(bounds);

      // 약간의 지연 후 중심과 줌 레벨 설정 (fitBounds가 비동기적으로 동작하므로)
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(center);
          const zoomLevel = getZoomLevelFor100m(center.lat);
          mapInstanceRef.current.setZoom(zoomLevel);
        }
      }, 300);
    };

    // 외부에서 지도 인스턴스와 메서드에 접근할 수 있도록 노출
    useImperativeHandle(ref, () => ({
      setAreaBounds,
      getMap: () => mapInstanceRef.current,
    }));

    return (
      <div className="google-map-container">
        <div ref={mapRef} className="google-map" />
        {!isMapLoaded && (
          <div className="map-loading">
            <div className="loading-spinner"></div>
            <p>지도를 로딩 중입니다...</p>
          </div>
        )}
      </div>
    );
  }
);

GoogleMap.displayName = 'GoogleMap';
