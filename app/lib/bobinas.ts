// Tabela de referência "Metragem por Espessura" para bobinas de Ø 60 cm,
// usada na Guia de Serviço UNIEX pra sugerir como dividir a metragem total
// a extrudar em bobinas físicas desse diâmetro. Fonte: ficha de receita em
// papel já usada na produção.
const METRAGEM_POR_ESPESSURA_D60: { espCm: number; metros: number }[] = [
  { espCm: 0.003, metros: 9.416 },
  { espCm: 0.004, metros: 6.88 },
  { espCm: 0.005, metros: 5.65 },
  { espCm: 0.006, metros: 4.586 },
  { espCm: 0.007, metros: 3.93 },
  { espCm: 0.008, metros: 3.44 },
  { espCm: 0.009, metros: 3.057 },
  { espCm: 0.01, metros: 2.825 },
  { espCm: 0.011, metros: 2.5 },
  { espCm: 0.012, metros: 2.293 },
  { espCm: 0.013, metros: 2.116 },
  { espCm: 0.014, metros: 1.966 },
  { espCm: 0.015, metros: 1.883 },
  { espCm: 0.016, metros: 1.72 },
  { espCm: 0.018, metros: 1.528 },
  { espCm: 0.019, metros: 1.448 },
  { espCm: 0.02, metros: 1.412 },
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
