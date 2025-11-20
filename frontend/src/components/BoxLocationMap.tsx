/**
 * BoxLocationMap 컴포넌트
 *
 * 박스 위치 영역, 구역, 마커를 표시하는 Google Maps 컴포넌트
 * 부모 컴포넌트로부터 props로 데이터를 받아 지도를 렌더링합니다.
 */

import { useEffect, useRef, useState } from 'react';
import { PolygonPresets } from './MapPolygon';
import { createMarker } from './MapMarker';

// ============================================================================
// 타입 정의
// ============================================================================

/**
 * 구역 데이터 타입
 */
export interface Zone {
  id: string;
  name: string;
  coordinates: Array<{ lat: number; lng: number }>;
  color?: 'cyan' | 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}

/**
 * 마커 데이터 타입
 */
export interface MarkerData {
  id: string;
  name: string;
  position: { lat: number; lng: number };
  selected: boolean;
}

/**
 * BoxLocationMap Props
 */
export interface BoxLocationMapProps {
  areaCoordinates: Array<{ lat: number; lng: number }>; // 영역 좌표 (bounds 계산용)
  zones: Zone[];                                          // 구역 목록
  markers: MarkerData[];                                  // 마커 목록
}

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export default function BoxLocationMap({
  areaCoordinates,
  zones,
  markers,
}: BoxLocationMapProps) {
  // --- State 선언 ---
  const mapRef = useRef<google.maps.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // 생성된 폴리곤/마커 인스턴스를 저장 (정리용)
  const [polygons, setPolygons] = useState<google.maps.Polygon[]>([]);
  const [mapMarkers, setMapMarkers] = useState<google.maps.Marker[]>([]);

  // --- Google Maps 초기화 ---
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Google Maps 스크립트 로딩
    const initMap = () => {
      const map = new google.maps.Map(mapContainerRef.current!, {
        zoom: 15,
        center: { lat: 33.2815, lng: -111.5526 }, // 초기 중심 (Arizona)
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });

      mapRef.current = map;
    };

    // 이미 로드되어 있으면 바로 초기화
    if (window.google && window.google.maps) {
      initMap();
    } else {
      // 스크립트 로딩 대기
      const checkGoogleMaps = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkGoogleMaps);
          initMap();
        }
      }, 100);

      return () => clearInterval(checkGoogleMaps);
    }
  }, []);

  // --- Convex Hull 알고리즘 ---
  const computeConvexHull = (points: Array<{ lat: number; lng: number }>) => {
    if (points.length < 3) return points;

    // 1. 가장 아래/왼쪽 점 찾기 (pivot)
    let lowest = 0;
    for (let i = 1; i < points.length; i++) {
      if (
        points[i].lat < points[lowest].lat ||
        (points[i].lat === points[lowest].lat && points[i].lng < points[lowest].lng)
      ) {
        lowest = i;
      }
    }

    const p0 = points[lowest];
    const others = points.filter((_, i) => i !== lowest);

    // 2. pivot 기준 극각(polar angle) 정렬
    const sorted = others.sort((a, b) => {
      const angleA = Math.atan2(a.lat - p0.lat, a.lng - p0.lng);
      const angleB = Math.atan2(b.lat - p0.lat, b.lng - p0.lng);
      if (angleA !== angleB) return angleA - angleB;

      // 각도가 같으면 거리로 정렬
      const distA = Math.hypot(a.lat - p0.lat, a.lng - p0.lng);
      const distB = Math.hypot(b.lat - p0.lat, b.lng - p0.lng);
      return distA - distB;
    });

    // 3. Graham Scan으로 Convex Hull 구축
    const hull = [p0, sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
      while (hull.length > 1 && cross(hull[hull.length - 2], hull[hull.length - 1], sorted[i]) <= 0) {
        hull.pop();
      }
      hull.push(sorted[i]);
    }

    return hull;
  };

  // Cross product 계산 (방향 판단)
  const cross = (O: { lat: number; lng: number }, A: { lat: number; lng: number }, B: { lat: number; lng: number }): number => {
    return (A.lng - O.lng) * (B.lat - O.lat) - (A.lat - O.lat) * (B.lng - O.lng);
  };

  // --- 데이터 변경 시 지도 렌더링 ---
  useEffect(() => {
    if (!mapRef.current) return;
    if (!areaCoordinates || areaCoordinates.length < 3) return;

    const map = mapRef.current;

    // 1. 기존 폴리곤/마커 제거
    clearMapObjects();

    const newPolygons: google.maps.Polygon[] = [];

    // 2. 영역 bounds 계산 및 자동 zoom/center
    const bounds = new google.maps.LatLngBounds();
    areaCoordinates.forEach(coord => bounds.extend(coord));
    map.fitBounds(bounds);

    // 3. 구역 폴리곤 생성 (Convex Hull 적용)
    zones.forEach(zone => {
      if (zone.coordinates.length < 3) return;

      // Convex Hull 계산
      const hullCoords = computeConvexHull(zone.coordinates);

      // 색상 프리셋 선택 (지정 안 되면 cyan)
      const colorPreset = zone.color || 'cyan';
      const zonePolygon = new google.maps.Polygon({
        paths: hullCoords,
        map: map,
        ...PolygonPresets[colorPreset],
      });

      newPolygons.push(zonePolygon);
    });

    // 4. 마커 생성
    const newMarkers: google.maps.Marker[] = [];

    markers.forEach(markerData => {
      const marker = createMarker(
        map,
        markerData.position,
        markerData.selected,
        {
          title: markerData.name,
        }
      );

      newMarkers.push(marker);
    });

    // State에 저장 (나중에 정리용)
    setPolygons(newPolygons);
    setMapMarkers(newMarkers);
  }, [areaCoordinates, zones, markers]);

  // --- 기존 지도 객체 정리 함수 ---
  const clearMapObjects = () => {
    // 모든 폴리곤 제거
    polygons.forEach(polygon => polygon.setMap(null));
    setPolygons([]);

    // 모든 마커 제거
    mapMarkers.forEach(marker => marker.setMap(null));
    setMapMarkers([]);
  };

  // --- 컴포넌트 언마운트 시 정리 ---
  useEffect(() => {
    return () => {
      clearMapObjects();
    };
  }, []);

  // --- JSX 렌더링 ---
  return (
    <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
  );
}
