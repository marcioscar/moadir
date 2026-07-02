// Parsing/composição do código de produto (sigla + dimensões), compartilhado
// entre o formulário de encomenda e a guia de serviço.

export const MATERIAIS = [
  { value: "A", label: "PEAD" },
  { value: "B", label: "PEBD" },
  { value: "P", label: "PP" },
] as const;

export const TIPOS_POR_MATERIAL: Record<
  string,
  { value: string; label: string }[]
> = {
  A: [
    { value: "SS", label: "Sacola Tipo Camiseta" },
    { value: "SC", label: "Sacola Furo Vazado" },
    { value: "SL", label: "Saco Solda Lateral" },
    { value: "SF", label: "Saco Solda Fundo" },
    { value: "BT", label: "Bobina" },
  ],
  B: [
    { value: "SS", label: "Sacola Tipo Camiseta" },
    { value: "SC", label: "Sacola Furo Vazado" },
    { value: "SL", label: "Saco Solda Lateral" },
    { value: "SF", label: "Saco Solda Fundo" },
    { value: "BT", label: "Bobina" },
  ],
  P: [
    { value: "SL", label: "Saco" },
    { value: "BT", label: "Bobina" },
  ],
};

export type Impressao = "L" | "F" | "FV";

const SIGLA_REGEX = /^(SS|SC|SL|SF|BT)([ABP])([NP])(?:I(\d+)(?:\+(\d+))?)?$/;

export function montarSigla(s: {
  tipo: string;
  material: string;
  cor: string;
  impressao: Impressao;
  nFrente: string;
  nVerso: string;
}) {
  let sufixo = "";
  if (s.impressao === "F") sufixo = `I${s.nFrente || "1"}`;
  if (s.impressao === "FV") sufixo = `I${s.nFrente || "1"}+${s.nVerso || "1"}`;
  return `${s.tipo}${s.material}${s.cor}${sufixo}`;
}

export function parseProduto(produto: string) {
  const [sigla, ...resto] = produto.trim().split(/\s+/);
  if (!sigla) return null;
  const m = sigla.match(SIGLA_REGEX);
  if (!m) return null;
  const [, tipo, material, cor, nFrente, nVerso] = m;
  return {
    tipo,
    material,
    cor,
    impressao: (nFrente ? (nVerso ? "FV" : "F") : "L") as Impressao,
    nFrente: nFrente ?? "1",
    nVerso: nVerso ?? "1",
    dimensoes: resto.join(" "),
  };
}

// "19,5X31X0,016" -> { larCm: 19.5, comCm: 31, espCm: 0.016 }
export function parseDimensoes(dimensoes: string) {
  const [larRaw, comRaw, espRaw] = dimensoes.split("X");
  const paraNumero = (v: string | undefined) =>
    v ? Number(v.replace(",", ".")) : 0;
  return {
    larCm: paraNumero(larRaw),
    comCm: paraNumero(comRaw),
    espCm: paraNumero(espRaw),
  };
}

// Tipo de solda derivado do prefixo (mesma regra do GSM.m legado: só "SL"
// resolve como solda lateral, todo o resto — SS/SC/SF/BT — é solda de fundo).
export function soldaPorTipo(tipo: string): "SL" | "SF" {
  return tipo === "SL" ? "SL" : "SF";
}
