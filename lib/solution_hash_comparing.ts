import { Balancer } from "./balancer";
import findAllFilenames from "./find_all_files";
import { cpus } from "os";
import { ObtainFileHashRequest, ObtainFileHashResponse } from "./workers/obtain_file_hash_protocol";
import groupIdenticalFromSorted from "./group_sorted_files";
import { relative } from "path";


async function findIdenticalByHashesComparing(path: string, threadsCount: number): Promise<Array<Array<string>>> {
  console.log("Running findIdenticalByHashesComparing solution");
  let filenames = await findAllFilenames(path);
  console.log(`${filenames.length} files were found`);

  let balancer = new Balancer<ObtainFileHashRequest, ObtainFileHashResponse>("./lib/workers/obtain_file_hash_worker.ts", threadsCount);
  console.log("Obtaining hashes for found files...")
  let hashesPromises = filenames.map(async (filename) => {
    let response = await balancer.executeTask({ filename });
    return {
      filename: filename,
      hash: response.hash,
    }
  });
  let hashes = await Promise.all(hashesPromises);
  await balancer.terminate();

  hashes.sort((a, b) => a.hash.localeCompare(b.hash));
  let groupedHashes = await groupIdenticalFromSorted(hashes, async (a, b) => a.hash.localeCompare(b.hash))

  return groupedHashes.map((group) => {
    // convert relative paths to absolute
    return group.map((hash) => relative(path, hash.filename));
  });
}

if (require.main == module) {
  const path = "./input";
  const threadsCount = cpus().length;

  findIdenticalByHashesComparing(path, threadsCount).then((value) => {
    console.log(JSON.stringify(value, null, 2))
  });
}

export {
  findIdenticalByHashesComparing
}