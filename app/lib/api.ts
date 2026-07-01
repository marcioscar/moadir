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

export type FatorSemana = {
  semana: string;
  chave: string;
  fator: number;
};

export type FatoresResposta = {
  semanaAtual: string;
  chaveAtual: string;
  fatorAtual: number;
  markup: number;
  fatores: FatorSemana[];
};

export async function listarFatores(ultimas = 20): Promise<FatoresResposta> {
  const url = new URL("/api/fatores", API_BASE);
  url.searchParams.set("ultimas", String(ultimas));
  return getJson<FatoresResposta>(url, "Erro ao buscar fatores");
}

export async function definirFator(
  semana: string,
  valor: number,
): Promise<{ ok: boolean; semana?: string; fator?: number; erro?: string }> {
  const url = new URL("/api/fator-set", API_BASE);
  url.searchParams.set("semana", semana);
  url.searchParams.set("valor", String(valor));
  return getJson(url, "Erro ao salvar fator");
}

export type Produto = {
  id: number;
  descricao: string;
  unidade: string;
  grupo: string;
  custo: number;
  venda: number;
  local: string;
  disponivel: number;
  reservado: number;
  estoque: number;
};

export type ProdutosResposta = {
  total: number;
  /** Semana de referência do fator (ex: "26/26" = semana 26 do ano 2026) */
  semana: string;
  /** Fator semanal aplicado aos preços base (÷10000 = multiplicador) */
  fator: number;
  produtos: Produto[];
};

// Cadastro de produtos (global ^EPR). Preços ajustados pelo fator semanal de ^EIN.
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

export type Encomenda = {
  id: number;
  produto: string;
  unidade: string;
  clienteId: number;
  clienteNome: string;
  dataPedido: string;
  qtdPedida: number;
  qtdProduzida: number;
  embalagem: number;
  precoCusto: number;
  precoVenda: number;
  valorOrcado: number;
  pesoKg: number;
  aceitaAprox: string;
  localizacaoAlmox: string;
  codOrigem: string;
  classifFiscal: string;
  tributadoIpi: string;
  comissaoVenda: number;
  diasPrazo: number;
  icmPct: number;
  estado: number;
  estadoNome: string;
};

export type EncomendasResposta = {
  total: number;
  encomendas: Encomenda[];
};

export async function listarEncomendas(params: {
  estado?: number;
  cliente?: number;
  abertos?: boolean;
  limite?: number;
  /** Lista da maior para a menor id (mais recentes primeiro) */
  desc?: boolean;
  /** Ignora encomendas com id maior que este (limita ao ciclo atual de numeração) */
  idMax?: number;
}): Promise<EncomendasResposta> {
  const url = new URL("/api/encomendas", API_BASE);
  if (params.estado !== undefined)
    url.searchParams.set("estado", String(params.estado));
  if (params.cliente) url.searchParams.set("cliente", String(params.cliente));
  if (params.abertos) url.searchParams.set("abertos", "1");
  if (params.limite) url.searchParams.set("limite", String(params.limite));
  if (params.desc) url.searchParams.set("desc", "1");
  if (params.idMax) url.searchParams.set("idmax", String(params.idMax));
  return getJson<EncomendasResposta>(url, "Erro ao buscar encomendas");
}

export type MovimentoGSF = {
  seq: number;
  data: string;
  tipo: number;
  requisicao: number;
  quantidade: number;
  unidade: string;
  produtoId: number;
  produtoNome: string;
};

export type EncomendaDetalhe = {
  id: number;
  produto: string;
  unidade: string;
  clienteId: number;
  clienteNome: string;
  dataPedido: string;
  qtdPedida: number;
  qtdProduzida: number;
  embalagem: number;
  precoCusto: number;
  precoVenda: number;
  valorOrcado: number;
  pesoKg: number;
  aceitaAprox: string;
  localizacaoAlmox: string;
  codOrigem: string;
  classifFiscal: string;
  tributadoIpi: string;
  comissaoVenda: number;
  diasPrazo: number;
  icmPct: number;
  estado: number;
  estadoNome: string;
  movimentos: MovimentoGSF[];
};

export type NovaEncomendaParams = {
  pr1: string;
  pr2: string;
  pr3: number;
  pr4: string;
  pr5: number;
  pr6: string;
  pr9: number;
  pr10: number;
  pr11: number;
  pr12: number;
  pr13: string;
  pr14: number;
  pr15: string;
  pr16: string;
  pr17: string;
  pr23: number;
  pr24: number;
  pr25: number;
};

export type EncomendaResposta = { ok: boolean; id?: number; erro?: string };

export async function criarEncomenda(
  p: NovaEncomendaParams,
): Promise<EncomendaResposta> {
  const url = new URL("/api/encomenda-criar", API_BASE);
  url.searchParams.set("pr1", p.pr1);
  url.searchParams.set("pr2", p.pr2);
  url.searchParams.set("pr3", String(p.pr3));
  url.searchParams.set("pr4", p.pr4);
  url.searchParams.set("pr5", String(p.pr5));
  url.searchParams.set("pr6", p.pr6);
  url.searchParams.set("pr9", String(p.pr9));
  url.searchParams.set("pr10", String(p.pr10));
  url.searchParams.set("pr11", String(p.pr11));
  url.searchParams.set("pr12", String(p.pr12));
  url.searchParams.set("pr13", p.pr13);
  url.searchParams.set("pr14", String(p.pr14));
  url.searchParams.set("pr15", p.pr15);
  url.searchParams.set("pr16", p.pr16);
  url.searchParams.set("pr17", p.pr17);
  url.searchParams.set("pr23", String(p.pr23));
  url.searchParams.set("pr24", String(p.pr24));
  url.searchParams.set("pr25", String(p.pr25));
  return getJson<EncomendaResposta>(url, "Erro ao criar encomenda");
}

export async function alterarEncomenda(
  id: number,
  p: NovaEncomendaParams,
): Promise<EncomendaResposta> {
  const url = new URL("/api/encomenda-alterar", API_BASE);
  url.searchParams.set("id", String(id));
  url.searchParams.set("pr1", p.pr1);
  url.searchParams.set("pr2", p.pr2);
  url.searchParams.set("pr3", String(p.pr3));
  url.searchParams.set("pr4", p.pr4);
  url.searchParams.set("pr5", String(p.pr5));
  url.searchParams.set("pr6", p.pr6);
  url.searchParams.set("pr9", String(p.pr9));
  url.searchParams.set("pr10", String(p.pr10));
  url.searchParams.set("pr11", String(p.pr11));
  url.searchParams.set("pr12", String(p.pr12));
  url.searchParams.set("pr13", p.pr13);
  url.searchParams.set("pr14", String(p.pr14));
  url.searchParams.set("pr15", p.pr15);
  url.searchParams.set("pr16", p.pr16);
  url.searchParams.set("pr17", p.pr17);
  url.searchParams.set("pr23", String(p.pr23));
  url.searchParams.set("pr24", String(p.pr24));
  url.searchParams.set("pr25", String(p.pr25));
  return getJson<EncomendaResposta>(url, "Erro ao alterar encomenda");
}

export async function excluirEncomenda(
  id: number,
): Promise<EncomendaResposta> {
  const url = new URL("/api/encomenda-excluir", API_BASE);
  url.searchParams.set("id", String(id));
  return getJson<EncomendaResposta>(url, "Erro ao excluir encomenda");
}

export type EstadoAtualizacao = { ok: boolean; id: number; estado: number };

export async function atualizarEstadoEncomenda(
  id: number,
  estado: number,
): Promise<EstadoAtualizacao> {
  const url = new URL("/api/encomenda-estado", API_BASE);
  url.searchParams.set("id", String(id));
  url.searchParams.set("estado", String(estado));
  return getJson<EstadoAtualizacao>(url, `Erro ao atualizar estado da encomenda ${id}`);
}

export async function buscarDetalheEncomenda(
  id: number,
): Promise<EncomendaDetalhe> {
  const url = new URL("/api/encomenda-detalhe", API_BASE);
  url.searchParams.set("id", String(id));
  return getJson<EncomendaDetalhe>(url, `Detalhe da encomenda ${id} não encontrado`);
}

export async function listarDcp(params: {
  ini?: number;
  fim?: number;
}): Promise<DcpResposta> {
  const url = new URL("/api/dcp", API_BASE);
  if (params.ini) url.searchParams.set("ini", String(params.ini));
  if (params.fim) url.searchParams.set("fim", String(params.fim));

  return getJson<DcpResposta>(url, "Erro ao buscar planilhas de custo");
}

export type MovimentoPlanilha = {
  seq: number;
  data: string;
  tipo: number;
  reg: number;
  qtdRaw: number;
  qtdDec: number;
  unidade: string;
  produtoCod: string;
  produtoId: number;
  produtoNome: string;
  /** Valor em centavos (negativo = crédito, ex.: aparas) */
  valorCentavos: number;
};

export type ResumoPlanilha = {
  /** Soma dos movimentos (materiais + mão de obra), em centavos */
  direto: number;
  indireto: number;
  custoVendasPct: number;
  custoVendas: number;
  cFinanceiroDias: number;
  cFinanceiro: number;
  subtotal: number;
  icmsPct: number;
  icms: number;
  irPisCofins: number;
  total: number;
  /** Quantidade base × preço de venda, em centavos */
  vendasTotal: number;
  /** vendasTotal - total; negativo = prejuízo */
  resultado: number;
  /** Peso total em gramas×10 (mesma escala de pesoKgUnit) */
  pesoTotal: number;
  /** Custo pós-cálculo por unidade, em centavos */
  posCalc: number;
  /** posCalc convertido para o fator base (sem o multiplicador semanal) */
  posCalcFator: number;
  /** Preço por kg necessário para lucro zero, em centavos */
  paraLucro: number;
  /** Diferença entre kg movimentados e kg apurados pelo peso cadastrado */
  kgDif: number;
};

// Planilha de Custo de Encomendado — equivalente à rotina P34/PRO do sistema original.
export type PlanilhaCusto = {
  id: number;
  produto: string;
  unidade: string;
  clienteId: number;
  clienteNome: string;
  dataPedido: string;
  qtdPedida: number;
  qtdProduzida: number;
  aceitaAprox: string;
  precoVenda: number;
  precoCusto: number;
  pesoKgUnit: number;
  estado: number;
  estadoNome: string;
  /** Semana/ano do fator aplicado (semana do pedido), formato "AA/SS" */
  semana: string;
  fator: number;
  qtdBase: number;
  movimentos: MovimentoPlanilha[];
  resumo: ResumoPlanilha;
  origem: string;
  classifFiscal: string;
  ipi: string;
};

export async function obterPlanilha(id: number): Promise<PlanilhaCusto> {
  const url = new URL("/api/planilha", API_BASE);
  url.searchParams.set("id", String(id));
  return getJson<PlanilhaCusto>(url, `Planilha de custo da encomenda ${id} não encontrada`);
}
