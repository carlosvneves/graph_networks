// src/components/Graph.tsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import  {ReactFlow,
  Background,
  Controls,
  useEdgesState,
  useNodesState,
  Position,
  Edge,
  Node,
  ReactFlowInstance,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import * as d3 from "d3-dsv";
import * as d3Force from "d3-force";
import dagre from "dagre";

import DownloadButton from "./DownloadButton";
import DagreLayoutButton from "./DagreLayoutButton";
import D3ForceLayoutButton from "./D3ForceLayoutButton";
import ToggleSimulationButton from "./ToggleSimulationButton"; // Importação do novo componente
import ContextMenu from "./ContextMenu";

type CsvData = {
  empresa1: string;
  empresa2: string;
  frequencia: string;
};

const nodeWidth = 80;
const nodeHeight = 10;

const Graph: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [layout, setLayout] = useState<"dagre" | "d3-force">("dagre");
  const [menu, setMenu] = useState<{
    id: string;
    position: { x: number; y: number };
  } | null>(null);
  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(true); // Estado da simulação
  const simulationRef = useRef<d3Force.Simulation<any, any> | null>(null); // Referência da simulação
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null); // Referência do ReactFlow
  const graphRef = useRef<HTMLDivElement>(null); // Adicionado graphRef

  // Função para aplicar o layout Dagre
  const applyDagreLayout = (nodes: Node[], edges: Edge[]) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const isHorizontal = false;
    dagreGraph.setGraph({ rankdir: isHorizontal ? "LR" : "TB" });

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const updatedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2,
        },
        style: { ...node.style },
      };
    });

    return updatedNodes;
  };

  // Função para aplicar o layout D3-Force
  const applyD3ForceLayout = (nodes: Node[], edges: Edge[]) => {
    // Criar um mapa de IDs de nós para objetos de nós
    const nodeIdToNodeObject: { [key: string]: any } = {};
    const simulationNodes = nodes.map((node) => {
      const simNode = { ...node };
      nodeIdToNodeObject[node.id] = simNode;
      return simNode;
    });

    // Converter arestas para o formato esperado pelo D3-Force
    const simulationEdges = edges.map((edge) => ({
      source: nodeIdToNodeObject[edge.source],
      target: nodeIdToNodeObject[edge.target],
    }));

    if (simulationRef.current) {
      simulationRef.current.stop();
    }
    const simulation = d3Force
      //@ts-ignore
      .forceSimulation(simulationNodes)
      .force("link", d3Force.forceLink(simulationEdges).distance(200))
      .force("charge", d3Force.forceManyBody().strength(-500))
      .force(
        "collision",
        d3Force
          .forceCollide()
          .radius((d: any) => (d.style?.width || 50) / 2 + 10)
      )
      .force("center", d3Force.forceCenter(0, 0));

    simulationRef.current = simulation;

    simulation.on("tick", () => {
      const updatedNodes = simulationNodes.map((node: any) => ({
        ...node,
        position: { x: node.x!, y: node.y! },
        positionAbsolute: true,
        style: { ...node.style },
      }));

      setNodes(updatedNodes);
    });

    simulation.on("end", () => {
      simulationRef.current = null;
    });
  };

  // Carregar dados
  useEffect(() => {
    fetch("/data/graph.csv")
      .then((response) => response.text())
      .then(async (text) => {
        const data: CsvData[] = d3.csvParse(text);

        const nodeIds = new Set<string>();
        const nodeDegrees: Record<string, number> = {};
        const edgeList: Edge[] = [];

        data.forEach(({ empresa1, empresa2, frequencia }) => {
          nodeIds.add(empresa1);
          nodeIds.add(empresa2);

          nodeDegrees[empresa1] = (nodeDegrees[empresa1] || 0) + 1;
          nodeDegrees[empresa2] = (nodeDegrees[empresa2] || 0) + 1;

          const freq = parseInt(frequencia, 10);

          edgeList.push({
            id: `e-${empresa1}-${empresa2}-${freq}`,
            type: "simplebezier",
            source: empresa1,
            target: empresa2,
            data: { frequency: freq },
            style: { strokeWidth: Math.min(freq / 10, 5) },
          });
        });

        const nodesArray: Node[] = Array.from(nodeIds).map((id) => {
          const degree = nodeDegrees[id];
          const size = 5 + degree * 10;
          return {
            id,
            data: { label: id },
            position: {
              x: Math.random() * 500, // Posição X aleatória
              y: Math.random() * 500, // Posição Y aleatória
            },
            draggable: true,
            style: {
              width: size,
              height: size,
              backgroundColor: `hsl(${Math.random() * 360}, 100%, 75%)`,
              borderRadius: "12px", //"50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#000",
              border: "1px solid #999",
              fontSize: "8px",
            },
            sourcePosition: Position.Bottom,
            targetPosition: Position.Top,
          };
        });

        setNodes(nodesArray);
        setEdges(edgeList);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!loading && nodes.length > 0 && edges.length > 0) {
      if (layout === "dagre") {
        if (simulationRef.current) {
          simulationRef.current.stop();
          simulationRef.current = null;
        }

        const layoutedNodes = applyDagreLayout(nodes, edges);
        setNodes(layoutedNodes);

        setTimeout(() => {
          reactFlowInstance.current?.fitView();
        }, 0);
      } else if (layout === "d3-force") {
        applyD3ForceLayout(nodes, edges);

        setTimeout(() => {
          reactFlowInstance.current?.fitView();
        }, 0);
      }
    }
  }, [layout, loading, edges]);

  // Função para alternar a simulação
  const toggleSimulation = () => {
    if (simulationRef.current) {
      if (isSimulationRunning) {
        simulationRef.current.stop();
        setIsSimulationRunning(false);
      } else {
        simulationRef.current.restart();
        setIsSimulationRunning(true);
      }
    }
  };

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();

    setEdges((eds) =>
      eds.map((ed) => {
        if (ed.id === edge.id) {
          const hasLabel = !!ed.label;
          return {
            ...ed,
            label: hasLabel ? undefined : `${edge.data.frequency}`,
            labelBgPadding: [8, 4],
            labelBgBorderRadius: 4,
            labelBgStyle: { fill: "#FFCC00", color: "#fff", fillOpacity: 0.7 },
          };
        }
        return ed;
      })
    );
  }, []);
  // Atualizar a função onNodeClick
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();

    // Obter a posição do clique
    const { clientX, clientY } = event;

    // Atualizar o estado para mostrar o menu de contexto
    setMenu({
      id: node.id,
      position: { x: clientX, y: clientY },
    });
  }, []);

  // Função para fechar o menu de contexto
  const onPaneClick = useCallback(() => {
    if (menu) {
      setMenu(null);
    }
  }, [menu]);

  if (loading) {
    return <div>Carregando...</div>;
  }
  return (
    <div
      style={{ width: "100%", height: "100%", position: "relative" }}
      ref={graphRef}
    >
      <DownloadButton graphRef={graphRef} />
      {/* Botões para alternar entre layouts */}
      <div
        style={{
          position: "absolute",
          left: 10,
          top: 10,
          zIndex: 4,
          display: "flex",
        }}
      >
        <DagreLayoutButton
          isActive={layout === "dagre"}
          onClick={() => setLayout("dagre")}
        />
        <D3ForceLayoutButton
          isActive={layout === "d3-force"}
          onClick={() => {
            setLayout("d3-force");
            setIsSimulationRunning(true); // Iniciar a simulação ao mudar para D3-Force
          }}
        />
        {layout === "d3-force" && (
          <ToggleSimulationButton
            isRunning={isSimulationRunning}
            onClick={toggleSimulation}
          />
        )}
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onEdgeClick={onEdgeClick}
        onNodeClick={onNodeClick}
        onInit={(instance) => (reactFlowInstance.current = instance)} // Capturar a instância do ReactFlow
        //onNodeContextMenu={onNodeContextMenu}
        //onPaneClick={onPaneClick}
        fitView
      >
        <Panel position="bottom-right">bottom-right</Panel>
        <Background color="#ccc" variant="lines" />
        <Controls />
      </ReactFlow>
      {/* Renderizar o ContextMenu */}
      {menu && (
        <ContextMenu
          nodeId={menu.id}
          position={menu.position}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
};

export default Graph;
