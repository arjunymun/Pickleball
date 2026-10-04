import Link from "next/link";

export function AuthStatusPill({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link
      href="/app"
      className="academy-button-secondary"
      style={inverted ? { color: "white" } : undefined}
    >
      Your account
    </Link>
  );
}
