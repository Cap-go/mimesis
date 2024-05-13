export const randomSelect = <Type>(filtered: Type[]): Type => {
  return filtered[Math.floor(Math.random() * filtered.length)]
}
