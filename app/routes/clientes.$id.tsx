import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import type { Route } from "./+types/clientes.$id";
import { obterCliente } from "~/lib/api";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export const handle = { title: "Cliente" };

export function meta({ loaderData }: Route.MetaArgs) {
  return [
    { title: loaderData ? `${loaderData.nome} — moadir` : "Cliente — moadir" },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  return obterCliente(Number(params.id));
}

function Campo({ rotulo, valor }: { rotulo: string; valor?: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {rotulo}
      </p>
      <p className="text-sm">{valor?.trim() || "—"}</p>
    </div>
  );
}

export default function ClienteDetalhe({ loaderData }: Route.ComponentProps) {
  const c = loaderData;

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/clientes">
          <ArrowLeft className="size-4" />
          Voltar
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{c.nome}</CardTitle>
          {c.fantasia ? (
            <p className="text-sm text-muted-foreground">{c.fantasia}</p>
          ) : null}
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo rotulo="ID" valor={String(c.id)} />
          <Campo rotulo="CNPJ" valor={c.cnpj} />
          <Campo rotulo="Inscrição" valor={c.inscricao} />
          <Campo rotulo="Endereço" valor={c.endereco} />
          <Campo rotulo="Bairro" valor={c.bairro} />
          <Campo rotulo="CEP" valor={c.cep} />
          <Campo rotulo="Cidade" valor={c.cidade} />
          <Campo rotulo="UF" valor={c.uf} />
          <Campo rotulo="Telefone 1" valor={c.telefone1} />
          <Campo rotulo="Telefone 2" valor={c.telefone2} />
        </CardContent>
      </Card>
    </main>
  );
}
