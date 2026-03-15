export const PENDING_LINK_TIMEOUT_MS = 4000;

interface SearchParamsLike {
  toString(): string;
}

export function buildNavigationCompletionToken(input: {
  pathname: string | null;
  searchParams?: SearchParamsLike | null;
}): string {
  const search = input.searchParams?.toString();

  if (!input.pathname) {
    return search ? `?${search}` : "";
  }

  return search ? `${input.pathname}?${search}` : input.pathname;
}

export function shouldResetPendingLink(input: {
  isPending: boolean;
  previousToken: string;
  nextToken: string;
}): boolean {
  return (
    input.isPending &&
    input.previousToken.length > 0 &&
    input.previousToken !== input.nextToken
  );
}
