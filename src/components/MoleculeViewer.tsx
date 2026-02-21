import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { cn } from '../lib/utils';

interface MoleculeViewerProps {
  smiles: string;
  className?: string;
}

export const MoleculeViewer: React.FC<MoleculeViewerProps> = ({ smiles, className }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 200;
    const height = 150;

    // Simple placeholder visualization for SMILES
    // Real SMILES rendering is complex, so we'll create a stylized "atomic" graph
    const nodes = smiles.split('').filter(c => /[A-Z]/.test(c)).map((c, i) => ({ id: i, label: c }));
    const links = nodes.slice(0, -1).map((n, i) => ({ source: i, target: i + 1 }));

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(30))
      .force("charge", d3.forceManyBody().strength(-50))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .attr("stroke", "#4b5563")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 2);

    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g");

    node.append("circle")
      .attr("r", 8)
      .attr("fill", d => {
        if (d.label === 'C') return '#3b82f6';
        if (d.label === 'O') return '#ef4444';
        if (d.label === 'N') return '#10b981';
        return '#6b7280';
      });

    node.append("text")
      .text(d => d.label)
      .attr("font-size", "8px")
      .attr("fill", "white")
      .attr("text-anchor", "middle")
      .attr("dy", ".3em");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

  }, [smiles]);

  return (
    <div className={cn("bg-zinc-900/50 rounded-lg border border-zinc-800 p-2", className)}>
      <svg ref={svgRef} width="200" height="150" className="mx-auto" />
      <div className="mt-2 text-[10px] font-mono text-zinc-500 truncate text-center">
        {smiles}
      </div>
    </div>
  );
};
