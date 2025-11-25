// utils/generateRevenuePDF.js (Enhanced version with better design)
const PDFDocument = require("pdfkit");
const fs = require("fs");

const generateRevenuePDF = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        bufferPages: true,
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const { summary, transactions, categoryData, dateRange, user } = data;

      // Color scheme
      const colors = {
        primary: "#2563eb",
        secondary: "#64748b",
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",
        gray: "#6b7280",
        lightGray: "#f3f4f6",
      };

      // Helper function to draw a box
      const drawBox = (x, y, width, height, fillColor) => {
        doc.rect(x, y, width, height).fill(fillColor);
      };

      // Helper function for currency formatting
      const formatCurrency = (value) => {
        return new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(value);
      };

      // ============ PAGE 1: HEADER & SUMMARY ============

      // Header with background
      drawBox(0, 0, doc.page.width, 120, colors.primary);

      doc
        .fontSize(32)
        .fillColor("#ffffff")
        .font("Helvetica-Bold")
        .text("REVENUE REPORT", 50, 30, { align: "center" });

      doc
        .fontSize(14)
        .fillColor("#ffffff")
        .font("Helvetica")
        .text(
          `Period: ${new Date(
            dateRange.startDate
          ).toLocaleDateString()} - ${new Date(
            dateRange.endDate
          ).toLocaleDateString()}`,
          50,
          70,
          { align: "center" }
        );

      doc.text(`Generated: ${new Date().toLocaleString()}`, 50, 90, {
        align: "center",
      });

      doc.moveDown(4);

      // Key Metrics Cards
      const cardWidth = 240;
      const cardHeight = 100;
      const cardSpacing = 20;
      const startY = 150;

      // Card 1: Total Revenue
      drawBox(50, startY, cardWidth, cardHeight, colors.lightGray);
      doc
        .fontSize(12)
        .fillColor(colors.gray)
        .font("Helvetica")
        .text("TOTAL REVENUE", 60, startY + 20);
      doc
        .fontSize(28)
        .fillColor(colors.primary)
        .font("Helvetica-Bold")
        .text(formatCurrency(summary.totalRevenue || 0), 60, startY + 45);
      doc
        .fontSize(10)
        .fillColor(colors.gray)
        .font("Helvetica")
        .text(`From ${summary.invoiceCount || 0} invoices`, 60, startY + 75);

      // Card 2: Average Order Value
      drawBox(
        50 + cardWidth + cardSpacing,
        startY,
        cardWidth,
        cardHeight,
        colors.lightGray
      );
      doc
        .fontSize(12)
        .fillColor(colors.gray)
        .text("AVERAGE ORDER VALUE", 60 + cardWidth + cardSpacing, startY + 20);
      doc
        .fontSize(28)
        .fillColor(colors.success)
        .font("Helvetica-Bold")
        .text(
          formatCurrency(
            (summary.totalRevenue || 0) / (summary.invoiceCount || 1)
          ),
          60 + cardWidth + cardSpacing,
          startY + 45
        );

      doc.moveDown(8);

      // Additional Metrics
      const metricsY = startY + cardHeight + 40;

      drawBox(50, metricsY, 495, 80, "#ffffff");
      doc.rect(50, metricsY, 495, 80).stroke(colors.lightGray);

      const metricData = [
        ["Total Tax Collected", formatCurrency(summary.totalTax || 0)],
        [
          "Net Revenue",
          formatCurrency((summary.totalRevenue || 0) - (summary.totalTax || 0)),
        ],
        [
          "Tax Percentage",
          `${(
            ((summary.totalTax || 0) / (summary.totalRevenue || 1)) *
            100
          ).toFixed(2)}%`,
        ],
      ];

      let metricX = 70;
      metricData.forEach(([label, value]) => {
        doc
          .fontSize(10)
          .fillColor(colors.gray)
          .font("Helvetica")
          .text(label, metricX, metricsY + 20);
        doc
          .fontSize(16)
          .fillColor("#000")
          .font("Helvetica-Bold")
          .text(value, metricX, metricsY + 40);
        metricX += 165;
      });

      // ============ PAGE 2: CATEGORY BREAKDOWN ============

      if (categoryData && categoryData.length > 0) {
        doc.addPage();

        doc
          .fontSize(20)
          .fillColor(colors.primary)
          .font("Helvetica-Bold")
          .text("Revenue by Category", 50, 50);

        doc.moveDown(1);

        // Category Table Header
        const tableTop = doc.y + 10;
        drawBox(50, tableTop, 495, 30, colors.primary);

        doc
          .fontSize(11)
          .fillColor("#ffffff")
          .font("Helvetica-Bold")
          .text("Category", 60, tableTop + 10);
        doc.text("Revenue", 350, tableTop + 10, { width: 80, align: "right" });
        doc.text("Share %", 450, tableTop + 10, { width: 80, align: "right" });

        // Category Rows
        let rowY = tableTop + 40;
        const totalRevenue = categoryData.reduce(
          (sum, cat) => sum + cat.revenue,
          0
        );

        categoryData.forEach((category, index) => {
          const bgColor = index % 2 === 0 ? "#ffffff" : colors.lightGray;
          drawBox(50, rowY, 495, 35, bgColor);

          doc
            .fontSize(10)
            .fillColor("#000")
            .font("Helvetica")
            .text(category._id, 60, rowY + 10, { width: 280 });

          doc
            .fontSize(11)
            .font("Helvetica-Bold")
            .text(formatCurrency(category.revenue), 350, rowY + 10, {
              width: 80,
              align: "right",
            });

          doc
            .fontSize(10)
            .fillColor(colors.primary)
            .text(
              `${((category.revenue / totalRevenue) * 100).toFixed(1)}%`,
              450,
              rowY + 10,
              { width: 80, align: "right" }
            );

          rowY += 35;

          // Add new page if needed
          if (rowY > 700) {
            doc.addPage();
            rowY = 50;
          }
        });

        // Total Row
        rowY += 10;
        drawBox(50, rowY, 495, 40, colors.primary);
        doc
          .fontSize(12)
          .fillColor("#ffffff")
          .font("Helvetica-Bold")
          .text("TOTAL", 60, rowY + 12);
        doc.text(formatCurrency(totalRevenue), 350, rowY + 12, {
          width: 80,
          align: "right",
        });
        doc.text("100%", 450, rowY + 12, { width: 80, align: "right" });
      }

      // ============ PAGE 3: TRANSACTION DETAILS ============

      if (transactions && transactions.length > 0) {
        doc.addPage();

        doc
          .fontSize(20)
          .fillColor(colors.primary)
          .font("Helvetica-Bold")
          .text("Transaction Details", 50, 50);

        doc.moveDown(1);

        // Table Header
        const tableTop = doc.y + 10;
        drawBox(50, tableTop, 495, 30, colors.primary);

        doc
          .fontSize(9)
          .fillColor("#ffffff")
          .font("Helvetica-Bold")
          .text("Date", 55, tableTop + 10, { width: 65 });
        doc.text("Invoice #", 125, tableTop + 10, { width: 70 });
        doc.text("Customer", 200, tableTop + 10, { width: 120 });
        doc.text("Payment", 325, tableTop + 10, { width: 65 });
        doc.text("Tax", 395, tableTop + 10, { width: 70, align: "right" });
        doc.text("Total", 470, tableTop + 10, { width: 70, align: "right" });

        // Transaction Rows
        let rowY = tableTop + 40;
        let pageTransactionCount = 0;
        const maxRowsPerPage = 18;

        transactions.forEach((trans, index) => {
          // Check if we need a new page
          if (pageTransactionCount >= maxRowsPerPage) {
            doc.addPage();
            rowY = 50;
            pageTransactionCount = 0;

            // Repeat header on new page
            drawBox(50, rowY, 495, 30, colors.primary);
            doc
              .fontSize(9)
              .fillColor("#ffffff")
              .font("Helvetica-Bold")
              .text("Date", 55, rowY + 10, { width: 65 });
            doc.text("Invoice #", 125, rowY + 10, { width: 70 });
            doc.text("Customer", 200, rowY + 10, { width: 120 });
            doc.text("Payment", 325, rowY + 10, { width: 65 });
            doc.text("Tax", 395, rowY + 10, { width: 70, align: "right" });
            doc.text("Total", 470, rowY + 10, { width: 70, align: "right" });
            rowY += 40;
          }

          const bgColor = index % 2 === 0 ? "#ffffff" : colors.lightGray;
          drawBox(50, rowY, 495, 28, bgColor);

          doc
            .fontSize(8)
            .fillColor("#000")
            .font("Helvetica")
            .text(
              new Date(trans.date).toLocaleDateString("en-IN"),
              55,
              rowY + 8,
              { width: 65 }
            );

          doc
            .fontSize(8)
            .fillColor(colors.primary)
            .font("Helvetica-Bold")
            .text(trans.invoiceNumber, 125, rowY + 8, { width: 70 });

          doc
            .fontSize(8)
            .fillColor("#000")
            .font("Helvetica")
            .text(trans.customer?.name || "Walk-in", 200, rowY + 8, {
              width: 120,
            });

          // Payment method with color coding
          const paymentColors = {
            cash: colors.success,
            online: colors.primary,
            due: colors.warning,
          };
          doc
            .fontSize(7)
            .fillColor(paymentColors[trans.paymentMethod] || colors.gray)
            .font("Helvetica-Bold")
            .text(trans.paymentMethod.toUpperCase(), 325, rowY + 8, {
              width: 65,
            });

          doc
            .fontSize(8)
            .fillColor("#000")
            .font("Helvetica")
            .text(formatCurrency(trans.tax), 395, rowY + 8, {
              width: 70,
              align: "right",
            });

          doc
            .fontSize(9)
            .font("Helvetica-Bold")
            .text(formatCurrency(trans.total), 470, rowY + 8, {
              width: 70,
              align: "right",
            });

          rowY += 28;
          pageTransactionCount++;
        });
      }

      // ============ FOOTER ON ALL PAGES ============

      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);

        // Footer line
        doc
          .moveTo(50, doc.page.height - 80)
          .lineTo(doc.page.width - 50, doc.page.height - 80)
          .stroke(colors.lightGray);

        // Footer text
        doc
          .fontSize(8)
          .fillColor(colors.gray)
          .font("Helvetica")
          .text("BillTrack Pro - Revenue Report", 50, doc.page.height - 65, {
            align: "left",
          });

        doc
          .fontSize(8)
          .fillColor(colors.gray)
          .text(`Page ${i + 1} of ${pageCount}`, 50, doc.page.height - 65, {
            align: "center",
          });

        doc
          .fontSize(8)
          .fillColor(colors.gray)
          .text(new Date().toLocaleDateString(), 50, doc.page.height - 65, {
            align: "right",
          });

        // Confidential notice
        doc
          .fontSize(7)
          .fillColor(colors.gray)
          .font("Helvetica-Oblique")
          .text(
            "This report is confidential and for internal use only",
            50,
            doc.page.height - 50,
            { align: "center" }
          );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = generateRevenuePDF;
