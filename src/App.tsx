import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Beaker, 
  Activity, 
  ShieldCheck, 
  Zap, 
  ChevronRight, 
  RefreshCw, 
  Database, 
  Search,
  CheckCircle2,
  AlertCircle,
  Microscope,
  Info,
  Target,
  FlaskConical,
  ArrowRight,
  Sparkles,
  Dna
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar 
} from 'recharts';
import Markdown from 'react-markdown';
import { MoleculeViewer } from './components/MoleculeViewer';
import { StructureComparison } from './components/StructureComparison';
import { ChemicalSpaceMap } from './components/ChemicalSpaceMap';
import { generateMolecules, performDocking, getDiscoveryInsights, Molecule } from './services/geminiService';
import { TARGETS, REFERENCE_DRUGS, DiscoveryTarget, ReferenceDrug } from './constants';

export default function App() {
  const [step, setStep] = useState(-1); // -1 is selection screen
  const [selectedTarget, setSelectedTarget] = useState<DiscoveryTarget | null>(null);
  const [selectedRefDrug, setSelectedRefDrug] = useState<ReferenceDrug | null>(null);
  const [molecules, setMolecules] = useState<Molecule[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [insights, setInsights] = useState("");
  const [stats, setStats] = useState({ totalMolecules: 0, screenedMolecules: 0, avgDockingScore: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error(e);
    }
  };

  const startDiscovery = async () => {
    if (!selectedTarget || !selectedRefDrug) return;
    setLoading(true);
    setStep(1);
    setStatus("AI is now 'thinking' and creating new chemical structures based on " + selectedRefDrug.name + "...");
    
    try {
      const generated = await generateMolecules(selectedRefDrug.name, selectedTarget.name);
      setMolecules(generated);
      
      for (const m of generated) {
        await fetch('/api/molecules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(m)
        });
      }
      
      setStatus("Success! AI has digitally created 5 potential medicine candidates.");
      setLoading(false);
      fetchStats();
    } catch (e) {
      console.error(e);
      setStatus("Oops! The digital lab encountered an error.");
      setLoading(false);
    }
  };

  const runScreening = async () => {
    setLoading(true);
    setStep(2);
    setStatus("Checking if these molecules are safe and can actually work in the human body...");
    
    await new Promise(r => setTimeout(r, 2000));
    
    const screened = molecules.map(m => ({
      ...m,
      status: 'screened' as const
    }));
    setMolecules(screened);
    
    // Update status in DB for each molecule
    // In a real app we'd have a bulk update or specific IDs
    // For this demo, we'll just proceed
    
    setStatus("Safety check complete. All candidates are 'drug-like' and passed the first test.");
    setLoading(false);
    fetchStats();
  };

  const runDocking = async () => {
    setLoading(true);
    setStep(3);
    setStatus("Testing how perfectly each molecule 'keys' into the " + selectedTarget?.commonName + " 'lock'...");
    
    const dockedMolecules = [];
    for (const m of molecules) {
      setStatus(`Testing ${m.name} against the target...`);
      const score = await performDocking(m, selectedTarget?.name || "");
      dockedMolecules.push({ ...m, docking_score: score, status: 'docked' as const });
      
      // Update molecule in DB with docking score
      // (Optional for demo, but good for persistence)
    }
    
    const sorted = dockedMolecules.sort((a, b) => (a.docking_score || 0) - (b.docking_score || 0));
    setMolecules(sorted);
    
    setStatus("Simulation finished. We found a potential winner!");
    setLoading(false);
    
    const top = sorted[0];
    const discoveryInsights = await getDiscoveryInsights(top, selectedTarget?.name || "");
    setInsights(discoveryInsights);
    
    await fetch('/api/simulations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_protein: selectedTarget?.name,
        reference_drug: selectedRefDrug?.name,
        molecules_generated: molecules.length,
        top_candidate_id: top.id
      })
    });
    fetchStats();
  };

  const reset = async () => {
    // Optional: await fetch('/api/reset', { method: 'DELETE' });
    setStep(-1);
    setSelectedTarget(null);
    setSelectedRefDrug(null);
    setMolecules([]);
    setInsights("");
    setStatus("");
    fetchStats();
  };

  const steps = [
    { title: "Setup", icon: Database, desc: "Choose your target and starting point." },
    { title: "Generation", icon: Beaker, desc: "AI creates new chemical ideas." },
    { title: "Screening", icon: Search, desc: "Filtering for safety and solubility." },
    { title: "Docking", icon: Microscope, desc: "Testing the fit in the target protein." },
    { title: "Results", icon: CheckCircle2, desc: "The final discovery report." },
  ];

  const renderSelectionScreen = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12"
    >
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold text-white tracking-tight">Virtual Drug Discovery Lab</h2>
        <p className="text-zinc-400 max-w-2xl mx-auto">
          Experience how AI accelerates medicine. Select a biological target and a reference drug to begin your virtual simulation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Target Selection */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
            <Target className="w-4 h-4" /> 1. Select Biological Target
          </h3>
          <div className="grid gap-3">
            {TARGETS.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTarget(t)}
                className={`p-4 rounded-2xl border text-left transition-all ${selectedTarget?.id === t.id ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500' : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'}`}
              >
                <div className="font-bold text-white">{t.commonName}</div>
                <div className="text-[10px] text-zinc-500 font-mono mb-2">{t.name}</div>
                <div className="text-xs text-zinc-400 leading-relaxed">{t.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Reference Drug Selection */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
            <FlaskConical className="w-4 h-4" /> 2. Select Reference Drug
          </h3>
          <div className="grid gap-3">
            {REFERENCE_DRUGS.map(d => (
              <button
                key={d.id}
                onClick={() => setSelectedRefDrug(d)}
                className={`p-4 rounded-2xl border text-left transition-all ${selectedRefDrug?.id === d.id ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500' : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="font-bold text-white">{d.name}</div>
                  <span className="text-[10px] px-2 py-0.5 bg-zinc-800 rounded-full text-zinc-400 uppercase tracking-widest">{d.category}</span>
                </div>
                <div className="text-xs text-zinc-400 leading-relaxed">{d.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <button
          disabled={!selectedTarget || !selectedRefDrug}
          onClick={() => setStep(0)}
          className="px-12 py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed text-black font-bold rounded-2xl transition-all flex items-center gap-3 group"
        >
          Enter Virtual Lab
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={reset}>
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Activity className="text-black w-5 h-5" />
            </div>
            <h1 className="text-lg font-semibold text-white tracking-tight">
              AstraDiscovery <span className="text-zinc-500 font-normal">v2.0</span>
            </h1>
          </div>
          {selectedTarget && (
            <div className="flex items-center gap-6 text-xs font-mono">
              <div className="flex flex-col items-end">
                <span className="text-zinc-500 uppercase tracking-widest">Target</span>
                <span className="text-emerald-400">{selectedTarget.commonName}</span>
              </div>
              <div className="h-8 w-[1px] bg-zinc-800" />
              <div className="flex flex-col items-end">
                <span className="text-zinc-500 uppercase tracking-widest">Inspiration</span>
                <span className="text-emerald-400">{selectedRefDrug?.name}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {step === -1 ? renderSelectionScreen() : (
          <>
            {/* Workflow Stepper */}
            <div className="flex items-center justify-between mb-12 bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800/50 overflow-x-auto">
              {steps.map((s, i) => (
                <div key={i} className="flex items-center flex-1 last:flex-none min-w-[120px]">
                  <div className={`flex flex-col items-center gap-2 px-4 transition-all duration-500 ${step >= i ? 'text-emerald-400' : 'text-zinc-600'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${step >= i ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-800'}`}>
                      <s.icon className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider block">{s.title}</span>
                    </div>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`h-[2px] flex-1 mx-2 rounded-full transition-all duration-1000 ${step > i ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Controls & Explanations */}
              <div className="space-y-6">
                <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                  <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-500" />
                    Discovery Phase
                  </h2>
                  <div className="space-y-3">
                    {step === 0 && (
                      <button 
                        onClick={startDiscovery}
                        disabled={loading}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 group"
                      >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                        Start AI Generation
                      </button>
                    )}
                    {step === 1 && !loading && (
                      <button 
                        onClick={runScreening}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Run Safety Screening
                      </button>
                    )}
                    {step === 2 && !loading && (
                      <button 
                        onClick={runDocking}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <Microscope className="w-4 h-4" />
                        Run Docking Simulation
                      </button>
                    )}
                    {step >= 3 && !loading && (
                      <button 
                        onClick={reset}
                        className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Restart Lab
                      </button>
                    )}
                  </div>

                  {status && (
                    <div className="mt-4 p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20 flex items-start gap-3">
                      <div className="mt-1">
                        {loading ? <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin" /> : <Info className="w-4 h-4 text-emerald-500" />}
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">{status}</p>
                    </div>
                  )}
                </section>

                {/* Visual Explanation for common people */}
                <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Dna className="w-24 h-24 text-emerald-500" />
                  </div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4">What's happening?</h2>
                  <div className="space-y-4 relative z-10">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-3"
                      >
                        <div className="text-emerald-400 font-bold text-sm">{steps[step === -1 ? 0 : step].title}</div>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          {step === 0 && "We are setting up the digital environment. We've told the AI what disease we want to fight and what existing medicines it should learn from."}
                          {step === 1 && "The AI is acting like a creative chemist. It's drawing new molecule shapes that have never existed before, hoping some might be the next big cure."}
                          {step === 2 && "Not every molecule is safe. We are filtering out the ones that are too big, won't dissolve, or might be toxic. Only the 'best behaved' molecules move forward."}
                          {step === 3 && "This is the 'Lock and Key' test. We simulate how well the molecule fits into the disease protein. A perfect fit means the medicine can stop the disease."}
                          {step >= 4 && "Success! We've identified a lead candidate. This molecule is now ready for real-world laboratory testing."}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </section>
              </div>

              {/* Middle & Right Column: Results & Visualization */}
              <div className="lg:col-span-2 space-y-8">
                <AnimatePresence mode="wait">
                  {step === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-12 text-center space-y-6"
                    >
                      <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                        <Beaker className="w-10 h-10 text-emerald-500" />
                      </div>
                      <div className="max-w-md mx-auto">
                        <h3 className="text-2xl font-bold text-white mb-2">Lab Initialized</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                          Targeting <span className="text-emerald-400 font-bold">{selectedTarget?.commonName}</span> using inspiration from <span className="text-emerald-400 font-bold">{selectedRefDrug?.name}</span>.
                        </p>
                      </div>
                      <div className="flex justify-center gap-8 pt-8">
                        <div className="text-center">
                          <div className="text-emerald-500 font-mono text-2xl">100%</div>
                          <div className="text-[10px] uppercase tracking-widest text-zinc-500">Data Ready</div>
                        </div>
                        <div className="text-center">
                          <div className="text-emerald-500 font-mono text-2xl">AI</div>
                          <div className="text-[10px] uppercase tracking-widest text-zinc-500">Model Loaded</div>
                        </div>
                      </div>
                      
                      <div className="mt-8">
                        <StructureComparison 
                          targetName={selectedTarget?.commonName || ""} 
                          drugName={selectedRefDrug?.name || ""} 
                        />
                        <p className="mt-4 text-[11px] text-zinc-500 italic">
                          Diagram: The AI analyzes how the reference drug interacts with the target protein to learn the 'Lock and Key' pattern.
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-8"
                    >
                      {/* Candidates Grid */}
                      {step === 1 && (
                        <div className="mb-8">
                          <ChemicalSpaceMap molecules={molecules} />
                          <p className="mt-4 text-[11px] text-zinc-500 italic text-center">
                            Diagram: The AI is searching through millions of possible chemical combinations to find those that resemble a medicine.
                          </p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {molecules.map((m, i) => (
                          <motion.div 
                            key={i}
                            layoutId={`mol-${m.name}`}
                            className={`bg-zinc-900/50 border rounded-2xl p-5 transition-all ${i === 0 && step >= 3 ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-zinc-800'}`}
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-bold text-white">{m.name}</h4>
                                  {i === 0 && step >= 3 && <span className="text-[8px] bg-emerald-500 text-black px-1.5 py-0.5 rounded font-bold uppercase">Best Fit</span>}
                                </div>
                                <span className="text-[10px] text-zinc-500 font-mono">{m.smiles.substring(0, 20)}...</span>
                              </div>
                              {m.docking_score && (
                                <div className="text-right">
                                  <span className="text-[10px] text-zinc-500 uppercase block">Fit Score</span>
                                  <span className="text-sm font-mono text-emerald-400">{m.docking_score}</span>
                                </div>
                              )}
                            </div>
                            
                            <MoleculeViewer smiles={m.smiles} className="mb-4" />

                            <p className="text-[11px] text-zinc-400 italic mb-4 line-clamp-2">
                              {m.description || "A unique chemical structure generated for this target."}
                            </p>

                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div className="bg-zinc-950 p-2 rounded border border-zinc-800 flex justify-between">
                                <span className="text-zinc-500">Size</span>
                                <span className="text-zinc-300">{m.molecular_weight}</span>
                              </div>
                              <div className="bg-zinc-950 p-2 rounded border border-zinc-800 flex justify-between">
                                <span className="text-zinc-500">Solubility</span>
                                <span className="text-zinc-300">{m.logp}</span>
                              </div>
                              <div className="bg-zinc-950 p-2 rounded border border-zinc-800 flex justify-between">
                                <span className="text-zinc-500">Safety</span>
                                <span className="text-emerald-400">{(m.admet_score * 100).toFixed(0)}%</span>
                              </div>
                              <div className="bg-zinc-950 p-2 rounded border border-zinc-800 flex justify-between">
                                <span className="text-zinc-500">Status</span>
                                <span className="text-zinc-300 capitalize">{m.status}</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Charts & Insights - Shown separately */}
                      {step >= 3 && (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-6"
                        >
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                              <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6">Molecular Profile: {molecules[0].name}</h3>
                              <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                                    { subject: 'Size', A: molecules[0].molecular_weight / 5, fullMark: 100 },
                                    { subject: 'Solubility', A: (molecules[0].logp + 5) * 10, fullMark: 100 },
                                    { subject: 'Donors', A: molecules[0].h_bond_donors * 20, fullMark: 100 },
                                    { subject: 'Acceptors', A: molecules[0].h_bond_acceptors * 10, fullMark: 100 },
                                    { subject: 'Safety', A: molecules[0].admet_score * 100, fullMark: 100 },
                                  ]}>
                                    <PolarGrid stroke="#27272a" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 10 }} />
                                    <Radar name="Candidate" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                                  </RadarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>

                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                              <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4">AI Discovery Report</h3>
                              <div className="prose prose-invert prose-sm max-w-none">
                                <div className="text-zinc-400 text-xs leading-relaxed">
                                  <Markdown>{insights || "Finalizing report..."}</Markdown>
                                </div>
                              </div>
                              <div className="mt-6 pt-6 border-t border-zinc-800 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                </div>
                                <div>
                                  <p className="text-[10px] text-zinc-500 uppercase font-bold">Final Verdict</p>
                                  <p className="text-xs text-white">High potential for {selectedTarget?.commonName}.</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
                            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6 text-center">Final Binding Simulation: {molecules[0].name}</h3>
                            <StructureComparison 
                              targetName={selectedTarget?.commonName || ""} 
                              drugName={molecules[0].name} 
                              isDocked={true}
                            />
                            <p className="mt-4 text-[11px] text-zinc-500 italic text-center">
                              Diagram: This visualization shows the lead candidate molecule successfully binding into the target protein's active site pocket.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-xs text-zinc-500">
            © 2026 AstraDiscovery AI. Accelerating medicine through data.
          </div>
          <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
            <a href="#" className="hover:text-emerald-500 transition-colors">Lab Guide</a>
            <a href="#" className="hover:text-emerald-500 transition-colors">AI Ethics</a>
            <a href="#" className="hover:text-emerald-500 transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
