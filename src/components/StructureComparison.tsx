import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { cn } from '../lib/utils';

interface StructureComparisonProps {
  targetName: string;
  drugName: string;
  isDocked?: boolean;
  className?: string;
}

export const StructureComparison: React.FC<StructureComparisonProps> = ({ 
  targetName, 
  drugName, 
  isDocked = false,
  className 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 400;
    const height = 250;

    // Create a "Lock" (Target Protein)
    const targetGroup = svg.append("g")
      .attr("class", "target-group");

    // The "Lock" shape - a large complex blob with a pocket
    const pocketPath = "M 150,50 Q 200,30 250,50 L 270,100 Q 280,150 250,200 L 150,200 Q 120,150 130,100 L 150,50 Z";
    // Add a "pocket" indentation
    const complexTargetShape = "M 100,50 C 150,20 250,20 300,50 C 350,80 350,170 300,200 C 250,230 150,230 100,200 C 50,170 50,80 100,50 M 180,100 C 190,90 210,90 220,100 C 230,110 230,130 220,140 C 210,150 190,150 180,140 C 170,130 170,110 180,100";

    targetGroup.append("path")
      .attr("d", complexTargetShape)
      .attr("fill", "#18181b")
      .attr("stroke", "#3f3f46")
      .attr("stroke-width", 2)
      .attr("fill-opacity", 0.8);

    // Add some "internal" structure to the protein (nodes/links)
    const proteinNodes = d3.range(20).map(i => ({ id: i }));
    const proteinLinks = d3.range(15).map(i => ({ 
      source: Math.floor(Math.random() * 20), 
      target: Math.floor(Math.random() * 20) 
    }));

    const proteinSim = d3.forceSimulation(proteinNodes as any)
      .force("link", d3.forceLink(proteinLinks).distance(20))
      .force("charge", d3.forceManyBody().strength(-10))
      .force("center", d3.forceCenter(200, 125))
      .stop();

    for (let i = 0; i < 50; ++i) proteinSim.tick();

    targetGroup.append("g")
      .attr("stroke", "#27272a")
      .attr("stroke-opacity", 0.4)
      .selectAll("line")
      .data(proteinLinks)
      .join("line")
      .attr("x1", (d: any) => d.source.x)
      .attr("y1", (d: any) => d.source.y)
      .attr("x2", (d: any) => d.target.x)
      .attr("y2", (d: any) => d.target.y);

    // Create the "Key" (Drug)
    const drugGroup = svg.append("g")
      .attr("class", "drug-group");

    const drugNodes = d3.range(6).map(i => ({ id: i }));
    const drugLinks = d3.range(5).map(i => ({ source: i, target: i + 1 }));

    const drugSim = d3.forceSimulation(drugNodes as any)
      .force("link", d3.forceLink(drugLinks).distance(15))
      .force("charge", d3.forceManyBody().strength(-20))
      .stop();

    for (let i = 0; i < 50; ++i) drugSim.tick();

    const drugX = isDocked ? 200 : 350;
    const drugY = isDocked ? 120 : 125;

    const drugVisual = drugGroup.append("g")
      .attr("transform", `translate(${drugX}, ${drugY})`);

    drugVisual.append("g")
      .attr("stroke", "#10b981")
      .attr("stroke-width", 2)
      .selectAll("line")
      .data(drugLinks)
      .join("line")
      .attr("x1", (d: any) => d.source.x)
      .attr("y1", (d: any) => d.source.y)
      .attr("x2", (d: any) => d.target.x)
      .attr("y2", (d: any) => d.target.y);

    drugVisual.append("g")
      .selectAll("circle")
      .data(drugNodes)
      .join("circle")
      .attr("r", 4)
      .attr("fill", "#10b981")
      .attr("cx", (d: any) => d.x)
      .attr("cy", (d: any) => d.y);

    // Labels
    svg.append("text")
      .attr("x", 100)
      .attr("y", 30)
      .attr("fill", "#71717a")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .attr("text-anchor", "middle")
      .text("TARGET PROTEIN");

    svg.append("text")
      .attr("x", 100)
      .attr("y", 45)
      .attr("fill", "#white")
      .attr("font-size", "12px")
      .attr("text-anchor", "middle")
      .text(targetName.split('(')[0]);

    if (!isDocked) {
      svg.append("text")
        .attr("x", 350)
        .attr("y", 30)
        .attr("fill", "#10b981")
        .attr("font-size", "10px")
        .attr("font-weight", "bold")
        .attr("text-anchor", "middle")
        .text("REFERENCE DRUG");

      svg.append("text")
        .attr("x", 350)
        .attr("y", 45)
        .attr("fill", "white")
        .attr("font-size", "12px")
        .attr("text-anchor", "middle")
        .text(drugName);
      
      // Arrow
      svg.append("path")
        .attr("d", "M 320,125 L 250,125")
        .attr("stroke", "#10b981")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4,4")
        .attr("marker-end", "url(#arrowhead)");
    } else {
      svg.append("text")
        .attr("x", 200)
        .attr("y", 240)
        .attr("fill", "#10b981")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .attr("text-anchor", "middle")
        .text("STABLE BINDING ACHIEVED");
    }

    // Arrowhead definition
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 8)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#10b981");

  }, [targetName, drugName, isDocked]);

  return (
    <div className={cn("bg-zinc-950/50 rounded-3xl border border-zinc-800 p-6 overflow-hidden", className)}>
      <svg ref={svgRef} viewBox="0 0 400 250" className="w-full h-auto" />
      <div className="mt-4 flex justify-between items-center px-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-zinc-800 border border-zinc-700" />
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Protein Pocket</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold">Drug Molecule</span>
        </div>
      </div>
    </div>
  );
};
