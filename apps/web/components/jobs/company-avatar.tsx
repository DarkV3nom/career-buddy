// Colorful square logo avatar (reference: Yo!Job's assorted colored
// company-logo squares) -- we don't store real company logos, so this
// cycles through the app's own design tokens by a hash of the company
// name instead of showing a fabricated icon. Same name always lands on
// the same color, so a company reads consistently across cards.
const PALETTE = [
  "bg-secondary text-secondary-foreground",
  "bg-accent text-accent-foreground",
  "bg-warning text-warning-foreground",
  "bg-primary text-primary-foreground",
  "bg-destructive text-destructive-foreground",
];

function hashString(s: string) {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

interface CompanyAvatarProps {
  name: string | null;
  className?: string;
}

export function CompanyAvatar({ name, className = "" }: CompanyAvatarProps) {
  const label = (name ?? "?").trim();
  const initial = label.charAt(0).toUpperCase() || "?";
  const colorClass = PALETTE[hashString(label) % PALETTE.length];

  return (
    <span
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-semibold ${colorClass} ${className}`}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
