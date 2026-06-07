import { getSettings } from "@/lib/settings";
import { updateSettings } from "./actions";
import ColorField from "@/components/admin/ColorField";
import ImageUploadField from "@/components/admin/ImageUploadField";

export default async function AdminConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  const { ok, err } = await searchParams;

  let settings = null;
  try {
    settings = await getSettings();
  } catch {
    // banco offline
  }

  const threshold =
    settings?.freeShippingThreshold != null
      ? String(settings.freeShippingThreshold).replace(".", ",")
      : "";

  const b2bDiscount =
    settings?.b2bDiscountPercent != null
      ? String(settings.b2bDiscountPercent).replace(".", ",")
      : "";
  const b2bMin =
    settings?.b2bMinOrder != null ? String(settings.b2bMinOrder).replace(".", ",") : "";
  const b2bMinFreight =
    settings?.b2bMinFreight != null ? String(settings.b2bMinFreight).replace(".", ",") : "";
  const b2bFreeShipThreshold =
    settings?.b2bFreeShippingThreshold != null
      ? String(settings.b2bFreeShippingThreshold).replace(".", ",")
      : "";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-slate-600">Identidade da loja, avisos e regras de frete</p>
      </header>

      {ok && (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Configurações salvas.</p>
      )}
      {err && (
        <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{decodeURIComponent(err)}</p>
      )}

      {!settings ? (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          Banco indisponível. Verifique a conexão e tente novamente.
        </p>
      ) : (
        <form action={updateSettings} className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold">Identidade</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">Nome da loja</span>
                <input name="name" defaultValue={settings.name} className="input" />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">Descrição</span>
                <textarea
                  name="description"
                  defaultValue={settings.description ?? ""}
                  rows={2}
                  className="input"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">WhatsApp</span>
                <input name="whatsapp" defaultValue={settings.whatsapp ?? ""} className="input" />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">E-mail</span>
                <input name="email" defaultValue={settings.email ?? ""} className="input" />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Instagram</span>
                <input
                  name="instagram"
                  defaultValue={settings.instagram ?? ""}
                  placeholder="@lambaripesca"
                  className="input"
                />
              </label>
              <ImageUploadField
                name="logoUrl"
                defaultValue={settings.logoUrl}
                label="Logo da loja"
                contain
              />
              <div className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">Cor da marca</span>
                <ColorField name="themeColor" defaultValue={settings.themeColor} />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold">Barra de aviso</h2>
            <p className="text-sm text-slate-500">Mensagem exibida no topo da loja.</p>
            <div className="mt-4 space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="announcementEnabled"
                  defaultChecked={settings.announcementEnabled}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                />
                <span className="text-sm font-medium text-slate-700">Exibir barra de aviso</span>
              </label>
              <input
                name="announcement"
                defaultValue={settings.announcement ?? ""}
                placeholder="Ex.: Frete grátis acima de R$ 299!"
                className="input"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold">Vitrine (home)</h2>
            <p className="text-sm text-slate-500">
              Banner principal e carrossel de destaques exibidos na página inicial.
            </p>
            <div className="mt-4 space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="heroEnabled"
                  defaultChecked={settings.heroEnabled}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                />
                <span className="text-sm font-medium text-slate-700">Exibir banner principal</span>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Título do banner
                </span>
                <input
                  name="heroTitle"
                  defaultValue={settings.heroTitle ?? ""}
                  placeholder="Ex.: Tudo para sua pescaria"
                  className="input"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Subtítulo do banner
                </span>
                <input
                  name="heroSubtitle"
                  defaultValue={settings.heroSubtitle ?? ""}
                  placeholder="Ex.: As melhores marcas com entrega rápida"
                  className="input"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Texto do botão
                </span>
                <input
                  name="heroCtaLabel"
                  defaultValue={settings.heroCtaLabel ?? ""}
                  placeholder="Ex.: Ver produtos"
                  className="input"
                />
              </label>

              <div className="border-t border-slate-100 pt-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="featuredCarouselEnabled"
                    defaultChecked={settings.featuredCarouselEnabled}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Exibir carrossel de destaques
                  </span>
                </label>
                <p className="mt-1 text-xs text-slate-500">
                  Mostra os produtos marcados como “Destaque na home” no cadastro de produtos.
                </p>
                <label className="mt-3 block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Título do carrossel
                  </span>
                  <input
                    name="featuredTitle"
                    defaultValue={settings.featuredTitle ?? ""}
                    placeholder="Destaques"
                    className="input"
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold">Frete grátis</h2>
            <p className="text-sm text-slate-500">Zera o frete quando o subtotal atinge o valor.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="flex items-center gap-2 sm:col-span-2">
                <input
                  type="checkbox"
                  name="freeShippingEnabled"
                  defaultChecked={settings.freeShippingEnabled}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                />
                <span className="text-sm font-medium text-slate-700">Ativar frete grátis</span>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Valor mínimo (R$)
                </span>
                <input
                  name="freeShippingThreshold"
                  defaultValue={threshold}
                  inputMode="decimal"
                  placeholder="299,00"
                  className="input"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold">Atacado (B2B / CNPJ)</h2>
            <p className="text-sm text-slate-500">
              Clientes com conta <strong>Pessoa Jurídica (CNPJ)</strong> veem um preço com desconto.
              Pessoa Física (CPF) e visitantes veem o preço normal de varejo.
            </p>
            <div className="mt-4 space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="b2bEnabled"
                  defaultChecked={settings.b2bEnabled}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                />
                <span className="text-sm font-medium text-slate-700">Ativar preços de atacado</span>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Desconto para CNPJ (%)
                  </span>
                  <input
                    name="b2bDiscountPercent"
                    defaultValue={b2bDiscount}
                    inputMode="decimal"
                    placeholder="Ex.: 15"
                    className="input"
                  />
                  <span className="mt-1 block text-xs text-slate-500">
                    Aplicado sobre o preço de cada produto (após promoções).
                  </span>
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Pedido mínimo CNPJ (R$)
                  </span>
                  <input
                    name="b2bMinOrder"
                    defaultValue={b2bMin}
                    inputMode="decimal"
                    placeholder="Ex.: 300,00"
                    className="input"
                  />
                  <span className="mt-1 block text-xs text-slate-500">
                    Valor mínimo do subtotal para finalizar pedido de atacado.
                  </span>
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Frete mínimo CNPJ (R$)
                  </span>
                  <input
                    name="b2bMinFreight"
                    defaultValue={b2bMinFreight}
                    inputMode="decimal"
                    placeholder="Ex.: 25,00"
                    className="input"
                  />
                  <span className="mt-1 block text-xs text-slate-500">
                    Valor mínimo cobrado de frete em pedidos CNPJ (piso de frete).
                  </span>
                </label>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="b2bFreeShippingEnabled"
                    defaultChecked={settings.b2bFreeShippingEnabled}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Frete grátis para CNPJ acima de um valor
                  </span>
                </label>
                <label className="mt-3 block sm:max-w-xs">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Valor mínimo para frete grátis CNPJ (R$)
                  </span>
                  <input
                    name="b2bFreeShippingThreshold"
                    defaultValue={b2bFreeShipThreshold}
                    inputMode="decimal"
                    placeholder="Ex.: 800,00"
                    className="input"
                  />
                  <span className="mt-1 block text-xs text-slate-500">
                    Regra separada do frete grátis de varejo (CPF).
                  </span>
                </label>
              </div>
            </div>
          </section>

          <button className="rounded-xl bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">
            Salvar configurações
          </button>
        </form>
      )}
    </div>
  );
}
