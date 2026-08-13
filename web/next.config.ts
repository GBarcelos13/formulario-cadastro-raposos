import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  experimental: {
    serverActions: {
      // Padrão do Next.js é 1MB — muito pouco para os anexos do formulário
      // de matrícula (até 4 arquivos de 5MB cada). Ver
      // src/lib/schemas/solicitacao.ts para os limites por arquivo.
      bodySizeLimit: "25mb",
    },
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/matricula",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
