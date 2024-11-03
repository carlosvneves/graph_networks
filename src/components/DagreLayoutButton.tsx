// src/components/DagreLayoutButton.tsx
import React from "react";

type DagreLayoutButtonProps = {
  isActive: boolean;
  onClick: () => void;
};

const DagreLayoutButton: React.FC<DagreLayoutButtonProps> = ({
  isActive,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={isActive}
      style={{ marginRight: "10px", padding: "8px 12px", fontSize: "16px" }}
    >
      Layout Dagre
    </button>
  );
};

export default DagreLayoutButton;
