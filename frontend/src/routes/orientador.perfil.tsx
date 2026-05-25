import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/shared/PageShell";
import { TagInput } from "@/components/shared/TagInput";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/orientador/perfil")({
  component: OrientadorPerfilPage,
  head: () => ({
    meta: [
      { title: "Perfil do Orientador — FindMyOrientador" },
      { name: "description", content: "Configure seu perfil de orientador acadêmico." },
    ],
  }),
});

const orientadorSchema = z.object({
  areas: z.array(z.string().min(1)).min(1, "Informe ao menos uma área"),
  metodos_ensino: z.array(z.string().min(1)),
  portfolio_url: z
    .string()
    .trim()
    .url("URL inválida")
    .max(500)
    .optional()
    .or(z.literal("")),
  aceita_novos_orientandos: z.boolean(),
});

type OrientadorInput = z.infer<typeof orientadorSchema>;

function OrientadorPerfilPage() {
  const navigate = useNavigate();
  const { session, profile, loading } = useProfile();
  const [loadingRow, setLoadingRow] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrientadorInput>({
    resolver: zodResolver(orientadorSchema),
    defaultValues: {
      areas: [],
      metodos_ensino: [],
      portfolio_url: "",
      aceita_novos_orientandos: true,
    },
  });

  // Auth + role guard
  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate({ to: "/login" });
      return;
    }
    if (profile?.role === "aluno") {
      navigate({ to: "/aluno/perfil" });
    }
  }, [loading, session, profile, navigate]);

  // Load existing orientador row
  useEffect(() => {
    if (!session?.user?.id || profile?.role !== "orientador") return;
    let cancelled = false;
    (async () => {
      setLoadingRow(true);
      const { data, error } = await supabase
        .from("orientadores")
        .select("areas, metodos_ensino, portfolio_url, aceita_novos_orientandos")
        .eq("id", session.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error("load orientador error:", error);
      } else if (data) {
        reset({
          areas: data.areas ?? [],
          metodos_ensino: data.metodos_ensino ?? [],
          portfolio_url: data.portfolio_url ?? "",
          aceita_novos_orientandos: data.aceita_novos_orientandos ?? true,
        });
      }
      setLoadingRow(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, profile?.role, reset]);

  const onSubmit = async (values: OrientadorInput) => {
    if (!session?.user?.id) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("orientadores")
        .upsert(
          {
            id: session.user.id,
            areas: values.areas,
            metodos_ensino: values.metodos_ensino,
            portfolio_url: values.portfolio_url || null,
            aceita_novos_orientandos: values.aceita_novos_orientandos,
          },
          { onConflict: "id" },
        );
      if (error) throw error;
      toast.success("Perfil salvo");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error("Não foi possível salvar", { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || loadingRow) {
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
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">{profile?.full_name}</CardTitle>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Perfil do Orientador</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="areas">Áreas de atuação</Label>
                <Controller
                  control={control}
                  name="areas"
                  render={({ field }) => (
                    <TagInput
                      id="areas"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Ex.: Machine Learning"
                    />
                  )}
                />
                {errors.areas && (
                  <p className="text-xs text-destructive">{errors.areas.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="metodos_ensino">Métodos de ensino</Label>
                <Controller
                  control={control}
                  name="metodos_ensino"
                  render={({ field }) => (
                    <TagInput
                      id="metodos_ensino"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Ex.: Reuniões semanais"
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="portfolio_url">Link de portfólio</Label>
                <Input
                  id="portfolio_url"
                  type="url"
                  placeholder="https://..."
                  {...register("portfolio_url")}
                />
                {errors.portfolio_url && (
                  <p className="text-xs text-destructive">{errors.portfolio_url.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <Label htmlFor="aceita_novos_orientandos" className="text-sm">
                    Aceita novos orientandos
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Defina se você está disponível para novos alunos.
                  </p>
                </div>
                <Controller
                  control={control}
                  name="aceita_novos_orientandos"
                  render={({ field }) => (
                    <Switch
                      id="aceita_novos_orientandos"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-between">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Salvando..." : "Salvar perfil"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link to="/orientador/painel">Ir para painel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
