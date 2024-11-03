// src/components/D3ForceLayoutButton.tsx
import React from "react";

type D3ForceLayoutButtonProps = {
  isActive: boolean;
  onClick: () => void;
};

const D3ForceLayoutButton: React.FC<D3ForceLayoutButtonProps> = ({
  isActive,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={isActive}
      style={{ padding: "8px 12px", fontSize: "16px" }}
    >
      Layout D3-Force
    </button>
  );
};

export default D3ForceLayoutButton;
