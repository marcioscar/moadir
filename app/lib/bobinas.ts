// Tabela de referência "Metragem por Espessura" para bobinas de Ø 60 cm,
// usada na Guia de Serviço UNIEX pra sugerir como dividir a metragem total
// a extrudar em bobinas físicas desse diâmetro. Fonte: ficha de receita em
// papel já usada na produção.
// Valores em METROS (a vírgula na ficha de papel original é separador de
// milhar aqui, não decimal — confirmado batendo com a física do rolo:
// metros ≈ π×Ø²/(4×espessura), ex. espessura 0,013 → ≈2.175m calculado vs
// 2.116m da tabela, mesma ordem de grandeza; não ~2 metros).
const METRAGEM_POR_ESPESSURA_D60: { espCm: number; metros: number }[] = [
  { espCm: 0.003, metros: 9416 },
  { espCm: 0.004, metros: 6880 },
  { espCm: 0.005, metros: 5650 },
  { espCm: 0.006, metros: 4586 },
  { espCm: 0.007, metros: 3930 },
  { espCm: 0.008, metros: 3440 },
  { espCm: 0.009, metros: 3057 },
  { espCm: 0.01, metros: 2825 },
  { espCm: 0.011, metros: 2500 },
  { espCm: 0.012, metros: 2293 },
  { espCm: 0.013, metros: 2116 },
  { espCm: 0.014, metros: 1966 },
  { espCm: 0.015, metros: 1883 },
  { espCm: 0.016, metros: 1720 },
  { espCm: 0.018, metros: 1528 },
  { espCm: 0.019, metros: 1448 },
  { espCm: 0.02, metros: 1412 },
];

export type SugestaoBobinas = {
  /** Metragem de referência (mais próxima) usada no cálculo */
  espRef: number;
  /** Metragem que cabe numa bobina de Ø60cm nessa espessura */
  metrosPorBobina: number;
  /** Se a espessura pedida não bateu exatamente com a tabela */
  aproximado: boolean;
  /** Quantidade de bobinas de Ø60cm pra fechar a metragem total a extrudar */
  qtdBobinas: number;
};

/**
 * Sugere como dividir `metrosTotais` a extrudar em bobinas de Ø60cm,
 * a partir da espessura pedida (`espCm`), usando a tabela de referência.
 */
export function sugerirBobinas60cm(
  espCm: number,
  metrosTotais: number,
): SugestaoBobinas | null {
  if (!espCm || !metrosTotais) return null;

  let melhor = METRAGEM_POR_ESPESSURA_D60[0];
  let menorDiff = Math.abs(espCm - melhor.espCm);
  for (const linha of METRAGEM_POR_ESPESSURA_D60) {
    const diff = Math.abs(espCm - linha.espCm);
    if (diff < menorDiff) {
      menorDiff = diff;
      melhor = linha;
    }
  }

  return {
    espRef: melhor.espCm,
    metrosPorBobina: melhor.metros,
    aproximado: menorDiff > 0.0001,
    qtdBobinas: Math.max(1, Math.ceil(metrosTotais / melhor.metros)),
  };
}
