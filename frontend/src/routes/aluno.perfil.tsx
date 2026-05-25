import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/shared/PageShell";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/aluno/perfil")({
  component: AlunoPerfilPage,
  head: () => ({
    meta: [
      { title: "Perfil do Aluno — FindMyOrientador" },
      { name: "description", content: "Complete seu perfil acadêmico de aluno." },
    ],
  }),
});

const alunoSchema = z.object({
  curso: z.string().trim().min(2, "Informe seu curso").max(120),
  tema_interesse: z.string().trim().max(200, "Máximo de 200 caracteres").optional().or(z.literal("")),
  resumo_tcc: z.string().trim().max(2000, "Máximo de 2000 caracteres").optional().or(z.literal("")),
});

type AlunoInput = z.infer<typeof alunoSchema>;

function AlunoPerfilPage() {
  const navigate = useNavigate();
  const { session, profile, loading } = useProfile();
  const [loadingRow, setLoadingRow] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AlunoInput>({
    resolver: zodResolver(alunoSchema),
    defaultValues: { curso: "", tema_interesse: "", resumo_tcc: "" },
  });

  // Auth + role guard
  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate({ to: "/login" });
      return;
    }
    if (profile?.role === "orientador") {
      navigate({ to: "/orientador/perfil" });
    }
  }, [loading, session, profile, navigate]);

  // Load existing aluno row
  useEffect(() => {
    if (!session?.user?.id || profile?.role !== "aluno") return;
    let cancelled = false;
    (async () => {
      setLoadingRow(true);
      const { data, error } = await supabase
        .from("alunos")
        .select("curso, tema_interesse, resumo_tcc")
        .eq("id", session.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error("load aluno error:", error);
      } else if (data) {
        reset({
          curso: data.curso ?? "",
          tema_interesse: data.tema_interesse ?? "",
          resumo_tcc: data.resumo_tcc ?? "",
        });
      }
      setLoadingRow(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, profile?.role, reset]);

  const onSubmit = async (values: AlunoInput) => {
    if (!session?.user?.id) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("alunos")
        .upsert(
          {
            id: session.user.id,
            curso: values.curso,
            tema_interesse: values.tema_interesse || null,
            resumo_tcc: values.resumo_tcc || null,
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
            <CardTitle>Perfil do Aluno</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="curso">Curso</Label>
                <Input id="curso" {...register("curso")} />
                {errors.curso && (
                  <p className="text-xs text-destructive">{errors.curso.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tema_interesse">Tema de interesse</Label>
                <Input
                  id="tema_interesse"
                  placeholder="Ex.: Inteligência Artificial aplicada à saúde"
                  {...register("tema_interesse")}
                />
                {errors.tema_interesse && (
                  <p className="text-xs text-destructive">{errors.tema_interesse.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="resumo_tcc">Resumo do TCC</Label>
                <Textarea
                  id="resumo_tcc"
                  rows={6}
                  placeholder="Descreva brevemente seu projeto de TCC..."
                  {...register("resumo_tcc")}
                />
                {errors.resumo_tcc && (
                  <p className="text-xs text-destructive">{errors.resumo_tcc.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-between">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Salvando..." : "Salvar perfil"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link to="/buscar">Buscar orientadores</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
