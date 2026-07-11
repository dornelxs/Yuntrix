/**
 * Extração de contatos a partir dos campos livres da planilha.
 *
 * As planilhas trazem o contato misturado com contexto, por exemplo:
 *   "@thaissoutopersonal — ~4.186 seguidores (507 posts, CREF 5569-G/PB)"
 *   "(83) 98794-4874 (Cabedelo Centro) / (83) 99618-0454 (Intermares)"
 *   "(83) 98877-9... (número parcial confirmado via OLX)"
 *
 * Montar o link a partir do campo inteiro gerava URLs inválidas (todos os
 * dígitos do texto viravam um "telefone" só). Aqui separamos o contato real
 * do contexto, e só geramos link para o que é utilizável.
 */

export interface TelefoneExtraido {
  /** Como aparece na planilha, ex: "(83) 98230-8508". */
  exibicao: string;
  /** Só dígitos com DDD, ex: "83982308508". Null se incompleto. */
  digitos: string | null;
  /** Link do WhatsApp, ou null quando o número não é utilizável. */
  linkWhatsapp: string | null;
  /** Número truncado na planilha (ex: "98877-9..."). */
  incompleto: boolean;
}

export interface InstagramExtraido {
  /** Handle sem "@", ex: "thaissoutopersonal". */
  handle: string;
  /** Como exibir, ex: "@thaissoutopersonal". */
  exibicao: string;
  linkPerfil: string;
}

/** Sobrou do campo depois de tirar o contato — seguidores, CREF, bairro etc. */
export function contextoRestante(valor: string, trechosRemovidos: string[]): string | null {
  let resto = valor;
  for (const trecho of trechosRemovidos) {
    resto = resto.replace(trecho, " ");
  }
  const limpo = resto
    .replace(/^[\s—–\-/,;.]+|[\s—–\-/,;.]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return limpo || null;
}

/**
 * Encontra todos os telefones em um campo livre. Aceita formatos como
 * "(83) 98230-8508", "83 98230 8508", "083 99143-0091", "83-3224-1955".
 */
export function extrairTelefones(valor: string | null | undefined): TelefoneExtraido[] {
  if (!valor) return [];

  const encontrados: TelefoneExtraido[] = [];
  // Sequência de dígitos com separadores comuns; exige ao menos 8 dígitos.
  const padrao = /\(?\d{2,3}\)?[\s.-]?\d{4,5}[\s.-]?\d{0,4}(\.{2,})?/g;

  for (const match of valor.matchAll(padrao)) {
    const bruto = match[0];
    const truncado = /\.{2,}/.test(bruto) || bruto.includes("…");
    let digitos = bruto.replace(/\D/g, "");

    // "(083) 99143-0091" -> o zero é prefixo de operadora, não faz parte do DDD.
    if (digitos.startsWith("0")) {
      digitos = digitos.replace(/^0+/, "");
    }

    // Válido = DDD (2) + 8 dígitos (fixo) ou 9 dígitos (celular).
    const valido = !truncado && (digitos.length === 10 || digitos.length === 11);

    encontrados.push({
      exibicao: bruto.trim(),
      digitos: valido ? digitos : null,
      linkWhatsapp: valido ? `https://wa.me/55${digitos}` : null,
      incompleto: !valido,
    });
  }

  return encontrados;
}

/**
 * Resumo curto do contato para listas: os telefones e o @, sem o contexto.
 * Ex: "(83) 98794-4874, (83) 99618-0454 · @clinicakinesi"
 */
export function resumoContato(
  telefone: string | null | undefined,
  instagram: string | null | undefined
): string {
  const tels = extrairTelefones(telefone).map((t) => t.exibicao);
  const insta = extrairInstagram(instagram);

  const partes: string[] = [];
  if (tels.length) partes.push(tels.join(", "));
  if (insta) partes.push(insta.exibicao);

  return partes.join(" · ") || "—";
}

/** Extrai o @handle do Instagram, ignorando o texto ao redor. */
export function extrairInstagram(valor: string | null | undefined): InstagramExtraido | null {
  if (!valor) return null;

  // Aceita "@handle", "instagram.com/handle" ou um handle solto no início.
  const match =
    valor.match(/@([A-Za-z0-9._]+)/) ??
    valor.match(/instagram\.com\/([A-Za-z0-9._]+)/i);

  if (!match) return null;

  const handle = match[1].replace(/[.]+$/, "");
  if (!handle) return null;

  return {
    handle,
    exibicao: `@${handle}`,
    linkPerfil: `https://instagram.com/${handle}`,
  };
}
