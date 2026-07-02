# Yuntrix — Design System

> Fonte única de verdade do visual do Yuntrix. Antes de criar/editar qualquer
> tela, leia este arquivo. Não improvise cores, sombras ou raios fora dos tokens
> abaixo. Os tokens vivem em `src/app/globals.css` (bloco `@theme`) e são expostos
> como classes Tailwind (ex: `bg-primary`, `text-on-surface`).

## 1. Personalidade

**Modern Corporate Minimalism** para operação de vendas outbound de alta cadência.
Profissional, sistemático, eficiente. UI recua para o segundo plano — dados,
status de lead e pipeline no centro. Sensação de **confiabilidade e controle**.

Densidade de informação sem sacrificar clareza. Refino vem da **execução**
(consistência, feedback tátil, hierarquia), não de ornamento.

## 2. Cores (tokens)

Paleta ancorada em azul corporativo sobre superfícies neutras claras. Todos os
tokens são variáveis CSS em `@theme` → viram classes `bg-*` / `text-*` / `border-*`.

### Marca / ação
| Token | Hex | Uso |
|---|---|---|
| `primary` | `#004ac6` | Ação primária, links, estado ativo |
| `on-primary` | `#ffffff` | Texto sobre primary |
| `primary-container` | `#2563eb` | Realce, hover de superfícies primárias |
| `on-primary-container` | `#eeefff` | Texto sobre primary-container |
| `primary-fixed` | `#dbe1ff` | Halo de foco, fundos suaves |
| `primary-fixed-dim` | `#b4c5ff` | Acento em fundo escuro |

### Superfícies (efeito de camadas)
| Token | Hex | Uso |
|---|---|---|
| `background` / `surface` | `#f9f9ff` | Fundo base da aplicação |
| `surface-container-lowest` | `#ffffff` | Cards, inputs (camada elevada) |
| `surface-container-low` | `#f1f3ff` | Colunas de kanban, áreas sutis |
| `surface-container` | `#e9edff` | Chips neutros |
| `surface-container-high` | `#e1e8fd` | Hover de itens de menu, badges |
| `surface-container-highest` | `#dce2f7` | Estados pressionados sutis |

### Texto / traços
| Token | Hex | Uso |
|---|---|---|
| `on-surface` | `#141b2b` | Texto primário (near-black) |
| `on-surface-variant` | `#434655` | Texto secundário / metadados |
| `outline` | `#737686` | Ícones sutis, placeholders |
| `outline-variant` | `#c3c6d7` | Bordas de card/input (Nível 1) |

### Semânticas de status (lead)
| Status | Fundo | Texto | Hue |
|---|---|---|---|
| Fechado / sucesso | `green-100` | `green-700` | Verde |
| Interessado | `tertiary-fixed` | `on-tertiary-fixed-variant` | Âmbar |
| Contatado / em andamento | `secondary-container` | `on-secondary-container` | Azul claro |
| Sem interesse / perdido | `error-container` | `on-error-container` | Vermelho |
| Sem contato / neutro | `surface-variant` | `on-surface-variant` | Cinza |
| Inatividade (>48h) | `amber-50` + `amber-300` | `amber-700` | Âmbar (borda) |

> Erro: `error` `#ba1a1a`. Definições completas de status em `src/lib/status-lead.ts`.

## 3. Tipografia

**Inter** (Google Fonts) — legibilidade em UI e dados tabulares. Carregada via
`next/font` em `layout.tsx` na variável `--font-sans`.

| Papel | Tamanho | Peso | Tracking | Uso |
|---|---|---|---|---|
| Display | 36px | 700 | -0.02em | Marca, telas de destaque |
| Headline lg | 24px | 600 | -0.01em | Título de página |
| Headline md | 20px | 600 | — | Título de seção |
| Body lg | 16px | 400 | — | Texto de leitura |
| Body md | 14px | 400 | — | **Padrão** — dados, corpo |
| Body sm | 13px | 400 | — | Metadados, sidebar |
| Label | 12px | 600 | 0.05em, UPPERCASE | Rótulos de campo, chips |

Densidade: `body-md` (14px) é o padrão. Rótulos em maiúsculas com tracking para
separar de dados interativos.

## 4. Forma & espaço

- **Raios**: `sm 4px` · `DEFAULT 8px` · `md 12px` · `lg 16px` · `xl 24px` · `full`.
  Cards/inputs = 8–12px (`rounded-lg`/`rounded-xl`). Chips/badges = `full` (pílula).
- **Grid base 4px**. Padding de linha compacto (8–12px) para maximizar registros.
- **Layout Fixed-Fluid**: sidebar fixa 240px + conteúdo fluido `max-w-[1440px]`.
- **Mobile**: sidebar vira drawer (hambúrguer), margens 16px.

## 5. Elevação (profundidade por traço, não sombra pesada)

- **Nível 0**: fundo `background`.
- **Nível 1 (card)**: `surface-container-lowest` + `border-outline-variant`,
  sombra mínima (`shadow-sm`). Hover: borda escurece para `outline`.
- **Nível 2 (modal/dropdown)**: branco + borda + sombra difusa suave (`shadow-lg`).

## 6. Componentes

### Botões — sistema tátil (classes em `globals.css`)
Todos os botões devem dar **sensação de clique**: `active:scale-[0.97]`, transição
rápida, e halo de foco acessível. Use as classes utilitárias, não estilos soltos.

| Classe | Aparência | Uso |
|---|---|---|
| `.btn` | Base: layout, transição, `active:scale`, `focus-visible` ring, `:disabled` | Toda a base |
| `.btn-primary` | Sólido `primary`, texto branco, hover mais escuro | Ação principal |
| `.btn-secondary` | Branco, borda `outline-variant`, texto `on-surface` | Ação secundária |
| `.btn-ghost` | Sem fundo/borda, hover `surface-container-high` | Ações em tabela/toolbar |
| `.btn-danger` | Texto/hover `error` | Excluir/destrutivo |
| `.btn-icon` | Quadrado, para ícone único | Fechar, copiar, editar |

Tamanhos: padrão `py-2.5 px-4 text-sm`. Pequeno: adicionar `.btn-sm`.

### Outros
- **Card**: `.card` = branco + `border-outline-variant` + `rounded-xl` + `shadow-sm`,
  padding 20–24px. Hover opcional `.card-hover` (borda escurece).
- **Input**: `.input` = borda `outline-variant`, foco → borda `primary` + ring
  `primary-fixed` (halo 2px). Raio 8px.
- **Chip/Badge**: pílula, fundo semitransparente + texto do mesmo hue, `label` style.
- **Kanban**: colunas `surface-container-low`; cards nível 1; inatividade = borda âmbar.

## 7. Movimento

Sutil e funcional. Nada de animação decorativa que atrapalhe leitura de dados.
- Transições: `transition-all duration-150` (interações) a `duration-200`.
- Botões: `active:scale-[0.97]` (feedback de clique).
- Foco: `focus-visible:ring-2 ring-primary-fixed` (acessível, só teclado).
- Reveal de página: opcional, staggered leve; evitar em telas de dados densos.

## 8. Acessibilidade

- Foco sempre visível via `focus-visible` (não remover outline sem substituto).
- Contraste: `on-surface` sobre `surface` e branco atende AA.
- Alvos de toque ≥ 40px em mobile. `aria-label` em botões de ícone.

## 9. Favicon / identidade

Monograma **"Y"** branco sobre quadrado `primary` (#004ac6) arredondado —
`public/favicon.svg`. Bate com o logo da sidebar. Registrado em `metadata.icons`.
