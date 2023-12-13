type ISampleRepo = {
  repo: string;
  shortName: string;
  displayName: string;
};

export const SAMPLE_REPOS: ISampleRepo[] = [
  {
    repo: "Significant-Gravitas/Auto-GPT",
    shortName: "autoGPT",
    displayName: "🤖  autoGPT",
  },
  {
    repo: "mit-pdos/xv6-riscv",
    shortName: "xv6",
    displayName: "💾  xv6 RISC-V",
  },
  {
    repo: "pallets/flask",
    shortName: "flask",
    displayName: "🌐  flask",
  },
  {
    repo: "facebook/react",
    shortName: "react",
    displayName: "⚛️  React JS",
  },
  {
    repo: "pandas-dev/pandas",
    shortName: "pandas",
    displayName: "🐼  Pandas",
  },
  {
    repo: "hwchase17/langchain",
    shortName: "langchain",
    displayName: "🦜  langchain",
  }
];

export const API_BASE="https://dprnu1tro5.execute-api.us-east-1.amazonaws.com/prod/v1"