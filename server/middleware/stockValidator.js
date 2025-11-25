// middleware/stockValidator.js

const validateStockOperation = (req, res, next) => {
  const { adjustment, type, quantity } = req.body;

  // Validate required fields
  if (adjustment === undefined && quantity === undefined) {
    return res.status(400).json({
      message: "Stock adjustment amount is required",
    });
  }

  // Validate numeric values
  const amount = adjustment || quantity;
  if (isNaN(amount) || amount === 0) {
    return res.status(400).json({
      message: "Invalid adjustment amount",
    });
  }

  // Validate type if provided
  if (
    type &&
    !["addition", "removal", "sale", "return", "adjustment"].includes(type)
  ) {
    return res.status(400).json({
      message: "Invalid adjustment type",
    });
  }

  next();
};

module.exports = { validateStockOperation };
