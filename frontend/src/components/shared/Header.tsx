import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

type NavTo = "/buscar" | "/aluno/perfil" | "/orientador/painel" | "/orientador/perfil";

export function Header() {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 text-primary">
          <GraduationCap className="h-6 w-6" />
          <span className="text-lg font-semibold tracking-tight">FindMyOrientador</span>
        </Link>

        {session && profile && (
          <nav className="hidden flex-1 items-center justify-center gap-1 sm:flex">
            {profile.role === "aluno" ? (
              <>
                <NavLink to="/buscar">Buscar</NavLink>
                <NavLink to="/aluno/perfil">Meu perfil</NavLink>
              </>
            ) : (
              <>
                <NavLink to="/orientador/painel">Solicitações</NavLink>
                <NavLink to="/orientador/perfil">Meu perfil</NavLink>
              </>
            )}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {session ? (
            <>
              <span className="hidden text-sm text-muted-foreground md:inline">
                {profile?.full_name ?? session.user.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sair
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Entrar</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/cadastro">Cadastrar</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {session && profile && (
        <nav className="flex items-center justify-center gap-1 border-t border-border px-4 py-2 sm:hidden">
          {profile.role === "aluno" ? (
            <>
              <NavLink to="/buscar">Buscar</NavLink>
              <NavLink to="/aluno/perfil">Meu perfil</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/orientador/painel">Solicitações</NavLink>
              <NavLink to="/orientador/perfil">Meu perfil</NavLink>
            </>
          )}
        </nav>
      )}
    </header>
  );
}

function NavLink({ to, children }: { to: NavTo; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      activeProps={{
        className: "rounded-md px-3 py-1.5 text-sm font-medium text-foreground bg-secondary",
      }}
    >
      {children}
    </Link>
  );
}
