export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-muted-foreground">
        <p className="font-medium text-foreground">FindMyOrientador</p>
        <p className="mt-1">
          Projeto acadêmico desenvolvido para a disciplina de Gerenciamento de Projetos (PMBOK).
        </p>
        <p className="mt-1">© {new Date().getFullYear()} — Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
