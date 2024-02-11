import { assert } from 'console';
import { Worker } from 'worker_threads';
import { Queue } from './queue';

type TaskCallback<Response> = (result: Response) => void;

class WorkerController<Request, Response> {
  readonly workerFilename: string
  private readonly _worker: Worker

  constructor(workerFilename: string) {
    this.workerFilename = workerFilename
    this._worker = new Worker(workerFilename, {
      execArgv: ["-r", "ts-node/register"],
    })
    this._worker.on('message', this.onMessage.bind(this));
  }

  private _executingTaskCallback?: TaskCallback<Response> = null
  public get canExecuteTask() {
    return this._executingTaskCallback == null;
  }

  private onMessage(message: Response) {
    let cb = this._executingTaskCallback;
    this._executingTaskCallback = null;
    cb(message);
  }

  public executeTask(data: Request, cb: TaskCallback<Response>) {
    assert(this.canExecuteTask, "Cannot launch next task while previous is not finished");
    this._executingTaskCallback = cb;
    this._worker.postMessage(data);
  }

  public async terminate(): Promise<number> {
    let value = await this._worker.terminate();
    this._executingTaskCallback = null;
    return value;
  }
}

interface BalancerTask<Request, Response> {
  data: Request
  callback: TaskCallback<Response>
}

/**
 * Creates `workersLimit` workers with `workerFilename` typescript
 * entry points and handles requests balancing beteween them. All
 * requests will pe queued until free worker found.
 */
class Balancer<Request, Response> {
  readonly workerFilename: string
  readonly workersLimit: number
  private workers: Array<WorkerController<Request, Response>>
  private tasksQueue: Queue<BalancerTask<Request, Response>> = new Queue()

  constructor(workerFilename: string, workersLimit: number) {
    this.workerFilename = workerFilename;
    this.workersLimit = workersLimit;

    console.log(`Balancer: starting ${workersLimit} workers with entry ${workerFilename}`)
    this.workers = new Array(workersLimit);
    for (let i = 0; i < workersLimit; i++)
      this.workers[i] = new WorkerController(workerFilename);
  }

  private async executeQueuedTasks() {
    let workerIndex = 0
    while (this.tasksQueue.canPop && workerIndex < this.workers.length) {
      if (this.workers[workerIndex].canExecuteTask) {
        let task = this.tasksQueue.pop();
        this.workers[workerIndex].executeTask(task.data, task.callback);
      }
      workerIndex++;
    }
  }

  public executeTask(data: Request): Promise<Response> {
    return new Promise((resolve) => {
      this.tasksQueue.push({
        data: data,
        callback: ((result: Response) => {
          resolve(result);
          this.executeQueuedTasks();
        }).bind(this),
      })
      this.executeQueuedTasks();
    });
  }

  public async terminate(): Promise<void> {
    console.log(`Balancer: terminating workers ${this.workerFilename}`)
    await Promise.all(this.workers.map((w) => w.terminate()));
    this.workers = [];
    this.tasksQueue.clear();
  }
}

export {
  Balancer
}