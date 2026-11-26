export type Country = {
  id: number
  name: string
  code: string
  flag: string
  average: number | null
  count: number
  visitedCount?: number;
  wishlistCount?: number;
}