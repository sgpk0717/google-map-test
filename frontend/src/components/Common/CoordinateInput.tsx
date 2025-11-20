import type { Coordinate } from '../../types';
import './CoordinateInput.css';

interface CoordinateInputProps {
  index: number;
  coordinate: Coordinate;
  onChange: (index: number, coordinate: Coordinate) => void;
  onRemove?: (index: number) => void;
  showRemove?: boolean;
}

export const CoordinateInput = ({
  index,
  coordinate,
  onChange,
  onRemove,
  showRemove = true,
}: CoordinateInputProps) => {
  const handleLatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lat = parseFloat(e.target.value) || 0;
    onChange(index, { ...coordinate, lat });
  };

  const handleLngChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lng = parseFloat(e.target.value) || 0;
    onChange(index, { ...coordinate, lng });
  };

  return (
    <div className="coordinate-input">
      <div className="coordinate-input-header">
        <span className="coordinate-label">좌표 {index + 1}</span>
        {showRemove && onRemove && (
          <button
            className="remove-btn"
            onClick={() => onRemove(index)}
            type="button"
          >
            ✕
          </button>
        )}
      </div>
      <div className="coordinate-fields">
        <div className="field">
          <label>위도 (Latitude)</label>
          <input
            type="number"
            step="any"
            value={coordinate.lat || ''}
            onChange={handleLatChange}
            placeholder="37.5665"
          />
        </div>
        <div className="field">
          <label>경도 (Longitude)</label>
          <input
            type="number"
            step="any"
            value={coordinate.lng || ''}
            onChange={handleLngChange}
            placeholder="126.978"
          />
        </div>
      </div>
    </div>
  );
};
