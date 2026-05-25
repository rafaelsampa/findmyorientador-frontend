import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageShell } from "@/components/shared/PageShell";
import { supabase } from "@/lib/supabase";
import { signUpSchema, type SignUpInput } from "@/schemas/auth";

export const Route = createFileRoute("/cadastro")({
  component: CadastroPage,
  head: () => ({
    meta: [
      { title: "Cadastro — FindMyOrientador" },
      { name: "description", content: "Crie sua conta de aluno ou orientador." },
    ],
  }),
});

function CadastroPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { role: undefined as unknown as "aluno" },
  });

  const role = watch("role");

  const onSubmit = async (values: SignUpInput) => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: { full_name: values.fullName, role: values.role },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error("Não foi possível criar o usuário.");

      // Insert profile row
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        role: values.role,
        full_name: values.fullName,
        email: values.email,
      });

      if (profileError) {
        console.error("profile insert error:", profileError);
        toast.error("Conta criada, mas não foi possível salvar o perfil.", {
          description: profileError.message,
        });
      } else {
        toast.success("Cadastro realizado com sucesso!");
      }

      // Redirect to role-specific onboarding
      navigate({
        to: values.role === "aluno" ? "/aluno/perfil" : "/orientador/perfil",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error("Erro no cadastro", { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell>
      <div className="mx-auto flex max-w-md flex-col px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Criar conta</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cadastre-se como aluno ou orientador para começar.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm"
        >
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome completo</Label>
            <Input id="fullName" autoComplete="name" {...register("fullName")} />
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName.message}</p>
            )}
          </div>

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
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Tipo de perfil</Label>
            <Select
              value={role}
              onValueChange={(v) => setValue("role", v as "aluno" | "orientador", { shouldValidate: true })}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aluno">Aluno</SelectItem>
                <SelectItem value="orientador">Orientador</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Criando conta..." : "Criar conta"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </PageShell>
  );
}
