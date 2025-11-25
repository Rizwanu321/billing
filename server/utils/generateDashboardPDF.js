// server/utils/generateDashboardPDF.js - CREATE THIS FILE
const PDFDocument = require("pdfkit");

async function generateDashboardPDF(data, period) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Header
      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .text("Dashboard Report", { align: "center" });
      doc.moveDown(0.5);

      doc
        .fontSize(12)
        .font("Helvetica")
        .text(
          `Period: ${data.period.start.toLocaleDateString()} - ${data.period.end.toLocaleDateString()}`,
          { align: "center" }
        );
      doc.text(`Generated: ${new Date().toLocaleString()}`, {
        align: "center",
      });
      doc.moveDown(2);

      // Summary Section
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .text("Summary", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).font("Helvetica");

      const summaryData = [
        ["Total Revenue", `$${data.revenue.total.toFixed(2)}`],
        ["Total Orders", data.revenue.count.toString()],
        ["Total Customers", data.customers.toString()],
        ["Total Products", data.products.length.toString()],
      ];

      let yPosition = doc.y;
      summaryData.forEach(([label, value]) => {
        doc.text(label, 50, yPosition, { width: 200 });
        doc.text(value, 300, yPosition, { width: 200, align: "right" });
        yPosition += 25;
      });

      doc.moveDown(2);

      // Recent Transactions
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .text("Recent Transactions", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica");

      // Table header
      const tableTop = doc.y;
      const columnWidths = [80, 100, 120, 80, 60];
      const headers = ["Date", "Invoice #", "Customer", "Amount", "Status"];
      let xPos = 50;

      doc.font("Helvetica-Bold");
      headers.forEach((header, i) => {
        doc.text(header, xPos, tableTop, { width: columnWidths[i] });
        xPos += columnWidths[i];
      });

      doc
        .moveTo(50, tableTop + 15)
        .lineTo(540, tableTop + 15)
        .stroke();

      // Table rows
      doc.font("Helvetica");
      let rowY = tableTop + 25;

      data.transactions.slice(0, 15).forEach((transaction) => {
        if (rowY > 700) {
          doc.addPage();
          rowY = 50;
        }

        xPos = 50;
        const rowData = [
          new Date(transaction.createdAt).toLocaleDateString(),
          transaction.invoiceNumber || "N/A",
          transaction.customer?.name || "Walk-in",
          `$${transaction.total.toFixed(2)}`,
          transaction.status,
        ];

        rowData.forEach((data, i) => {
          doc.text(data, xPos, rowY, {
            width: columnWidths[i],
            ellipsis: true,
          });
          xPos += columnWidths[i];
        });

        rowY += 20;
      });

      // Products Section (New Page)
      doc.addPage();
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .text("Products Overview", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica");

      const prodTableTop = doc.y;
      const prodColumnWidths = [200, 80, 80, 100];
      const prodHeaders = ["Product Name", "Stock", "Price", "Total Value"];
      xPos = 50;

      doc.font("Helvetica-Bold");
      prodHeaders.forEach((header, i) => {
        doc.text(header, xPos, prodTableTop, { width: prodColumnWidths[i] });
        xPos += prodColumnWidths[i];
      });

      doc
        .moveTo(50, prodTableTop + 15)
        .lineTo(540, prodTableTop + 15)
        .stroke();

      doc.font("Helvetica");
      rowY = prodTableTop + 25;

      data.products.slice(0, 30).forEach((product) => {
        if (rowY > 700) {
          doc.addPage();
          rowY = 50;
        }

        xPos = 50;
        const prodRowData = [
          product.name,
          product.stock.toString(),
          `$${product.price.toFixed(2)}`,
          `$${(product.stock * product.price).toFixed(2)}`,
        ];

        prodRowData.forEach((data, i) => {
          doc.text(data, xPos, rowY, {
            width: prodColumnWidths[i],
            ellipsis: true,
          });
          xPos += prodColumnWidths[i];
        });

        rowY += 20;
      });

      // Footer
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc
          .fontSize(8)
          .text(`Page ${i + 1} of ${pageCount}`, 50, doc.page.height - 50, {
            align: "center",
          });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = generateDashboardPDF;
