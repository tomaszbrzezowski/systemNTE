import { Agreement, Performance } from '../hooks/useAgreement';

/**
 * Filter agreements based on search term and filter criteria
 */
export const filterAgreements = (
  agreements: Agreement[],
  searchTerm: string,
  filters: {
    season: string;
    startDate: string;
    endDate: string;
    status: string;
  }
) => {
  return agreements.filter(agreement => {
    // Filter by search term
    const matchesSearch = !searchTerm || 
      agreement.agreement_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agreement.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agreement.teacher_name.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by season
    const matchesSeason = !filters.season || agreement.season === filters.season;
    
    // Filter by date range
    const agreementDate = new Date(agreement.agreement_date);
    const matchesDateRange = (!filters.startDate || agreementDate >= new Date(filters.startDate)) &&
                           (!filters.endDate || agreementDate <= new Date(filters.endDate));

    // Filter by status (placeholder for future implementation)
    const matchesStatus = !filters.status || filters.status === 'active';

    return matchesSearch && matchesSeason && matchesDateRange && matchesStatus;
  });
};

/**
 * Calculate pagination data
 */
export const getPaginationData = (
  filteredItems: any[],
  currentPage: number,
  itemsPerPage: number
) => {
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  return {
    totalItems,
    totalPages,
    currentItems
  };
};

/**
 * Validate agreement form data
 */
export const validateAgreementForm = (data: {
  season: string;
  date: string;
  schoolName: string;
  schoolAddress: string;
  teacherName: string;
  teacherPhone: string;
  teacherEmail: string;
  hallCityName: string;
  hallName: string;
  performances: Performance[];
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validate required fields
  if (!data.date) errors.push('Data jest wymagana');
  if (!data.schoolName) errors.push('Nazwa szkoły jest wymagana');
  if (!data.schoolAddress) errors.push('Adres szkoły jest wymagany');
  if (!data.teacherName) errors.push('Imię i nazwisko nauczyciela jest wymagane');
  if (!data.teacherPhone) errors.push('Telefon nauczyciela jest wymagany');
  if (!data.teacherEmail) errors.push('Email nauczyciela jest wymagany');
  if (!data.hallCityName) errors.push('Miasto wydarzenia jest wymagane');
  if (!data.hallName) errors.push('Nazwa sali jest wymagana');

  // Validate performances
  if (!data.performances.length) {
    errors.push('Dodaj przynajmniej jeden spektakl');
  } else {
    data.performances.forEach((perf, index) => {
      if (!perf.date) errors.push(`Spektakl ${index + 1}: Data jest wymagana`);
      if (!perf.showTitleId) errors.push(`Spektakl ${index + 1}: Tytuł jest wymagany`);
      if (!perf.time) errors.push(`Spektakl ${index + 1}: Godzina jest wymagana`);
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Format date to local format
 */
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pl-PL');
};

/**
 * Get a list of unique seasons from agreements
 */
export const getUniqueSeasons = (agreements: Agreement[]) => {
  const seasons = agreements.map(a => a.season);
  return [...new Set(seasons)].sort((a, b) => b.localeCompare(a)); // Sort descending
}; 