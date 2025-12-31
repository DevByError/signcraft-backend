import type { Request, Response, NextFunction } from "express";
import express from "express";

const route = express.Router();

route.get("/401", (req: Request, res: Response, next: NextFunction) => {
    res.status(401).render("errors/401");
});

route.get("/404", (req: Request, res: Response, next: NextFunction) => {
    res.status(404).render("errors/404");
});

export default route;
