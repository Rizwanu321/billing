// routes/categories.js
const express = require("express");
const router = express.Router();
const Category = require("../models/Category");
const auth = require("../middleware/auth");

// Get all categories for the authenticated user
router.get("/", auth, async (req, res) => {
  try {
    const categories = await Category.find({ createdBy: req.user.userId });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Create category
router.post("/", auth, async (req, res) => {
  try {
    // Check if category with same name already exists for this user
    const existingCategory = await Category.findOne({
      name: req.body.name,
      createdBy: req.user.userId,
    });

    if (existingCategory) {
      return res.status(400).json({
        message: "You already have a category with this name",
      });
    }

    const category = new Category({
      ...req.body,
      createdBy: req.user.userId,
    });

    await category.save();
    res.status(201).json(category);
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        message: "You already have a category with this name",
      });
    }
    console.error("Category creation error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update category
router.put("/:id", auth, async (req, res) => {
  try {
    // First check if the category belongs to the user
    const existingCategory = await Category.findOne({
      _id: req.params.id,
      createdBy: req.user.userId,
    });

    if (!existingCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    // If name is being changed, check for duplicates
    if (req.body.name && req.body.name !== existingCategory.name) {
      const duplicateCategory = await Category.findOne({
        name: req.body.name,
        createdBy: req.user.userId,
        _id: { $ne: req.params.id },
      });

      if (duplicateCategory) {
        return res.status(400).json({
          message: "You already have a category with this name",
        });
      }
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    res.json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "You already have a category with this name",
      });
    }
    console.error("Category update error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete category
router.delete("/:id", auth, async (req, res) => {
  try {
    // Only delete categories that belong to the authenticated user
    const category = await Category.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.userId,
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Category deletion error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
