// ==========================
// Fetch with retry (handles Render free-tier "cold start" delays)
// ==========================
async function fetchWithRetry(url, options, retries = 1, delayMs = 8000) {
    try {
        return await fetch(url, options);
    } catch (err) {
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
            return fetchWithRetry(url, options, retries - 1, delayMs);
        }
        throw err;
    }
}

// ==========================
// CSV Export
// columns: [{ key: "donorName", label: "Donor Name" }, ...]
// rows: array of objects
// ==========================
function exportToCSV(filename, columns, rows) {
    if (!rows || rows.length === 0) {
        Swal.fire({ icon: "info", title: "No Data", text: "There is nothing to export yet." });
        return;
    }

    const escapeCell = (value) => {
        const str = String(value ?? "");
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    };

    const header = columns.map(c => escapeCell(c.label)).join(",");
    const lines = rows.map(row => columns.map(c => escapeCell(row[c.key])).join(","));
    const csvContent = [header, ...lines].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ==========================
// Donation Receipt (print-friendly popup)
// ==========================
function printDonationReceipt(donation, masjidName = "Jama Masjid As-Salam") {
    const receiptWindow = window.open("", "_blank", "width=420,height=650");

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Donation Receipt - ${donation.donationId}</title>
            <style>
                * { box-sizing: border-box; }
                body { font-family: Arial, sans-serif; padding: 30px; color: #212529; }
                .receipt { border: 2px solid #198754; border-radius: 10px; padding: 25px; }
                .header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #198754; padding-bottom: 15px; }
                .header h1 { font-size: 22px; color: #198754; margin: 0 0 4px 0; }
                .header p { margin: 0; color: #666; font-size: 13px; }
                .row { display: flex; justify-content: space-between; margin: 10px 0; font-size: 14px; }
                .label { color: #666; }
                .value { font-weight: bold; }
                .amount { text-align: center; margin: 20px 0; }
                .amount .value { font-size: 28px; color: #198754; }
                .footer { text-align: center; margin-top: 25px; font-size: 12px; color: #999; border-top: 1px dashed #ccc; padding-top: 12px; }
                @media print { body { padding: 0; } }
            </style>
        </head>
        <body>
            <div class="receipt">
                <div class="header">
                    <h1>🕌 ${masjidName}</h1>
                    <p>Official Donation Receipt</p>
                </div>

                <div class="row"><span class="label">Receipt No.</span><span class="value">${donation.donationId}</span></div>
                <div class="row"><span class="label">Donor Name</span><span class="value">${donation.donorName}</span></div>
                <div class="row"><span class="label">Phone</span><span class="value">${donation.phone}</span></div>
                <div class="row"><span class="label">Purpose</span><span class="value">${donation.purpose}</span></div>
                <div class="row"><span class="label">Date</span><span class="value">${donation.date}</span></div>
                <div class="row"><span class="label">Status</span><span class="value">${donation.status}</span></div>

                <div class="amount">
                    <div class="label">Amount Received</div>
                    <div class="value">Rs. ${Number(donation.amount).toLocaleString()}</div>
                </div>

                <div class="footer">
                    Jazak Allah Khair for your generous contribution.<br>
                    This is a computer-generated receipt.
                </div>
            </div>
            <script>
                window.onload = function() { window.print(); };
            </script>
        </body>
        </html>
    `;

    receiptWindow.document.write(html);
    receiptWindow.document.close();
}
