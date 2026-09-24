// Everything personal lives here. Edit this file to change your name, links, and About page.

export const site = {
  name: "Tomer Weissman",
  headline: "ML Engineer",
  // Used for canonical URLs and the sitemap — replace once you have a domain
  url: "https://tomerweissman.github.io",
  description:
    "Tomer Weissman — ML engineer. Research replications, LLM pipelines, and applied machine learning.",
  intro:
    "I build machine learning systems end to end — from reproducing research results to shipping LLM pipelines that run on real data.",
  location: "San Francisco, CA",
  email: "weissmantomer@gmail.com",
  links: {
    github: "https://github.com/TomerWeissman",
    linkedin: "https://linkedin.com/in/tomerweissman",
  },
};

export const about = {
  bio: [
    "I'm an ML engineer and Data Science student at Minerva University, based in San Francisco. I like problems where the model is only half the work — the other half is the data pipeline, the evaluation, and making it hold up outside a notebook.",
    "I've built multi-agent LLM pipelines that extract structured data from hundreds of thousands of real estate listings, multimodal price-prediction models, and text-quality scoring for pre-training data. Minerva's rotation has had me studying and working across the U.S., Korea, Taiwan, Argentina, and Germany.",
  ],
  experience: [
    {
      role: "Founder — AI/ML Engineer",
      org: "Dativon",
      when: "2025 — Present",
      summary: "Multi-agent LLM pipeline classifying and extracting structured data from 500K+ real estate listings; geospatial data pipeline with census integration.",
    },
    {
      role: "Software Engineering Intern",
      org: "Mason",
      when: "2026 — Present",
      summary: "Auto-fix pipeline linking Elastic, Sentry, Intercom, and PostHog to detect bugs and open fix PRs; restored OpenTelemetry monitoring across 24+ orgs.",
    },
    {
      role: "AI Research Consultant",
      org: "Adobe (via 180 Degrees Consulting)",
      when: "2024 — 2025",
      summary: "Co-authored a 40-page whitepaper on multi-agent AI systems: architectures, coordination, and governance.",
    },
    {
      role: "AI Product Developer",
      org: "Authme",
      when: "2024",
      summary: "NLP pipeline extracting entities and financial metrics from 1,000+ unstructured documents, cutting analysis time by 70%.",
    },
  ],
  education: [
    {
      role: "B.S., Minerva University",
      org: "Concentrations: Data Science & Statistics; Strategic Finance",
      when: "2023 — 2027",
      summary: "Coursework in machine learning, Bayesian statistics, algorithms, and probability. TA for Multivariable Calculus.",
    },
  ],
  skills: {
    "ML / AI": ["PyTorch", "TensorFlow", "scikit-learn", "XGBoost", "HuggingFace", "LLM pipelines", "Computer vision", "NLP"],
    Engineering: ["Python", "SQL", "TypeScript", "FastAPI", "Docker", "Git"],
    Data: ["pandas", "NumPy", "DuckDB", "geopandas", "Statistics"],
  },
};
