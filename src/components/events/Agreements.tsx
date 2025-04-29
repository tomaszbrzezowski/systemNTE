import React, { useState, useCallback } from 'react';
import { Plus, Search, Filter, FileText, Calendar, MapPin, Users, Phone, Mail, Eye, Printer, Pencil, Trash2 } from 'lucide-react';
import AgreementModal from './AgreementModal';
import AgreementPreview from './AgreementPreview';
import { useAgreement, Agreement, AgreementFormData } from '../../hooks/useAgreement';
import { filterAgreements, getPaginationData, getUniqueSeasons, formatDate } from '../../utils/agreementUtils';

const Agreements: React.FC = () => {
  // State management with our custom hook
  const { 
    agreements, 
    performances, 
    loading, 
    error, 
    createAgreement, 
    updateAgreement, 
    deleteAgreement 
  } = useAgreement();

  // UI state
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    season: '',
    startDate: '',
    endDate: '',
    status: ''
  });

  // Apply filters
  const filteredAgreements = filterAgreements(agreements, searchTerm, filters);

  // Pagination
  const { totalItems, totalPages, currentItems } = getPaginationData(
    filteredAgreements,
    currentPage,
    itemsPerPage
  );

  // Event handlers
  const handleAgreementClick = useCallback((agreementId: string) => {
    setExpandedId(expandedId === agreementId ? null : agreementId);
  }, [expandedId]);

  const handlePreviewClick = useCallback((agreement: Agreement) => {
    setSelectedAgreement(agreement);
    setShowPreview(true);
  }, []);

  const handleCreateAgreement = async (data: AgreementFormData) => {
    const success = await createAgreement(data);
    if (success) {
      setShowModal(false);
    }
  };

  const handleEditAgreement = async (data: AgreementFormData) => {
    if (!selectedAgreement) return;
    
    const success = await updateAgreement(selectedAgreement.id, data);
    if (success) {
      setShowEditModal(false);
      setSelectedAgreement(null);
    }
  };

  const handleDeleteAgreement = async (agreement: Agreement) => {
    if (window.confirm(`Czy na pewno chcesz usunąć umowę ${agreement.agreement_number}?`)) {
      const success = await deleteAgreement(agreement.id);
      if (success) {
        setExpandedId(null);
      }
    }
  };

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Get unique seasons for filter dropdown
  const seasons = getUniqueSeasons(agreements);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Umowy</h1>
        <button 
          className="px-4 py-2 bg-red-900 text-white rounded-lg flex items-center gap-2"
          onClick={() => setShowModal(true)}
        >
          <Plus className="w-5 h-5" />
          <span>Nowa umowa</span>
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Szukaj umów..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-5 h-5" />
              <span>Filtry</span>
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-4 gap-4">
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
                  {seasons.map(season => (
                    <option key={season} value={season}>{season}</option>
                  ))}
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
              <div className="flex items-end">
                <button
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  onClick={() => setFilters({
                    season: '',
                    startDate: '',
                    endDate: '',
                    status: ''
                  })}
                >
                  Wyczyść filtry
                </button>
              </div>
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-red-900 rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-600">Ładowanie umów...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            {error}
          </div>
        ) : currentItems.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="mx-auto w-12 h-12 text-gray-400" />
            <p className="mt-2 text-gray-600">Brak umów do wyświetlenia</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Szkoła</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sala</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentItems.map(agreement => (
                  <React.Fragment key={agreement.id}>
                    <tr 
                      className={`hover:bg-gray-50 cursor-pointer ${expandedId === agreement.id ? 'bg-gray-50' : ''}`}
                      onClick={() => handleAgreementClick(agreement.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{agreement.agreement_number || 'Brak numeru'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-500">{formatDate(agreement.agreement_date)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Users className="w-5 h-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{agreement.school_name}</div>
                            <div className="text-xs text-gray-500">{agreement.school_address}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <MapPin className="w-5 h-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{agreement.hall_name}</div>
                            <div className="text-xs text-gray-500">{agreement.hall_city_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          className="text-red-900 hover:text-red-800 mr-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewClick(agreement);
                          }}
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          className="text-blue-600 hover:text-blue-800 mr-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            
                            // Get the performances for this agreement
                            const agreementPerformances = performances[agreement.id] || [];
                            
                            // Convert to the format expected by the modal
                            setSelectedAgreement(agreement);
                            setShowEditModal(true);
                          }}
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAgreement(agreement);
                          }}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                    {expandedId === agreement.id && (
                      <tr>
                        <td colSpan={5} className="bg-gray-50 border-t border-gray-100 px-6 py-4">
                          <div className="text-sm text-gray-900 mb-3">
                            <strong>Kontakt:</strong> {agreement.teacher_name}
                            <div className="flex items-center mt-1">
                              <Phone className="w-4 h-4 text-gray-400 mr-1" />
                              <span className="text-xs">{agreement.teacher_phone}</span>
                              <Mail className="w-4 h-4 text-gray-400 ml-4 mr-1" />
                              <span className="text-xs">{agreement.teacher_email}</span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-900 mb-3">
                            <strong>Spektakle:</strong>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            {performances[agreement.id]?.map((performance, idx) => (
                              <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 text-sm">
                                <div className="font-medium">{performance.show_title?.name || 'Brak tytułu'}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {formatDate(performance.date)}, {performance.time}
                                </div>
                                <div className="text-xs mt-2">
                                  <div>Bilety płatne: {performance.paidTickets}</div>
                                  <div>Bilety niepłatne: {performance.unpaidTickets}</div>
                                  <div>Bilety nauczycieli: {performance.teacherTickets}</div>
                                  <div className="mt-1 font-medium">Koszt: {performance.cost} zł</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {!loading && totalItems > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-sm text-gray-700">
                Pokazuję {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} z {totalItems} umów
              </span>
              <select
                className="ml-4 px-2 py-1 border border-gray-300 rounded"
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              >
                <option value={10}>10 / stronę</option>
                <option value={20}>20 / stronę</option>
                <option value={50}>50 / stronę</option>
              </select>
            </div>
            <div className="flex">
              <button
                className="px-3 py-1 border border-gray-300 rounded-l-lg disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Poprzednia
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
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
                    key={i}
                    className={`px-3 py-1 border-t border-b border-gray-300 ${
                      pageNumber === currentPage ? 'bg-red-900 text-white' : 'bg-white text-gray-700'
                    }`}
                    onClick={() => handlePageChange(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              <button
                className="px-3 py-1 border border-gray-300 rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Następna
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AgreementModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreateAgreement}
        editMode={false}
      />

      {showEditModal && selectedAgreement && (
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
            performances: performances[selectedAgreement.id] || []
          }}
        />
      )}

      {showPreview && selectedAgreement && (
        <AgreementPreview
          agreement={selectedAgreement}
          performances={performances[selectedAgreement.id] || []}
          isOpen={showPreview}
          onClose={() => {
            setShowPreview(false);
            setSelectedAgreement(null);
          }}
        />
      )}
    </div>
  );
};

export default Agreements;