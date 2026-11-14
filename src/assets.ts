// Vite replaces BASE_URL for root hosting and repository subpaths alike.
export function assetPath(path: string) {
  return `${import.meta.env.BASE_URL}assets/${path}`;
}
