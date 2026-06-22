export function characterUrl(numId: number, slug: string) {
  return `/library/characters/${numId}-${slug}`;
}

export function parseCharacterParam(param: string): number {
  return parseInt(param, 10);
}
