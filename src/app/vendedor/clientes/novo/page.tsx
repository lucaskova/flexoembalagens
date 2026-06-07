import SellerClientForm from "@/components/vendedor/SellerClientForm";

export const metadata = { title: "Cadastrar cliente — Portal do Vendedor" };

export default function NovoClienteVendedorPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Cadastrar cliente</h1>
        <p className="text-sm text-slate-600">
          Digite o CNPJ para preencher os dados automaticamente.
        </p>
      </header>
      <SellerClientForm />
    </div>
  );
}
