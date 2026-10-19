import express from "express";
import {
  getAllListsByUser,
  getListById,
  createNewList,
  updateListById,
  deleteListById,
} from "../controllers/listController.js";

const router = express.Router();

router.get("/", getAllListsByUser);
router.post("/", createNewList);
router.get("/:id", getListById);
router.patch("/:id", updateListById);
router.delete("/:id", deleteListById);

export default router;
