class QueueService {
  public q = [];

  constructor() {
    this.q = [];
  }
  send(item) {
    this.q.push(item);
  }
  receive() {
    return this.q.shift();
  }
  peek() {
    return this.q[0];
  }
  length() {
    return this.q.length;
  }
}

export default QueueService;
