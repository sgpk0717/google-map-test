import { useState } from 'react';
import type { Coordinate, Marker, MarkerStyleType } from '../../types';
import { ColorPicker } from '../Common/ColorPicker';
import { MarkerStylePicker } from '../Common/MarkerStylePicker';
import { isValidCoordinate } from '../../utils/mapUtils';
import './ControlSection.css';

interface MarkerSettingProps {
  markers: Marker[];
  onAddMarker: (marker: Marker) => void;
  onRemoveMarker: (markerId: string) => void;
}

export const MarkerSetting = ({
  markers,
  onAddMarker,
  onRemoveMarker,
}: MarkerSettingProps) => {
  const [coordinate, setCoordinate] = useState<Coordinate>({ lat: 0, lng: 0 });
  const [selectedStyle, setSelectedStyle] = useState<MarkerStyleType>('pin');
  const [selectedColor, setSelectedColor] = useState('#FF6B6B');

  const handleShowMarker = () => {
    if (!isValidCoordinate(coordinate)) {
      alert('유효하지 않은 좌표입니다. 확인해주세요.');
      return;
    }

    if (coordinate.lat === 0 && coordinate.lng === 0) {
      alert('좌표를 입력해주세요.');
      return;
    }

    const newMarker: Marker = {
      id: `marker-${Date.now()}`,
      coordinate: { ...coordinate },
      style: {
        type: selectedStyle,
        color: selectedColor,
        size: 40,
      },
    };

    onAddMarker(newMarker);

    // 입력 초기화
    setCoordinate({ lat: 0, lng: 0 });
  };

  return (
    <div className="control-section">
      <div className="section-header">
        <h2>3. 좌표 세팅</h2>
        <p className="section-description">
          좌표와 마커 디자인을 선택하여 마커를 표시합니다
        </p>
      </div>

      <MarkerStylePicker
        value={selectedStyle}
        onChange={setSelectedStyle}
        label="마커 스타일"
      />

      <ColorPicker
        value={selectedColor}
        onChange={setSelectedColor}
        label="마커 색상"
      />

      <div className="coordinate-single">
        <div className="field">
          <label>위도 (Latitude)</label>
          <input
            type="number"
            step="any"
            value={coordinate.lat || ''}
            onChange={(e) =>
              setCoordinate({ ...coordinate, lat: parseFloat(e.target.value) || 0 })
            }
            placeholder="37.5665"
          />
        </div>
        <div className="field">
          <label>경도 (Longitude)</label>
          <input
            type="number"
            step="any"
            value={coordinate.lng || ''}
            onChange={(e) =>
              setCoordinate({ ...coordinate, lng: parseFloat(e.target.value) || 0 })
            }
            placeholder="126.978"
          />
        </div>
      </div>

      <div className="section-actions">
        <button className="btn btn-primary" onClick={handleShowMarker}>
          표시
        </button>
      </div>

      {markers.length > 0 && (
        <div className="markers-list" style={{ marginTop: '20px' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '10px', color: '#666' }}>
            표시된 마커 ({markers.length})
          </h3>
          {markers.map((marker) => (
            <div key={marker.id} className="marker-item">
              <div className="item-info">
                <div className="item-label">
                  <span
                    style={{
                      display: 'inline-block',
                      width: '20px',
                      height: '20px',
                      backgroundColor: marker.style.color,
                      border: '2px solid white',
                      borderRadius: marker.style.type === 'circle' ? '50%' : '4px',
                      marginRight: '8px',
                      verticalAlign: 'middle',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }}
                  />
                  {marker.style.type === 'pin' && '📍'}
                  {marker.style.type === 'circle' && '⚫'}
                  {marker.style.type === 'square' && '◼️'}
                  {marker.style.type === 'star' && '⭐'}
                </div>
                <div className="item-coords">
                  ({marker.coordinate.lat.toFixed(4)},{' '}
                  {marker.coordinate.lng.toFixed(4)})
                </div>
              </div>
              <div className="item-actions">
                <button
                  className="delete-btn"
                  onClick={() => onRemoveMarker(marker.id)}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
