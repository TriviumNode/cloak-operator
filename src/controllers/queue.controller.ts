import { NextFunction, Request, Response } from 'express';
import CloakController from '@controllers/cloak.controller';
import QueueService from '@services/queue.service';

class QueueController {
  public cloakController = new CloakController();
  public queue = new QueueService();
  public processingQueue = false;
  public execWait: number = parseInt(process.env.EXEC_WAIT) || 1000;

  public sleep = duration => new Promise(res => setTimeout(res, duration));

  public statusCheck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    this.cloakController.statusCheck(req, res, next);
  };

  public addToQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = { req: req, res: res, next: next };
      this.queue.send(data);
      this.processQueue();
    } catch (error) {
      console.log(error);
      next(error);
    }
  };

  public processQueue = async (): Promise<void> => {
    if (!this.processingQueue) {
      this.processingQueue = true;
      while (this.queue.peek()) {
        try {
          const { req, res, next } = this.queue.receive();
          this.cloakController.cloakRelease(req, res, next);
        } catch (error) {
          console.log(error);
        }
        //wait a second to prevent going out of sequence
        await this.sleep(this.execWait);
      }
      this.processingQueue = false;
    }
  };
}

export default QueueController;
