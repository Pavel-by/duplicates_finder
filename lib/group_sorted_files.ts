/**
 * Example:
 *
 * ```
 * groupIdenticalFromSorted([
 *  1,1,1,2,2,3,3,3
 * ], async (a, b) => a - b);
 * ```
 *
 * will return
 *
 * `[[1,1,1], [2,2], [3,3,3]]`
 */
async function groupIdenticalFromSorted<T>(arr: Array<T>, comp: (a: T, b: T) => Promise<number>): Promise<Array<Array<T>>> {
  let comparePromises = Array<Promise<number>>(arr.length);
  for (let i = 0; i < arr.length - 1; i++) {
    comparePromises[i] = comp(arr[i], arr[i + 1]);
  }
  comparePromises[arr.length - 1] = Promise.resolve(-1);
  let compareResults = await Promise.all(comparePromises);
  let result = Array<Array<T>>();
  let lastTakenIdx = -1;
  for (let i = 0; i < arr.length; i++) {
    if (compareResults[i] != 0) {
      result.push(arr.slice(lastTakenIdx + 1, i + 1));
      lastTakenIdx = i;
    }
  }
  return result;
}

export default groupIdenticalFromSorted