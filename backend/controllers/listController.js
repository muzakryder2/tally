import { clerkMiddleware, clerkClient, getAuth } from "@clerk/express";
import List from "../models/listModel.js";

// @desc    Get all lists for the logged in user
// @route   GET /api/lists
// @access  Private
export const getAllListsByUser = async (req, res) => {
  try {
    const { isAuthenticated, userId } = getAuth(req);

    if (!isAuthenticated || !userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const lists = await List.find({ ownerId: userId }).select({
      ownerId: 0,
      createdAt: 0,
      updatedAt: 0,
      __v: 0,
    });

    res.status(200).json({ success: true, data: lists });
  } catch (err) {
    console.error("Error getting all lists for user:", err);
    res.status(500).json({
      success: false,
      message: "Error getting all lists for user",
      error: err.message,
    });
  }
};

// @desc    Get single list by ID
// @route   GET /api/lists/:id
// @access  Private
export const getListById = async (req, res) => {
  try {
    const { isAuthenticated, userId } = getAuth(req);
    if (!isAuthenticated || !userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const list = await List.findOne({ _id: req.params.id, ownerId: userId });
    if (!list)
      return res
        .status(404)
        .json({ success: false, message: "List not found" });

    res.status(200).json({ success: true, data: list });
  } catch (err) {
    console.error("Error getting list by ID:", err);
    if (err.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid list ID" });
    }

    res.status(500).json({
      success: false,
      message: "Error getting list by ID:",
      error: err.message,
    });
  }
};

// @desc    Create a new list
// @route   POST /api/lists
// @access  Private
export const createNewList = async (req, res) => {
  try {
    const { isAuthenticated, userId } = getAuth(req);
    if (!isAuthenticated || !userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { name } = req.body;

    const newList = await List.create({
      name,
      ownerId: userId,
    });

    res.status(201).json({ success: true, data: newList });
  } catch (err) {
    console.error("Error creating new list:", err);
    res.status(500).json({
      success: false,
      message: "Error creating new list",
      error: err.message,
    });
  }
};

// @desc    Update a list by ID
// @route   PATCH /api/lists/:id
// @access  Private
export const updateListById = async (req, res) => {
  try {
    const { isAuthenticated, userId } = getAuth(req);
    if (!isAuthenticated || !userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { name, items } = req.body;

    const updates = {};
    if (name !== undefined) {
      updates.$set = { name };
    }

    if (items !== undefined) {
      updates.$push = {
        items: {
          $each: Array.isArray(items) ? items : [items],
        },
      };
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields provided to update",
      });
    }

    const updatedList = await List.findByIdAndUpdate(
      { _id: req.params.id, ownerId: userId },
      updates,
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!updatedList)
      return res
        .status(404)
        .json({ success: false, message: "List not found" });

    res.status(200).json({
      success: true,
      data: updatedList,
    });
  } catch (err) {
    console.error("Error updating list:", err);
    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid list ID",
      });
    }
    res.status(500).json({
      success: false,
      message: "Error updating list",
      error: err.message,
    });
  }
};

// @desc    Delete list by ID
// @route   DELETE /api/lists/:id
// @access  Private
export const deleteListById = async (req, res) => {
  try {
    const { isAuthenticated, userId } = getAuth(req);
    if (!isAuthenticated || !userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const list = await List.findOne({ _id: req.params.id, ownerId: userId });

    if (!list)
      return res
        .status(404)
        .json({ success: false, message: "List not found" });

    await list.deleteOne();

    res
      .status(200)
      .json({ success: true, message: "List deleted successfully" });
  } catch (err) {
    console.error("Error deleting list:", err);
    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid list ID",
      });
    }
    res.status(500).json({
      success: false,
      message: "Error deleting list",
      error: err.message,
    });
  }
};

// @desc    Delete list item by ID
// @route   DELETE /api/lists/:id/items/:itemId
// @access  Private
export const deleteItemById = async (req, res) => {
  try {
    const { isAuthenticated, userId } = getAuth(req);
    if (!isAuthenticated || !userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { id, itemId } = req.params;

    const updatedList = await List.findOneAndUpdate(
      { _id: id, ownerId: userId },
      {
        $pull: {
          items: { _id: itemId },
        },
      },
      { returnDocument: "after", runValidators: true },
    );

    if (!updatedList) {
      return res.status(404).json({
        success: false,
        message: "List not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedList,
    });
  } catch (err) {
    console.error("Error deleting item:", err);
    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid list or item ID",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to delete item",
      error: err.message,
    });
  }
};

// @desc    Delete all list items
// @route   DELETE /api/lists/:id/items/
// @access  Private
export const deleteAllItems = async (req, res) => {
  try {
    const { isAuthenticated, userId } = getAuth(req);
    if (!isAuthenticated || !userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const updatedList = await List.findOneAndUpdate(
      { _id: id, ownerId: userId },
      {
        $set: { items: [] },
      },
      { returnDocument: "after", runValidators: true },
    );

    if (!updatedList) {
      return res.status(404).json({
        success: false,
        message: "List not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedList,
    });
  } catch (err) {
    console.error("Error deleting all items:", err);
    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid list ID",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to delete all items",
      error: err.message,
    });
  }
};

// @desc    Update a list item's checked status
// @route   PATCH /api/lists/:id/items/:itemId
// @access  Private
export const updateItemChecked = async (req, res) => {
  try {
    const { isAuthenticated, userId } = getAuth(req);
    if (!isAuthenticated || !userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { id, itemId } = req.params;
    const { checked } = req.body;

    if (typeof checked !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "The checked field must be a boolean",
      });
    }

    const updatedList = await List.findOneAndUpdate(
      {
        _id: id,
        ownerId: userId,
        "items._id": itemId,
      },
      {
        $set: {
          "items.$.checked": checked,
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!updatedList) {
      return res.status(404).json({
        success: false,
        message: "List or item not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedList,
    });
  } catch (err) {
    console.error("Error updating item checked status:", err);
    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid list or item ID",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to update item checked status",
      error: err.message,
    });
  }
};

// @desc    Uncheck all list items
// @route   PATCH /api/lists/:id/items/uncheck-all
// @access  Private
export const uncheckAllItems = async (req, res) => {
  try {
    const { isAuthenticated, userId } = getAuth(req);
    if (!isAuthenticated || !userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { id } = req.params;

    const updatedList = await List.findOneAndUpdate(
      { _id: id, ownerId: userId },
      {
        $set: {
          "items.$[].checked": false,
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!updatedList) {
      return res.status(404).json({
        success: false,
        message: "List not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedList,
    });
  } catch (err) {
    console.error("Error unchecking all items:", err);
    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid list or item ID",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to uncheck all items",
      error: err.message,
    });
  }
};

// @desc    Delete all checked items
// @route   DELETE /api/lists/:id/items/checked
// @access  Private
export const deleteCheckedItems = async (req, res) => {
  try {
    const { isAuthenticated, userId } = getAuth(req);
    if (!isAuthenticated || !userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { id } = req.params;

    const updatedList = await List.findOneAndUpdate(
      { _id: id, ownerId: userId },
      {
        $pull: {
          items: { checked: true },
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!updatedList) {
      return res.status(404).json({
        success: false,
        message: "List not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedList,
      message: "Checked items deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting checked items:", err);
    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid list ID",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to delete checked items",
      error: err.message,
    });
  }
};
