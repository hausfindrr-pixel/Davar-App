import type { ReactNode } from "react";

type BenefitCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
};

export function BenefitCard({ icon, title, description }: BenefitCardProps) {
  return (
    <div className="rounded-3xl bg-paper border border-mist p-6 flex flex-col gap-3 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_12px_32px_rgba(58,51,44,0.08)]">
      <div className="h-11 w-11 rounded-2xl bg-sage-50 text-sage-600 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="text-sm text-ink/75 leading-relaxed">{description}</p>
    </div>
  );
}
