import type { MarkerStyleType } from '../../types';
import './MarkerStylePicker.css';

interface MarkerStylePickerProps {
  value: MarkerStyleType;
  onChange: (styleType: MarkerStyleType) => void;
  label?: string;
}

const MARKER_STYLES: { type: MarkerStyleType; label: string; icon: string }[] =
  [
    { type: 'pin', label: '핀', icon: '📍' },
    { type: 'circle', label: '원', icon: '🔴' },
    { type: 'square', label: '사각형', icon: '🟥' },
    { type: 'star', label: '별', icon: '⭐' },
  ];

export const MarkerStylePicker = ({
  value,
  onChange,
  label,
}: MarkerStylePickerProps) => {
  return (
    <div className="marker-style-picker">
      {label && <label className="marker-style-label">{label}</label>}
      <div className="marker-style-options">
        {MARKER_STYLES.map((style) => (
          <button
            key={style.type}
            className={`style-option ${value === style.type ? 'active' : ''}`}
            onClick={() => onChange(style.type)}
            type="button"
          >
            <span className="style-icon">{style.icon}</span>
            <span className="style-label">{style.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
