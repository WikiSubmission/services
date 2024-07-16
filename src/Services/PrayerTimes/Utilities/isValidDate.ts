export function isValidDate(str: string | null | undefined): boolean {
  if (isNil(str)) return false;
  str = str as string;
  const regexMatch = str.match(/^\d{4}-\d{2}-\d{2}$/) !== null;
  if (!regexMatch) return false;
  const [y, m, d] = str.split("-").map((x) => Number(x));
  if (y < 1000 || y > 3000 || m < 1 || m > 12 || d < 1 || d > 31) return false;

  return true;
}

export function isNil(value: string | null | undefined) {
  return value === null || value === undefined;
}
