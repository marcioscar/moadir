import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart"

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const chartConfig = {
  valor: {
    label: "Prejuízo",
    color: "var(--destructive)",
  },
} satisfies ChartConfig

export type ItemPrejuizo = { nome: string; total: number }

export function ChartPrejuizos({ data }: { data: ItemPrejuizo[] }) {
  // Maiores prejuízos (valores mais negativos), em valor absoluto para a barra.
  const chartData = [...data]
    .sort((a, b) => a.total - b.total)
    .slice(0, 10)
    .map((d) => ({
      nome: d.nome.length > 28 ? d.nome.slice(0, 28) + "…" : d.nome,
      valor: Math.abs(d.total),
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maiores prejuízos</CardTitle>
        <CardDescription>Top 10 clientes no período</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Sem dados no período.
          </p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="max-h-[420px] w-full"
          >
            <BarChart
              accessibilityLayer
              data={chartData}
              layout="vertical"
              margin={{ left: 12, right: 16 }}
            >
              <CartesianGrid horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(v) => brl.format(-v)}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="nome"
                width={180}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value) => brl.format(-(value as number))}
                  />
                }
              />
              <Bar dataKey="valor" fill="var(--color-valor)" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
