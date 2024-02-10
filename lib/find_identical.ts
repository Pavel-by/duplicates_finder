import { readdir } from 'fs/promises';
import { CompareFilesRequest, CompareFilesResponse } from './workers/compare_files_protocol';
import { ObtainFileHashRequest, ObtainFileHashResponse } from './workers/obtain_file_hash_protocol';
import mergeSortAsync from './merge_sort_async';
import { Balancer } from './balancer';
import { resolve, relative } from 'path/posix';

async function collectFilesFromDir(path: string, filenames: Array<string>): Promise<void> {
  let dirents = await readdir(path, {
    withFileTypes: true,
  });
  for (let dirent of dirents) {
    let fullPath = resolve(path, dirent.name);
    if (dirent.isDirectory())
      await collectFilesFromDir(fullPath, filenames);
    else
      filenames.push(fullPath);
  }
}

async function findAllFilenames(path: string): Promise<Array<string>> {
  let result = Array<string>();
  await collectFilesFromDir(path, result);
  return result;
}

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

async function findIdenticalByRawComparing(path: string, threadsCount: number): Promise<Array<Array<string>>> {
  console.log("Running findIdenticalByRawComparing solution");
  let filenames = await findAllFilenames(path);
  console.log(`${filenames.length} files were found`);

  let balancer = new Balancer<CompareFilesRequest, CompareFilesResponse>("./lib/workers/compare_files_worker.js", threadsCount);
  let comparator = async (filename1: string, filename2: string) => {
    let response = await balancer.executeTask({ filename1, filename2 });
    return response.result;
  };
  console.log("Sorting found files...");
  await mergeSortAsync(filenames, comparator);
  console.log("Grouping sorted files...");
  let groupedFilenames = await groupIdenticalFromSorted(filenames, comparator);
  await balancer.terminate();

  groupedFilenames = groupedFilenames.map((filenames) => {
    return filenames.map((filename) => relative(path, filename));
  })
  return groupedFilenames;
}

async function findIdenticalByHashesComparing(path: string, threadsCount: number): Promise<Array<Array<string>>> {
  console.log("Running findIdenticalByHashesComparing solution");
  let filenames = await findAllFilenames(path);
  console.log(`${filenames.length} files were found`);

  let balancer = new Balancer<ObtainFileHashRequest, ObtainFileHashResponse>("./lib/workers/obtain_file_hash_worker.js", threadsCount);
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
    return group.map((hash) => relative(path, hash.filename));
  });
}

export {
  findIdenticalByRawComparing,
  findIdenticalByHashesComparing,
}
