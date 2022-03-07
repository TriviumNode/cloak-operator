import { Router } from 'express';
import QueueController from '@controllers/queue.controller';
import { Routes } from '@interfaces/routes.interface';

class CloakReleaseRoute implements Routes {
  public path = '/release';
  public router = Router();
  public queueController = new QueueController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/`, this.queueController.addToQueue);
    //this.router.post(`${this.path}/`, this.queueController.addToQueue);
  }
}

export default CloakReleaseRoute;
