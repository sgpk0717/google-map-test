import './ColorPicker.css';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

const PRESET_COLORS = [
  '#FF6B6B', // 빨강
  '#4ECDC4', // 청록
  '#45B7D1', // 하늘
  '#FFA07A', // 연어
  '#98D8C8', // 민트
  '#F7DC6F', // 노랑
  '#BB8FCE', // 보라
  '#85C1E2', // 파랑
  '#F8B195', // 복숭아
  '#95E1D3', // 에메랄드
];

export const ColorPicker = ({ value, onChange, label }: ColorPickerProps) => {
  return (
    <div className="color-picker">
      {label && <label className="color-picker-label">{label}</label>}
      <div className="color-picker-content">
        <div className="preset-colors">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              className={`color-btn ${value === color ? 'active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => onChange(color)}
              type="button"
              aria-label={`색상 ${color}`}
            />
          ))}
        </div>
        <div className="custom-color">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="color-input"
          />
          <span className="color-value">{value}</span>
        </div>
      </div>
    </div>
  );
};
