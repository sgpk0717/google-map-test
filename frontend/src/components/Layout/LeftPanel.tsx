import { ReactNode } from 'react';
import './LeftPanel.css';

interface LeftPanelProps {
  children: ReactNode;
}

export const LeftPanel = ({ children }: LeftPanelProps) => {
  return (
    <div className="left-panel">
      <div className="left-panel-header">
        <h1>좌표 관리 시스템</h1>
      </div>
      <div className="left-panel-content">{children}</div>
    </div>
  );
};
