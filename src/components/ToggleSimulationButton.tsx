// src/components/ToggleSimulationButton.tsx
import React from "react";

type ToggleSimulationButtonProps = {
  isRunning: boolean;
  onClick: () => void;
};

const ToggleSimulationButton: React.FC<ToggleSimulationButtonProps> = ({
  isRunning,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      style={{ marginLeft: "10px", padding: "8px 12px", fontSize: "16px" }}
    >
      {isRunning ? "Parar Simulação" : "Continuar Simulação"}
    </button>
  );
};

export default ToggleSimulationButton;
