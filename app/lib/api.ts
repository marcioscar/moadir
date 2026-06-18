// Cliente HTTP para a API da VPS.
// As funções abaixo rodam no servidor (loaders do React Router),
// evitando problemas de CORS no navegador.

export const API_BASE = "http://2.25.175.240:9080";

// A API às vezes devolve caracteres de controle crus dentro de strings
// (ex.: quebra de linha no nome do cliente), o que quebra o JSON.parse.
// Esta função busca o texto, sanitiza esses caracteres e faz o parse.
async function getJson<T>(url: URL, msgErro: string): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) {
    throw new Response(`${msgErro} (${res.status})`, { status: res.status });
  }
  const texto = await res.text();
  // Remove caracteres de controle (0x00–0x1F) exceto \t (\x09) — os demais
  // são trocados por espaço para não quebrar tokens nem juntar palavras.
  const limpo = texto.replace(/[\x00-\x08\x0A-\x1F]/g, " ");
  return JSON.parse(limpo) as T;
}

export type ClienteResumo = {
  id: number;
  nome: string;
  cidade: string;
  uf: string;
  cnpj: string;
};

export type ClientesResposta = {
  total: number;
  clientes: ClienteResumo[];
};

export type ClienteDetalhe = {
  id: number;
  nome: string;
  endereco: string;
  bairro: string;
  cidade: string;
  cep: string;
  uf: string;
  cnpj: string;
  inscricao: string;
  telefone1: string;
  telefone2: string;
  fantasia: string;
};

export async function listarClientes(params: {
  nome?: string;
  limite?: number;
}): Promise<ClientesResposta> {
  const url = new URL("/api/clientes", API_BASE);
  if (params.nome) url.searchParams.set("nome", params.nome);
  if (params.limite) url.searchParams.set("limite", String(params.limite));

  return getJson<ClientesResposta>(url, "Erro ao buscar clientes");
}

export type RelatorioResposta = {
  periodo: { dini: string; dfim: string };
  totalGeral: number;
  clientes: { id: number; nome: string; total: number }[];
};

// Relatório de prejuízo por cliente + totalGeral. Datas em YYYY-MM-DD.
export async function obterRelatorio(params: {
  dini: string;
  dfim: string;
}): Promise<RelatorioResposta> {
  const url = new URL("/api/relatorio", API_BASE);
  url.searchParams.set("dini", params.dini);
  url.searchParams.set("dfim", params.dfim);

  return getJson<RelatorioResposta>(url, "Erro ao gerar relatório");
}

export async function obterCliente(id: number): Promise<ClienteDetalhe> {
  const url = new URL("/api/cliente", API_BASE);
  url.searchParams.set("id", String(id));

  return getJson<ClienteDetalhe>(url, `Cliente ${id} não encontrado`);
}
