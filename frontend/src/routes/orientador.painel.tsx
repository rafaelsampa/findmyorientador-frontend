import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Inbox, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/shared/PageShell";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/orientador/painel")({
  component: PainelOrientadorPage,
  head: () => ({
    meta: [
      { title: "Painel do Orientador — FindMyOrientador" },
      {
        name: "description",
        content: "Veja e responda às solicitações de orientação recebidas.",
      },
    ],
  }),
});

type RequestStatus = "pendente" | "aceita" | "recusada";

interface SolicitacaoRow {
  id: string;
  aluno_id: string;
  mensagem: string;
  status: RequestStatus;
  created_at: string;
  profile: { id: string; full_name: string; email: string } | null;
  aluno: {
    id: string;
    curso: string | null;
    tema_interesse: string | null;
    resumo_tcc: string | null;
  } | null;
}

const FILTERS: { value: RequestStatus | "all"; label: string }[] = [
  { value: "pendente", label: "Pendentes" },
  { value: "aceita", label: "Aceitas" },
  { value: "recusada", label: "Recusadas" },
  { value: "all", label: "Todas" },
];

function PainelOrientadorPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session, profile, loading } = useProfile();

  const [filter, setFilter] = useState<RequestStatus | "all">("pendente");

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate({ to: "/login" });
      return;
    }
    if (profile?.role === "aluno") {
      navigate({ to: "/buscar" });
    }
  }, [loading, session, profile, navigate]);

  const requestsQuery = useQuery({
    queryKey: ["solicitacoes", "received", session?.user?.id],
    enabled: !!session?.user?.id && profile?.role === "orientador",
    queryFn: async (): Promise<SolicitacaoRow[]> => {
      const { data: requests, error } = await supabase
        .from("solicitacoes_contato")
        .select("id, aluno_id, mensagem, status, created_at")
        .eq("orientador_id", session!.user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!requests || requests.length === 0) return [];

      const alunoIds = Array.from(new Set(requests.map((r) => r.aluno_id)));

      const [profilesRes, alunosRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email").in("id", alunoIds),
        supabase.from("alunos").select("id, curso, tema_interesse, resumo_tcc").in("id", alunoIds),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      if (alunosRes.error) throw alunosRes.error;

      const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
      const alunoMap = new Map((alunosRes.data ?? []).map((a) => [a.id, a]));

      return requests.map((r) => ({
        id: r.id,
        aluno_id: r.aluno_id,
        mensagem: r.mensagem,
        status: r.status as RequestStatus,
        created_at: r.created_at,
        profile: profileMap.get(r.aluno_id) ?? null,
        aluno: alunoMap.get(r.aluno_id) ?? null,
      }));
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (args: { id: string; status: "aceita" | "recusada" }) => {
      const { error } = await supabase
        .from("solicitacoes_contato")
        .update({ status: args.status })
        .eq("id", args.id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      toast.success(vars.status === "aceita" ? "Solicitação aceita" : "Solicitação recusada");
      queryClient.invalidateQueries({
        queryKey: ["solicitacoes", "received", session?.user?.id],
      });
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error("Não foi possível atualizar a solicitação", {
        description: msg,
      });
    },
  });

  const counts = useMemo(() => {
    const data = requestsQuery.data ?? [];
    return {
      all: data.length,
      pendente: data.filter((r) => r.status === "pendente").length,
      aceita: data.filter((r) => r.status === "aceita").length,
      recusada: data.filter((r) => r.status === "recusada").length,
    };
  }, [requestsQuery.data]);

  const filtered = useMemo(() => {
    const data = requestsQuery.data ?? [];
    if (filter === "all") return data;
    return data.filter((r) => r.status === filter);
  }, [requestsQuery.data, filter]);

  if (loading || !session || profile?.role !== "orientador") {
    return (
      <PageShell>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center text-muted-foreground">
          Carregando...
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Painel do Orientador
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Veja as solicitações de orientação que você recebeu e responda aceitando ou recusando.
          </p>
        </header>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => {
            const selected = filter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                aria-pressed={selected}
                className={
                  selected
                    ? "inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-colors"
                    : "inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary"
                }
              >
                {f.label}
                <span
                  className={
                    selected
                      ? "rounded-full bg-primary-foreground/20 px-1.5 text-[10px] tabular-nums"
                      : "rounded-full bg-secondary px-1.5 text-[10px] tabular-nums text-secondary-foreground"
                  }
                >
                  {counts[f.value]}
                </span>
              </button>
            );
          })}
        </div>

        {requestsQuery.isLoading ? (
          <div className="py-16 text-center text-muted-foreground">Carregando solicitações...</div>
        ) : requestsQuery.error ? (
          <div className="py-16 text-center text-destructive">
            Não foi possível carregar as solicitações.
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState filter={filter} hasAny={counts.all > 0} />
        ) : (
          <ul className="space-y-3">
            {filtered.map((req) => (
              <li key={req.id}>
                <SolicitacaoCard
                  req={req}
                  onAccept={() => updateStatus.mutate({ id: req.id, status: "aceita" })}
                  onReject={() => updateStatus.mutate({ id: req.id, status: "recusada" })}
                  pending={updateStatus.isPending && updateStatus.variables?.id === req.id}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  );
}

interface SolicitacaoCardProps {
  req: SolicitacaoRow;
  onAccept: () => void;
  onReject: () => void;
  pending: boolean;
}

function SolicitacaoCard({ req, onAccept, onReject, pending }: SolicitacaoCardProps) {
  const name = req.profile?.full_name ?? "Aluno";
  const email = req.profile?.email;
  const curso = req.aluno?.curso;
  const tema = req.aluno?.tema_interesse;
  const resumo = req.aluno?.resumo_tcc;
  const when = format(new Date(req.created_at), "d 'de' MMM 'de' yyyy", {
    locale: ptBR,
  });

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
        <div
          aria-hidden
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
        >
          <User className="h-7 w-7" />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">{name}</h3>
            <StatusBadge status={req.status} />
            <span className="ml-auto text-xs text-muted-foreground">{when}</span>
          </div>

          {(curso || tema) && (
            <div className="space-y-0.5 text-xs text-muted-foreground">
              {curso && (
                <p>
                  <span className="font-medium text-foreground">Curso:</span> {curso}
                </p>
              )}
              {tema && (
                <p>
                  <span className="font-medium text-foreground">Tema:</span> {tema}
                </p>
              )}
            </div>
          )}

          {email && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              {email}
            </p>
          )}

          <section>
            <h4 className="mb-1 text-xs font-medium text-foreground">Mensagem</h4>
            <p className="whitespace-pre-wrap rounded-md bg-secondary/40 p-3 text-sm text-foreground">
              {req.mensagem}
            </p>
          </section>

          {resumo && (
            <details className="text-sm">
              <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
                Ver resumo do TCC
              </summary>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{resumo}</p>
            </details>
          )}

          {req.status === "pendente" && (
            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onReject}
                disabled={pending}
              >
                Recusar
              </Button>
              <Button type="button" size="sm" onClick={onAccept} disabled={pending}>
                {pending ? "Salvando..." : "Aceitar"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: RequestStatus }) {
  if (status === "aceita") {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-200">
        Aceita
      </Badge>
    );
  }
  if (status === "recusada") {
    return <Badge variant="destructive">Recusada</Badge>;
  }
  return <Badge variant="secondary">Pendente</Badge>;
}

function EmptyState({ filter, hasAny }: { filter: RequestStatus | "all"; hasAny: boolean }) {
  let title = "Nenhuma solicitação ainda";
  let body = "Quando um aluno enviar uma solicitação de orientação, ela aparecerá aqui.";

  if (hasAny) {
    if (filter === "pendente") {
      title = "Nenhuma solicitação pendente";
      body = "Todas as suas solicitações já foram respondidas.";
    } else if (filter === "aceita") {
      title = "Nenhuma solicitação aceita";
      body = "Você ainda não aceitou nenhuma solicitação neste momento.";
    } else if (filter === "recusada") {
      title = "Nenhuma solicitação recusada";
      body = "Você não recusou nenhuma solicitação até agora.";
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
      <Inbox className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
      <p className="text-base font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
