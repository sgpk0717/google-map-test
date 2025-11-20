import { useState } from 'react';
import type { Coordinate, Zone } from '../../types';
import { CoordinateInput } from '../Common/CoordinateInput';
import { ColorPicker } from '../Common/ColorPicker';
import { areValidCoordinates } from '../../utils/mapUtils';
import './ControlSection.css';

interface ZoneSettingProps {
  zones: Zone[];
  onAddZone: (zone: Zone) => void;
  onRemoveZone: (zoneId: string) => void;
}

export const ZoneSetting = ({
  zones,
  onAddZone,
  onRemoveZone,
}: ZoneSettingProps) => {
  const [coordinates, setCoordinates] = useState<Coordinate[]>([
    { lat: 0, lng: 0 },
    { lat: 0, lng: 0 },
    { lat: 0, lng: 0 },
  ]);
  const [selectedColor, setSelectedColor] = useState('#FF6B6B');

  const handleCoordinateChange = (index: number, coordinate: Coordinate) => {
    const newCoordinates = [...coordinates];
    newCoordinates[index] = coordinate;
    setCoordinates(newCoordinates);
  };

  const handleAddCoordinate = () => {
    setCoordinates([...coordinates, { lat: 0, lng: 0 }]);
  };

  const handleRemoveCoordinate = (index: number) => {
    if (coordinates.length > 3) {
      const newCoordinates = coordinates.filter((_, i) => i !== index);
      setCoordinates(newCoordinates);
    }
  };

  const handleShowZone = () => {
    if (!areValidCoordinates(coordinates)) {
      alert('유효하지 않은 좌표가 있습니다. 확인해주세요.');
      return;
    }

    if (coordinates.length < 3) {
      alert('최소 3개 이상의 좌표를 입력해주세요.');
      return;
    }

    const newZone: Zone = {
      id: `zone-${Date.now()}`,
      coordinates: [...coordinates],
      color: selectedColor,
      fillOpacity: 0.4,
      strokeWidth: 2,
    };

    onAddZone(newZone);

    // 입력 초기화
    setCoordinates([
      { lat: 0, lng: 0 },
      { lat: 0, lng: 0 },
      { lat: 0, lng: 0 },
    ]);
  };

  return (
    <div className="control-section">
      <div className="section-header">
        <h2>2. 구역 세팅</h2>
        <p className="section-description">
          좌표를 입력하고 색상을 선택하여 구역을 표시합니다
        </p>
      </div>

      <ColorPicker
        value={selectedColor}
        onChange={setSelectedColor}
        label="구역 색상"
      />

      <div className="coordinates-list">
        {coordinates.map((coord, index) => (
          <CoordinateInput
            key={index}
            index={index}
            coordinate={coord}
            onChange={handleCoordinateChange}
            onRemove={handleRemoveCoordinate}
            showRemove={coordinates.length > 3}
          />
        ))}
      </div>

      <div className="section-actions">
        <button className="btn btn-secondary" onClick={handleAddCoordinate}>
          + 좌표 추가
        </button>
        <button className="btn btn-primary" onClick={handleShowZone}>
          표시
        </button>
      </div>

      {zones.length > 0 && (
        <div className="zones-list" style={{ marginTop: '20px' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '10px', color: '#666' }}>
            표시된 구역 ({zones.length})
          </h3>
          {zones.map((zone) => (
            <div key={zone.id} className="zone-item">
              <div className="item-info">
                <div className="item-label">
                  <span
                    style={{
                      display: 'inline-block',
                      width: '16px',
                      height: '16px',
                      backgroundColor: zone.color,
                      border: '1px solid #ddd',
                      borderRadius: '3px',
                      marginRight: '8px',
                      verticalAlign: 'middle',
                    }}
                  />
                  구역 {zone.id.split('-')[1]}
                </div>
                <div className="item-coords">
                  {zone.coordinates.length}개의 좌표
                </div>
              </div>
              <div className="item-actions">
                <button
                  className="delete-btn"
                  onClick={() => onRemoveZone(zone.id)}
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
