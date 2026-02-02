import jsPDF from "jspdf";
import { Teacher, Parish } from "../types";

export const PdfService = {
  generateFatherReport: (teacher: Teacher, parish: Parish, className: string) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.text("Parish Inspection - Father's Report", 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 30);
    
    // Content
    doc.setFontSize(14);
    doc.text("Inspection Details:", 20, 45);
    
    doc.setFontSize(12);
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

  generateTeacherDutyReport: (teacher: Teacher, parish: Parish, className: string) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.text("Inspection Duty Order", 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 30);
    doc.text(`Order ID: IMP-${Math.floor(Math.random() * 10000)}`, 140, 30);
    
    // Content
    doc.setFontSize(14);
    doc.text(`Dear ${teacher.name},`, 20, 45);
    
    doc.setFontSize(12);
    doc.text(`You have been assigned to inspect the following parish:`, 20, 55);
    
    doc.setDrawColor(0);
    doc.setFillColor(240, 240, 240);
    doc.rect(20, 60, 170, 40, "F");
    
    doc.setFont("helvetica", "bold");
    doc.text(`${parish.name}`, 25, 70);
    doc.setFont("helvetica", "normal");
    doc.text(`Class to Inspect: ${className}`, 25, 80);
    doc.text(`Location Coordinates: ${parish.location.lat}, ${parish.location.long}`, 25, 90);
    
    doc.text("Instructions for Teacher:", 20, 115);
    doc.setFontSize(10);
    doc.text("1. Contact the Parish Priest 2 days prior to confirm time.", 25, 122);
    doc.text("2. Carry this Duty Order and your ID card.", 25, 127);
    doc.text("3. Submit the inspection report within 24 hours via the portal.", 25, 132);
    
    // Save
    doc.save(`Duty_Order_${teacher.name.replace(/\s+/g, '_')}.pdf`);
  }
};
