import express from "express";

import {
  getPeople,
  getPerson,
  insertPerson,
  updatePersonDetails
} from "../controllers/personController";


export const personRouter = express.Router();

personRouter.post("/", insertPerson as any)
personRouter.patch("/:personId", updatePersonDetails as any)
personRouter.get("/", getPeople as any)
personRouter.get("/:personId", getPerson as any)
