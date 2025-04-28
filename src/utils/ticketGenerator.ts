import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface SeatAssignment {
  sectionId: string;
  rowIndex: number;
  seatIndex: number;
  seatNumber: number;
  rowLabel: string;
}

export interface SchoolTicketData {
  title: string;
  date: string;
  time: string;
  seats: SeatAssignment[];
}

/**
 * Parses a seat ID string into its components
 * @param seatId The seat ID in the format "sectionId-rowIndex-seatIndex"
 * @returns An object with the parsed components
 */
export const parseSeatId = (seatId: string): { sectionId: string; rowIndex: number; seatIndex: number } => {
  const parts = seatId.split('-');
  if (parts.length < 3) {
    throw new Error(`Invalid seat ID format: ${seatId}`);
  }
  
  // The section ID might contain hyphens, so we need to handle that
  const sectionId = parts.slice(0, parts.length - 2).join('-');
  const rowIndex = parseInt(parts[parts.length - 2], 10);
  const seatIndex = parseInt(parts[parts.length - 1], 10);
  
  return { sectionId, rowIndex, seatIndex };
};

/**
 * Generates tickets for a school and downloads the PDF
 * @param data School ticket data
 */
export const generateTicketsForSchool = async (data: SchoolTicketData): Promise<void> => {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();

    // Get fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Add title
    const titleText = `Bilety: ${data.title}`;
    const titleWidth = boldFont.widthOfTextAtSize(titleText, 24);
    page.drawText(titleText, {
      x: (width - titleWidth) / 2,
      y: height - 50,
      size: 24,
      font: boldFont,
      color: rgb(0, 0, 0)
    });

    // Add date and time
    const dateTimeText = `Data: ${data.date}, Godzina: ${data.time}`;
    const dateTimeWidth = font.widthOfTextAtSize(dateTimeText, 14);
    page.drawText(dateTimeText, {
      x: (width - dateTimeWidth) / 2,
      y: height - 80,
      size: 14,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Sort seats by section, row, and seat number
    const sortedSeats = [...data.seats].sort((a, b) => {
      if (a.sectionId !== b.sectionId) return a.sectionId.localeCompare(b.sectionId);
      if (a.rowIndex !== b.rowIndex) return a.rowIndex - b.rowIndex;
      return a.seatIndex - b.seatIndex;
    });

    // Add seats list
    const lineHeight = 25;
    let yPosition = height - 120;

    // Add header for seats
    page.drawText('Lista miejsc:', {
      x: 50,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0)
    });

    yPosition -= 30;

    // Add each seat to the PDF
    for (const seat of sortedSeats) {
      const seatText = `Sekcja: ${seat.sectionId}, Rząd: ${seat.rowLabel}, Miejsce: ${seat.seatNumber}`;
      page.drawText(seatText, {
        x: 50,
        y: yPosition,
        size: 12,
        font: font,
        color: rgb(0, 0, 0)
      });
      yPosition -= lineHeight;

      // Add a new page if we're running out of space
      if (yPosition < 50) {
        const newPage = pdfDoc.addPage([595.28, 841.89]);
        yPosition = height - 50;
      }
    }

    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    
    // Create a blob and download
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bilety_${data.title.replace(/\s+/g, '_')}.pdf`;
    link.click();
    
  } catch (error) {
    console.error('Error generating tickets:', error);
    throw error;
  }
};

/**
 * Calls the Netlify function to generate a PDF with seat information
 * @param salaName Name of the hall
 * @param miejsca Array of seat identifiers
 * @returns Promise that resolves when the PDF is downloaded
 */
export const generateSeatPlan = async (salaName: string, miejsca: string[]): Promise<void> => {
  try {
    const response = await fetch('/.netlify/functions/generatePdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ salaName, miejsca }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate PDF');
    }

    // Get the PDF as a blob
    const pdfBlob = await response.blob();
    
    // Create a download link
    const url = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `plan_sali_${salaName.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error calling PDF generator function:', error);
    throw error;
  }
};