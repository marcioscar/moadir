import { Badge } from "~/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { TrendingDownIcon, UsersIcon } from "lucide-react"

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const numero = new Intl.NumberFormat("pt-BR")

export type ResumoDashboard = {
  totalClientes: number
  totalGeral: number
  clientesComPrejuizo: number
  maiorPrejuizo: { nome: string; total: number } | null
}

export function SectionCards({ resumo }: { resumo: ResumoDashboard }) {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total de clientes</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {numero.format(resumo.totalClientes)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <UsersIcon />
              Cadastrados
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">Base total de clientes</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Prejuízo total</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums text-destructive @[250px]/card:text-3xl">
            {brl.format(resumo.totalGeral)}
          </CardTitle>
          <CardAction>
            <Badge variant="destructive">
              <TrendingDownIcon />
              Período
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">Soma do total geral</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Clientes com prejuízo</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {numero.format(resumo.clientesComPrejuizo)}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">No período selecionado</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Maior prejuízo</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums text-destructive @[250px]/card:text-3xl">
            {resumo.maiorPrejuizo
              ? brl.format(resumo.maiorPrejuizo.total)
              : "—"}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 font-medium">
            {resumo.maiorPrejuizo?.nome ?? "Sem registros"}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
