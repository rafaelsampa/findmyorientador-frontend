import { Link, useNavigate } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function Header() {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-primary">
          <GraduationCap className="h-6 w-6" />
          <span className="text-lg font-semibold tracking-tight">FindMyOrientador</span>
        </Link>
        <nav className="flex items-center gap-2">
          {session ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">
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
        </nav>
      </div>
    </header>
  );
}
