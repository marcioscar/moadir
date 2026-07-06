// Receitas de referência de blendas de polietileno (Dowlex TG 2085-B + DOW 230N),
// usadas pra pré-preencher percentual e produto de Polietileno Base / Mistura
// na Guia de Serviço. Aplicar uma receita só preenche os campos como ponto
// de partida — tanto o percentual quanto o produto continuam 100% editáveis
// depois (útil pra trocar o material se o sugerido estiver sem estoque).
//
// Baseado na rotina MUMPS "BLENDA" (mantida só como documentação/fonte,
// nunca implementada no backend — o cálculo é feito aqui no React).
//
// Códigos reais do ^EPR (confirmados via /api/produtos?nome=...):
//   P453 = "PELBD DowLEX TG2085-B"
//   P301 = "PEBD 230N DOW"
const DOWLEX_TG2085B = { produtoId: 453, produtoNome: "PELBD DowLEX TG2085-B" };
const DOW_230N = { produtoId: 301, produtoNome: "PEBD 230N DOW" };

export type BlendaComponente = {
  /** Nome do material de referência (da rotina original, pra exibição) */
  material: string;
  /** Produto real sugerido no ^EPR (pode ser trocado livremente na tela) */
  produtoId: number;
  produtoNome: string;
  /** Percentual sugerido (derivado da quantidade de referência), inteiro */
  pctSugerido: number;
  /** Texto original da faixa/percentual, só pra exibição (ex: "30% a 40%") */
  faixaTexto: string;
  /** Quantidade de referência em Kg (batelada de exemplo da rotina original) */
  qtdReferenciaKg: number;
};

export type Blenda = {
  id: number;
  nome: string;
  obs?: string;
  /** [0] = sugestão pro slot "Polietileno Base", [1] = sugestão pro slot "Mistura" */
  componentes: [BlendaComponente, BlendaComponente];
};

export const BLENDAS: Blenda[] = [
  {
    id: 1,
    nome: "Sacos Convencionais (Uso Geral)",
    componentes: [
      { ...DOWLEX_TG2085B, material: "Dowlex TG 2085-B", pctSugerido: 40, faixaTexto: "30% a 40%", qtdReferenciaKg: 16670 },
      { ...DOW_230N, material: "DOW 230N", pctSugerido: 60, faixaTexto: "60% a 70%", qtdReferenciaKg: 25000 },
    ],
  },
  {
    id: 2,
    nome: "Sacos para Serviço Pesado (Heavy Duty)",
    obs: "Exige alta resistência à perfuração e ao empilhamento.",
    componentes: [
      { ...DOWLEX_TG2085B, material: "Dowlex TG 2085-B", pctSugerido: 70, faixaTexto: "70% a 80%", qtdReferenciaKg: 25000 },
      { ...DOW_230N, material: "DOW 230N", pctSugerido: 30, faixaTexto: "20% a 30%", qtdReferenciaKg: 10700 },
    ],
  },
  {
    id: 3,
    nome: "Sacos Pão de Queijo (1 Kg - Consumo Final)",
    componentes: [
      { ...DOWLEX_TG2085B, material: "Dowlex TG 2085-B", pctSugerido: 50, faixaTexto: "50%", qtdReferenciaKg: 12500 },
      { ...DOW_230N, material: "DOW 230N", pctSugerido: 50, faixaTexto: "50%", qtdReferenciaKg: 12500 },
    ],
  },
  {
    id: 4,
    nome: "Sacos para Gelo em Cubos (4 Kg)",
    componentes: [
      { ...DOWLEX_TG2085B, material: "Dowlex TG 2085-B", pctSugerido: 80, faixaTexto: "80% a 90%", qtdReferenciaKg: 25000 },
      { ...DOW_230N, material: "DOW 230N", pctSugerido: 20, faixaTexto: "10% a 20%", qtdReferenciaKg: 6250 },
    ],
  },
  {
    id: 5,
    nome: "Sacos para Peixe Congelado",
    componentes: [
      { ...DOWLEX_TG2085B, material: "Dowlex TG 2085-B", pctSugerido: 70, faixaTexto: "70%", qtdReferenciaKg: 25000 },
      { ...DOW_230N, material: "DOW 230N", pctSugerido: 30, faixaTexto: "30%", qtdReferenciaKg: 10700 },
    ],
  },
  {
    id: 6,
    nome: "Bobinas Técnicas (Automáticas) — Pão de Queijo Congelado",
    obs: "Essencial o uso de Slip/Antibloqueio pra garantir que a bobina deslize bem no colarinho da máquina.",
    componentes: [
      { ...DOWLEX_TG2085B, material: "Dowlex TG 2085-B", pctSugerido: 60, faixaTexto: "60%", qtdReferenciaKg: 25000 },
      { ...DOW_230N, material: "DOW 230N", pctSugerido: 40, faixaTexto: "40%", qtdReferenciaKg: 16000 },
    ],
  },
  {
    id: 7,
    nome: "Bobinas para Leite (1 Litro)",
    componentes: [
      { ...DOWLEX_TG2085B, material: "Dowlex TG 2085-B", pctSugerido: 70, faixaTexto: "70%", qtdReferenciaKg: 25000 },
      { ...DOW_230N, material: "DOW 230N", pctSugerido: 30, faixaTexto: "30%", qtdReferenciaKg: 10700 },
    ],
  },
];
