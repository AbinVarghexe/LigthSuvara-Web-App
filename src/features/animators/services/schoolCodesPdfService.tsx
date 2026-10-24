import React from "react";
import { renderToString } from "react-dom/server";
// @ts-ignore
import html2pdf from "html2pdf.js";

export interface SchoolCodeItem {
  id: string;
  name: string;
  code: string;
  forane?: string;
}

interface SchoolCodesPdfTemplateProps {
  schools: SchoolCodeItem[];
}

export const SchoolCodesPdfTemplate: React.FC<SchoolCodesPdfTemplateProps> = ({ schools }) => {
  const todayDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Group schools by forane
  const grouped = schools.reduce((acc, school) => {
    const f = (school.forane || "General").trim() || "General";
    if (!acc[f]) acc[f] = [];
    acc[f].push(school);
    return acc;
  }, {} as Record<string, SchoolCodeItem[]>);

  const sortedForanes = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

  return (
    <div
      id="school-codes-pdf-root"
      style={{
        padding: "40px 48px",
        backgroundColor: "#ffffff",
        width: "800px",
        minHeight: "1050px",
        color: "#0f172a",
        fontFamily: "'Inter', Arial, sans-serif",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Malayalam:wght@400;600;700&display=swap');`}
      </style>

      {/* Top Accent Line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "6px",
          backgroundColor: "#2563eb",
        }}
      />

      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#2563eb",
            textTransform: "uppercase",
            letterSpacing: "1.2px",
            marginBottom: "6px",
          }}
        >
          SUVARA • Catechetical Administrative System
        </div>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 800,
            color: "#0f172a",
            margin: "0 0 6px 0",
            letterSpacing: "-0.5px",
          }}
        >
          Sunday School Codes Directory
        </h1>
        <p
          style={{
            fontSize: "13px",
            color: "#64748b",
            margin: "0 0 14px 0",
          }}
        >
          Official list of Sunday Schools, Codes, and Foranes for bulk animator registration and verification.
        </p>
        <div
          style={{
            display: "flex",
            gap: "24px",
            fontSize: "12px",
            color: "#475569",
            borderTop: "1px solid #e2e8f0",
            borderBottom: "1px solid #e2e8f0",
            padding: "8px 0",
          }}
        >
          <div>
            <strong>Total Schools:</strong> {schools.length}
          </div>
          <div>
            <strong>Total Foranes:</strong> {sortedForanes.length}
          </div>
          <div>
            <strong>Generated:</strong> {todayDate}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div
        style={{
          border: "1px solid #cbd5e1",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
            fontSize: "12px",
            fontFamily: "'Noto Sans Malayalam', 'Inter', sans-serif",
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: "#f1f5f9",
                borderBottom: "2px solid #cbd5e1",
                color: "#334155",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              <th style={{ padding: "10px 14px", width: "45px", textAlign: "center" }}>#</th>
              <th style={{ padding: "10px 14px", width: "130px" }}>School Code</th>
              <th style={{ padding: "10px 14px" }}>Sunday School Name</th>
              <th style={{ padding: "10px 14px", width: "180px" }}>Forane</th>
            </tr>
          </thead>
          <tbody>
            {schools.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: "32px 16px",
                    textAlign: "center",
                    color: "#94a3b8",
                    fontStyle: "italic",
                  }}
                >
                  No Sunday school records available.
                </td>
              </tr>
            ) : (
              sortedForanes.map((foraneName) => (
                <React.Fragment key={foraneName}>
                  {/* Forane Header Row */}
                  <tr
                    style={{
                      backgroundColor: "#e0f2fe",
                      borderTop: "1px solid #bae6fd",
                      borderBottom: "1px solid #bae6fd",
                    }}
                  >
                    <td
                      colSpan={4}
                      style={{
                        padding: "8px 14px",
                        fontWeight: 700,
                        color: "#0369a1",
                        fontSize: "12px",
                        letterSpacing: "0.3px",
                      }}
                    >
                      FORANE: {foraneName.toUpperCase()} ({grouped[foraneName].length} Schools)
                    </td>
                  </tr>

                  {/* Schools in Forane */}
                  {grouped[foraneName]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((school, idx) => (
                      <tr
                        key={school.id || idx}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                        }}
                      >
                        <td
                          style={{
                            padding: "9px 14px",
                            color: "#64748b",
                            textAlign: "center",
                            fontSize: "11px",
                          }}
                        >
                          {idx + 1}
                        </td>
                        <td style={{ padding: "9px 14px" }}>
                          <span
                            style={{
                              backgroundColor: "#e0e7ff",
                              color: "#3730a3",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontWeight: 700,
                              fontFamily: "monospace",
                              fontSize: "12px",
                              display: "inline-block",
                              border: "1px solid #c7d2fe",
                            }}
                          >
                            {school.code || "—"}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "9px 14px",
                            fontWeight: 600,
                            color: "#0f172a",
                          }}
                        >
                          {school.name}
                        </td>
                        <td
                          style={{
                            padding: "9px 14px",
                            color: "#475569",
                            fontSize: "11px",
                          }}
                        >
                          {school.forane || "General"}
                        </td>
                      </tr>
                    ))}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: "36px",
          borderTop: "1px solid #e2e8f0",
          paddingTop: "12px",
          display: "flex",
          justifyContent: "space-between",
          fontSize: "11px",
          color: "#94a3b8",
        }}
      >
        <div>SUVARA • Eparchy of Kanjirapally</div>
        <div>Page Reference Guide for Bulk Upload</div>
      </div>
    </div>
  );
};

export const downloadSchoolCodesPdf = async (schools: SchoolCodeItem[]) => {
  // 1. Render React template to static HTML
  const htmlString = renderToString(<SchoolCodesPdfTemplate schools={schools} />);

  // 2. Invisible wrapper
  const wrapper = document.createElement("div");
  wrapper.style.position = "absolute";
  wrapper.style.left = "-9999px";
  wrapper.style.top = "0";

  const tempContainer = document.createElement("div");
  tempContainer.style.width = "800px";
  tempContainer.style.background = "white";

  const fontCss = `@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Malayalam:wght@400;700&display=swap');`;
  tempContainer.innerHTML = `<style>${fontCss}</style>${htmlString}`;

  wrapper.appendChild(tempContainer);
  document.body.appendChild(wrapper);

  try {
    if ((document as any).fonts && (document as any).fonts.ready) {
      await (document as any).fonts.ready;
    }

    const opt = {
      margin: 8,
      filename: `Sunday_School_Codes_Directory_${new Date().toISOString().split("T")[0]}.pdf`,
      image: { type: "jpeg" as const, quality: 1.0 },
      html2canvas: {
        scale: 2.5,
        useCORS: true,
        letterRendering: true,
        scrollY: 0,
        windowWidth: 1200,
        logging: false,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    };

    await html2pdf().from(tempContainer).set(opt).save();
  } catch (error) {
    console.error("School codes PDF generation failed:", error);
    throw error;
  } finally {
    try {
      document.body.removeChild(wrapper);
    } catch (e) {
      /* ignore */
    }
  }
};
