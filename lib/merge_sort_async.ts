type Comparator<T> = (a: T, b: T) => Promise<number>

async function mergeSortInner<T>(arr: Array<T>, comp: Comparator<T>, start: number, end: number, cache: Array<T>): Promise<void> {
  if (start + 1 >= end) return;

  let middle = Math.floor((start + end) / 2);
  await Promise.all([
    mergeSortInner(arr, comp, start, middle, cache),
    mergeSortInner(arr, comp, middle, end, cache),
  ]);
  let leftIdx = middle - 1;
  let rightIdx = end - 1;
  let cacheIdx = end - 1;
  while (cacheIdx >= start) {
    if (leftIdx < start) {
      cache[cacheIdx--] = arr[rightIdx--];
      continue;
    }
    if (rightIdx < middle) {
      cache[cacheIdx--] = arr[leftIdx--];
      continue;
    }

    let compareResult = await comp(arr[leftIdx], arr[rightIdx]);
    if (compareResult < 0)
      cache[cacheIdx--] = arr[rightIdx--];
    else
      cache[cacheIdx--] = arr[leftIdx--];
  }

  for (let i = start; i < end; i++)
    arr[i] = cache[i];
}

function mergeSortAsync<T>(arr: Array<T>, comp: Comparator<T>): Promise<void> {
  let cache = new Array<T>(arr.length);
  return mergeSortInner(arr, comp, 0, arr.length, cache);
}

export default mergeSortAsync;