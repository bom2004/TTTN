import express from "express";
import { globalSearch } from "../controllers/searchController.ts";

const searchRouter = express.Router();

searchRouter.get("/", globalSearch);

export default searchRouter;
