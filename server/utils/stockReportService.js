// utils/stockReportService.js

export const generateStockReport = (products, movements) => {
  const report = {
    summary: {
      totalProducts: products.length,
      managedProducts: products.filter((p) => p.isStockRequired).length,
      totalValue: products.reduce((sum, p) => sum + p.stock * p.price, 0),
      movements: {
        totalMovements: movements.length,
        additions: movements.filter((m) => m.adjustment > 0).length,
        removals: movements.filter((m) => m.adjustment < 0).length,
        sales: movements.filter((m) => m.type === "sale").length,
        returns: movements.filter((m) => m.type === "return").length,
      },
    },
    stockHealth: {
      healthy: products.filter((p) => p.isStockRequired && p.stock > 10).length,
      warning: products.filter(
        (p) => p.isStockRequired && p.stock > 0 && p.stock <= 10
      ).length,
      critical: products.filter((p) => p.isStockRequired && p.stock === 0)
        .length,
    },
    topMovers: getTopMovers(movements),
    recentActivity: movements.slice(0, 10),
  };

  return report;
};

const getTopMovers = (movements) => {
  const productMovements = {};

  movements.forEach((movement) => {
    const productId = movement.product?._id || movement.product;
    if (!productMovements[productId]) {
      productMovements[productId] = {
        productName: movement.product?.name || "Unknown",
        totalIn: 0,
        totalOut: 0,
        movements: 0,
      };
    }

    productMovements[productId].movements++;
    if (movement.adjustment > 0) {
      productMovements[productId].totalIn += movement.adjustment;
    } else {
      productMovements[productId].totalOut += Math.abs(movement.adjustment);
    }
  });

  return Object.values(productMovements)
    .sort((a, b) => b.movements - a.movements)
    .slice(0, 5);
};
