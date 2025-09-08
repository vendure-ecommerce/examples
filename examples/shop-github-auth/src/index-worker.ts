import { runWorker } from "@shared/worker";
import { config } from "./vendure-config";

runWorker(config)
  .then(() => console.log("Worker started: shop-github-auth"))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
