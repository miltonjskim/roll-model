// app/entities/project-detail/ui/version-section/VersionGraphDagre.tsx
'use client';

import { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, { Node, Edge, ConnectionLineType, MarkerType, NodeTypes, Controls, Background, Panel, useNodesState, useEdgesState, useReactFlow, Handle, Position } from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import { VersionHistory, Pipelines } from '../../model/versionTypes';
import VersionDetailCard from '@/entities/project-detail/ui/version-section/VersionDetailCard';

// 상수 정의
const X_SPACING = 100;
const NODE_OFFSET = 60;
const INITIAL_Y_SPACING = 110;
const LAYOUT_Y_SPACING = 60;

// 커스텀 노드 컴포넌트
const VersionNode = ({ data, selected }: any) => {
  const { label, version, isLatest, isPublic, isDeleted, onClick } = data;

  // 노드 상태에 따른 색상 결정
  let backgroundColor = 'var(--primary-black)'; // 기본 검정색

  if (isDeleted || !isPublic) {
    backgroundColor = 'var(--color-gray-02)'; // 삭제되었거나 비공개 버전은 회색
  } else if (isLatest) {
    backgroundColor = 'var(--color-green-02)'; // 최신 버전은 녹색
  } else if (selected) {
    backgroundColor = 'var(--color-blue-02)'; // 선택된 버전은 파란색
  } else if (version.toString().startsWith('3')) {
    backgroundColor = 'var(--color-rose-02)'; // 3.x 버전은 보라색
  }

  // version이 1.0인 경우 source handle을 오른쪽에 배치
  const sourcePosition = version === 1.0 ? Position.Right : Position.Top;

  return (
    <div
      className="flex cursor-pointer items-center justify-center rounded-full"
      style={{
        backgroundColor,
        color: 'white',
        width: '60px',
        height: '60px',
        fontSize: '16px',
        fontWeight: 'bold',
      }}
      onClick={onClick}
    >
      <Handle type="target" position={Position.Bottom} style={{ background: backgroundColor }} />

      <Handle type="source" position={sourcePosition} style={{ background: backgroundColor }} />

      {label}
    </div>
  );
};

interface VersionGraphDagreProps {
  versionHistory: VersionHistory[];
  selectedVersion: number;
  onSelectVersion: (version: number) => void;
  selectedPipeline: Pipelines | null;
}

const nodeTypes: NodeTypes = {
  versionNode: VersionNode,
};

const VersionGraphDagre = ({ versionHistory, selectedVersion, onSelectVersion, selectedPipeline }: VersionGraphDagreProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowInstance = useReactFlow();

  // 최신 버전 찾기 (이 부분을 수정)
  const latestVersion = useMemo(() => {
    if (!versionHistory.length) return 0;

    // updatedAt을 기준으로 가장 최근에 업데이트된 버전 찾기
    const mostRecentVersion = versionHistory.reduce((latest, current) => {
      const latestDate = new Date(latest.updatedAt).getTime();
      const currentDate = new Date(current.updatedAt).getTime();
      return currentDate > latestDate ? current : latest;
    }, versionHistory[0]);

    return mostRecentVersion.version;
  }, [versionHistory]);

  // 노드 클릭 이벤트 핸들러
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const version = parseFloat(node.id);
      onSelectVersion(version);
    },
    [onSelectVersion],
  );

  // 시간 순서로 정렬된 버전 목록 생성 함수
  const getTimeOrderedVersions = useCallback(() => {
    return [...versionHistory].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [versionHistory]);

  // Y 위치 맵 생성 함수
  const createYPositionMap = useCallback((timeOrderedVersions: VersionHistory[], spacing: number) => {
    const yPositionMap = new Map<number, number>();
    timeOrderedVersions.forEach((version, index) => {
      yPositionMap.set(version.version, index * spacing);
    });
    return yPositionMap;
  }, []);

  // 부모별 자식 노드 그룹화 함수
  const createChildrenByParentMap = useCallback((edges: Edge[], nodes: Node[]) => {
    const childrenByParent = new Map<string, Node[]>();
    edges.forEach((edge) => {
      if (!childrenByParent.has(edge.source)) {
        childrenByParent.set(edge.source, []);
      }

      const targetNode = nodes.find((node) => node.id === edge.target);
      if (targetNode) {
        childrenByParent.get(edge.source)?.push(targetNode);
      }
    });

    // 각 부모별로 자식 노드들을 버전 번호 순으로 정렬
    childrenByParent.forEach((children, parentId) => {
      children.sort((a, b) => parseFloat(a.id) - parseFloat(b.id));

      console.log(
        `부모 노드 ${parentId}의 자식 노드들:`,
        children.map((node) => node.id),
      );
    });

    return childrenByParent;
  }, []);

  // 노드 X 위치 계산 함수
  const calculateNodeXPosition = useCallback((node: Node, xPos: number, parentId: string | undefined, childrenByParent: Map<string, Node[]>) => {
    let updatedXPos = xPos;

    if (parentId) {
      const siblings = childrenByParent.get(parentId) || [];
      console.log(
        `노드 ${node.id}의 형제들:`,
        siblings.map((s) => s.id),
      );

      // 여기가 중요: 자식이 1개인 경우 부모와 같은 X 위치에 배치
      if (siblings.length === 1) {
        // 자식이 하나뿐인 경우 부모와 동일한 X 위치를 유지

        updatedXPos = xPos;
        console.log(node.id, siblings, updatedXPos, xPos);
      } else if (siblings.length >= 2) {
        const nodeIndex = siblings.findIndex((sibling) => sibling.id === node.id);
        console.log(`노드 ${node.id}의 인덱스:`, nodeIndex);

        if (nodeIndex !== -1) {
          const offset = (nodeIndex - (siblings.length - 1) / 2) * NODE_OFFSET;
          updatedXPos = xPos + offset;
        }
      }
    }

    return updatedXPos;
  }, []);

  // 트리 구조에 따른 레이아웃 적용 함수
  const applyTreeBasedLayout = useCallback(
    (nodes: Node[], edges: Edge[]) => {
      // 부모별 자식 노드 그룹화
      const childrenByParent = createChildrenByParentMap(edges, nodes);

      // 각 노드의 부모 찾기
      const parentMap = new Map<string, string>();
      edges.forEach((edge) => {
        parentMap.set(edge.target, edge.source);
      });

      // 메이저 버전 그룹화 (X 위치 고정)
      const majorVersionMap = new Map<number, number>();
      const majorVersions = [...new Set(nodes.map((node) => Math.floor(parseFloat(node.id))))].sort();

      // 메이저 버전별 고정 X 위치 설정 (100, 300, 500, ...)
      majorVersions.forEach((majorVer, index) => {
        majorVersionMap.set(majorVer, index * X_SPACING);
      });

      // 노드 위치 초기화 (메이저 버전 기준)
      nodes.forEach((node) => {
        const nodeVersion = parseFloat(node.id);
        const majorVersion = Math.floor(nodeVersion);
        const isExactMajorVersion = nodeVersion === majorVersion; // 1.0, 2.0, 3.0 확인

        if (isExactMajorVersion) {
          // 메이저 버전 노드는 고정 위치에 배치
          node.position.x = majorVersionMap.get(majorVersion) || 0;
        }
      });

      // 재귀적으로 자식 노드 위치 계산 함수
      const positionChildren = (parentId: string) => {
        const children = childrenByParent.get(parentId) || [];
        if (children.length === 0) return;

        const parentNode = nodes.find((n) => n.id === parentId);
        if (!parentNode) return;

        // 각 자식 노드에 대해
        children.forEach((childNode, index) => {
          const childVersion = parseFloat(childNode.id);
          const childMajorVersion = Math.floor(childVersion);
          const isExactMajorVersion = childVersion === childMajorVersion; // 1.0, 2.0, 3.0 확인

          // 메이저 버전 노드(2.0, 3.0 등)는 위치를 다시 계산하지 않음
          if (isExactMajorVersion && childMajorVersion !== parseFloat(parentId)) {
            // 이미 위치가 고정된 메이저 버전 노드는 건너뜀
            // 단, 부모가 자기 자신인 경우(예: 1.0의 부모가 1.0)는 처리
          } else {
            // 메이저 버전이 아닌 노드(1.1, 2.1 등)는 위치 계산
            if (children.length === 1) {
              // 자식이 하나인 경우 부모와 같은 X 위치에 배치
              childNode.position.x = parentNode.position.x;
            } else if (children.length >= 2) {
              // 자식이 여러 개인 경우 부모를 중심으로 좌우로 배치
              const offset = (index - (children.length - 1) / 2) * NODE_OFFSET;
              childNode.position.x = parentNode.position.x + offset;
            }
          }

          // 이 자식 노드의 자식들에 대해 재귀적으로 위치 계산
          positionChildren(childNode.id);
        });
      };

      // 메이저 버전 노드부터 시작하여 자식 노드 위치 계산
      majorVersions.forEach((majorVer) => {
        const majorNodeId = majorVer.toString();
        positionChildren(majorNodeId);
      });

      return { nodes, edges };
    },
    [createChildrenByParentMap],
  );

  // 버전 히스토리 데이터로 그래프 노드와 엣지 생성
  useEffect(() => {
    if (!versionHistory.length) return;

    // 시간순으로 정렬 (최신이 먼저)
    const timeOrderedVersions = getTimeOrderedVersions();

    // 그래프 노드 생성
    const graphNodes: Node[] = [];
    const graphEdges: Edge[] = [];

    // 각 버전의 Y 위치를 업데이트 날짜 기준으로 계산
    const yPositionMap = createYPositionMap(timeOrderedVersions, INITIAL_Y_SPACING);

    // 버전별로 노드 생성
    versionHistory.forEach((version) => {
      const yPosition = yPositionMap.get(version.version) || 0;

      graphNodes.push({
        id: version.version.toString(),
        type: 'versionNode',
        data: {
          label: version.version.toFixed(1),
          version: version.version,
          isLatest: version.version === latestVersion,
          isPublic: version.publicYn,
          isDeleted: version.deletedYn,
          onClick: () => onSelectVersion(version.version),
        },
        // 초기 위치 설정 - Y 위치는 시간순으로, X는 레이아웃에서 조정
        position: {
          x: 0,
          y: yPosition,
        },
        selected: version.version === selectedVersion,
      });

      // 부모 버전으로 연결되는 엣지 (자식 → 부모 방향)
      // 자기 자신을 가리키는 엣지는 생성하지 않음
      if (version.version !== version.parent) {
        console.log('다름 있음');

        // 엣지 생성 시 스타일 명시적 지정
        graphEdges.push({
          id: `e${version.version}-${version.parent.toString()}`,
          source: version.parent.toString(),
          target: version.version.toString(),
          type: 'step', // step 대신 default 사용
          style: {
            stroke: 'var(--color-gray-02)',
            strokeWidth: 2.5,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 13,
            height: 20,
            color: '#888888',
          },
          zIndex: 100, // 노드보다 위에 표시
        });
      }
    });

    // 시간 기반 커스텀 레이아웃 적용
    const { nodes: layoutedNodes, edges: layoutedEdges } = applyTreeBasedLayout(graphNodes, graphEdges);

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);

    // 노드 적용 후 최신 버전 노드에 뷰 영역 조정
    setTimeout(() => {
      // 최신 버전 노드 ID 찾기
      const latestNodeId = selectedVersion.toString();

      // 최신 버전 노드 찾기
      const latestNode = layoutedNodes.find((node) => node.id === latestNodeId);

      if (latestNode) {
        // 최신 노드가 있으면 해당 노드로 화면 이동 및 확대
        reactFlowInstance.setCenter(
          latestNode.position.x + 300, // 노드 중앙으로 이동 (노드 크기의 절반 추가)
          latestNode.position.y + 250,
          { zoom: 0.8, duration: 800 },
        );
      } else {
        // 최신 노드가 없으면 전체 뷰 조정
        reactFlowInstance.fitView({ padding: 0.5, duration: 800 });
      }
    }, 100);
  }, [versionHistory, selectedVersion, latestVersion, onSelectVersion, reactFlowInstance, getTimeOrderedVersions, createYPositionMap, applyTreeBasedLayout]);

  // 레이아웃 재적용 버튼
  const onLayout = useCallback(() => {
    if (!versionHistory.length) return;

    // 시간순으로 정렬된 버전 (최신이 먼저)
    const timeOrderedVersions = getTimeOrderedVersions();

    // 각 버전의 Y 위치를 업데이트 날짜 기준으로 계산
    const yPositionMap = createYPositionMap(timeOrderedVersions, LAYOUT_Y_SPACING);

    // 부모별 자식 노드 그룹화
    const childrenByParent = createChildrenByParentMap(edges, nodes);

    // 메이저 버전 그룹화 (X 위치 고정)
    const majorVersionMap = new Map<number, number>();
    const majorVersions = [...new Set(nodes.map((node) => Math.floor(parseFloat(node.id))))].sort();

    // 메이저 버전별 고정 X 위치 설정
    majorVersions.forEach((majorVer, index) => {
      majorVersionMap.set(majorVer, index * X_SPACING);
    });

    // 노드 위치 초기화 (메이저 버전 기준)
    const updatedNodes = [...nodes];
    updatedNodes.forEach((node) => {
      const nodeVersion = parseFloat(node.id);
      const majorVersion = Math.floor(nodeVersion);
      const isExactMajorVersion = nodeVersion === majorVersion; // 1.0, 2.0, 3.0 확인

      // Y 위치 업데이트
      node.position.y = yPositionMap.get(nodeVersion) || 0;

      if (isExactMajorVersion) {
        // 메이저 버전 노드는 고정 위치에 배치
        node.position.x = majorVersionMap.get(majorVersion) || 0;
      }
    });

    // 재귀적으로 자식 노드 위치 계산 함수
    const positionChildren = (parentId: string) => {
      const children = childrenByParent.get(parentId) || [];
      if (children.length === 0) return;

      const parentNode = updatedNodes.find((n) => n.id === parentId);
      if (!parentNode) return;

      // 각 자식 노드에 대해
      children.forEach((childNode, index) => {
        const childVersion = parseFloat(childNode.id);
        const childMajorVersion = Math.floor(childVersion);
        const isExactMajorVersion = childVersion === childMajorVersion; // 1.0, 2.0, 3.0 확인

        // 메이저 버전 노드(2.0, 3.0 등)는 위치를 다시 계산하지 않음
        if (isExactMajorVersion && childMajorVersion !== parseFloat(parentId)) {
          // 이미 위치가 고정된 메이저 버전 노드는 건너뜀
        } else {
          // 메이저 버전이 아닌 노드(1.1, 2.1 등)는 위치 계산
          if (children.length === 1) {
            // 자식이 하나인 경우 부모와 같은 X 위치에 배치
            const nodeToUpdate = updatedNodes.find((n) => n.id === childNode.id);
            if (nodeToUpdate) {
              nodeToUpdate.position.x = parentNode.position.x;
            }
          } else if (children.length >= 2) {
            // 자식이 여러 개인 경우 부모를 중심으로 좌우로 배치
            const offset = (index - (children.length - 1) / 2) * NODE_OFFSET;
            const nodeToUpdate = updatedNodes.find((n) => n.id === childNode.id);
            if (nodeToUpdate) {
              nodeToUpdate.position.x = parentNode.position.x + offset;
            }
          }
        }

        // 이 자식 노드의 자식들에 대해 재귀적으로 위치 계산
        positionChildren(childNode.id);
      });
    };

    // 메이저 버전 노드부터 시작하여 자식 노드 위치 계산
    majorVersions.forEach((majorVer) => {
      const majorNodeId = majorVer.toString();
      positionChildren(majorNodeId);
    });

    setNodes([...updatedNodes]);

    window.requestAnimationFrame(() => {
      reactFlowInstance.fitView({ padding: 0.2 });
    });
  }, [nodes, edges, versionHistory, setNodes, reactFlowInstance, getTimeOrderedVersions, createYPositionMap, createChildrenByParentMap]);
  return (
    <div
      className="w-full rounded-lg border border-2 border-gray-200"
      style={{
        // height: `${Math.max(500, nodes.length * INITIAL_Y_SPACING + 120)}px`,
        height: '600px',
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={onNodeClick}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
        minZoom={0.2}
        maxZoom={1.5}
        defaultEdgeOptions={{
          style: { strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        }}
      >
        <Controls />
        <Background />

        {/* 범례와 재정렬 버튼을 같은 Panel에 배치 */}
        <Panel position="top-left" className="flex flex-col gap-2">
          {/* 재정렬 버튼 */}
          <button onClick={onLayout} className="bg-[theme(primary-black)] hover:bg-gray-01 rounded px-4 py-2 text-white duration-300 ease-in focus:outline-none">
            재정렬
          </button>
          {/* 범례 */}
          <div className="legend flex flex-col gap-2 rounded border border-gray-200 bg-white p-3 shadow-sm">
            <div className="mb-1 text-sm font-medium">버전 상태</div>
            <div className="flex items-center">
              <div className="bg-[theme(color-blue-02)] mr-1 h-4 w-4 rounded-full"></div>
              <span className="text-xs">선택한 버전</span>
            </div>
            <div className="flex items-center">
              <div className="bg-[theme(color-green-02)] mr-1 h-4 w-4 rounded-full"></div>
              <span className="text-xs">최신 버전</span>
            </div>
            <div className="flex items-center">
              <div className="bg-[theme(color-rose-02)] mr-1 h-4 w-4 rounded-full"></div>
              <span className="text-xs">나의 버전</span>
            </div>
            <div className="flex items-center">
              <div className="bg-[theme(color-gray-02)] mr-1 h-4 w-4 rounded-full"></div>
              <span className="text-xs">삭제/비공개된 버전</span>
            </div>
          </div>
        </Panel>
        {selectedPipeline && (
          <Panel position="top-right" className="overflow-auto">
            <VersionDetailCard pipeline={selectedPipeline} />
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};

export default VersionGraphDagre;
