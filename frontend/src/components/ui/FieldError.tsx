export function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return <p className="text-sm text-danger mt-1.5">{children}</p>;
}
