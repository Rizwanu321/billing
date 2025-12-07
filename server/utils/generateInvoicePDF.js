const PDFDocument = require("pdfkit");

const generateCompactInvoicePDF = async (invoice, customerData = null, recentPayment = null, settings = null) => {
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
      let yPos = 15;

      // 1. Business Info (Top Priority)
      const businessName = settings?.businessName || "Shop Management System";
      doc
        .fontSize(15) // Larger, professional font for business name
        .font("Helvetica-Bold")
        .text(businessName, leftMargin, yPos, {
          width: contentWidth,
          align: "center",
        });

      yPos += 20;

      const businessAddress = settings?.businessAddress || "Your Business Address";
      doc
        .fontSize(9)
        .font("Helvetica")
        .text(businessAddress, leftMargin, yPos, {
          width: contentWidth,
          align: "center",
          lineGap: 2,
        });

      // Calculate height of address text to adjust yPos dynamically
      const addressHeight = doc.heightOfString(businessAddress, {
        width: contentWidth,
        align: "center",
      });
      yPos += addressHeight + 4;

      const businessPhone = settings?.businessPhone || "+91 XXXXX XXXXX";
      doc.text(`Phone: ${businessPhone}`, leftMargin, yPos, {
        width: contentWidth,
        align: "center",
      });

      yPos += 15;

      // 2. Document Title (Dynamic based on Tax)
      // If tax > 0, it's a "TAX INVOICE", otherwise just an "INVOICE"
      const invoiceTitle = invoice.tax > 0 ? "TAX INVOICE" : "INVOICE";

      doc
        .moveTo(leftMargin, yPos)
        .lineTo(rightMargin, yPos)
        .lineWidth(1)
        .stroke();

      yPos += 5;

      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text(invoiceTitle, leftMargin, yPos, {
          width: contentWidth,
          align: "center",
          characterSpacing: 1, // Adds a professional touch
        });

      yPos += 15;

      doc
        .moveTo(leftMargin, yPos)
        .lineTo(rightMargin, yPos)
        .lineWidth(1)
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

      // For due invoices with customer data, show comprehensive payment info
      if (invoice.paymentMethod === "due" && customerData) {
        yPos += 10;
        doc.text(`This Invoice:`, leftMargin, yPos, { continued: true });
        doc.font("Helvetica-Bold").text(formatCurrency(invoice.total), {
          align: "right",
        });

        // Show recent payment if available
        if (recentPayment) {
          yPos += 10;
          doc.font("Helvetica").text(`Recent Payment:`, leftMargin, yPos, {
            continued: true
          });
          doc.font("Helvetica-Bold")
            .fillColor("#10b981")
            .text(formatCurrency(recentPayment.amount), {
              align: "right",
            });
          doc.fillColor("#000000").font("Helvetica");
        }

        yPos += 10;
        doc.font("Helvetica").text(`Customer Balance:`, leftMargin, yPos, {
          continued: true
        });
        doc.text(formatCurrency(customerData.amountDue || 0), {
          align: "right",
        });

        yPos += 10;
        doc.text(`Total Paid:`, leftMargin, yPos, { continued: true });
        doc.font("Helvetica-Bold")
          .fillColor("#10b981")
          .text(formatCurrency(customerData.totalPayments || 0), {
            align: "right",
          });
        doc.fillColor("#000000").font("Helvetica");
      }
      // For cash/online/card invoices, show simple paid amount
      else if (invoice.paymentMethod !== "due") {
        yPos += 10;
        doc.text(`Paid:`, leftMargin, yPos, { continued: true });
        doc.font("Helvetica-Bold")
          .fillColor("#10b981")
          .text(formatCurrency(invoice.total), {
            align: "right",
          });
        doc.fillColor("#000000").font("Helvetica");
      }
      // For due invoices without customer (walk-in), show basic info
      else {
        yPos += 10;
        doc.text(`Amount Due:`, leftMargin, yPos, { continued: true });
        doc.font("Helvetica-Bold").text(formatCurrency(invoice.total), {
          align: "right",
        });
        doc.font("Helvetica");
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
