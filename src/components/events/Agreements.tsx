import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, FileText, Calendar, MapPin, Users, Phone, Mail, Eye, Printer, Pencil, Trash2 } from 'lucide-react';
import AgreementModal from './AgreementModal';
import AgreementPreview from './AgreementPreview';
import { supabase } from '../../lib/supabase';

interface Agreement {
  id: string;
  agreement_number: string;
  season: string;
  agreement_date: string;
  school_name: string;
  school_address: string;
  teacher_name: string;
  teacher_phone: string;
  teacher_email: string;
  hall_city_name: string;
  hall_name: string;
  created_at: string;
}

const Agreements: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [performances, setPerformances] = useState<Record<string, {
    id: string;
    performance_date: string;
    performance_time: string;
    paid_tickets: number;
    unpaid_tickets: number;
    teacher_tickets: number;
    cost: number;
    notes: string;
    show_title: { name: string } | null;
  }[]>>({});
  const [filters, setFilters] = useState({
    season: '',
    startDate: '',
    endDate: '',
    status: ''
  });

  // Filter agreements based on search and filters
  const filteredAgreements = agreements.filter(agreement => {
    const matchesSearch = !searchTerm || 
      agreement.agreement_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agreement.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agreement.teacher_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeason = !filters.season || agreement.season === filters.season;
    
    const agreementDate = new Date(agreement.agreement_date);
    const matchesDateRange = (!filters.startDate || agreementDate >= new Date(filters.startDate)) &&
                           (!filters.endDate || agreementDate <= new Date(filters.endDate));

    const matchesStatus = !filters.status || filters.status === 'active';

    return matchesSearch && matchesSeason && matchesDateRange && matchesStatus;
  });

  useEffect(() => {
    const loadAgreements = async () => {
      try {
        const { data: agreementsData, error: agreementsError } = await supabase
          .from('agreements')
          .select('*')
          .order('created_at', { ascending: false });

        if (agreementsError) throw agreementsError;
        setAgreements(agreementsData || []);

        // Fetch performances for each agreement
        const { data: performancesData, error: performancesError } = await supabase
          .from('agreement_performances')
          .select(`
            id,
            agreement_id,
            performance_date,
            performance_time,
            paid_tickets,
            unpaid_tickets,
            teacher_tickets,
            cost,
            notes,
            show_title:show_titles(name)
          `);

        if (performancesError) throw performancesError;

        // Group performances by agreement_id
        const performancesByAgreement = (performancesData || []).reduce((acc, perf) => {
          if (!acc[perf.agreement_id]) {
            acc[perf.agreement_id] = [];
          }
          acc[perf.agreement_id].push(perf);
          return acc;
        }, {} as Record<string, typeof performancesData>);

        setPerformances(performancesByAgreement);
      } catch (error) {
        console.error('Failed to load agreements:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAgreements();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  const handleAgreementClick = useCallback((agreementId: string) => {
    setExpandedId(expandedId === agreementId ? null : agreementId);
  }, [expandedId]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  // Calculate pagination
  const totalItems = filteredAgreements.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAgreements = filteredAgreements.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handlePreviewClick = useCallback((agreement: Agreement) => {
    setSelectedAgreement(agreement);
    setShowPreview(true);
  }, []);

  const handleCreateAgreement = async (data: {
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
  }) => {
    try {
      setError(null);
      
      // Insert agreement
      const { data: agreement, error: agreementError } = await supabase
        .from('agreements')
        .insert([{
          season: data.season,
          agreement_date: data.date,
          school_name: data.schoolName,
          school_address: data.schoolAddress,
          teacher_name: data.teacherName,
          teacher_phone: data.teacherPhone,
          teacher_email: data.teacherEmail,
          hall_city_name: data.hallCityName,
          hall_name: data.hallName
        }])
        .select()
        .single();

      if (agreementError) throw agreementError;

      // Insert performances
      const { error: performancesError } = await supabase
        .from('agreement_performances')
        .insert(
          data.performances.map(perf => ({
            agreement_id: agreement.id,
            performance_date: perf.date,
            show_title_id: perf.showTitleId,
            performance_time: perf.time,
            paid_tickets: perf.paidTickets,
            unpaid_tickets: perf.unpaidTickets,
            teacher_tickets: perf.teacherTickets,
            cost: perf.cost,
            notes: perf.notes
          }))
        );

      if (performancesError) throw performancesError;

      // Refresh agreements list
      const { data: updatedAgreements } = await supabase
        .from('agreements')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (updatedAgreements) {
        setAgreements(updatedAgreements);
      }

      setShowModal(false);
    } catch (error) {
      console.error('Failed to create agreement:', error);
      setError(error instanceof Error ? error.message : 'Failed to create agreement');
    }
  };

  const handleEditAgreement = async (data: {
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
  }) => {
    try {
      setError(null);
      
      if (!selectedAgreement) return;

      // Update agreement
      const { error: agreementError } = await supabase
        .from('agreements')
        .update({
          season: data.season,
          agreement_date: data.date,
          school_name: data.schoolName,
          school_address: data.schoolAddress,
          teacher_name: data.teacherName,
          teacher_phone: data.teacherPhone,
          teacher_email: data.teacherEmail,
          hall_city_name: data.hallCityName,
          hall_name: data.hallName
        })
        .eq('id', selectedAgreement.id);

      if (agreementError) throw agreementError;

      // Delete existing performances
      const { error: deleteError } = await supabase
        .from('agreement_performances')
        .delete()
        .eq('agreement_id', selectedAgreement.id);

      if (deleteError) throw deleteError;

      // Insert new performances
      const { error: performancesError } = await supabase
        .from('agreement_performances')
        .insert(
          data.performances.map(perf => ({
            agreement_id: selectedAgreement.id,
            performance_date: perf.date,
            show_title_id: perf.showTitleId,
            performance_time: perf.time,
            paid_tickets: perf.paidTickets,
            unpaid_tickets: perf.unpaidTickets,
            teacher_tickets: perf.teacherTickets,
            cost: perf.cost,
            notes: perf.notes
          }))
        );

      if (performancesError) throw performancesError;

      // Refresh agreements list
      const { data: updatedAgreements } = await supabase
        .from('agreements')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (updatedAgreements) {
        setAgreements(updatedAgreements);
      }

      setShowEditModal(false);
      setSelectedAgreement(null);
    } catch (error) {
      console.error('Failed to update agreement:', error);
      setError(error instanceof Error ? error.message : 'Failed to update agreement');
    }
  };

  const handleDeleteAgreement = async (agreement: Agreement) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tę umowę?')) return;

    try {
      const { error } = await supabase
        .from('agreements')
        .delete()
        .eq('id', agreement.id);

      if (error) throw error;

      setAgreements(agreements.filter(a => a.id !== agreement.id));
    } catch (error) {
      console.error('Failed to delete agreement:', error);
      alert('Nie udało się usunąć umowy');
    }
  };

  return (
    <div className="w-full max-w-6xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <h2 className="text-2xl font-bold text-gray-900">Umowy</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Dodaj umowę</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Szukaj umów..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters ? 'bg-red-100 text-red-800' : 'hover:bg-gray-100'
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sezon
                  </label>
                  <select
                    value={filters.season}
                    onChange={(e) => setFilters({ ...filters, season: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Wszystkie sezony</option>
                    <option value="current">Bieżący sezon</option>
                    <option value="next">Następny sezon</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data od
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data do
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Wszystkie statusy</option>
                    <option value="active">Aktywne</option>
                    <option value="completed">Zakończone</option>
                    <option value="cancelled">Anulowane</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center text-gray-500">
              Ładowanie umów...
            </div>
          ) : currentAgreements.length === 0 ? (
            <div className="text-center text-gray-500">
              Brak umów do wyświetlenia
            </div>
          ) : (
            <div className="space-y-4">
              {currentAgreements.map(agreement => (
                <div
                  key={agreement.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-red-200 transition-all hover:shadow-md"
                >
                  <div 
                    onClick={() => handleAgreementClick(agreement.id)}
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    {/* Header with agreement number and date */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-6 h-6 text-red-600" />
                        <h3 className="text-lg font-medium text-gray-900">
                          Umowa nr {agreement.agreement_number}
                          <span className="ml-2 text-sm text-gray-500">
                            • {agreement.school_name}, {agreement.school_address}
                          </span>
                        </h3>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">
                          Data umowy: {formatDate(agreement.agreement_date)}
                        </span>
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                          Sezon {agreement.season}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expandable content */}
                  <div className={`overflow-hidden transition-all duration-300 ${
                    expandedId === agreement.id ? 'max-h-[1000px]' : 'max-h-0'
                  }`}>
                    <div className="p-4 border-t border-gray-100">
                      {/* School information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Dane szkoły</h4>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-900">{agreement.school_name}</p>
                            <p className="text-sm text-gray-600">{agreement.school_address}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Dane sali</h4>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-900">{agreement.hall_name}</p>
                            <p className="text-sm text-gray-600">{agreement.hall_city_name}</p>
                          </div>
                        </div>
                      </div>

                      {/* Teacher information */}
                      <div className="border-t border-gray-100 pt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Dane nauczyciela</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{agreement.teacher_name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{agreement.teacher_phone}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{agreement.teacher_email}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Performances */}
                      {performances[agreement.id]?.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Spektakle:</h4>
                          <div className="space-y-3">
                            {performances[agreement.id].map((performance) => (
                              <div 
                                key={performance.id}
                                className="bg-gray-50 p-3 rounded-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
                              >
                                <div>
                                  <span className="text-xs text-gray-500">Tytuł</span>
                                  <p className="text-sm font-medium text-gray-900">
                                    {performance.show_title?.name || 'Brak tytułu'}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500">Data i godzina</span>
                                  <p className="text-sm font-medium text-gray-900">
                                    {formatDate(new Date(performance.performance_date))}, {performance.performance_time}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500">Miejscówki</span>
                                  <p className="text-sm font-medium text-gray-900">
                                    {performance.paid_tickets} płatne, {performance.unpaid_tickets} niepłatne, {performance.teacher_tickets} dla nauczycieli
                                  </p>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500">Koszt</span>
                                  <p className="text-sm font-medium text-gray-900">
                                    {performance.cost.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
                                  </p>
                                </div>
                                {performance.notes && (
                                  <div className="col-span-full">
                                    <span className="text-xs text-gray-500">Uwagi</span>
                                    <p className="text-sm text-gray-600">{performance.notes}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex justify-end space-x-2 pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewClick(agreement);
                          }}
                          className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center space-x-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Szczegóły</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAgreement(agreement);
                            setShowEditModal(true);
                          }}
                          className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center space-x-2"
                        >
                          <Pencil className="w-4 h-4" />
                          <span>Edytuj</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAgreement(agreement);
                          }}
                          className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center space-x-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Usuń</span>
                        </button>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-2"
                        >
                          <Printer className="w-4 h-4" />
                          <span>Drukuj</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="mt-6 border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">Pokaż</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className="rounded-md border-gray-300 py-1.5 text-sm focus:border-red-500 focus:ring-red-500"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-gray-700">na stronie</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-700">
                    Pokazuje <span className="font-medium">{startIndex + 1}</span>
                    {' '}-{' '}
                    <span className="font-medium">{Math.min(endIndex, totalItems)}</span>
                    {' '}z{' '}
                    <span className="font-medium">{totalItems}</span>
                  </p>
                  
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm ml-4" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Poprzednia
                    </button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                            currentPage === pageNumber
                              ? 'z-10 bg-red-900 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600'
                              : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Następna
                    </button>
                  </nav>
                </div>
              </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <AgreementModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        editMode={false}
        onSubmit={handleCreateAgreement}
      />
      
      {selectedAgreement && showEditModal && (
        <AgreementModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAgreement(null);
          }}
          onSubmit={handleEditAgreement}
          editMode={true}
          initialData={{
            season: selectedAgreement.season,
            date: selectedAgreement.agreement_date,
            schoolName: selectedAgreement.school_name,
            schoolAddress: selectedAgreement.school_address,
            teacherName: selectedAgreement.teacher_name,
            teacherPhone: selectedAgreement.teacher_phone,
            teacherEmail: selectedAgreement.teacher_email,
            hallCityName: selectedAgreement.hall_city_name,
            hallName: selectedAgreement.hall_name,
            performances: (performances[selectedAgreement.id] || []).map(p => ({
              date: p.performance_date,
              showTitleId: p.show_title_id,
              time: p.performance_time,
              paidTickets: p.paid_tickets,
              unpaidTickets: p.unpaid_tickets,
              teacherTickets: p.teacher_tickets,
              cost: p.cost,
              notes: p.notes || ''
            }))
          }}
        />
      )}
      
      {selectedAgreement && (
        <AgreementPreview
          isOpen={showPreview}
          onClose={() => {
            setShowPre

view(false);
            setSelectedAgreement(null);
          }}
          agreement={selectedAgreement}
        />
      )}
    </div>
  );
};

export default Agreements;