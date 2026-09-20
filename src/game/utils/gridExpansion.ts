export function createAnchoredSquareIndexMap(fromSize: number, toSize: number) {
  const map = Array.from({ length: fromSize * fromSize }, (_, index) => {
    const row = Math.floor(index / fromSize)
    const col = index % fromSize
    return row * toSize + col
  })

  return map
}

export function remapAnchoredSquareArray<T>(items: T[], fromSize: number, toSize: number, fillValue: T) {
  const result = Array(toSize * toSize).fill(fillValue) as T[]
  const indexMap = createAnchoredSquareIndexMap(fromSize, toSize)

  for (let index = 0; index < Math.min(items.length, indexMap.length); index += 1) {
    result[indexMap[index]] = items[index] ?? fillValue
  }

  return result
}

export function remapAnchoredSquareAssignments(
  assignments: Record<number, string>,
  fromSize: number,
  toSize: number,
) {
  const result: Record<number, string> = {}

  for (const [cellIndex, employeeId] of Object.entries(assignments)) {
    const sourceIndex = Number(cellIndex)
    if (Number.isNaN(sourceIndex)) continue

    const row = Math.floor(sourceIndex / fromSize)
    const col = sourceIndex % fromSize
    if (row >= fromSize || col >= fromSize) continue

    const targetIndex = row * toSize + col
    result[targetIndex] = employeeId
  }

  return result
}
