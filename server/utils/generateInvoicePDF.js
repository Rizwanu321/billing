const PDFDocument = require("pdfkit");

const generateCompactInvoicePDF = async (invoice) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document with dynamic height
      const doc = new PDFDocument({
        size: [227, 600], // Increased height for better layout
        margin: 12,
      });

      // Create a buffer to store the PDF
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      // Helper function to format unit display
      const formatUnitDisplay = (unit, quantity) => {
        if (quantity === 1) return unit;

        switch (unit) {
          case "kg":
            return "kgs";
          case "box":
            return "boxes";
          case "piece":
            return "pieces";
          case "dozen":
            return "dozens";
          case "gram":
            return "grams";
          case "liter":
            return "liters";
          case "ml":
            return "ml";
          case "packet":
            return "packets";
          default:
            return unit + "s";
        }
      };

      // Helper function to format currency
      const formatCurrency = (amount) => {
        return `Rs ${parseFloat(amount).toFixed(2)}`;
      };

      const pageWidth = 227;
      const leftMargin = 12;
      const rightMargin = pageWidth - 12;
      const contentWidth = rightMargin - leftMargin;

      // ===== HEADER SECTION =====
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("TAX INVOICE", leftMargin, 15, {
          width: contentWidth,
          align: "center",
        });

      // Decorative line
      doc
        .moveTo(leftMargin, 32)
        .lineTo(rightMargin, 32)
        .lineWidth(1.5)
        .stroke();

      // ===== BUSINESS INFO SECTION =====
      let yPos = 38;
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Shop Management System", leftMargin, yPos, {
          width: contentWidth,
          align: "center",
        });

      yPos += 12;
      doc
        .fontSize(7)
        .font("Helvetica")
        .text("Your Business Address", leftMargin, yPos, {
          width: contentWidth,
          align: "center",
        });

      yPos += 10;
      doc.text("Phone: +91 XXXXX XXXXX", leftMargin, yPos, {
        width: contentWidth,
        align: "center",
      });

      // Separator line
      yPos += 12;
      doc
        .moveTo(leftMargin, yPos)
        .lineTo(rightMargin, yPos)
        .lineWidth(0.5)
        .stroke();

      // ===== INVOICE DETAILS SECTION =====
      yPos += 8;
      doc.fontSize(8).font("Helvetica-Bold");

      // Invoice number and date in two columns
      doc.text(`Invoice #:`, leftMargin, yPos, { continued: true });
      doc
        .font("Helvetica")
        .text(`${invoice.invoiceNumber}`, { align: "right" });

      yPos += 10;
      doc.font("Helvetica-Bold").text(`Date:`, leftMargin, yPos, {
        continued: true,
      });
      doc.font("Helvetica").text(
        `${new Date(invoice.date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}`,
        {
          align: "right",
        }
      );

      // Customer details if available
      if (invoice.customer?.name) {
        yPos += 10;
        doc
          .font("Helvetica-Bold")
          .text(`Customer:`, leftMargin, yPos, { continued: true });
        doc.font("Helvetica").text(`${invoice.customer.name}`, {
          align: "right",
        });

        if (invoice.customer?.phone) {
          yPos += 10;
          doc
            .font("Helvetica-Bold")
            .text(`Phone:`, leftMargin, yPos, { continued: true });
          doc.font("Helvetica").text(`${invoice.customer.phone}`, {
            align: "right",
          });
        }
      }

      // Separator line
      yPos += 12;
      doc
        .moveTo(leftMargin, yPos)
        .lineTo(rightMargin, yPos)
        .lineWidth(0.5)
        .stroke();

      // ===== ITEMS SECTION =====
      yPos += 8;
      doc.fontSize(8).font("Helvetica-Bold").text("ITEMS", leftMargin, yPos, {
        width: contentWidth,
        align: "left",
      });

      yPos += 10;
      // Table header with dashed line
      doc
        .moveTo(leftMargin, yPos)
        .lineTo(rightMargin, yPos)
        .dash(1, { space: 1 })
        .stroke();

      yPos += 6;

      // Items list
      invoice.items.forEach((item, index) => {
        if (item.product) {
          const unit = item.unit || item.product.unit || "piece";
          const formattedUnit = formatUnitDisplay(unit, item.quantity);

          // Product name (bold)
          doc
            .fontSize(8)
            .font("Helvetica-Bold")
            .text(`${index + 1}. ${item.product.name}`, leftMargin, yPos, {
              width: contentWidth,
              align: "left",
            });

          yPos += 10;

          // Quantity and price details
          const qtyText = `${item.quantity} ${formattedUnit} x ${formatCurrency(
            item.price
          )}`;
          const subtotalText = formatCurrency(item.subtotal);

          doc.fontSize(7).font("Helvetica");
          doc.text(qtyText, leftMargin + 8, yPos, {
            width: contentWidth - 50,
            align: "left",
          });
          doc.text(subtotalText, leftMargin, yPos, {
            width: contentWidth,
            align: "right",
          });

          yPos += 12;
        }
      });

      // Separator line
      doc
        .moveTo(leftMargin, yPos)
        .lineTo(rightMargin, yPos)
        .dash(1, { space: 1 })
        .stroke();

      // ===== TOTALS SECTION =====
      yPos += 8;

      // Subtotal
      doc.fontSize(8).font("Helvetica");
      doc.text(`Subtotal:`, leftMargin, yPos, { continued: true });
      doc.text(formatCurrency(invoice.subtotal), {
        align: "right",
      });

      // Tax (only if greater than 0)
      if (invoice.tax > 0) {
        yPos += 10;
        doc.text(`Tax:`, leftMargin, yPos, { continued: true });
        doc.text(formatCurrency(invoice.tax), {
          align: "right",
        });
      }

      // Discount (only if greater than 0)
      if (invoice.discount > 0) {
        yPos += 10;
        doc.text(`Discount:`, leftMargin, yPos, { continued: true });
        doc.text(`-${formatCurrency(invoice.discount)}`, {
          align: "right",
        });
      }

      // Bold line before total
      yPos += 8;
      doc
        .moveTo(leftMargin, yPos)
        .lineTo(rightMargin, yPos)
        .lineWidth(1)
        .stroke();

      // Total (bold and larger)
      yPos += 8;
      doc.fontSize(10).font("Helvetica-Bold");
      doc.text(`TOTAL:`, leftMargin, yPos, { continued: true });
      doc.text(formatCurrency(invoice.total), {
        align: "right",
      });

      // Double line after total
      yPos += 12;
      doc
        .moveTo(leftMargin, yPos)
        .lineTo(rightMargin, yPos)
        .lineWidth(1)
        .stroke();
      yPos += 2;
      doc
        .moveTo(leftMargin, yPos)
        .lineTo(rightMargin, yPos)
        .lineWidth(1)
        .stroke();

      // ===== PAYMENT DETAILS SECTION =====
      yPos += 10;
      doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .text("PAYMENT DETAILS", leftMargin, yPos);

      yPos += 10;
      doc.font("Helvetica").fontSize(8);

      // Payment method
      doc.text(`Method:`, leftMargin, yPos, { continued: true });
      doc.text(invoice.paymentMethod.toUpperCase(), {
        align: "right",
      });

      // Amount paid
      yPos += 10;
      const amountPaid = invoice.total - (invoice.dueAmount || 0);
      doc.text(`Paid:`, leftMargin, yPos, { continued: true });
      doc.text(formatCurrency(amountPaid), {
        align: "right",
      });

      // Due amount (if applicable)
      if (invoice.paymentMethod === "due" && invoice.dueAmount > 0) {
        yPos += 10;
        doc.font("Helvetica-Bold");
        doc.text(`Balance Due:`, leftMargin, yPos, { continued: true });
        doc.text(formatCurrency(invoice.dueAmount), {
          align: "right",
        });
      }

      // ===== FOOTER SECTION =====
      yPos += 18;
      doc
        .moveTo(leftMargin, yPos)
        .lineTo(rightMargin, yPos)
        .lineWidth(0.5)
        .stroke();

      yPos += 8;
      doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .text("Thank You!", leftMargin, yPos, {
          width: contentWidth,
          align: "center",
        });

      yPos += 10;
      doc
        .fontSize(7)
        .font("Helvetica")
        .text("Visit Again Soon!", leftMargin, yPos, {
          width: contentWidth,
          align: "center",
        });

      yPos += 12;
      doc
        .fontSize(6)
        .font("Helvetica")
        .fillColor("#666666")
        .text("Powered by Shop Management System", leftMargin, yPos, {
          width: contentWidth,
          align: "center",
        });

      // ===== TERMS & CONDITIONS (OPTIONAL) =====
      if (invoice.notes || invoice.terms) {
        yPos += 12;
        doc
          .moveTo(leftMargin, yPos)
          .lineTo(rightMargin, yPos)
          .lineWidth(0.5)
          .stroke();

        yPos += 6;
        doc
          .fontSize(6)
          .font("Helvetica-Bold")
          .fillColor("#000000")
          .text("Terms & Conditions:", leftMargin, yPos);

        yPos += 8;
        doc
          .fontSize(6)
          .font("Helvetica")
          .text(
            invoice.notes ||
              "Goods once sold cannot be returned. Subject to local jurisdiction.",
            leftMargin,
            yPos,
            {
              width: contentWidth,
              align: "left",
            }
          );
      }

      // End the document
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = generateCompactInvoicePDF;
