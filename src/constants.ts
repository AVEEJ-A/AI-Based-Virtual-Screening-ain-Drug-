export interface DiscoveryTarget {
  id: string;
  name: string;
  description: string;
  commonName: string;
}

export interface ReferenceDrug {
  id: string;
  name: string;
  description: string;
  category: string;
}

export const TARGETS: DiscoveryTarget[] = [
  {
    id: "pf_dhfr",
    name: "Plasmodium falciparum DHFR",
    commonName: "Malaria Parasite Enzyme",
    description: "An essential enzyme the malaria parasite needs to multiply. Blocking this stops the infection."
  },
  {
    id: "sars_cov_2_mpro",
    name: "SARS-CoV-2 Main Protease (Mpro)",
    commonName: "COVID-19 Virus Replication Tool",
    description: "A key protein the COVID-19 virus uses to cut other proteins and replicate itself."
  },
  {
    id: "hiv_1_protease",
    name: "HIV-1 Protease",
    commonName: "HIV Virus Assembly Tool",
    description: "The 'scissors' the HIV virus uses to create mature, infectious virus particles."
  },
  {
    id: "egfr_kinase",
    name: "EGFR Kinase Domain",
    commonName: "Cancer Growth Signal",
    description: "A protein that, when overactive, tells cancer cells to grow and divide uncontrollably."
  }
];

export const REFERENCE_DRUGS: ReferenceDrug[] = [
  {
    id: "chloroquine",
    name: "Chloroquine",
    category: "Antimalarial",
    description: "A classic drug used to treat malaria by interfering with the parasite's waste disposal."
  },
  {
    id: "remdesivir",
    name: "Remdesivir",
    category: "Antiviral",
    description: "An antiviral drug that mimics genetic material to confuse and stop virus replication."
  },
  {
    id: "ritonavir",
    name: "Ritonavir",
    category: "Protease Inhibitor",
    description: "A drug that blocks the 'scissors' proteins used by viruses like HIV."
  },
  {
    id: "gefitinib",
    name: "Gefitinib",
    category: "Kinase Inhibitor",
    description: "A targeted therapy that blocks growth signals in certain types of lung cancer."
  }
];
