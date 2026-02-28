
import { createMalayalamPDF } from "../../../lib/pdfFonts";
import { Teacher, Parish } from "../types";
import { UserData } from "../../users/services/userService";

export const PdfService = {
  generateFatherReport: async (teacher: Teacher, parish: Parish, className: string) => {
    const doc = await createMalayalamPDF();

    // Header
    doc.setFontSize(22);
    doc.setFont("NotoSansMalayalam", "bold");
    doc.text("Parish Inspection - Father's Report", 20, 20);

    doc.setFontSize(12);
    doc.setFont("NotoSansMalayalam", "normal");
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 30);

    // Content
    doc.setFontSize(14);
    doc.setFont("NotoSansMalayalam", "bold");
    doc.text("Inspection Details:", 20, 45);

    doc.setFontSize(12);
    doc.setFont("NotoSansMalayalam", "normal");
    doc.text(`Parish Name: ${parish.name}`, 20, 55);
    doc.text(`Assigned Class: ${className}`, 20, 65);
    doc.text(`Academic Year: ${teacher.academicYear}`, 20, 75);

    doc.text("Assigned Inspector (Teacher):", 20, 90);
    doc.text(`Name: ${teacher.name}`, 25, 100);
    doc.text(`Phone: ${teacher.phone}`, 25, 107);
    doc.text(`Email: ${teacher.email}`, 25, 114);

    doc.text("Instructions:", 20, 130);
    doc.setFontSize(10);
    doc.text("Please ensure all students are present for the inspection.", 25, 137);
    doc.text("The inspector will verify the records and conduct a brief oral evaluation.", 25, 142);

    // Save
    doc.save(`Father_Report_${parish.name.replace(/\s+/g, '_')}.pdf`);
  },

  generateTeacherDutyReport: async (teacher: Teacher, parish: Parish, className: string) => {
    const doc = await createMalayalamPDF();

    // Header
    doc.setFontSize(22);
    doc.setFont("NotoSansMalayalam", "bold");
    doc.text("Inspection Duty Order", 20, 20);

    doc.setFontSize(12);
    doc.setFont("NotoSansMalayalam", "normal");
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 30);
    doc.text(`Order ID: IMP-${Math.floor(Math.random() * 10000)}`, 140, 30);

    // Content
    doc.setFontSize(14);
    doc.setFont("NotoSansMalayalam", "normal");
    doc.text(`Dear ${teacher.name},`, 20, 45);

    doc.setFontSize(12);
    doc.text(`You have been assigned to inspect the following parish:`, 20, 55);

    doc.setDrawColor(0);
    doc.setFillColor(240, 240, 240);
    doc.rect(20, 60, 170, 40, "F");

    doc.setFont("NotoSansMalayalam", "bold");
    doc.text(`${parish.name}`, 25, 70);
    doc.setFont("NotoSansMalayalam", "normal");
    doc.text(`Class to Inspect: ${className}`, 25, 80);
    doc.text(`Location Coordinates: ${parish.location.lat}, ${parish.location.long}`, 25, 90);

    doc.text("Instructions for Teacher:", 20, 115);
    doc.setFontSize(10);
    doc.text("1. Contact the Parish Priest 2 days prior to confirm time.", 25, 122);
    doc.text("2. Carry this Duty Order and your ID card.", 25, 127);
    doc.text("3. Submit the inspection report within 24 hours via the portal.", 25, 132);

    // Save
    doc.save(`Duty_Order_${teacher.name.replace(/\s+/g, '_')}.pdf`);
  },

  // New Report Implementations

  generateSundaySchoolReport: async (users: UserData[], forane: string, parish: string) => {
    const doc = await createMalayalamPDF();

    doc.setFontSize(18);
    doc.setFont("NotoSansMalayalam", "bold");
    doc.text("Sunday School Report", 14, 20);

    doc.setFontSize(12);
    doc.setFont("NotoSansMalayalam", "normal");
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Filters - Forane: ${forane}, Parish: ${parish}`, 14, 37);

    let y = 50;
    const lineHeight = 10;
    const pageHeight = doc.internal.pageSize.height;

    doc.setFont("NotoSansMalayalam", "bold");
    doc.text("Name", 14, y);
    doc.text("School/Parish", 80, y);
    doc.text("Mobile", 150, y);
    y += lineHeight;
    doc.line(14, y - 5, 200, y - 5); // header line

    doc.setFont("NotoSansMalayalam", "normal");

    users.forEach((user, index) => {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
      const schoolName = user.schoolName || user.schoolname || "N/A";
      doc.text(`${index + 1}. ${user.fullName || "Unknown"}`, 14, y);
      doc.text(
        doc.splitTextToSize(schoolName, 65), // wrap text
        80,
        y
      );
      doc.text(user.phoneNumber || "N/A", 150, y);

      // Adjust y based on wrapped text height if needed, but for simplicity:
      y += lineHeight;
    });

    doc.save(`Sunday_School_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  },

  generateTeacherClassReport: async (teachers: Teacher[], forane: string, parish: string, year: string, className: string) => {
    const doc = await createMalayalamPDF();

    doc.setFontSize(18);
    doc.setFont("NotoSansMalayalam", "bold");
    doc.text("Class-wise Teacher Report", 14, 20);

    doc.setFontSize(12);
    doc.setFont("NotoSansMalayalam", "normal");
    doc.text(`Academic Year: ${year}`, 14, 30);
    doc.text(`Filters - Forane: ${forane}, Parish: ${parish}, Class: ${className}`, 14, 37);

    let y = 50;
    const lineHeight = 10;

    doc.setFont("NotoSansMalayalam", "bold");
    doc.text("Name", 14, y);
    doc.text("Parish", 70, y);
    doc.text("Phone", 130, y);
    doc.text("Classes", 170, y);
    y += lineHeight;
    doc.line(14, y - 5, 200, y - 5);

    doc.setFont("NotoSansMalayalam", "normal");

    teachers.forEach((t, i) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${i + 1}. ${t.name}`, 14, y);
      doc.text(doc.splitTextToSize(t.parishName || "N/A", 55), 70, y);
      doc.text(t.phone || "", 130, y);
      doc.text(Array.isArray(t.classes) ? t.classes.join(", ") : t.classes || "", 170, y);
      y += lineHeight;
    });

    doc.save(`Teachers_Class_Report_${className}_${year}.pdf`);
  },

  generateAnimatorReport: async (animators: UserData[], forane: string, parish: string) => {
    const doc = await createMalayalamPDF();

    doc.setFontSize(18);
    doc.setFont("NotoSansMalayalam", "bold");
    doc.text("Animator Report", 14, 20);

    doc.setFontSize(12);
    doc.setFont("NotoSansMalayalam", "normal");
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Filters - Forane: ${forane}, Parish: ${parish}`, 14, 37);

    let y = 50;
    const lineHeight = 10;

    doc.setFont("NotoSansMalayalam", "bold");
    doc.text("Name", 14, y);
    doc.text("Parish/School", 80, y);
    doc.text("Contact", 150, y);
    y += lineHeight;
    doc.line(14, y - 5, 200, y - 5);

    doc.setFont("NotoSansMalayalam", "normal");

    animators.forEach((a, i) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      const school = a.schoolName || a.schoolname || "N/A";
      doc.text(`${i + 1}. ${a.fullName || "Unknown"}`, 14, y);
      doc.text(doc.splitTextToSize(school, 60), 80, y);
      doc.text(a.phoneNumber || "", 150, y);
      y += lineHeight;
    });

    doc.save(`Animator_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  },

  generateObserverAssignmentReport: async (assignments: any[], teachers: Teacher[], parishes: Parish[], forane: string, parish: string, year: string) => {
    const doc = await createMalayalamPDF();

    doc.setFontSize(18);
    doc.setFont("NotoSansMalayalam", "bold");
    doc.text("Observer Assignment Report", 14, 20);

    doc.setFontSize(12);
    doc.setFont("NotoSansMalayalam", "normal");
    doc.text(`Year: ${year}`, 14, 30);
    doc.text(`Filters - Forane: ${forane}, Parish: ${parish}`, 14, 37);

    let y = 55;
    const lineHeight = 12; // slightly more space for assignments

    doc.setFont("NotoSansMalayalam", "bold");
    doc.text("Teacher (Observer)", 14, y);
    doc.text("Assigned Parish", 80, y);
    doc.text("Class", 150, y);
    doc.text("Date", 180, y);
    y += lineHeight;
    doc.line(14, y - 5, 200, y - 5);

    doc.setFont("NotoSansMalayalam", "normal");

    // Pre-process data
    const rows = assignments.map(a => {
      const t = teachers.find(tea => tea.id === a.teacherId);
      const p = parishes.find(par => par.id === a.parishId);
      return {
        teacherName: t?.name || "Unknown",
        parishName: p?.name || "Unknown",
        className: a.classId || "N/A", // assuming classId stores the class name or ID
        date: a.dateAssigned ? new Date(a.dateAssigned).toLocaleDateString() : "N/A"
      };
    });

    rows.forEach((row, i) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${i + 1}. ${row.teacherName}`, 14, y);
      doc.text(doc.splitTextToSize(row.parishName, 60), 80, y);
      doc.text(row.className, 150, y);
      doc.text(row.date, 180, y);
      y += lineHeight;
    });

    doc.save(`Observer_Assignments_${year}.pdf`);
  },

  generateObserverDirectoryReport: async (teachers: Teacher[], forane: string, parish: string, year: string) => {
    const doc = await createMalayalamPDF();

    doc.setFontSize(18);
    doc.setFont("NotoSansMalayalam", "bold");
    doc.text("Observer Directory", 14, 20);

    doc.setFontSize(12);
    doc.setFont("NotoSansMalayalam", "normal");
    doc.text(`Year: ${year}`, 14, 30);
    doc.text(`Filters - Forane: ${forane}, Home Parish: ${parish}`, 14, 37);

    let y = 50;
    const lineHeight = 10;

    doc.setFont("NotoSansMalayalam", "bold");
    doc.text("Name", 14, y);
    doc.text("Home Parish", 70, y);
    doc.text("Phone", 130, y);
    doc.text("Email", 170, y);
    y += lineHeight;
    doc.line(14, y - 5, 200, y - 5);

    doc.setFont("NotoSansMalayalam", "normal");
    doc.setFontSize(10); // slightly smaller for directory

    teachers.forEach((t, i) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${i + 1}. ${t.name}`, 14, y);
      doc.text(doc.splitTextToSize(t.parishName || "N/A", 55), 70, y);
      doc.text(t.phone || "N/A", 130, y);
      const email = t.email.length > 20 ? t.email.substring(0, 18) + ".." : t.email;
      doc.text(email, 170, y);
      y += lineHeight;
    });

    doc.save(`Observer_Directory_${year}.pdf`);
  }
};
