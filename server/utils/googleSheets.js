const { google } = require('googleapis');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

/**
 * Robust Auth Helper
 * This function loads credentials dynamically to prevent crashes on Render.
 */
const getAuth = () => {
    let credentials;

    // 1. Priority: Check Render Environment Variable (Secret)
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        try {
            credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
        } catch (e) {
            throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not a valid JSON string.");
        }
    } else {
        // 2. Fallback: Local Development
        try {
            // Using a dynamic require inside the function so it doesn't crash on boot
            credentials = require('../google-key.json');
        } catch (e) {
            throw new Error(
                "Google Credentials not found. Please ensure GOOGLE_SERVICE_ACCOUNT_JSON is set in Render " + 
                "Environment Variables, or the 'google-key.json' file exists locally."
            );
        }
    }

    return new JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
};

/**
 * 1. Setup a new Tab (Worksheet)
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
        console.error("Sheet setup error:", error.message);
        throw error;
    }
};

/**
 * 2. Add a new Attendee row and color it GREEN
 */
const addRowToSheet = async (eventName, data) => {
    try {
        const serviceAccountAuth = getAuth();
        const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
        
        await doc.loadInfo();
        
        const sheet = doc.sheetsByTitle[eventName];
        if (!sheet) throw new Error("Sheet tab not found!");

        const row = await sheet.addRow(data);

        // Styling: Make the row Green
        await sheet.loadCells({
            startRowIndex: row.rowNumber - 1,
            endRowIndex: row.rowNumber,
            startColumnIndex: 0,
            endColumnIndex: sheet.columnCount
        });

        for (let i = 0; i < sheet.columnCount; i++) {
            const cell = sheet.getCell(row.rowNumber - 1, i);
            cell.backgroundColor = { red: 0.56, green: 0.93, blue: 0.56 }; 
        }
        
        await sheet.saveUpdatedCells();
        return row;
    } catch (error) {
        console.error("Add row error:", error.message);
        throw error;
    }
};

/**
 * 3. Update an existing row with Sequential Status Logic
 */
async function updateRowStatus(eventName, qrCodeId, newAction) {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${eventName}!A1:Z`, 
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) return;

  const headers = rows[0];
  const qrIdColumnIndex = headers.indexOf('QR_ID');
  const rowIndex = rows.findIndex(row => row[qrIdColumnIndex] === qrCodeId);
  if (rowIndex === -1) throw new Error("Attendee not found in sheet");

  const attendeeRow = rows[rowIndex];

  let statusColumns = headers
    .map((h, i) => (h.startsWith('Status') ? i : -1))
    .filter(index => index !== -1);

  let targetColumnIndex = -1;
  for (let colIndex of statusColumns) {
    if (!attendeeRow[colIndex]) {
      targetColumnIndex = colIndex;
      break;
    }
  }

  if (targetColumnIndex === -1) {
    const nextStatusNumber = statusColumns.length + 1;
    const newHeaderName = `Status ${nextStatusNumber}`;
    targetColumnIndex = headers.length;

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${eventName}!${String.fromCharCode(65 + targetColumnIndex)}1`,
      valueInputOption: 'RAW',
      resource: { values: [[newHeaderName]] },
    });
  }

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