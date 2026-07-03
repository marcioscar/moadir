const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export const qty = (v: number, dec: number) =>
  (v / 10 ** dec).toLocaleString("pt-BR", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });

export const centavos = (v: number) => brl.format(v / 100);

export const TIPO_MOV: Record<number, string> = {
  1: "Entrada",
  2: "Saída",
  3: "Transferência",
  4: "Devolução/Apara",
  5: "Ajuste",
  6: "Cancelamento",
};

export function fmtData(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
