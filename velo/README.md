# Velô Sprint - Configurador de Veículo Elétrico

Aplicação web em React para configuração e compra do veículo elétrico **Velô Sprint**.

## Sobre o Projeto

Uma SPA (Single Page Application) que permite:
- Personalizar cores, rodas e opcionais do veículo
- Calcular preços em tempo real
- Realizar pedidos com análise de crédito
- Consultar status de pedidos

**Especificações do Velô Sprint:** 450 km de autonomia | 0-100 km/h em 3.2s | 500 cv

---

## Stack Tecnológica

| Categoria | Tecnologias |
|-----------|-------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| **Estado** | Zustand (global), React Hook Form (formulários) |
| **Validação** | Zod |
| **Data Fetching** | TanStack Query |
| **Backend** | Supabase (PostgreSQL + Edge Functions) |

---

## Instalação

```bash
# Instalar dependências
yarn install

# Rodar em desenvolvimento
yarn run dev
```

Acesse: `http://localhost:5173`

---

## Configuração do Supabase

### 1. Criar Projeto

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Clique em **New Project**
3. Escolha um nome e senha para o banco
4. Aguarde a criação (~2 minutos)

### 2. Variáveis de Ambiente

Crie o arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_PROJECT_ID="seu_project_id"
VITE_SUPABASE_PUBLISHABLE_KEY="sua_chave_anon_publica"
VITE_SUPABASE_URL="https://seu_project_id.supabase.co"
```

> Encontre essas informações em: **Project Settings → API**

### 3. Deploy (banco + functions)

```bash
# Instalar CLI
yarn add supabase -D

# Login e vincular projeto
yarn supabase login
yarn supabase link --project-ref lzgfxkbbuvlvwctjpkcx

# Aplicar migrações (cria tabelas e RLS)
yarn supabase db push

# Deploy das Edge Functions
yarn supabase functions deploy
```

Pronto! O banco e as functions estarão configurados.

Antes de `db push` ou `functions deploy`, confirme o projeto ativo:

```bash
yarn supabase projects list
```

O `●` precisa estar no projeto certo (preview ou produção). O CLI lembra só o último `link`.

---

## Ambientes Preview e Produção

O app usa dois projetos Supabase. Variáveis `VITE_*` são **embutidas no bundle no build**; não dá para trocá-las só mudando o domínio.

| Ambiente | Projeto Supabase | Ref | Papel |
|----------|------------------|-----|--------|
| Produção | Velô | `lzgfxkbbuvlvwctjpkcx` | Site no ar |
| Preview | velo-sprint-preview | `dvmnpucvjjafxpmrctze` | Deploy de preview + E2E |

Preview e produção têm o mesmo schema (`supabase/migrations`) e a Edge Function `credit-analysis`.

### Por que não usamos `vercel promote`

`vercel promote` reaponta o domínio de produção para um **deploy já existente**. O deploy de preview é gerado com o Supabase de **preview**. Promovê-lo faria a produção ler e gravar nesse banco.

A solução: **dois deploys distintos**.

1. **Preview** — `vercel deploy --target=preview` com `--build-env` das `VITE_SUPABASE_*` de preview (secrets no GitHub: `VITE_SUPABASE_URL_PREVIEW`, `VITE_SUPABASE_PROJECT_ID_PREVIEW`, `VITE_SUPABASE_PUBLISHABLE_KEY_PREVIEW`). A UI da Vercel não permitiu uma segunda `VITE_SUPABASE_URL` só para Preview (conflito com variável fantasma `branch undefined`).
2. **E2E** — Playwright usa `BASE_URL` da URL Visit do preview e `DATABASE_URL` no GitHub igual ao **Session pooler** do preview (`postgres.dvmnpucvjjafxpmrctze` em `aws-1-us-west-2.pooler.supabase.com:5432`). Pedidos da suíte não devem aparecer no Velô.
3. **Produção** — `vercel deploy --prod` (build novo, não promote), com `VITE_SUPABASE_*` do ambiente Production na Vercel apontando para o Velô.

Pipeline: Unit Tests → Preview → E2E → Production. Produção só sobe se o E2E passar.

### Secrets (GitHub Actions, não commitar)

- `VITE_SUPABASE_URL_PREVIEW`, `VITE_SUPABASE_PROJECT_ID_PREVIEW`, `VITE_SUPABASE_PUBLISHABLE_KEY_PREVIEW`
- `DATABASE_URL` — session pooler do **preview**
- `VERCEL_TOKEN`, `TESTDINO_TOKEN`, `VERCEL_AUTOMATION_BYPASS_SECRET` (se houver Deployment Protection)

Não versionar senha de banco, token TestDino nem `supabase/.temp/`.

### Conferência rápida

- Preview `/lookup` → Network → `dvmnpucvjjafxpmrctze.supabase.co`
- Produção `/lookup` → Network → `lzgfxkbbuvlvwctjpkcx.supabase.co`
- Table Editor: pedidos `VLO-*` da suíte CI no preview; os mesmos códigos novos **não** no Velô

---

## Estrutura Principal

```
src/
├── pages/           # Páginas da aplicação
├── components/      # Componentes React
│   ├── configurator/   # Configurador do carro
│   ├── landing/        # Landing page
│   └── ui/             # Componentes shadcn/ui
├── store/           # Estado global (Zustand)
├── hooks/           # Hooks customizados
└── integrations/    # Cliente Supabase
```

---

## Rotas

| Rota | Descrição |
|------|-----------|
| `/` | Landing page |
| `/configure` | Configurador do veículo |
| `/order` | Checkout/Pedido |
| `/success` | Confirmação do pedido |
| `/lookup` | Consulta de pedidos |

---

## Modelo de Preços

- **Preço base:** R$ 40.000
- **Rodas Sport:** +R$ 2.000
- **Precision Park:** +R$ 5.500
- **Flux Capacitor:** +R$ 5.000
- **Financiamento:** 12x com juros de 2% a.m.

---

## Banco de Dados

**Tabela `orders`** — campos principais:
- `order_number` — Formato: VLO-XXXXXX
- `color`, `wheel_type`, `optionals` — Configuração
- `customer_name`, `customer_email`, `customer_cpf` — Cliente
- `payment_method`, `total_price` — Pagamento
- `status` — pending, approved, rejected, analysis

---

## Análise de Crédito

| Score | Resultado |
|-------|-----------|
| > 700 | Aprovado |
| 501-700 | Em análise |
| ≤ 500 | Reprovado |

*Se entrada ≥ 50% do total, aprova mesmo com score < 700*

---

## Fluxo Principal

```
Landing → Configurador → Checkout → Análise de Crédito → Confirmação
```

---

## Scripts

```bash
npm run dev      # Desenvolvimento
npm run build    # Build de produção
npm run lint     # Verificar código
```