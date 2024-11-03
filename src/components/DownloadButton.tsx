// src/components/DownloadButton.tsx
import React from "react";
import { toPng } from "html-to-image";

type DownloadButtonProps = {
  graphRef: React.RefObject<HTMLDivElement>;
};

const DownloadButton: React.FC<DownloadButtonProps> = ({ graphRef }) => {
  const handleDownload = () => {
    if (graphRef.current === null) {
      return;
    }

    toPng(graphRef.current)
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = "grafo.png";
        link.href = dataUrl;
        link.click();
      })
      .catch((error) => {
        console.error("Erro ao gerar a imagem:", error);
      });
  };

  return (
    <button
      onClick={handleDownload}
      style={{
        position: "absolute",
        right: 10,
        top: 10,
        zIndex: 4,
        padding: "8px 12px",
        fontSize: "16px",
        cursor: "pointer",
      }}
    >
      Baixar Imagem
    </button>
  );
};

export default DownloadButton;
