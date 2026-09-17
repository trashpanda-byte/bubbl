"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import SpriteText from "three-spritetext";

import { colorForType, HUB_COLOR } from "@/lib/bubble-colors";
import type { Bubble, Relationship } from "@/types/database";

import { BubbleDetailPanel } from "./bubble-detail-panel";
import type { GraphLink, GraphNode } from "./graph-types";
import { createStarfield } from "./starfield";
import { WebcamGestures, type CameraDelta } from "./webcam-gestures";

import type { ForceGraphMethods } from "react-force-graph-3d";

const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), {
  ssr: false,
});

const HUB_ID = "__hub__";
const TAP_HIT_RADIUS_PX = 40;

interface Graph3DNode extends GraphNode {
  isHub?: boolean;
  fx?: number;
  fy?: number;
  fz?: number;
  // Populated at runtime by the force simulation — not present up front.
  x?: number;
  y?: number;
  z?: number;
}

type ForceGraph3DRef = ForceGraphMethods<Graph3DNode, GraphLink> | undefined;

function buildNodeObject(node: Graph3DNode, dimmed: boolean): THREE.Object3D {
  const group = new THREE.Group();
  const radius = node.isHub ? 14 : 7;
  const color = node.isHub ? HUB_COLOR : colorForType(node.type);

  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  const material = new THREE.MeshPhongMaterial({
    color,
    emissive: color,
    emissiveIntensity: dimmed ? 0.08 : node.isHub ? 0.9 : 0.45,
    shininess: 70,
    transparent: true,
    opacity: dimmed ? 0.15 : 0.95,
  });
  const sphere = new THREE.Mesh(geometry, material);
  group.add(sphere);

  if (!dimmed) {
    const label = new SpriteText(node.name, 3.2, "#f5f5f5");
    label.backgroundColor = false;
    label.position.set(0, -(radius + 6), 0);
    group.add(label);
  }

  return group;
}

export function BubbleGraph3D({
  bubbles,
  relationships,
  highlightedIds,
  onBubbleChanged,
  linkingFromId,
  onStartLinking,
  onLinkTargetSelected,
}: {
  bubbles: Bubble[];
  relationships: Relationship[];
  highlightedIds?: string[] | null;
  onBubbleChanged: () => void;
  linkingFromId: string | null;
  onStartLinking: (bubbleId: string) => void;
  onLinkTargetSelected: (bubbleId: string) => void;
}) {
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const fgRef = useRef<ForceGraph3DRef>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const starsAdded = useRef(false);
  const forcesConfigured = useRef(false);
  const sphericalRef = useRef<{ radius: number; theta: number; phi: number } | null>(null);

  const graphData = useMemo(() => {
    const nodes: Graph3DNode[] = [
      { id: HUB_ID, name: "My Life", type: "__hub__", description: null, isHub: true, fx: 0, fy: 0, fz: 0 },
      ...bubbles.map(
        (b): Graph3DNode => ({
          id: b.id,
          name: b.label,
          type: b.type,
          description: b.description,
        }),
      ),
    ];
    const links: GraphLink[] = relationships.map((r) => ({
      source: r.source_bubble_id,
      target: r.target_bubble_id,
      relationship_type: r.relationship_type,
    }));
    return { nodes, links };
  }, [bubbles, relationships]);

  const selectNode = useCallback(
    (node: Graph3DNode) => {
      if (node.isHub) return;
      if (linkingFromId && node.id !== linkingFromId) {
        onLinkTargetSelected(node.id);
      } else {
        setSelected(node);
      }
    },
    [linkingFromId, onLinkTargetSelected],
  );

  const handleCameraDelta = useCallback((delta: CameraDelta) => {
    const fg = fgRef.current;
    if (!fg) return;

    if (!sphericalRef.current) {
      const pos = fg.camera().position;
      const radius = Math.sqrt(pos.x ** 2 + pos.y ** 2 + pos.z ** 2) || 400;
      const phi = Math.acos(THREE.MathUtils.clamp(pos.y / radius, -1, 1));
      const theta = Math.atan2(pos.z, pos.x);
      sphericalRef.current = { radius, theta, phi };
    }

    const s = sphericalRef.current;
    s.radius = THREE.MathUtils.clamp(s.radius + delta.deltaRadius, 80, 2200);
    s.theta += delta.deltaTheta;
    s.phi = THREE.MathUtils.clamp(s.phi + delta.deltaPhi, 0.15, Math.PI - 0.15);

    const x = s.radius * Math.sin(s.phi) * Math.cos(s.theta);
    const y = s.radius * Math.cos(s.phi);
    const z = s.radius * Math.sin(s.phi) * Math.sin(s.theta);

    fg.cameraPosition({ x, y, z }, { x: 0, y: 0, z: 0 }, 0);
  }, []);

  // Gesture "tap" hit-testing: react-force-graph-3d's own click detection
  // is wired to real DOM pointer events, so instead of faking those, this
  // projects each node's current simulated (x,y,z) — mutated in place by
  // the force engine on the same graphData.nodes array we pass as
  // graphData — into screen space and picks whichever lands nearest the
  // gesture's tap position.
  const handleTap = useCallback(
    (screenX: number, screenY: number) => {
      const fg = fgRef.current;
      const container = containerRef.current;
      if (!fg || !container) return;

      const rect = container.getBoundingClientRect();
      const camera = fg.camera();
      const projected = new THREE.Vector3();

      let closest: Graph3DNode | null = null;
      let closestDist = TAP_HIT_RADIUS_PX;

      for (const node of graphData.nodes) {
        if (node.isHub || node.x === undefined || node.y === undefined || node.z === undefined) {
          continue;
        }
        projected.set(node.x, node.y, node.z).project(camera);
        const px = rect.left + ((projected.x + 1) / 2) * rect.width;
        const py = rect.top + ((1 - projected.y) / 2) * rect.height;
        const dist = Math.hypot(px - screenX, py - screenY);
        if (dist < closestDist) {
          closestDist = dist;
          closest = node;
        }
      }

      if (closest) selectNode(closest);
    },
    [graphData, selectNode],
  );

  const highlightSet = useMemo(
    () => (highlightedIds ? new Set(highlightedIds) : null),
    [highlightedIds],
  );

  useEffect(() => {
    starsAdded.current = false;
  }, []);

  if (bubbles.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <p className="text-lg font-medium text-neutral-300">Your universe is empty</p>
        <p className="max-w-sm text-sm text-neutral-500">
          Bubbles will appear here as you capture thoughts. Bubbl organizes
          them automatically.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <ForceGraph3D
        // next/dynamic erases the generic type params of forwardRef
        // components, so the dynamically-imported element's inferred ref
        // type can never structurally match our own ForceGraph3DRef —
        // this cast is the standard escape hatch for that combination.
        ref={fgRef as never}
        graphData={graphData}
        backgroundColor="#040611"
        nodeId="id"
        nodeLabel="name"
        nodeThreeObject={(node) => {
          const n = node as unknown as Graph3DNode;
          const dimmed = !!highlightSet && !n.isHub && !highlightSet.has(n.id);
          return buildNodeObject(n, dimmed);
        }}
        nodeThreeObjectExtend={false}
        linkColor={(link) => {
          const l = link as unknown as { source: string | Graph3DNode; target: string | Graph3DNode };
          const sourceId = typeof l.source === "string" ? l.source : l.source.id;
          const targetId = typeof l.target === "string" ? l.target : l.target.id;
          if (!highlightSet) return "rgba(148,163,184,0.35)";
          return highlightSet.has(sourceId) && highlightSet.has(targetId)
            ? "rgba(226,232,240,0.6)"
            : "rgba(100,100,120,0.06)";
        }}
        linkLabel={(link) => (link as unknown as GraphLink).relationship_type}
        linkOpacity={0.5}
        linkWidth={0.6}
        onNodeClick={(node) => selectNode(node as unknown as Graph3DNode)}
        onBackgroundClick={() => setSelected(null)}
        onEngineTick={() => {
          if (!forcesConfigured.current && fgRef.current) {
            // Wider spacing than the library defaults so bubbles read as
            // distinct planets rather than a cramped cluster.
            const charge = fgRef.current.d3Force("charge") as { strength?: (v: number) => void } | undefined;
            charge?.strength?.(-140);
            const link = fgRef.current.d3Force("link") as { distance?: (v: number) => void } | undefined;
            link?.distance?.(110);
            forcesConfigured.current = true;
          }

          if (starsAdded.current) return;
          const scene = fgRef.current?.scene();
          if (!scene) return;
          scene.add(createStarfield());
          starsAdded.current = true;
        }}
        onEngineStop={() => fgRef.current?.zoomToFit(600, 80)}
      />

      <WebcamGestures onCameraDelta={handleCameraDelta} onTap={handleTap} />

      {selected && (
        <BubbleDetailPanel
          key={selected.id}
          bubble={selected}
          onClose={() => setSelected(null)}
          onChanged={onBubbleChanged}
          onStartLinking={(id) => {
            onStartLinking(id);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}
