import { Card } from "@/components/ui/Card";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="mx-auto max-w-xl text-center">
      <p className="text-lg font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
    </Card>
  );
}
