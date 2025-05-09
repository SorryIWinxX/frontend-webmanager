import { Building2 } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-primary text-primary-foreground p-4 shadow-md">
      <div className="container mx-auto flex items-center gap-2">
        <Building2 size={28} />
        <h1 className="text-2xl font-semibold">Desktop Maintenance Hub</h1>
      </div>
    </header>
  );
}
