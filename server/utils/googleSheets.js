const { google } = require('googleapis');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const creds = require('../google-key.json'); // Ensure this file is in your server folder

// Helper to initialize the Google Auth
const getAuth = () => {
    return new JWT({
        email: creds.client_email,
        key: creds.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
};

/**
 * 1. Setup a new Tab (Worksheet) for a new QR Event
 * Called when: Admin creates a "New Record QR Code Generator"
 */
const setupSheet = async (eventName, fields) => {
    try {
        const serviceAccountAuth = getAuth();
        const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
        
        await doc.loadInfo(); 
        
        // Adds a new tab named after the Event with custom headers
        const newSheet = await doc.addSheet({ 
            title: eventName, 
            headerValues: [...fields, 'QR_ID', 'Status', 'Timestamp'] 
        });

        return newSheet.sheetId;
    } catch (error) {
        console.error("Error setting up sheet:", error);
        throw error;
    }
};

/**
 * 2. Add a new Attendee row and color it GREEN
 * Called when: A user fills the form and generates their QR code
 */
const addRowToSheet = async (eventName, data) => {
    try {
        const serviceAccountAuth = getAuth();
        const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
        
        await doc.loadInfo();
        
        const sheet = doc.sheetsByTitle[eventName];
        if (!sheet) throw new Error("Sheet tab not found!");

        // Add the row data
        const row = await sheet.addRow(data);

        // --- STYLING: Make the row Green ---
        await sheet.loadCells({
            startRowIndex: row.rowNumber - 1,
            endRowIndex: row.rowNumber,
            startColumnIndex: 0,
            endColumnIndex: sheet.columnCount
        });

        for (let i = 0; i < sheet.columnCount; i++) {
            const cell = sheet.getCell(row.rowNumber - 1, i);
            cell.backgroundColor = { red: 0.56, green: 0.93, blue: 0.56 }; // Light Green
        }
        
        await sheet.saveUpdatedCells();
        return row;
    } catch (error) {
        console.error("Error adding row to sheet:", error);
        throw error;
    }
};

/**
 * 3. Update an existing row with Sequential Status Logic
 * This version checks for existing "Status" columns and creates "Status 2", "Status 3", etc.
 * if existing cells are already filled for the user.
 */
async function updateRowStatus(eventName, qrCodeId, newAction) {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  // 1. Get all data from the sheet to find the row and headers
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${eventName}!A1:Z`, 
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) return;

  const headers = rows[0];
  const qrIdColumnIndex = headers.indexOf('QR_ID');
  
  // 2. Find the row index for this specific attendee
  const rowIndex = rows.findIndex(row => row[qrIdColumnIndex] === qrCodeId);
  if (rowIndex === -1) throw new Error("Attendee not found in sheet");

  const attendeeRow = rows[rowIndex];

  // 3. Find all column indices that start with "Status"
  let statusColumns = headers
    .map((h, i) => (h.startsWith('Status') ? i : -1))
    .filter(index => index !== -1);

  // 4. Find the first "Status" column that is empty for THIS row
  let targetColumnIndex = -1;
  for (let colIndex of statusColumns) {
    if (!attendeeRow[colIndex]) {
      targetColumnIndex = colIndex;
      break;
    }
  }

  // 5. If all Status columns are full, create a NEW column header
  if (targetColumnIndex === -1) {
    const nextStatusNumber = statusColumns.length + 1;
    const newHeaderName = `Status ${nextStatusNumber}`;
    targetColumnIndex = headers.length; // Next available column at the end

    // Add new header to the first row
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${eventName}!${String.fromCharCode(65 + targetColumnIndex)}1`,
      valueInputOption: 'RAW',
      resource: { values: [[newHeaderName]] },
    });
  }

  // 6. Update the cell with the new action
  const columnLetter = String.fromCharCode(65 + targetColumnIndex);
  const cellRange = `${eventName}!${columnLetter}${rowIndex + 1}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: cellRange,
    valueInputOption: 'RAW',
    resource: { values: [[newAction]] },
  });
}

module.exports = { setupSheet, addRowToSheet, updateRowStatus };