import { Balancer } from "./balancer";
import findAllFilenames from "./find_all_files";
import { cpus } from "os";
import { ObtainFileHashRequest, ObtainFileHashResponse } from "./workers/obtain_file_hash_protocol";
import { relative } from "path";


async function findIdenticalByHashesComparing(path: string, threadsCount: number): Promise<Array<Array<string>>> {
  console.log("Running findIdenticalByHashesComparing solution");
  let filenames = await findAllFilenames(path);
  console.log(`${filenames.length} files were found`);

  let hashToFilenames = new Map<string, Array<string>>();
  let balancer = new Balancer<ObtainFileHashRequest, ObtainFileHashResponse>("./lib/workers/obtain_file_hash_worker.ts", threadsCount);
  console.log("Obtaining hashes for found files...")
  await Promise.all(filenames.map(async (filename) => {
    let response = await balancer.executeTask({ filename });
    if (!hashToFilenames.has(response.hash))
      hashToFilenames.set(response.hash, []);
    hashToFilenames.get(response.hash).push(filename);
  }));
  await balancer.terminate();

  return Array.from(hashToFilenames.values(), (filenames) => {
    // convert absolute paths to relative
    return filenames.map((filename) => relative(path, filename));
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