interface QueueNode<T> {
  data: T
  nextNode?: QueueNode<T>
}

/**
 * PS: Does we have a "native" queue in nodejs?
 */
class Queue<T> {
  private first?: QueueNode<T>
  private last?: QueueNode<T>

  public get canPop(): boolean {
    return this.first != null;
  }

  public push(data: T) {
    let node = { data };
    if (this.first == null) {
      this.first = this.last = node;
    } else {
      this.last.nextNode = node;
      this.last = node;
    }
  }

  public pop(): T {
    if (!this.canPop)
      throw "Trying to pop from empty queue";

    let data = this.first.data;
    if (this.first.nextNode == null) {
      this.first = this.last = null;
    } else {
      this.first = this.first.nextNode;
    }
    return data;
  }

  public clear() {
    this.first = this.last = null;
  }
}

export {
  Queue
}