import { cpus } from "os";
import findAllFilenames from "./find_all_files";
import { Balancer } from "./balancer";
import { CompareFilesRequest, CompareFilesResponse } from "./workers/compare_files_protocol";
import mergeSortAsync from "./merge_sort_async";
import groupIdenticalFromSorted from "./group_sorted_files";
import { relative } from "path";

async function findIdenticalByRawComparing(path: string, threadsCount: number): Promise<Array<Array<string>>> {
  console.log("Running findIdenticalByRawComparing solution");
  let filenames = await findAllFilenames(path);
  console.log(`${filenames.length} files were found`);

  let balancer = new Balancer<CompareFilesRequest, CompareFilesResponse>("./lib/workers/compare_files_worker.ts", threadsCount);
  let comparator = async (filename1: string, filename2: string) => {
    let response = await balancer.executeTask({ filename1, filename2 });
    return response.result;
  };
  console.log("Sorting found files...");
  await mergeSortAsync(filenames, comparator);
  console.log("Grouping sorted files...");
  let groupedFilenames = await groupIdenticalFromSorted(filenames, comparator);
  await balancer.terminate();

  return groupedFilenames.map((filenames) => {
    // convert absolute paths to relative
    return filenames.map((filename) => relative(path, filename));
  });
}

if (require.main == module) {
  const path = "./input";
  const threadsCount = cpus().length;

  findIdenticalByRawComparing(path, threadsCount).then((value) => {
    console.log(JSON.stringify(value, null, 2))
  });
}

export {
  findIdenticalByRawComparing
}