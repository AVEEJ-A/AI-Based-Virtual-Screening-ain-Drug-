import express from "express";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, "drug_discovery.db"));

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS molecules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    smiles TEXT NOT NULL,
    name TEXT,
    molecular_weight REAL,
    logp REAL,
    h_bond_donors INTEGER,
    h_bond_acceptors INTEGER,
    admet_score REAL,
    docking_score REAL,
    description TEXT,
    status TEXT DEFAULT 'candidate',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS simulations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_protein TEXT,
    reference_drug TEXT,
    molecules_generated INTEGER,
    top_candidate_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/molecules", (req, res) => {
    try {
      const molecules = db.prepare("SELECT * FROM molecules ORDER BY created_at DESC LIMIT 100").all();
      res.json(molecules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch molecules" });
    }
  });

  app.post("/api/molecules", (req, res) => {
    try {
      const { smiles, name, molecular_weight, logp, h_bond_donors, h_bond_acceptors, admet_score, docking_score, description, status } = req.body;
      const info = db.prepare(`
        INSERT INTO molecules (smiles, name, molecular_weight, logp, h_bond_donors, h_bond_acceptors, admet_score, docking_score, description, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(smiles, name, molecular_weight, logp, h_bond_donors, h_bond_acceptors, admet_score, docking_score, description, status);
      res.json({ id: info.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ error: "Failed to save molecule" });
    }
  });

  app.post("/api/simulations", (req, res) => {
    try {
      const { target_protein, reference_drug, molecules_generated, top_candidate_id } = req.body;
      const info = db.prepare(`
        INSERT INTO simulations (target_protein, reference_drug, molecules_generated, top_candidate_id)
        VALUES (?, ?, ?, ?)
      `).run(target_protein, reference_drug, molecules_generated, top_candidate_id);
      res.json({ id: info.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ error: "Failed to save simulation" });
    }
  });

  app.get("/api/stats", (req, res) => {
    try {
      const totalMolecules = db.prepare("SELECT COUNT(*) as count FROM molecules").get() as { count: number };
      const screenedMolecules = db.prepare("SELECT COUNT(*) as count FROM molecules WHERE status != 'candidate'").get() as { count: number };
      const avgDockingScore = db.prepare("SELECT AVG(docking_score) as avg FROM molecules WHERE docking_score IS NOT NULL").get() as { avg: number };
      res.json({ 
        totalMolecules: totalMolecules.count, 
        screenedMolecules: screenedMolecules.count, 
        avgDockingScore: avgDockingScore.avg || 0 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.delete("/api/reset", (req, res) => {
    try {
      db.prepare("DELETE FROM molecules").run();
      db.prepare("DELETE FROM simulations").run();
      res.json({ status: "success" });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset data" });
    }
  });

  // Vite middleware for development vs static serving for production
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    // Dynamic import to avoid loading Vite in production
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
