import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, Search, MessageSquare, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/shared/PageShell";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "FindMyOrientador — Encontre seu orientador de TCC" },
      {
        name: "description",
        content:
          "Conectamos alunos de graduação a orientadores disponíveis por áreas de pesquisa e métodos de ensino.",
      },
    ],
  }),
});

const steps = [
  {
    icon: Search,
    title: "1. Busque",
    text: "Pesquise orientadores por áreas de interesse, palavras-chave e métodos de ensino.",
  },
  {
    icon: UserCheck,
    title: "2. Compare",
    text: "Veja perfis detalhados de professores e identifique o melhor encaixe para o seu tema.",
  },
  {
    icon: MessageSquare,
    title: "3. Solicite contato",
    text: "Envie uma mensagem de interesse e aguarde a resposta do orientador.",
  },
];

function LandingPage() {
  return (
    <PageShell>
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-secondary/40 to-background">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:py-28">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            <GraduationCap className="h-3.5 w-3.5 text-primary" />
            Plataforma acadêmica de orientação de TCC
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Encontre o orientador certo para o seu TCC
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
            O FindMyOrientador aproxima alunos de graduação e professores disponíveis,
            com base em áreas de pesquisa, palavras-chave e métodos de ensino.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/cadastro">Sou Aluno</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/cadastro">Sou Orientador</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Como funciona</h2>
          <p className="mt-2 text-muted-foreground">Três passos simples para começar o seu TCC.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.title}
              className="rounded-lg border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
