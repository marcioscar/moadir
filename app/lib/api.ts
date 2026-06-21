// Cliente HTTP para a API da VPS.
// As funções abaixo rodam no servidor (loaders do React Router),
// evitando problemas de CORS no navegador.

// Endereço da API. Pode ser sobrescrito pela variável de ambiente API_BASE
// (lida no servidor, já que os loaders rodam em Node — SSR).
// Na própria VPS, defina API_BASE=http://127.0.0.1:9080 para falar com a API
// local sem sair da máquina nem depender da porta 9080 estar aberta para fora.
export const API_BASE =
  (typeof process !== "undefined" && process.env.API_BASE) ||
  "http://2.25.175.240:9080";

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

export type Produto = {
  id: number;
  descricao: string;
  unidade: string;
  grupo: string;
  custo: number;
  venda: number;
  estoque: number;
};

export type ProdutosResposta = {
  total: number;
  produtos: Produto[];
};

// Cadastro de produtos (global ^EPR). Preços já vêm em reais (÷100 na API).
export async function listarProdutos(params: {
  nome?: string;
  limite?: number;
}): Promise<ProdutosResposta> {
  const url = new URL("/api/produtos", API_BASE);
  if (params.nome) url.searchParams.set("nome", params.nome);
  if (params.limite) url.searchParams.set("limite", String(params.limite));

  return getJson<ProdutosResposta>(url, "Erro ao buscar produtos");
}

export async function obterCliente(id: number): Promise<ClienteDetalhe> {
  const url = new URL("/api/cliente", API_BASE);
  url.searchParams.set("id", String(id));

  return getJson<ClienteDetalhe>(url, `Cliente ${id} não encontrado`);
}

export type RegistroDcp = {
  id: number;
  data: string;
  produtoId: number;
  clienteId: number;
  clienteNome: string;
  descricao: string;
  valor: number;
};

export type SemanaDcp = {
  semana: number;
  numGS: number;
  totalLP: number;
  subtotal: number;
  registros: RegistroDcp[];
};

export type DcpResposta = {
  filtro: { ini: number; fim: number };
  totalGeral: number;
  semanas: SemanaDcp[];
};

export async function listarDcp(params: {
  ini?: number;
  fim?: number;
}): Promise<DcpResposta> {
  const url = new URL("/api/dcp", API_BASE);
  if (params.ini) url.searchParams.set("ini", String(params.ini));
  if (params.fim) url.searchParams.set("fim", String(params.fim));

  return getJson<DcpResposta>(url, "Erro ao buscar planilhas de custo");
}
