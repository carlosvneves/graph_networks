// src/components/ContextMenu.tsx
import React from "react";

type ContextMenuProps = {
  nodeId: string;
  position: { x: number; y: number };
  onClose: () => void;
};

const ContextMenu: React.FC<ContextMenuProps> = ({
  nodeId,
  position,
  onClose,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        top: position.y,
        left: position.x,
        backgroundColor: "#fff",
        border: "1px solid #ccc",
        padding: "10px",
        zIndex: 10,
      }}
      onClick={(e) => e.stopPropagation()} // Impedir que o clique feche o menu
    >
      <p>Nó selecionado: {nodeId}</p>
      <button onClick={() => alert(`Ação no nó ${nodeId}`)}>Ação 1</button>
      <button onClick={onClose}>Fechar</button>
    </div>
  );
};

export default ContextMenu;
