import { ReactNode } from 'react';
import './Layout.css';

interface LayoutProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
}

export const Layout = ({ leftPanel, rightPanel }: LayoutProps) => {
  return (
    <div className="layout">
      <div className="layout-left">{leftPanel}</div>
      <div className="layout-right">{rightPanel}</div>
    </div>
  );
};
