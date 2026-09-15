import { ApostleAvatar } from "@/components/ApostleAvatar";
import type { Apostle } from "@/lib/apostles";

type ApostleMessageCardProps = {
  apostle: Apostle;
  message: string;
};

export function ApostleMessageCard({ apostle, message }: ApostleMessageCardProps) {
  return (
    <section className="w-full max-w-sm rounded-2xl bg-paper border border-mist p-4 flex items-start gap-3">
      <ApostleAvatar apostleId={apostle.id} />
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-xs font-medium text-clay-600">{apostle.name}</span>
        <p className="text-sm text-ink/85 leading-relaxed">{message}</p>
      </div>
    </section>
  );
}
