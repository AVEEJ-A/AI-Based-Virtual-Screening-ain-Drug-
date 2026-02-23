import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { cn } from '../lib/utils';

interface ChemicalSpaceMapProps {
  molecules: any[];
  className?: string;
}

export const ChemicalSpaceMap: React.FC<ChemicalSpaceMapProps> = ({ molecules, className }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 400;
    const height = 200;

    // Create a grid/background
    svg.append("g")
      .attr("stroke", "#27272a")
      .attr("stroke-opacity", 0.2)
      .selectAll("line")
      .data(d3.range(0, width, 40))
      .join("line")
      .attr("x1", d => d)
      .attr("y1", 0)
      .attr("x2", d => d)
      .attr("y2", height);

    svg.append("g")
      .attr("stroke", "#27272a")
      .attr("stroke-opacity", 0.2)
      .selectAll("line")
      .data(d3.range(0, height, 40))
      .join("line")
      .attr("x1", 0)
      .attr("y1", d => d)
      .attr("x2", width)
      .attr("y2", d => d);

    // Plot molecules as points in "Chemical Space"
    const points = molecules.map((m, i) => ({
      x: 50 + Math.random() * (width - 100),
      y: 50 + Math.random() * (height - 100),
      name: m.name,
      score: m.admet_score
    }));

    const node = svg.append("g")
      .selectAll("g")
      .data(points)
      .join("g")
      .attr("transform", d => `translate(${d.x}, ${d.y})`);

    node.append("circle")
      .attr("r", 6)
      .attr("fill", "#10b981")
      .attr("fill-opacity", 0.6)
      .attr("stroke", "#10b981")
      .attr("stroke-width", 2);

    node.append("text")
      .attr("dy", -10)
      .attr("text-anchor", "middle")
      .attr("fill", "#71717a")
      .attr("font-size", "8px")
      .text(d => d.name);

    // Add "Scanning" line
    const scanner = svg.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", height)
      .attr("stroke", "#10b981")
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.5);

    function animateScanner() {
      scanner
        .attr("x1", 0)
        .attr("x2", 0)
        .transition()
        .duration(3000)
        .ease(d3.easeLinear)
        .attr("x1", width)
        .attr("x2", width)
        .on("end", animateScanner);
    }
    animateScanner();

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("fill", "#white")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .text("AI EXPLORING CHEMICAL SPACE");

  }, [molecules]);

  return (
    <div className={cn("bg-zinc-950/50 rounded-2xl border border-zinc-800 p-4", className)}>
      <svg ref={svgRef} viewBox="0 0 400 200" className="w-full h-auto" />
      <div className="mt-2 text-[9px] text-zinc-500 text-center uppercase tracking-widest">
        Mapping potential molecular structures
      </div>
    </div>
  );
};
