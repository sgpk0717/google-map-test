import { useState } from 'react';
import type { Coordinate } from '../../types';
import { CoordinateInput } from '../Common/CoordinateInput';
import { areValidCoordinates } from '../../utils/mapUtils';
import './ControlSection.css';

interface AreaSettingProps {
  onSetArea: (coordinates: Coordinate[]) => void;
}

export const AreaSetting = ({ onSetArea }: AreaSettingProps) => {
  const [coordinates, setCoordinates] = useState<Coordinate[]>([
    { lat: 0, lng: 0 },
    { lat: 0, lng: 0 },
    { lat: 0, lng: 0 },
  ]);

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

  const handleSetArea = () => {
    if (!areValidCoordinates(coordinates)) {
      alert('유효하지 않은 좌표가 있습니다. 확인해주세요.');
      return;
    }

    if (coordinates.length < 3) {
      alert('최소 3개 이상의 좌표를 입력해주세요.');
      return;
    }

    onSetArea(coordinates);
  };

  return (
    <div className="control-section">
      <div className="section-header">
        <h2>1. 영역 세팅</h2>
        <p className="section-description">
          좌표를 입력하여 지도 영역을 설정합니다 (최소 3개)
        </p>
      </div>

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
        <button className="btn btn-primary" onClick={handleSetArea}>
          영역 세팅
        </button>
      </div>
    </div>
  );
};
