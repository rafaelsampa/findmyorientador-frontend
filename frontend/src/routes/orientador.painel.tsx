import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/shared/PageShell";

export const Route = createFileRoute("/orientador/painel")({
  component: () => (
    <PageShell>
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Painel do Orientador</h1>
        <p className="mt-3 text-muted-foreground">
          Esta tela será implementada na próxima iteração.
        </p>
      </div>
    </PageShell>
  ),
});
