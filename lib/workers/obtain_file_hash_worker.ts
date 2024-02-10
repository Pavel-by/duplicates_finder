import { parentPort } from 'worker_threads';
import { FileHandle, open } from 'fs/promises';
import { createHash } from 'crypto';
import { Readable } from 'stream';
import { ObtainFileHashRequest } from './obtain_file_hash_protocol';


async function obtainHashFromStream(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    let hash = createHash('md5');
    hash.setEncoding('hex');
    stream
      .once('error', reject)
      .on('end', () => {
        hash.end();
        resolve(hash.read());
      })
      .pipe(hash);
  });
}

async function obtainHashByFilename(filename: string): Promise<string> {
  let fd: FileHandle = null;
  let hash = createHash('md5');
  hash.setEncoding('hex');
  let result = '';
  try {
    fd = await open(filename, 'r');
    result = await obtainHashFromStream(fd.createReadStream());
  } catch (e) {
    console.log(`Failed to obtain hash of file ${filename}`, e);
  } finally {
    await fd?.close();
    return result;
  }
}

parentPort.on('message', async (request: ObtainFileHashRequest) => {
  let hash = await obtainHashByFilename(request.filename);
  parentPort.postMessage({ hash })
})