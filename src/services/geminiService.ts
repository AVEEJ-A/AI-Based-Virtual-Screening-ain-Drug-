import { GoogleGenAI, Type } from "@google/genai";

// Safe access to environment variables in both browser and node
const getApiKey = () => {
  try {
    return process.env.GEMINI_API_KEY || "";
  } catch (e) {
    return "";
  }
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export interface Molecule {
  id?: number;
  smiles: string;
  name: string;
  molecular_weight: number;
  logp: number;
  h_bond_donors: number;
  h_bond_acceptors: number;
  admet_score: number;
  docking_score?: number;
  status: 'candidate' | 'screened' | 'docked';
  description?: string;
}

export async function generateMolecules(referenceDrug: string, targetProtein: string): Promise<Molecule[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are an AI drug discovery assistant. 
    Target: ${targetProtein}
    Reference Drug: ${referenceDrug}
    
    Generate 5 potential drug candidate molecules (SMILES strings) that might be effective against this target, inspired by the reference drug.
    
    For each molecule, provide:
    1. A unique, catchy name (e.g., "Astra-101").
    2. SMILES string.
    3. Molecular Weight (MW).
    4. LogP (how well it dissolves in fat vs water).
    5. Hydrogen Bond Donors.
    6. Hydrogen Bond Acceptors.
    7. ADMET score (0-1, safety/absorption estimate).
    8. A "Common Person" description of what makes this molecule special.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            smiles: { type: Type.STRING },
            molecular_weight: { type: Type.NUMBER },
            logp: { type: Type.NUMBER },
            h_bond_donors: { type: Type.INTEGER },
            h_bond_acceptors: { type: Type.INTEGER },
            admet_score: { type: Type.NUMBER },
            description: { type: Type.STRING, description: "Simple explanation for non-scientists" },
          },
          required: ["name", "smiles", "molecular_weight", "logp", "h_bond_donors", "h_bond_acceptors", "admet_score", "description"]
        }
      }
    }
  });

  try {
    const data = JSON.parse(response.text || "[]");
    return data.map((m: any) => ({ ...m, status: 'candidate' }));
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return [];
  }
}

export async function performDocking(molecule: Molecule, targetProtein: string): Promise<number> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Simulate molecular docking for the molecule ${molecule.name} (${molecule.smiles}) against the target protein ${targetProtein}. 
    Provide a docking score (binding affinity) in kcal/mol. Usually between -5.0 and -12.0 for good candidates. Return only the number.`,
  });

  const score = parseFloat(response.text?.match(/-?\d+\.\d+/)?.[0] || "-7.5");
  return score;
}

export async function getDiscoveryInsights(topMolecule: Molecule, targetProtein: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Provide a brief scientific summary of why the molecule ${topMolecule.name} (${topMolecule.smiles}) is a promising candidate for ${targetProtein}. 
    Mention its ADMET properties and binding affinity of ${topMolecule.docking_score} kcal/mol.`,
  });

  return response.text || "No insights available.";
}
