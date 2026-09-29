# ME Projects — Business Website: Planejamento

> Documento de planejamento do novo site da ME Projects (cliente), substituindo a landing page atual em https://www.me-projects.com.au/.
> Status: **Fase 2 (Sitemap & Conteúdo)**. Briefing respondido em 2026-09-29 → [`docs/02-briefing-answers.md`](docs/02-briefing-answers.md). Conteúdo real + mocks `[mock]` em `content/`.

---

## 1. Objetivo

Transformar a landing page atual em um **business website multi-página**, com:
- Páginas dedicadas por serviço e por projeto (SEO local)
- Portfólio de projetos com galeria (substitui a galeria solta atual)
- Conteúdo em arquivos no repo, sem banco de dados — **o cliente não quer editar** (Q32); nós mantemos (care plan)
- Custo zero de infraestrutura (free tiers com uso comercial permitido)

## 2. Premissas e restrições

- **Mínimo de ferramentas possível.**
- **Free tier por enquanto** — ferramentas pagas só quando houver renda recorrente.
- **Evitar serviços que pausam por inatividade** (motivo de sair do Supabase: pausa após 7 dias).
- **Deploy na Cloudflare** (free, uso comercial, sem pausa, DNS + SSL no mesmo lugar).
- Cliente é australiano → conteúdo do site em **inglês (en-AU)**.

---

## 3. Workflow profissional (fases)

| # | Fase | Entregável | Status |
|---|---|---|---|
| 0 | Proposta & Escopo | Documento: o que entra/não entra, prazo, valor, nº de revisões | ✅ |
| 1 | Descoberta (Briefing) | Questionário respondido pelo cliente | ✅ (parcial — ver pendências) |
| 2 | Conteúdo & Sitemap | Sitemap aprovado + textos + fotos organizadas por projeto | 🔄 |
| 3 | Wireframe → Design | Layout aprovado (Figma free ou esboço) | 🔄 site navegável pronto para revisão (DESIGN.md) |
| 4 | Setup técnico | Repo, README, CLAUDE.md, convenções, deploy de preview | 🔄 Astro + README feitos; falta CLAUDE.md e deploy |
| 5 | Desenvolvimento | Features em branches + PRs pequenos | ⬜ |
| 6 | QA | Checklist: mobile, Lighthouse > 90, a11y, formulário, links | ⬜ |
| 7 | Lançamento | DNS, redirects 301, Search Console, Google Business Profile | ⬜ |
| 8 | Entrega & Manutenção | Guia do cliente, acessos, contrato de manutenção (opcional) | ⬜ |

### ⚠️ Atenção no lançamento (Fase 7)
- Antes de mover o DNS para a Cloudflare, **copiar todos os registros MX / SPF / DKIM / DMARC** — senão o e-mail do cliente para.
- Mapear URLs do site atual e criar **redirects 301** para as novas rotas (preserva SEO).
- O domínio `.com.au` deve permanecer **em nome do cliente** (auDA exige ABN).

---

## 4. Sitemap (atualizado com o briefing)

```
/                     Home — hero, resumo de serviços, projetos em destaque, depoimentos, CTA
/about                Sobre — história, equipe, licenças/seguros, valores
/services             Lista de serviços
/services/[slug]      Página por serviço (+ projetos relacionados) — ordem: extensions, new-builds,
                      decks, bathrooms, home-renovations, commercial-fit-outs (sem kitchens/outdoor)
/projects             Portfólio com filtro por categoria/serviço
/projects/[slug]      Estudo de caso — galeria, descrição, local, antes/depois
/testimonials         Não — seção na Home com Google reviews reais
/faq                  Sim — licenças QLD/NSW, garantia QBCC, consultoria paga
/contact              Formulário (campos em content/settings/contact-form.yaml, com upload) + telefone + áreas
                      Sem endereço completo (Q1) — só Tugun QLD
/privacy-policy       Obrigatória (formulário coleta dados — Australian Privacy Act)
/404
```

Por que uma página por serviço/projeto: cada uma pode ranquear para buscas locais específicas (ex.: *"bathroom renovation [suburb]"*).

---

## 5. Modelo de conteúdo

```ts
Service {
  title: string
  slug: string
  summary: string
  content: rich text
  image: image
  order: number
}

Project {
  title: string
  slug: string
  service: → Service      // categoria
  location: string        // suburb
  date: date
  coverImage: image
  images: image[]
  description: rich text
  featured: boolean       // aparece na Home
}

Testimonial {
  name: string
  text: string
  rating?: number
  project?: → Project
}
```

Páginas geradas automaticamente a partir do conteúdo:
- `/projects` (grid + filtro), `/projects/[slug]` (galeria + lightbox)
- "Projetos relacionados" em cada `/services/[slug]`
- Projetos `featured` na Home

---

## 6. Stack definida

| Camada | Escolha | Observação |
|---|---|---|
| Framework | **Astro 7** | Multi-página estático, roteamento por arquivos, otimização de imagens nativa |
| Estilo | **CSS puro** com tokens | Decidido: navy + concreto, Archivo variável — ver `DESIGN.md` |
| Conteúdo | **Astro Content Collections** (Markdown/YAML em `content/`) | ~~Keystatic~~ dispensado: cliente não quer editar (Q32). Menos uma ferramenta; pode voltar se ele mudar de ideia |
| Imagens | Astro `<Image />` (WebP/AVIF, lazy) | Se o volume crescer muito → mover imagens para **Cloudflare R2** |
| Lightbox | `<dialog>` nativo | Sem dependência; PhotoSwipe só se precisar de zoom/gestos |
| Formulário | Endpoint Astro/Worker + **Resend** + **Turnstile** | Precisa de **upload de fotos/plantas** (Q24): anexos no e-mail (limite de tamanho) ou R2. Confirmar limites do free tier |
| Hospedagem / DNS | **Cloudflare** | Deploy automático a cada push; preview por branch |
| SEO | `@astrojs/sitemap`, schema.org `LocalBusiness`, meta/OG por página | |
| Analytics | **Cloudflare Web Analytics** | Grátis, sem cookies |

### Banco de dados
**Não necessário no início.** Se surgir necessidade (ex.: armazenar leads, galeria dinâmica):

| Opção | Tipo | Pausa por inatividade? | Nota |
|---|---|---|---|
| **Cloudflare D1** ✅ | SQLite | Não | Escolha natural — mesmo ecossistema |
| Turso | SQLite (libSQL) | Verificar política atual | Alternativa |
| Neon | Postgres | Suspende compute, mas acorda sozinho (cold start ~1s) | Se precisar de Postgres |
| Firebase Firestore | NoSQL | Não | Outro ecossistema |

> Free tiers mudam com frequência — confirmar limites atuais antes de decidir.

### Opções de galeria avaliadas
| Opção | Quem atualiza | Complexidade | Decisão |
|---|---|---|---|
| Imagens no repo (Content Collections) | Dev | Muito baixa | Base do Keystatic |
| **CMS Git-based (Keystatic / Pages CMS / Decap)** | Cliente | Baixa | ✅ Escolhida |
| Sanity (headless CMS) | Cliente | Média | Plano B se o volume de mídia for grande |
| R2 + D1 + painel próprio | Cliente | Alta | Só como projeto de aprendizado |
| Cloudinary | Dev/Cliente | Baixa | Não necessário |

---

## 7. Descobertas (análise do site atual — 2026-09-25)

| Item | Achado |
|---|---|
| Empresa | **M.E Projects Pty Ltd** — builder (construtora/reformas), contato: **Mark** |
| Ramo | Reformas residenciais e comerciais; 20+ anos de experiência |
| Serviços citados | Renovations, kitchens, bathrooms, decks, extensions, outdoor living, office fit-outs |
| Contato | 0451 241 400 · mark@me-projects.com.au · 453A Golden Four Drive, Tugun QLD 4224 |
| Região | Gold Coast (sul — Tugun), provavelmente também Tweed/Northern NSW |
| Plataforma atual | **Squarespace** (`/cart` ativo → plano pago) |
| Páginas atuais | `/`, `/about`, `/what-we-do` (mesmo conteúdo que `/about`), `/gallery` (~18 fotos), `/contact` |
| Credenciais | Meta description menciona **QBCC licenced** — número não aparece no site (exigido em QLD) |
| Depoimentos | Nenhum no site |
| DNS | Nameservers **Vodien** (ns1-3.vodien.com) |
| E-mail | **Google Workspace** (MX `aspmx.l.google.com`) → preservar MX na migração |
| SPF / DMARC | Não encontrados → oportunidade de configurar no lançamento |
| Problema técnico | Certificado SSL do domínio inválido para `me-projects.com.au`/`www` (serve cert `*.squarespace.com`) → argumento de venda |

### Redirects 301 previstos
```
/what-we-do  → /services
/gallery     → /projects
/about       → /about
/contact     → /contact
```

## 8. Perguntas pendentes — status após o briefing (2026-09-29)

- [x] ~~Lista final de serviços~~ → 6 serviços, sem kitchens/outdoor living; + new builds
- [x] ~~Fotos organizadas?~~ → "all mixed together" (quantidade ⬜)
- [x] ~~Cliente edita sozinho?~~ → **não** → sem Keystatic
- [x] ~~Depoimentos?~~ → Google reviews (falta link + permissão)
- [x] ~~Plataforma atual~~ → Squarespace — ⚠️ **renova em 3/10**, login com a esposa
- [x] ~~E-mail no mesmo domínio?~~ → sim, Google Workspace; só o Mark usa
- [x] ~~Acesso ao registrador~~ → "myself i think" (confirmar antes do lançamento)
- [x] ~~Área de atendimento~~ → Tugun, Palm Beach, Burleigh Heads, Coolangatta, Tweed Heads, Northern NSW
- [x] ~~Licenças/seguros/associações~~ → QBCC 15139741, NSW 473008C, fully insured, sem associações
- [x] ~~ABN~~ → 65 640 158 069
- [ ] Fotos + 6–10 projetos (nome, suburb, ano)
- [ ] Logo em qualidade ("not sure") — navy é a cor da camisa
- [ ] Referências visuais / 3 palavras (em branco) → definimos no design system
- [ ] Redes sociais, link do Google Business Profile, classe QBCC, dias de trabalho, valor da consultoria paga

Lista completa para o próximo contato: [`docs/02-briefing-answers.md`](docs/02-briefing-answers.md#pendências-para-o-próximo-contato-com-o-mark).

---

## 9. Próximos passos

1. ✅ **Questionário de briefing** (em inglês) → `docs/01-briefing-questionnaire.md`
2. ✅ **Proposta/escopo** reutilizável → `docs/00-proposal-scope.md` — preencher `[campos]` (preço, prazo, revisões) e enviar
3. ✅ Proposta e briefing enviados ao cliente (aguardando retorno).
4. ✅ **Conteúdo mock** em `content/` (seguindo o modelo da seção 5) para adiantar design e dev — registro em `MOCKS.md`; `node scripts/check-mocks.mjs` precisa passar antes do lançamento.
5. 🔄 Design system (Murilo — análise de referências).
6. ✅ Briefing recebido (2026-09-29): conteúdo real aplicado em `content/`; o que falta segue como `[mock]`.
7. Setup do repositório `me-projects-website`:
   - `npm create astro@latest`
   - Tailwind (a confirmar), sitemap, content collections apontando para `content/`
   - Conectar à Cloudflare (deploy de preview)
   - Converter este arquivo em `CLAUDE.md`
