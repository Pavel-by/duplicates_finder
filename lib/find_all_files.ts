import { Dirent } from "fs";
import { readdir } from "fs/promises";
import { resolve } from "path";

async function collectFilesFromDir(path: string, filenames: Array<string>): Promise<void> {
  let dirents: Array<Dirent> = [];
  try {
    dirents = await readdir(path, {
      withFileTypes: true,
    });
  } catch (e) {
    console.log(`Failed to read directory ${path}`)
  }

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
  await collectFilesFromDir(resolve(path), result);
  return result;
}

export default findAllFilenames