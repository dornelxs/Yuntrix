import * as XLSX from "xlsx";

export interface LeadImportado {
  nome: string;
  telefone: string | null;
  instagram: string | null;
  possuiSite: string | null;
  especialidade: string | null;
  publicoAtendido: string | null;
  pontoDeDor: string | null;
  canalRecomendado: string | null;
  scoreOportunidade: number | null;
  prioridade: "alta" | "media" | "baixa" | null;
  mensagem1: string | null;
  mensagem2: string | null;
  mensagem3: string | null;
  valido: boolean;
  motivoInvalido?: string;
}

const TAMANHO_MAXIMO_CAMPO = 2000;
const EXTENSOES_ACEITAS = [".csv", ".xlsx", ".xls"];
const TAMANHO_MAXIMO_ARQUIVO = 25 * 1024 * 1024; // 25MB

function limitarTamanho(valor: string): string {
  return valor.slice(0, TAMANHO_MAXIMO_CAMPO);
}

function textoOuNulo(valor: unknown): string | null {
  const texto = String(valor ?? "").trim();
  if (!texto || texto.toLowerCase() === "não informado") return null;
  return limitarTamanho(texto);
}

function normalizarTelefone(valor: unknown): string | null {
  const texto = String(valor ?? "").trim();
  if (!texto || texto.toLowerCase().startsWith("não encontrado")) return null;
  return limitarTamanho(texto);
}

function normalizarScore(valor: unknown): number | null {
  const texto = String(valor ?? "").trim();
  const match = texto.match(/^(\d+)/);
  if (!match) return null;
  const numero = parseInt(match[1], 10);
  return Number.isFinite(numero) ? numero : null;
}

function normalizarPrioridade(valor: unknown): "alta" | "media" | "baixa" | null {
  const texto = String(valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, ""); // remove acentos: "média" -> "media"

  if (texto === "alta" || texto === "media" || texto === "baixa") return texto;
  return null;
}

export function validarArquivo(nomeArquivo: string, tamanhoBytes: number): string | null {
  const extensao = nomeArquivo.slice(nomeArquivo.lastIndexOf(".")).toLowerCase();
  if (!EXTENSOES_ACEITAS.includes(extensao)) {
    return `Formato de arquivo não suportado: ${extensao}. Use .csv, .xlsx ou .xls.`;
  }
  if (tamanhoBytes > TAMANHO_MAXIMO_ARQUIVO) {
    return "Arquivo excede o tamanho máximo de 25MB.";
  }
  return null;
}

export function parsearPlanilha(buffer: ArrayBuffer): LeadImportado[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const primeiraAba = workbook.SheetNames[0];
  const planilha = workbook.Sheets[primeiraAba];
  const linhas = XLSX.utils.sheet_to_json<Record<string, unknown>>(planilha, {
    defval: "",
  });

  return linhas.map((linha): LeadImportado => {
    const nome = textoOuNulo(linha["Nome"]);

    if (!nome) {
      return {
        nome: "",
        telefone: null,
        instagram: null,
        possuiSite: null,
        especialidade: null,
        publicoAtendido: null,
        pontoDeDor: null,
        canalRecomendado: null,
        scoreOportunidade: null,
        prioridade: null,
        mensagem1: null,
        mensagem2: null,
        mensagem3: null,
        valido: false,
        motivoInvalido: "Linha sem nome — não pode ser importada",
      };
    }

    return {
      nome,
      telefone: normalizarTelefone(linha["WhatsApp/Telefone"]),
      instagram: textoOuNulo(linha["Instagram"]),
      possuiSite: textoOuNulo(linha["Possui site?"]),
      especialidade: textoOuNulo(linha["Especialidade"]),
      publicoAtendido: textoOuNulo(linha["Publico atendido"]),
      pontoDeDor: textoOuNulo(linha["Ponto de dor"]),
      canalRecomendado: textoOuNulo(linha["Canal recomendado"]),
      scoreOportunidade: normalizarScore(linha["Score"]),
      prioridade: normalizarPrioridade(linha["Prioridade"]),
      mensagem1: textoOuNulo(linha["Mensagem 1 - Primeiro contato"]),
      mensagem2: textoOuNulo(linha["Mensagem 2 - Explicacao do servico"]),
      mensagem3: textoOuNulo(linha["Mensagem 3 - Gancho de retencao"]),
      valido: true,
    };
  });
}
