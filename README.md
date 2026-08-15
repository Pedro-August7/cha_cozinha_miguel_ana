# ☕ Chá de Panela — Ana Júlia & Miguel

Aplicação web interativa para o Chá de Panela, desenvolvida em **React 18 + Vite** no front-end e **Node.js + Express** no back-end, com persistência leve em arquivos JSON, **Painel da Noiva** com exportação Excel (`.xlsx`) e controles de segurança avançados (Helmet, CSP, Bcrypt, rate-limiting, cookies HttpOnly e prevenção de Formula Injection).

---

## 🚀 Tecnologias
- **Front-end:** React 18, Vite, CSS Vanilla customizado com tipografia refinada (*Great Vibes*, *Cormorant Garamond*, *Jost*).
- **Back-end:** Node.js, Express, `helmet`, `bcryptjs`, `express-rate-limit`, `cookie-parser`, `cors`.
- **Exportação:** `exceljs` para geração de planilhas nativas do Excel (`.xlsx`) com colunas formatadas e proteção contra injeção de fórmulas.
- **Persistência:** Arquivos JSON leves com controle de concorrência (`withLock`):
  - `server/data/reservations.json` (reservas de presentes em tempo real)
  - `server/data/links.json` (links das lojas cadastrados)
  - `server/data/custom_gifts.json` (novos itens cadastrados pela noiva)
  - `server/data/config.json` (hash Bcrypt do código de acesso)

---

## 👑 Painel da Noiva (`/painel_da_noiva`)
Acessível através do link discreto no rodapé da página:
- **Autenticação Segura:** Código de acesso protegido por hash Bcrypt (código inicial: `anaju0120`, com opção de alteração no próprio painel) e sessão em cookie `HttpOnly`.
- **Controle de Presentes:** Visualização de todos os presentes reservados, busca textual e opção de liberar presentes reservados.
- **Acrescentar Novos Itens:** Cadastro de novos presentes vinculados a uma das categorias com escolha de ícone e links de loja.
- **Exportação Excel (.xlsx):** Download direto de planilha compatível com Microsoft Excel e Google Sheets.
- **Gerenciador de Links:** Cadastro de links de compra (Amazon, Mercado Livre, Magalu) para cada item.

---

## 📦 Como Rodar Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar o servidor da API (em um terminal)
npm run server    # sobe em http://localhost:4000

# 3. Iniciar o front-end Vite (em outro terminal)
npm run dev       # sobe em http://localhost:5173
```

---

## 🔒 Executar Testes de Segurança

O projeto conta com suíte automatizada de testes cobrindo XSS, Formula Injection, validação de IDs, Bcrypt e sanitização de URLs:

```bash
node server/security.test.js
```

---

## 🌐 Publicação em Produção (VPS / Cloud)

```bash
# Build e execução em processo único
npm install
npm run build     # gera a pasta dist/
npm run server    # Express serve a API e os arquivos estáticos na porta 4000
```
