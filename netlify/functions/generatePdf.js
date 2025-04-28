const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

exports.handler = async function(event, context) {
  // Check if request method is POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Only POST requests are accepted' })
    };
  }

  try {
    // Parse request body
    const requestBody = JSON.parse(event.body);
    const { salaName, miejsca } = requestBody;

    // Validate required fields
    if (!salaName || !miejsca || !Array.isArray(miejsca)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid request. Required fields: salaName (string) and miejsca (array)' })
      };
    }

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();

    // Get fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Add title
    const titleText = `Plan sali: ${salaName}`;
    const titleWidth = boldFont.widthOfTextAtSize(titleText, 24);
    page.drawText(titleText, {
      x: (width - titleWidth) / 2,
      y: height - 50,
      size: 24,
      font: boldFont,
      color: rgb(0, 0, 0)
    });

    // Add seats list
    const lineHeight = 25;
    let yPosition = height - 100;

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
    for (const miejsce of miejsca) {
      page.drawText(miejsce, {
        x: 50,
        y: yPosition,
        size: 16,
        font: font,
        color: rgb(0, 0, 0)
      });
      yPosition -= lineHeight;

      // Add a new page if we're running out of space
      if (yPosition < 50) {
        page = pdfDoc.addPage([595.28, 841.89]);
        yPosition = height - 50;
      }
    }

    // Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save();
    
    // Convert to base64
    const base64String = Buffer.from(pdfBytes).toString('base64');

    // Return the PDF
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="plan_sali.pdf"',
        'Content-Length': pdfBytes.length.toString()
      },
      body: base64String,
      isBase64Encoded: true
    };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate PDF', details: error.message })
    };
  }
};