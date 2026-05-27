# FindMyOrientador

Mockup de MVP de uma plataforma web acadêmica que conecta alunos de TCC a
orientadores compatíveis, desenvolvido como entrega da disciplina de
Gerenciamento de Projetos (PMBOK 8).

## Objetivo geral

Demonstrar, em formato de protótipo funcional, um sistema capaz de:

- Cadastrar alunos e orientadores em perfis distintos
- Permitir que cada lado complete suas informações acadêmicas (curso, tema
  de interesse, áreas de pesquisa, métodos de ensino, etc.)
- Possibilitar que alunos busquem orientadores por nome ou área de atuação
- Registrar solicitações de contato entre aluno e orientador, com fluxo
  de aceite/recusa

A entrega é um MVP navegável, com banco de dados real e autenticação
funcional — não apenas telas estáticas.

## Acesso ao sistema

- **URL do deploy:** https://findmyorientador-test.vercel.app
- **Stack:** React 19 + TypeScript + Vite + TanStack Start + TailwindCSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Hospedagem:** Vercel (frontend) + Supabase (banco)

## Banco de dados

O sistema usa PostgreSQL gerenciado pelo Supabase, com Row Level Security
ativo em todas as tabelas. Estrutura principal:

| Tabela | Função |
|---|---|
| `profiles` | Dados básicos do usuário (nome, email, role) |
| `alunos` | Perfil acadêmico do aluno (curso, tema de TCC) |
| `orientadores` | Perfil do orientador (áreas, métodos, disponibilidade) |
| `solicitacoes_contato` | Pedidos de orientação entre aluno e orientador |

## Como rodar localmente

O código-fonte do app está em [`frontend/`](frontend/) — o `package.json`
não fica na raiz do repositório.

```bash
cd frontend
npm install
npm run dev
```

A aplicação abrirá em `http://localhost:5173`.

## Equipe

- **Rafael Sampaio** — Gerente de Projeto
- **Matheus Fabiano** — UX
- **Gabriel Martins** — Backend
- **Lucas Mourato** — Frontend
- **Matheus Verissimo** — Backend
