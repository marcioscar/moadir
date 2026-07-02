import React from "react";
import { useFetcher } from "react-router";
import { Loader2, Search, X } from "lucide-react";
import type { ProdutosResposta } from "~/lib/api";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

type Props = {
  produtoId: number;
  produtoNome: string;
  placeholder?: string;
  onChange: (id: number, nome: string) => void;
};

export function ProdutoPicker({
  produtoId,
  produtoNome,
  placeholder = "Nenhum produto selecionado",
  onChange,
}: Props) {
  const [aberto, setAberto] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const searchFetcher = useFetcher<ProdutosResposta>();
  const nomeInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!aberto) {
      setQuery("");
      return;
    }
    setTimeout(() => nomeInputRef.current?.focus(), 50);
  }, [aberto]);

  React.useEffect(() => {
    if (query.length < 2) return;
    const t = setTimeout(() => {
      searchFetcher.load(
        `/api/produtos?nome=${encodeURIComponent(query)}&limite=20`,
      );
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const produtos = searchFetcher.data?.produtos ?? [];
  const buscando = searchFetcher.state === "loading";

  function selecionar(id: number, nome: string) {
    onChange(id, nome);
    setAberto(false);
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center">
          {produtoId > 0 ? (
            <span className="truncate text-sm">
              P{produtoId} - {produtoNome}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">
              {placeholder}
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

        {produtoId > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={() => onChange(0, "")}
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Buscar matéria-prima</DialogTitle>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              ref={nomeInputRef}
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
            ) : produtos.length === 0 && !buscando ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                Nenhum produto encontrado.
              </p>
            ) : (
              <ul className="divide-y">
                {produtos.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="flex w-full items-baseline gap-3 px-4 py-2.5 text-left hover:bg-accent"
                      onClick={() => selecionar(p.id, p.descricao)}
                    >
                      <span className="w-14 shrink-0 font-mono text-xs text-muted-foreground">
                        P{p.id}
                      </span>
                      <span className="flex-1 text-sm font-medium leading-tight">
                        {p.descricao}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {p.grupo}
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
