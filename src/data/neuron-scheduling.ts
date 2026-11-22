// Yield between cells so scrolling and page controls can run while the full
// reconstruction is being prepared. Yielding never skips any cell or branch.
export async function mapCells<T, U>(cells: readonly T[], visit: (cell: T) => U) {
  const result: U[] = [];
  let sliceStart = performance.now();
  for (const cell of cells) {
    result.push(visit(cell));
    if (performance.now() - sliceStart >= 7) {
      await new Promise<void>(resolve => setTimeout(resolve, 0));
      sliceStart = performance.now();
    }
  }
  return result;
}
