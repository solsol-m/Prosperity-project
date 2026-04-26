import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Generates a professional Prosperity invoice PDF for a transaction.
 *
 * Arabic rendering fix: html2canvas cannot capture elements with opacity:0 or z-index:-1.
 * Solution: wrap the invoice in a clip:rect(0,0,0,0) container — fully rendered by browser
 * but invisible to user, allowing html2canvas to capture it correctly.
 */
export async function generateInvoicePDF(tx, t, lang, currency) {
  const isIncome = tx.amount > 0;
  const amountColor = isIncome ? "#10B981" : "#EF4444";
  const absAmount = Math.abs(tx.amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
  });
  const formatted = `${isIncome ? "+" : "-"}${currency}${absAmount}`;
  const isAr = lang === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const typeLabel = isIncome
    ? isAr
      ? "دخل"
      : "Income"
    : isAr
      ? "مصروف"
      : "Expense";
  const catLabel = t(`cat_${tx.category}`);
  const generatedOn = new Date().toLocaleDateString(isAr ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // ── Logo SVG (inline, no external request) ─────────────────────────
  const svgStr = `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="14" fill="#10B981"/><path d="M14 24C14 18.477 18.477 14 24 14C29.523 14 34 18.477 34 24C34 29.523 29.523 34 24 34" stroke="white" stroke-width="3.5" stroke-linecap="round"/><circle cx="24" cy="24" r="4" fill="white"/><path d="M24 20V16M28 24H32" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>`;
  const logoUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgStr)))}`;

  // ── Clipping container — rendered but invisible to the user ────────
  const clipper = document.createElement("div");
  clipper.style.cssText = [
    "position:fixed",
    "top:0",
    "left:0",
    "clip:rect(0,0,0,0)", // hides from user but browser still renders content fully
    "overflow:hidden",
    "width:0",
    "height:0",
    "z-index:99999",
  ].join(";");

  // ── Invoice element ────────────────────────────────────────────────
  const invoice = document.createElement("div");
  invoice.style.cssText = [
    "position:absolute",
    "top:0",
    "left:0",
    "width:720px",
    `direction:${dir}`,
    "background:#ffffff",
    "font-family:Cairo,Inter,sans-serif",
    "box-sizing:border-box",
  ].join(";");

  invoice.innerHTML = `
    <!-- Header -->
    <div style="background:#0A192F;color:#fff;padding:36px 40px;
      display:flex;align-items:center;justify-content:space-between;
      border-radius:20px 20px 0 0;">
      <div style="display:flex;align-items:center;gap:14px;">
        <img src="${logoUrl}" width="48" height="48"
          style="border-radius:14px;flex-shrink:0;display:block;" />
        <div>
          <div style="font-size:26px;font-weight:900;color:#10B981;line-height:1.1;letter-spacing:-1px;">
            Prosperity
          </div>
          <div style="font-size:12px;opacity:.5;margin-top:4px;letter-spacing:.4px;">
            ${isAr ? "منصة الإدارة المالية الذكية" : "Smart Financial Management Platform"}
          </div>
        </div>
      </div>
      <div style="text-align:${isAr ? "left" : "right"};">
        <div style="font-size:10px;opacity:.4;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:6px;">
          ${isAr ? "رقم الفاتورة" : "Invoice No."}
        </div>
        <div style="font-size:20px;font-weight:800;color:#10B981;">#PRO-${tx.id}</div>
      </div>
    </div>

    <!-- Body -->
    <div style="border:1px solid #E2E8F0;border-top:none;border-radius:0 0 20px 20px;
      padding:40px;background:#fff;">

      <!-- Badge -->
      <div style="margin-bottom:28px;">
        <span style="display:inline-flex;align-items:center;gap:8px;padding:8px 20px;
          border-radius:999px;background:${isIncome ? "#ECFDF5" : "#FEF2F2"};
          color:${amountColor};font-weight:700;font-size:13px;">
          <span style="width:8px;height:8px;border-radius:50%;
            background:${amountColor};display:inline-block;"></span>
          ${typeLabel}
        </span>
      </div>

      <!-- Details Grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-bottom:32px;">
        ${cell(isAr ? "اسم العملية" : "Transaction Name", tx.name)}
        ${cell(isAr ? "التاريخ" : "Date", tx.date)}
        ${cell(isAr ? "الفئة" : "Category", catLabel)}
        ${cell(isAr ? "رقم المرجع" : "Reference ID", `#PRO-${tx.id}`)}
      </div>

      <!-- Divider -->
      <div style="height:1px;background:#F1F5F9;margin-bottom:28px;"></div>

      <!-- Amount Block -->
      <div style="background:#F8FAFC;border:2px solid ${amountColor}33;border-radius:16px;
        padding:28px 32px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:11px;font-weight:700;color:#94A3B8;letter-spacing:1px;
            text-transform:uppercase;margin-bottom:6px;">
            ${isAr ? "المبلغ الإجمالي" : "Total Amount"}
          </div>
          <div style="font-size:13px;color:#64748B;">
            ${isAr ? "شامل جميع الرسوم" : "All charges included"}
          </div>
        </div>
        <div style="font-size:36px;font-weight:900;color:${amountColor};
          font-family:Manrope,Inter,sans-serif;letter-spacing:-1px;">
          ${formatted}
        </div>
      </div>

      <!-- Footer -->
      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #F1F5F9;
        display:flex;justify-content:space-between;align-items:center;">
        <div style="font-size:11px;color:#CBD5E1;">
          ${isAr ? "صدرت بواسطة" : "Generated by"}
          <strong style="color:#10B981;">Prosperity</strong> • ${generatedOn}
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <div style="width:6px;height:6px;border-radius:50%;background:#10B981;"></div>
          <div style="font-size:11px;color:#10B981;font-weight:600;">
            ${isAr ? "موثقة ومعتمدة" : "Verified & Certified"}
          </div>
        </div>
      </div>

    </div>
  `;

  clipper.appendChild(invoice);
  document.body.appendChild(clipper);

  // Wait for fonts and layout
  await document.fonts.ready;
  await new Promise((r) => setTimeout(r, 150));

  try {
    const canvas = await html2canvas(invoice, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: 720,
      windowWidth: 720,
    });

    // Guard: make sure we captured something
    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error("html2canvas captured an empty canvas");
    }

    const imgData = canvas.toDataURL("image/png");
    const pdfW = 595.28; // A4 width in pt
    const pdfH = pdfW * (canvas.height / canvas.width);
    const totalH = pdfH + 40;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: [pdfW, totalH],
    });
    pdf.addImage(imgData, "PNG", 0, 20, pdfW, pdfH);

    const safeName = tx.name.replace(/[\\/:*?"<>|]/g, "_");
    pdf.save(`Prosperity_Invoice_${safeName}_${tx.date}.pdf`);
  } finally {
    document.body.removeChild(clipper);
  }
}

function cell(label, value) {
  return `
    <div>
      <div style="font-size:11px;font-weight:700;color:#94A3B8;letter-spacing:.8px;
        text-transform:uppercase;margin-bottom:8px;">${label}</div>
      <div style="font-size:15px;font-weight:700;color:#0A192F;">${value}</div>
    </div>
  `;
}
