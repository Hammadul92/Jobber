export function formatDate(dateInput, showHours = true) {
    if (!dateInput) return '';

    // Handle pure date-only strings like "2026-03-01"
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        const [year, month, day] = dateInput.split('-').map(Number);
        const date = new Date(year, month - 1, day); // local time, no offset

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    }

    // Handle datetimes (e.g. 2026-03-01T14:00:00Z)
    const date = new Date(dateInput);
    if (isNaN(date)) return '';

    const options = {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    };

    if (showHours) {
        options.hour = 'numeric';
        options.minute = '2-digit';
        options.hour12 = true;
    }

    return date.toLocaleString('en-US', options);
}
