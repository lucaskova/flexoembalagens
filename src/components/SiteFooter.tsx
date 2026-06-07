import Link from "next/link";

type Props = {
  storeName?: string;
};

const cols = [
  {
    title: "Institucional",
    links: [
      { label: "Sobre a empresa", href: "/sobre" },
      { label: "Política de Trocas", href: "/politica-trocas" },
      { label: "Política de Frete", href: "/politica-frete" },
      { label: "Termos de uso", href: "/termos" },
    ],
  },
  {
    title: "Atendimento",
    links: [
      { label: "Central de ajuda", href: "/contato" },
      { label: "Meus pedidos", href: "/minha-conta" },
      { label: "Fale conosco", href: "/contato" },
      { label: "Trocas e devoluções", href: "/politica-trocas" },
    ],
  },
  {
    title: "Categorias",
    links: [
      { label: "Caixas de Papelão", href: "/produtos" },
      { label: "Envelopes", href: "/produtos" },
      { label: "Etiquetas", href: "/produtos" },
      { label: "Bobinas", href: "/produtos" },
    ],
  },
];

export default function SiteFooter({ storeName = "Lambari Pesca" }: Props) {
  return (
    <footer className="mt-20 bg-[#082b4d] text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <p className="text-xl font-extrabold text-white">{storeName}</p>
          <p className="mt-3 max-w-xs text-sm text-slate-400">
            Distribuidora de embalagens e suprimentos para e-commerce. Atacado, entrega rápida e
            nota fiscal para todo o Brasil.
          </p>
          <div className="mt-5 flex gap-3">
            {["Instagram", "Facebook", "WhatsApp"].map((s) => (
              <a
                key={s}
                href="#"
                aria-label={s}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <span className="text-xs font-semibold">{s[0]}</span>
              </a>
            ))}
          </div>
        </div>

        {cols.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
              {col.title}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-slate-400 transition hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-slate-400 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {storeName}. Todos os direitos reservados.
          </p>
          <p>CNPJ 00.000.000/0001-00 · Pagamentos seguros</p>
        </div>
      </div>
    </footer>
  );
}
