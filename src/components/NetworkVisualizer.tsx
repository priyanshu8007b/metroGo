"use client";

import React, { useState, useRef, useEffect } from "react";
import type { NetworkData, Station, RouteResult } from "@/types/network";
import { cn } from "@/lib/utils";

interface NetworkVisualizerProps {
  data: NetworkData;
  activeRoute: RouteResult | null;
  onUpdateStation: (station: Station) => void;
  onSelectStation: (id: string) => void;
  selectedStationId: string | null;
}

export default function NetworkVisualizer({
  data,
  activeRoute,
  onUpdateStation,
  onSelectStation,
  selectedStationId
}: NetworkVisualizerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleMouseDown = (id: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingId(id);
    onSelectStation(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !svgRef.current) return;

    const svg = svgRef.current;
    const CTM = svg.getScreenCTM();
    if (!CTM) return;

    const x = (e.clientX - CTM.e) / CTM.a;
    const y = (e.clientY - CTM.f) / CTM.d;

    const station = data.stations.find(s => s.id === draggingId);
    if (station) {
      onUpdateStation({ ...station, x, y });
    }
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  const isEdgeInRoute = (from: string, to: string) => {
    if (!activeRoute) return false;
    const path = activeRoute.path;
    for (let i = 0; i < path.length - 1; i++) {
      if ((path[i] === from && path[i+1] === to) || (path[i] === to && path[i+1] === from)) {
        return true;
      }
    }
    return false;
  };

  return (
    <div className="relative w-full h-full bg-background overflow-hidden border-r">
      <svg
        ref={svgRef}
        className="w-full h-full cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Connections */}
        {data.connections.map((conn, idx) => {
          const s1 = data.stations.find(s => s.id === conn.from);
          const s2 = data.stations.find(s => s.id === conn.to);
          if (!s1 || !s2) return null;

          const inRoute = isEdgeInRoute(conn.from, conn.to);

          return (
            <g key={`conn-${idx}`}>
              <line
                x1={s1.x}
                y1={s1.y}
                x2={s2.x}
                y2={s2.y}
                stroke={inRoute ? "hsl(var(--accent))" : "hsl(var(--border))"}
                strokeWidth={inRoute ? 6 : 3}
                className="connection-line"
                style={inRoute ? { filter: 'url(#glow)' } : {}}
              />
              <text
                x={(s1.x + s2.x) / 2}
                y={(s1.y + s2.y) / 2 - 10}
                className="text-[10px] fill-muted-foreground select-none font-medium text-center"
                textAnchor="middle"
              >
                {conn.weight}m
              </text>
            </g>
          );
        })}

        {/* Stations */}
        {data.stations.map((station) => {
          const isSelected = selectedStationId === station.id;
          const isInRoute = activeRoute?.path.includes(station.id);

          return (
            <g
              key={station.id}
              className="group"
              onMouseDown={handleMouseDown(station.id)}
            >
              <circle
                cx={station.x}
                cy={station.y}
                r={isSelected ? 10 : (isInRoute ? 8 : 6)}
                fill={isInRoute ? "hsl(var(--accent))" : (isSelected ? "hsl(var(--primary))" : "hsl(var(--card))")}
                stroke={isSelected ? "hsl(var(--primary))" : "hsl(var(--primary))"}
                strokeWidth={2}
                className="station-node"
              />
              <text
                x={station.x}
                y={station.y + 25}
                textAnchor="middle"
                className={cn(
                  "text-xs select-none transition-all duration-200",
                  isSelected ? "font-bold fill-primary" : "font-medium fill-foreground",
                  isInRoute && "fill-accent-foreground font-semibold"
                )}
              >
                {station.name}
              </text>
            </g>
          );
        })}
      </svg>
      
      <div className="absolute top-4 left-4 flex flex-col gap-2 p-3 bg-card/80 backdrop-blur border rounded-lg shadow-sm">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Network Legend</h3>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent border border-accent"></div>
          <span className="text-xs">Optimal Path</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary border border-primary"></div>
          <span className="text-xs">Station</span>
        </div>
      </div>
    </div>
  );
}