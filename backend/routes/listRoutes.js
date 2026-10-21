import express from "express";
import {
  getAllListsByUser,
  getListById,
  createNewList,
  updateListById,
  deleteListById,
  deleteAllItems,
  deleteItemById,
  updateItemChecked,
  uncheckAllItems,
  deleteCheckedItems,
} from "../controllers/listController.js";

const router = express.Router();

router.get("/", getAllListsByUser);
router.post("/", createNewList);
router.get("/:id", getListById);
router.patch("/:id/items/uncheck-all", uncheckAllItems);
router.patch("/:id/items/:itemId", updateItemChecked);
router.patch("/:id", updateListById);
router.delete("/:id/items/checked", deleteCheckedItems);
router.delete("/:id/items", deleteAllItems);
router.delete("/:id/items/:itemId", deleteItemById);
router.delete("/:id", deleteListById);

export default router;
