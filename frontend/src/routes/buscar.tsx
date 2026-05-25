import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Search, User, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PageShell } from "@/components/shared/PageShell";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/buscar")({
  component: BuscarPage,
  head: () => ({
    meta: [
      { title: "Buscar Orientadores — FindMyOrientador" },
      {
        name: "description",
        content: "Encontre orientadores disponíveis para seu TCC.",
      },
    ],
  }),
});

interface OrientadorProfile {
  id: string;
  full_name: string;
  email: string;
  bio: string | null;
}

interface OrientadorRow {
  id: string;
  areas: string[] | null;
  metodos_ensino: string[] | null;
  portfolio_url: string | null;
  aceita_novos_orientandos: boolean;
  profiles: OrientadorProfile | null;
}

const contactSchema = z.object({
  mensagem: z
    .string()
    .trim()
    .min(10, "A mensagem deve ter pelo menos 10 caracteres")
    .max(1000, "Máximo de 1000 caracteres"),
});
type ContactInput = z.infer<typeof contactSchema>;

function BuscarPage() {
  const navigate = useNavigate();
  const { session, profile, loading } = useProfile();

  const [query, setQuery] = useState("");
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [openOrientador, setOpenOrientador] = useState<OrientadorRow | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate({ to: "/login" });
      return;
    }
    if (profile?.role === "orientador") {
      navigate({ to: "/orientador/painel" });
    }
  }, [loading, session, profile, navigate]);

  const orientadoresQuery = useQuery({
    queryKey: ["orientadores", "available"],
    enabled: !!session && profile?.role === "aluno",
    queryFn: async (): Promise<OrientadorRow[]> => {
      const { data, error } = await supabase
        .from("orientadores")
        .select(
          "id, areas, metodos_ensino, portfolio_url, aceita_novos_orientandos, profiles(id, full_name, email, bio)",
        )
        .eq("aceita_novos_orientandos", true);
      if (error) throw error;
      return (data ?? []) as unknown as OrientadorRow[];
    },
  });

  const myRequestsQuery = useQuery({
    queryKey: ["solicitacoes", "by-aluno", session?.user?.id],
    enabled: !!session?.user?.id && profile?.role === "aluno",
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("solicitacoes_contato")
        .select("orientador_id")
        .eq("aluno_id", session!.user.id);
      if (error) throw error;
      return (data ?? []).map((r: { orientador_id: string }) => r.orientador_id);
    },
  });

  const contactedSet = useMemo(
    () => new Set(myRequestsQuery.data ?? []),
    [myRequestsQuery.data],
  );

  const allAreas = useMemo(() => {
    const set = new Set<string>();
    for (const o of orientadoresQuery.data ?? []) {
      for (const a of o.areas ?? []) set.add(a);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [orientadoresQuery.data]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return (orientadoresQuery.data ?? []).filter((o) => {
      if (selectedAreas.length > 0) {
        const areas = o.areas ?? [];
        if (!selectedAreas.every((sel) => areas.includes(sel))) return false;
      }
      if (term) {
        const name = (o.profiles?.full_name ?? "").toLowerCase();
        const areasJoined = (o.areas ?? []).join(" ").toLowerCase();
        if (!name.includes(term) && !areasJoined.includes(term)) return false;
      }
      return true;
    });
  }, [orientadoresQuery.data, query, selectedAreas]);

  const toggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
    );
  };

  if (loading || !session || profile?.role !== "aluno") {
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
            Buscar Orientadores
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Filtre por nome ou áreas de atuação e clique em um perfil para enviar uma solicitação.
          </p>
        </header>

        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome ou área..."
            className="pl-9"
          />
        </div>

        {allAreas.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {allAreas.map((area) => {
              const selected = selectedAreas.includes(area);
              return (
                <button
                  key={area}
                  type="button"
                  onClick={() => toggleArea(area)}
                  aria-pressed={selected}
                  className={
                    selected
                      ? "rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-colors"
                      : "rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary"
                  }
                >
                  {area}
                </button>
              );
            })}
            {selectedAreas.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedAreas([])}
                className="rounded-full px-3 py-1 text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}

        {orientadoresQuery.isLoading ? (
          <div className="py-16 text-center text-muted-foreground">
            Carregando orientadores...
          </div>
        ) : orientadoresQuery.error ? (
          <div className="py-16 text-center text-destructive">
            Não foi possível carregar os orientadores.
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
            <p className="text-base font-medium text-foreground">
              Nenhum orientador encontrado
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tente ajustar os filtros ou limpar a busca.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((o) => (
              <li key={o.id}>
                <OrientadorCard
                  orientador={o}
                  alreadyContacted={contactedSet.has(o.id)}
                  onOpen={() => setOpenOrientador(o)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <OrientadorDialog
        orientador={openOrientador}
        alreadyContacted={
          openOrientador ? contactedSet.has(openOrientador.id) : false
        }
        alunoId={session.user.id}
        onClose={() => setOpenOrientador(null)}
      />
    </PageShell>
  );
}

interface OrientadorCardProps {
  orientador: OrientadorRow;
  alreadyContacted: boolean;
  onOpen: () => void;
}

function OrientadorCard({ orientador, alreadyContacted, onOpen }: OrientadorCardProps) {
  const name = orientador.profiles?.full_name ?? "Orientador";
  const bio = orientador.profiles?.bio;
  const areas = orientador.areas ?? [];

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
        <div
          aria-hidden
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
        >
          <User className="h-7 w-7" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">{name}</h3>
            {alreadyContacted && (
              <Badge variant="secondary" className="text-[10px]">
                Solicitação enviada
              </Badge>
            )}
          </div>

          {areas.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {areas.map((a) => (
                <li
                  key={a}
                  className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                >
                  {a}
                </li>
              ))}
            </ul>
          )}

          {bio && (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{bio}</p>
          )}
        </div>

        <div className="shrink-0 sm:self-center">
          <Button size="sm" variant="outline" onClick={onOpen}>
            Ver detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface OrientadorDialogProps {
  orientador: OrientadorRow | null;
  alreadyContacted: boolean;
  alunoId: string;
  onClose: () => void;
}

function OrientadorDialog({
  orientador,
  alreadyContacted,
  alunoId,
  onClose,
}: OrientadorDialogProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { mensagem: "" },
  });

  useEffect(() => {
    if (orientador) reset({ mensagem: "" });
  }, [orientador, reset]);

  const sendRequest = useMutation({
    mutationFn: async (values: ContactInput) => {
      if (!orientador) throw new Error("Orientador inválido");
      const { error } = await supabase.from("solicitacoes_contato").insert({
        aluno_id: alunoId,
        orientador_id: orientador.id,
        mensagem: values.mensagem,
        status: "pendente",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitação enviada");
      queryClient.invalidateQueries({
        queryKey: ["solicitacoes", "by-aluno", alunoId],
      });
      onClose();
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error("Não foi possível enviar a solicitação", { description: msg });
    },
  });

  const open = !!orientador;
  const name = orientador?.profiles?.full_name ?? "";
  const areas = orientador?.areas ?? [];
  const metodos = orientador?.metodos_ensino ?? [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        {orientador && (
          <>
            <DialogHeader>
              <DialogTitle>{name}</DialogTitle>
              <DialogDescription>{orientador.profiles?.email}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {orientador.profiles?.bio && (
                <section>
                  <h4 className="mb-1 text-sm font-medium text-foreground">Sobre</h4>
                  <p className="text-sm text-muted-foreground">
                    {orientador.profiles.bio}
                  </p>
                </section>
              )}

              {areas.length > 0 && (
                <section>
                  <h4 className="mb-2 text-sm font-medium text-foreground">
                    Áreas de atuação
                  </h4>
                  <ul className="flex flex-wrap gap-1.5">
                    {areas.map((a) => (
                      <li
                        key={a}
                        className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                      >
                        {a}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {metodos.length > 0 && (
                <section>
                  <h4 className="mb-2 text-sm font-medium text-foreground">
                    Métodos de ensino
                  </h4>
                  <ul className="flex flex-wrap gap-1.5">
                    {metodos.map((m) => (
                      <li
                        key={m}
                        className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                      >
                        {m}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {orientador.portfolio_url && (
                <section>
                  <h4 className="mb-1 text-sm font-medium text-foreground">Portfólio</h4>
                  <a
                    href={orientador.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 break-all text-sm text-primary hover:underline"
                  >
                    {orientador.portfolio_url}
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </section>
              )}

              <section className="border-t border-border pt-4">
                <h4 className="mb-2 text-sm font-medium text-foreground">
                  Solicitar contato
                </h4>
                {alreadyContacted ? (
                  <p className="text-sm text-muted-foreground">
                    Você já enviou uma solicitação para este orientador.
                  </p>
                ) : (
                  <form
                    onSubmit={handleSubmit((v) => sendRequest.mutate(v))}
                    className="space-y-3"
                  >
                    <Textarea
                      rows={5}
                      placeholder="Apresente-se brevemente e explique seu interesse..."
                      {...register("mensagem")}
                    />
                    {errors.mensagem && (
                      <p className="text-xs text-destructive">
                        {errors.mensagem.message}
                      </p>
                    )}
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                      <Button type="button" variant="outline" onClick={onClose}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={sendRequest.isPending}>
                        {sendRequest.isPending ? "Enviando..." : "Enviar solicitação"}
                      </Button>
                    </div>
                  </form>
                )}
              </section>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
