# Lambari Pesca

Loja **própria** de artigos de pesca — single-store, sem multi-tenant.

## O que tem

- **Loja virtual** (Next.js) — vitrine de produtos
- **Bling** — produtos e estoque sincronizados do ERP (OAuth)
- **J&T Express** — estrutura de cotação de frete (credenciais no `.env`)
- **Admin** em `/admin` — conectar Bling e sincronizar catálogo
- **Pagamentos** — a definir depois

## Rodar localmente

```bash
cp .env.example .env.local
# Edite BLING_CLIENT_ID, BLING_CLIENT_SECRET, etc.

docker compose up -d          # Postgres na porta 5433
# DATABASE_URL=postgresql://lambari:lambari@localhost:5433/lambaripesca

npm run db:push               # cria tabelas
npm run dev                   # http://localhost:3000
```

## Bling

1. Crie um app em [developer.bling.com.br](https://developer.bling.com.br)
2. Redirect URI: `http://localhost:3000/api/integrations/bling/callback`
3. Preencha `BLING_CLIENT_ID` e `BLING_CLIENT_SECRET` no `.env.local`
4. Acesse `/admin` → **Conectar Bling** → **Sincronizar produtos**

## J&T Express

Preencha no `.env.local`:

- `JT_CUSTOMER_CODE`
- `JT_API_ACCOUNT`
- `JT_PRIVATE_KEY`

Endpoint de cotação: `POST /api/freight/quote` com `{ "zipCode": "01310100", "weightGrams": 500 }`

## Próximas fases

1. Carrinho e checkout (sem pagamento)
2. Simulação de frete na página do carrinho
3. Mercado Pago ou outro gateway
4. Envio de pedidos para o Bling (opcional)
