import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";

const chartConfig = {
  count: { label: "Pedidos", color: "var(--primary)" },
} satisfies ChartConfig;

export type ItemClienteAtivo = { cliente: string; count: number };

export function ChartTopClientes({ data }: { data: ItemClienteAtivo[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Clientes com mais pedidos em aberto</CardTitle>
        <CardDescription>Top {data.length} por quantidade de encomendas</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Sem pedidos em aberto.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="max-h-[300px] w-full">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 8, right: 32 }}
            >
              <CartesianGrid horizontal={false} />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="cliente"
                width={200}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
