const benefits = [
  { title: "Compra em atacado", desc: "Preços especiais para CNPJ" },
  { title: "Entrega rápida", desc: "Envio para todo o Brasil" },
  { title: "Nota Fiscal", desc: "Emissão em todos os pedidos" },
  { title: "Suporte especializado", desc: "Atendimento para lojistas" },
  { title: "Frete nacional", desc: "Cobertura em todo território" },
];

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 text-[#0f4c81]"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default function BenefitsBar() {
  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-5 sm:grid-cols-3 lg:grid-cols-5">
        {benefits.map((b) => (
          <div key={b.title} className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0f4c81]/10">
              <CheckIcon />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">{b.title}</p>
              <p className="truncate text-xs text-slate-500">{b.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
