import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Movimento | Gestão de treino",
    template: "%s | Movimento",
  },
  description: "Plataforma para academias acompanharem alunos, professores e treinos.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
