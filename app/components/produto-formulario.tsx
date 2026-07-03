import React from "react";
import { Form, useNavigation } from "react-router";
import { Loader2 } from "lucide-react";
import type { ProdutoDetalhe } from "~/lib/api";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent } from "~/components/ui/card";
import { ProdutoPicker } from "~/components/produto-picker";

type Props = {
  produto?: ProdutoDetalhe;
  erro?: string;
};

export function ProdutoFormulario({ produto, erro }: Props) {
  const nav = useNavigation();
  const salvando = nav.state === "submitting";
  const editando = Boolean(produto);

  const [codigo, setCodigo] = React.useState("");
  const [modeloId, setModeloId] = React.useState(0);
  const [modeloNome, setModeloNome] = React.useState("");

  return (
    <Form method="post" className="space-y-6">
      {erro && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {erro}
        </div>
      )}

      <Card>
        <CardContent className="space-y-4 pt-6">
          {!editando && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <Label htmlFor="codigo">
                  Código <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="codigo"
                  name="codigo"
                  type="number"
                  min={1}
                  required
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="col-span-3">
                <Label>Copiar dados de (opcional)</Label>
                <div className="mt-1">
                  <ProdutoPicker
                    produtoId={modeloId}
                    produtoNome={modeloNome}
                    placeholder="Nenhum — usa padrões"
                    onChange={(id, nome) => {
                      setModeloId(id);
                      setModeloNome(nome);
                    }}
                  />
                </div>
                <input type="hidden" name="modeloId" value={modeloId} />
                <p className="mt-1 text-xs text-muted-foreground">
                  Copia a classificação interna de um produto parecido
                  (não altera descrição, custo, venda etc.).
                </p>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="descricao">
              Descrição <span className="text-destructive">*</span>
            </Label>
            <Input
              id="descricao"
              name="descricao"
              required
              maxLength={28}
              defaultValue={produto?.descricao ?? ""}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <Label htmlFor="unidade">
                Unidade <span className="text-destructive">*</span>
              </Label>
              <Input
                id="unidade"
                name="unidade"
                required
                maxLength={3}
                placeholder="KG, HC, MIL..."
                defaultValue={produto?.unidade ?? ""}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="custo">
                Custo (R$) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="custo"
                name="custo"
                type="number"
                min={0}
                step="0.01"
                required
                defaultValue={produto?.custo ?? ""}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="venda">
                Venda (R$) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="venda"
                name="venda"
                type="number"
                min={0}
                step="0.01"
                required
                defaultValue={produto?.venda ?? ""}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="peso">Peso (Kg)</Label>
              <Input
                id="peso"
                name="peso"
                type="number"
                min={0}
                step="0.1"
                defaultValue={produto?.peso ?? 0}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <Label htmlFor="local">Localização</Label>
              <Input
                id="local"
                name="local"
                placeholder="A-0-00"
                defaultValue={produto?.local ?? ""}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="origem">Origem</Label>
              <Input
                id="origem"
                name="origem"
                maxLength={2}
                defaultValue={produto?.origem ?? "01"}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="classifFiscal">Classif. Fiscal</Label>
              <Input
                id="classifFiscal"
                name="classifFiscal"
                maxLength={1}
                defaultValue={produto?.classifFiscal ?? "A"}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="tributadoIpi">Tributado IPI</Label>
              <Input
                id="tributadoIpi"
                name="tributadoIpi"
                maxLength={1}
                placeholder="S ou N"
                defaultValue={produto?.tributadoIpi ?? "N"}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={salvando}>
          {salvando && <Loader2 className="mr-2 size-4 animate-spin" />}
          {editando ? "Salvar Alterações" : "Cadastrar Produto"}
        </Button>
      </div>
    </Form>
  );
}
