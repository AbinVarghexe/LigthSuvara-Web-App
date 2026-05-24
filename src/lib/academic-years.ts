/**
 * Static and dynamic utilities for academic years in India (starting June/July)
 */

export function getAcademicYears() {
  const startYear = 2024; // Start from 2024-2025 to include historical data
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-11
  
  // Cutoff is May (index 4). If it's May or later, the "next" year (currentYear to currentYear+1)
  // is available in the selection list.
  // If it's currently April 2026 (month 3), displayEndYear should be 2025 to show up to "2025-2026".
  const displayEndYear = currentMonth >= 4 ? currentYear : currentYear - 1;
  
  const years = [];
  for (let y = startYear; y <= displayEndYear; y++) {
    years.push(`${y}-${y + 1}`);
  }
  return years;
}

export function getCurrentAcademicYear() {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // Using May (index 4) as the cutoff month for the switch
  return month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

/**
 * Returns true if the given academic year is the current academic year.
 * Used for locking edits on past and future academic years.
 */
export function isYearEditable(yearString: string) {
  if (!yearString || yearString === "All") return false;
  return yearString === getCurrentAcademicYear();
}
