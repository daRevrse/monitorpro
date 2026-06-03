// ========================================
// backend/routes/reports.js
// ========================================
const express = require("express");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const { authenticateToken } = require("../middleware/auth");
const reportService = require("../services/reportService");
const logger = require("../utils/logger");

const router = express.Router();
router.use(authenticateToken);

// GET /api/reports - rapport agrégé (JSON)
router.get("/", async (req, res) => {
  try {
    const { period, site_id } = req.query;
    const report = await reportService.getReport({
      period,
      siteId: site_id || null,
    });
    res.json({ success: true, data: report });
  } catch (error) {
    logger.error("Erreur génération rapport:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la génération du rapport",
    });
  }
});

const cell = (row, key) => {
  const v = row[key];
  return v === null || v === undefined ? "" : v;
};

// GET /api/reports/export?format=csv|xlsx|pdf
router.get("/export", async (req, res) => {
  try {
    const { period, site_id, format = "csv" } = req.query;
    const report = await reportService.getReport({
      period,
      siteId: site_id || null,
    });
    const cols = reportService.COLUMNS;
    const stamp = new Date().toISOString().slice(0, 10);
    const baseName = `rapport-monitorpro-${report.period}-${stamp}`;

    // ---- CSV ----
    if (format === "csv") {
      const esc = (v) => {
        const s = String(v);
        return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const lines = [];
      lines.push(cols.map((c) => esc(c.header)).join(","));
      for (const row of report.rows) {
        lines.push(cols.map((c) => esc(cell(row, c.key))).join(","));
      }
      const csv = "﻿" + lines.join("\r\n"); // BOM pour Excel
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${baseName}.csv"`
      );
      return res.send(csv);
    }

    // ---- Excel (.xlsx) ----
    if (format === "xlsx") {
      const wb = new ExcelJS.Workbook();
      wb.creator = "MonitorPro";
      const ws = wb.addWorksheet("Rapport");
      ws.columns = cols.map((c) => ({
        header: c.header,
        key: c.key,
        width: Math.max(12, c.header.length + 2),
      }));
      ws.getRow(1).font = { bold: true };
      ws.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF7A1230" },
      };
      ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      report.rows.forEach((row) => {
        const obj = {};
        cols.forEach((c) => (obj[c.key] = cell(row, c.key)));
        ws.addRow(obj);
      });
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${baseName}.xlsx"`
      );
      await wb.xlsx.write(res);
      return res.end();
    }

    // ---- PDF ----
    if (format === "pdf") {
      const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 30 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${baseName}.pdf"`
      );
      doc.pipe(res);

      // En-tête
      doc.fillColor("#7A1230").fontSize(18).text("MonitorPro — Rapport", {
        align: "left",
      });
      doc
        .fillColor("#666")
        .fontSize(10)
        .text(
          `Période : ${report.period_label}  ·  Généré le ${new Date(
            report.generated_at
          ).toLocaleString("fr-FR")}`
        );
      doc
        .fillColor("#333")
        .fontSize(10)
        .text(
          `${report.totals.sites} site(s)  ·  Uptime global : ${
            report.totals.uptime ?? "—"
          }%  ·  Incidents : ${report.totals.incidents}  ·  Interventions : ${
            report.totals.interventions
          }`
        );
      doc.moveDown(0.8);

      // Tableau (colonnes choisies pour tenir en largeur)
      const pdfCols = [
        { key: "name", header: "Site", w: 150 },
        { key: "uptime", header: "Uptime%", w: 60 },
        { key: "total_checks", header: "Checks", w: 55 },
        { key: "avg_response", header: "Tps moy", w: 60 },
        { key: "down", header: "Down", w: 45 },
        { key: "incidents", header: "Incid.", w: 50 },
        { key: "interventions", header: "Interv.", w: 55 },
        { key: "hosting_account", header: "Hébergement", w: 140 },
      ];
      const startX = doc.page.margins.left;
      let y = doc.y;
      const rowH = 18;

      const drawRow = (values, opts = {}) => {
        let x = startX;
        if (opts.header) {
          doc
            .rect(
              startX,
              y,
              pdfCols.reduce((a, c) => a + c.w, 0),
              rowH
            )
            .fill("#7A1230");
        }
        doc.fillColor(opts.header ? "#FFFFFF" : "#222").fontSize(9);
        pdfCols.forEach((c, i) => {
          const v = values[i];
          doc.text(v === null || v === undefined ? "" : String(v), x + 4, y + 5, {
            width: c.w - 8,
            ellipsis: true,
            lineBreak: false,
          });
          x += c.w;
        });
        y += rowH;
      };

      drawRow(
        pdfCols.map((c) => c.header),
        { header: true }
      );
      report.rows.forEach((row, i) => {
        if (y + rowH > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          y = doc.page.margins.top;
          drawRow(
            pdfCols.map((c) => c.header),
            { header: true }
          );
        }
        if (i % 2 === 0) {
          doc
            .rect(
              startX,
              y,
              pdfCols.reduce((a, c) => a + c.w, 0),
              rowH
            )
            .fill("#F5F0F2");
        }
        drawRow(pdfCols.map((c) => cell(row, c.key)));
      });

      doc.end();
      return;
    }

    return res
      .status(400)
      .json({ success: false, message: "Format non supporté" });
  } catch (error) {
    logger.error("Erreur export rapport:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'export du rapport",
    });
  }
});

module.exports = router;
