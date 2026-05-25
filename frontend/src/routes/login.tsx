import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageShell } from "@/components/shared/PageShell";
import { supabase } from "@/lib/supabase";
import { signInSchema, type SignInInput } from "@/schemas/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Entrar — FindMyOrientador" },
      { name: "description", content: "Acesse sua conta no FindMyOrientador." },
    ],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({ resolver: zodResolver(signInSchema) });

  const onSubmit = async (values: SignInInput) => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) throw error;
      if (!data.user) throw new Error("Falha ao autenticar.");

      // Read role from profile to decide redirect
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error(profileError);
      }

      toast.success("Bem-vindo(a) de volta!");

      if (profile?.role === "orientador") {
        navigate({ to: "/orientador/painel" });
      } else if (profile?.role === "aluno") {
        navigate({ to: "/buscar" });
      } else {
        // No profile yet — send to home; user can complete profile later
        navigate({ to: "/" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Credenciais inválidas";
      toast.error("Erro ao entrar", { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell>
      <div className="mx-auto flex max-w-md flex-col px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Entrar</h1>
          <p className="mt-2 text-sm text-muted-foreground">Acesse sua conta para continuar.</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm"
        >
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Entrando..." : "Entrar"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link to="/cadastro" className="font-medium text-primary hover:underline">
              Cadastre-se
            </Link>
          </p>
        </form>
      </div>
    </PageShell>
  );
}
