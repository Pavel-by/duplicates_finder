import { parentPort } from 'worker_threads';
import { CompareFilesRequest } from './compare_files_protocol';
import { open, read, close } from 'fs';
import { promisify } from 'util';


const DEFAULT_BUFFER_SIZE = 4 * 1024;

const openAsync = promisify(open);
const readAsync = promisify(read);
const closeAsync = promisify(close);

let buf1 = Buffer.alloc(DEFAULT_BUFFER_SIZE);
let buf2 = Buffer.alloc(DEFAULT_BUFFER_SIZE);

async function compareFilesByDescriptors(fd1: number, fd2: number): Promise<number> {
  let offset = 0;
  while (true) {
    let [{ bytesRead: bytesRead1 }, { bytesRead: bytesRead2 }] = await Promise.all([
      readAsync(fd1, buf1, 0, DEFAULT_BUFFER_SIZE, offset),
      readAsync(fd2, buf2, 0, DEFAULT_BUFFER_SIZE, offset),
    ]);
    offset += bytesRead1;

    if (bytesRead1 == 0 && bytesRead2 == 0)
      return 0;

    let compareResult = buf1.compare(buf2, 0, bytesRead2, 0, bytesRead1);
    if (compareResult != 0)
      return compareResult;
  }
}

async function compareFilesByFilenames(filename1: string, filename2: string): Promise<number> {
  let [fd1, fd2] = await Promise.all([
    openAsync(filename1, 'r'),
    openAsync(filename2, 'r'),
  ]);
  let compareResult = await compareFilesByDescriptors(fd1, fd2);
  await Promise.all([
    closeAsync(fd1),
    closeAsync(fd2),
  ]);
  return compareResult;
}

parentPort.on('message', async (message: CompareFilesRequest) => {
  let result = await compareFilesByFilenames(message.filename1, message.filename2);
  parentPort.postMessage({ result });
})
