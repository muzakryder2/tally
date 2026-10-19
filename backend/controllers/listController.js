import List from "../models/listModel.js";

// @desc    Get all lists for the logged in user
// @route   GET /api/lists
// @access  Private
export const getAllListsByUser = async (req, res) => {
  try {
    const lists = await List.find().select({
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
    const list = await List.findById({ _id: req.params.id });
    if (!list)
      return res
        .status(404)
        .json({ success: false, message: "List not found" });

    res.status(200).json({ success: true, data: list });
  } catch (err) {
    console.error("Error getting list by ID:", err);
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
    const { name } = req.body;

    const newList = await List.create({
      name,
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
// @route   PUT /api/lists/:id
// @access  Private
export const updateListById = async (req, res) => {
  try {
    const { name, items } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (items !== undefined) updates.items = items;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields provided to update",
      });
    }

    const updatedList = await List.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true },
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
    const list = await List.findById({ _id: req.params.id });

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
    res.status(500).json({
      success: false,
      message: "Error deleting list",
      error: err.message,
    });
  }
};
