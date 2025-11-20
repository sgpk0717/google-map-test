import { ReactNode } from 'react';
import './RightPanel.css';

interface RightPanelProps {
  children: ReactNode;
}

export const RightPanel = ({ children }: RightPanelProps) => {
  return <div className="right-panel">{children}</div>;
};
