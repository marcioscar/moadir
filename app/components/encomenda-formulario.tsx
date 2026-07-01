import React from "react";
import { Form, Link, useNavigation, useFetcher } from "react-router";
import { Loader2, Search, X } from "lucide-react";
import type { ClientesResposta, EncomendaDetalhe } from "~/lib/api";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

const hoje = new Date().toISOString().slice(0, 10);

type Props = {
  encomenda?: EncomendaDetalhe;
  erro?: string;
};

type ClienteLookup = { id: number; nome: string; erro?: string };

function ClientePicker({
  clienteId,
  clienteNome,
  onChange,
}: {
  clienteId: number;
  clienteNome: string;
  onChange: (id: number, nome: string) => void;
}) {
  const [codeInput, setCodeInput] = React.useState(
    clienteId > 0 ? String(clienteId) : "",
  );
  const [aberto, setAberto] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const lookupFetcher = useFetcher<ClienteLookup>();
  const searchFetcher = useFetcher<ClientesResposta>();
  const nameInputRef = React.useRef<HTMLInputElement>(null);

  // Sync code input when clienteId changes (e.g. after dialog selection)
  React.useEffect(() => {
    setCodeInput(clienteId > 0 ? String(clienteId) : "");
  }, [clienteId]);

  // Handle ID lookup response
  React.useEffect(() => {
    if (!lookupFetcher.data) return;
    const d = lookupFetcher.data;
    if (d.erro || !d.nome) {
      onChange(0, "");
    } else {
      onChange(d.id, d.nome);
    }
  }, [lookupFetcher.data]);

  function triggerLookup() {
    const id = Number(codeInput);
    if (id > 0 && id !== clienteId) {
      lookupFetcher.load(`/api/cliente?id=${id}`);
    } else if (!id) {
      onChange(0, "");
    }
  }

  // Dialog name search
  React.useEffect(() => {
    if (!aberto) {
      setQuery("");
      return;
    }
    setTimeout(() => nameInputRef.current?.focus(), 50);
  }, [aberto]);

  React.useEffect(() => {
    if (query.length < 2) return;
    const t = setTimeout(() => {
      searchFetcher.load(
        `/api/clientes?nome=${encodeURIComponent(query)}&limite=20`,
      );
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const clientes = searchFetcher.data?.clientes ?? [];
  const buscando = searchFetcher.state === "loading";
  const validando = lookupFetcher.state === "loading";
  const erroLookup =
    lookupFetcher.data?.erro ||
    (lookupFetcher.data && !lookupFetcher.data.nome
      ? "Cliente não encontrado"
      : undefined);

  function selecionar(id: number, nome: string) {
    onChange(id, nome);
    setAberto(false);
  }

  return (
    <>
      <div className="mt-1 flex items-center gap-2">
        <Input
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
          onBlur={triggerLookup}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              triggerLookup();
            }
          }}
          placeholder="Cód."
          className="w-24 shrink-0 font-mono"
          inputMode="numeric"
        />

        <div className="flex min-w-0 flex-1 items-center">
          {validando ? (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Verificando...
            </span>
          ) : erroLookup ? (
            <span className="text-sm text-destructive">{erroLookup}</span>
          ) : clienteNome ? (
            <span className="truncate text-sm">{clienteNome}</span>
          ) : (
            <span className="text-sm text-muted-foreground">
              Nenhum cliente selecionado
            </span>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAberto(true)}
        >
          <Search className="mr-1.5 size-3.5" />
          Buscar
        </Button>

        {clienteId > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={() => {
              onChange(0, "");
              setCodeInput("");
            }}
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Buscar cliente</DialogTitle>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              ref={nameInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Digite parte do nome..."
              className="pl-9"
            />
            {buscando && (
              <Loader2 className="absolute right-3 top-2.5 size-4 animate-spin text-muted-foreground" />
            )}
          </div>

          <div className="max-h-80 overflow-y-auto rounded-md border">
            {query.length < 2 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                Digite ao menos 2 letras para buscar.
              </p>
            ) : clientes.length === 0 && !buscando ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                Nenhum cliente encontrado.
              </p>
            ) : (
              <ul className="divide-y">
                {clientes.map((cli) => (
                  <li key={cli.id}>
                    <button
                      type="button"
                      className="flex w-full items-baseline gap-3 px-4 py-2.5 text-left hover:bg-accent"
                      onClick={() => selecionar(cli.id, cli.nome)}
                    >
                      <span className="w-14 shrink-0 font-mono text-xs text-muted-foreground">
                        {cli.id}
                      </span>
                      <span className="flex-1 text-sm font-medium leading-tight">
                        {cli.nome}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {cli.cidade}/{cli.uf}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function EncomendaFormulario({ encomenda, erro }: Props) {
  const nav = useNavigation();
  const salvando = nav.state === "submitting";

  const [clienteId, setClienteId] = React.useState(
    encomenda?.clienteId ?? 0,
  );
  const [clienteNome, setClienteNome] = React.useState(
    encomenda?.clienteNome ?? "",
  );

  const d = encomenda;

  return (
    <Form method="post" className="space-y-6">
      {/* Campo oculto com o ID do cliente selecionado */}
      <input type="hidden" name="pr3" value={clienteId} />

      {erro && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {erro}
        </div>
      )}

      {/* Produto e Cliente */}
      <Card>
        <CardContent className="pt-6">
          <p className="mb-4 text-sm font-medium text-muted-foreground">
            Produto e Cliente
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="pr1">
                Produto <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pr1"
                name="pr1"
                required
                minLength={5}
                maxLength={40}
                defaultValue={d?.produto ?? ""}
                placeholder="Ex: SLBNI4+4 19,5X31X0,016"
                className="mt-1 font-mono"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Código do produto conforme cadastro (tipo + dimensões).
              </p>
            </div>

            <div>
              <Label htmlFor="pr2">
                Unidade <span className="text-destructive">*</span>
              </Label>
              <Select name="pr2" defaultValue={d?.unidade ?? "MIL"} required>
                <SelectTrigger id="pr2" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MIL">MIL (milhares)</SelectItem>
                  <SelectItem value="KG">KG (quilogramas)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <Label>
                Cliente <span className="text-destructive">*</span>
              </Label>
              <ClientePicker
                clienteId={clienteId}
                clienteNome={clienteNome}
                onChange={(id, nome) => {
                  setClienteId(id);
                  setClienteNome(nome);
                }}
              />
              {clienteId === 0 && (
                <p className="mt-1 text-xs text-destructive">
                  Selecione um cliente antes de salvar.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pedido e Quantidades */}
      <Card>
        <CardContent className="pt-6">
          <p className="mb-4 text-sm font-medium text-muted-foreground">
            Pedido e Quantidades
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="pr4">
                Data do Pedido <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pr4"
                name="pr4"
                type="date"
                required
                defaultValue={d?.dataPedido ?? hoje}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="pr5">
                Quantidade Pedida <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pr5"
                name="pr5"
                type="number"
                required
                min={0}
                step="0.001"
                defaultValue={d?.qtdPedida ?? ""}
                placeholder="0.000"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="pr6">
                Aceita Aproximado? <span className="text-destructive">*</span>
              </Label>
              <Select name="pr6" defaultValue={d?.aceitaAprox ?? "S"} required>
                <SelectTrigger id="pr6" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="S">Sim</SelectItem>
                  <SelectItem value="N">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pr9">Embalagem (un/cx)</Label>
              <Input
                id="pr9"
                name="pr9"
                type="number"
                min={0}
                defaultValue={d?.embalagem ?? 0}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="pr24">Dias de Prazo</Label>
              <Input
                id="pr24"
                name="pr24"
                type="number"
                min={0}
                max={99}
                defaultValue={d?.diasPrazo ?? 28}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preços e Valores */}
      <Card>
        <CardContent className="pt-6">
          <p className="mb-4 text-sm font-medium text-muted-foreground">
            Preços e Valores
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="pr10">Preço Unit. Custo (R$)</Label>
              <Input
                id="pr10"
                name="pr10"
                type="number"
                min={0}
                step="0.01"
                defaultValue={d?.precoCusto ?? ""}
                placeholder="0.00"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="pr11">Preço Unit. Venda (R$)</Label>
              <Input
                id="pr11"
                name="pr11"
                type="number"
                min={0}
                step="0.01"
                defaultValue={d?.precoVenda ?? ""}
                placeholder="0.00"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="pr12">Valor Orçado (R$)</Label>
              <Input
                id="pr12"
                name="pr12"
                type="number"
                min={0}
                step="0.01"
                defaultValue={d?.valorOrcado ?? ""}
                placeholder="0.00"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="pr14">Peso Total (kg)</Label>
              <Input
                id="pr14"
                name="pr14"
                type="number"
                min={0}
                step="0.1"
                defaultValue={d?.pesoKg ?? ""}
                placeholder="0.0"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="pr23">Comissão Venda (%)</Label>
              <Input
                id="pr23"
                name="pr23"
                type="number"
                min={0}
                max={99}
                defaultValue={d?.comissaoVenda ?? 0}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="pr25">ICM (%)</Label>
              <Input
                id="pr25"
                name="pr25"
                type="number"
                min={0}
                max={99}
                defaultValue={d?.icmPct ?? 13}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Classificação Fiscal e Localização */}
      <Card>
        <CardContent className="pt-6">
          <p className="mb-4 text-sm font-medium text-muted-foreground">
            Classificação e Localização
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <Label htmlFor="pr13">Localização Almox</Label>
              <Input
                id="pr13"
                name="pr13"
                maxLength={4}
                defaultValue={d?.localizacaoAlmox ?? ""}
                placeholder="Z000"
                className="mt-1 font-mono uppercase"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                1 letra + 3 dígitos
              </p>
            </div>

            <div>
              <Label htmlFor="pr15">Cód. Origem</Label>
              <Input
                id="pr15"
                name="pr15"
                maxLength={2}
                defaultValue={d?.codOrigem ?? ""}
                placeholder="01"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="pr16">Classif. Fiscal</Label>
              <Input
                id="pr16"
                name="pr16"
                maxLength={1}
                defaultValue={d?.classifFiscal ?? ""}
                placeholder="A"
                className="mt-1 font-mono uppercase"
              />
            </div>

            <div>
              <Label htmlFor="pr17">Tributado IPI?</Label>
              <Select name="pr17" defaultValue={d?.tributadoIpi ?? "N"}>
                <SelectTrigger id="pr17" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="S">Sim</SelectItem>
                  <SelectItem value="N">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex items-center justify-end gap-3">
        <Button asChild variant="outline">
          <Link to="/fila">Cancelar</Link>
        </Button>
        <Button type="submit" disabled={salvando || clienteId === 0}>
          {salvando && <Loader2 className="mr-2 size-4 animate-spin" />}
          {encomenda ? "Salvar alterações" : "Criar encomenda"}
        </Button>
      </div>
    </Form>
  );
}
