import React from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { useAgreementForm } from '../../hooks/useAgreementForm';
import { validateAgreementForm } from '../../utils/agreementUtils';
import TimeSelector from './TimeSelector';
import PerformanceDateSelector from './PerformanceDateSelector';
import { AgreementFormData } from '../../hooks/useAgreement';

interface AgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  editMode: boolean;
  initialData?: AgreementFormData;
  onSubmit: (data: AgreementFormData) => void;
}

const AgreementModal: React.FC<AgreementModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  editMode = false,
  initialData
}) => {
  const {
    formData,
    performances,
    season,
    filteredHalls,
    citySuggestions,
    schoolSuggestions,
    showSchoolCitySuggestions,
    showEventCitySuggestions,
    showSchoolSuggestions,
    
    setSeason,
    setFormData,
    setPerformances,
    setSelectedCityId,
    setCitySuggestions,
    setShowSchoolCitySuggestions,
    setShowEventCitySuggestions,
    setShowSchoolSuggestions,
    
    loadSchoolSuggestions,
    getFilteredShowTitles,
    addPerformance,
    removePerformance,
    validateForm,
    getFormData
  } = useAgreementForm({ editMode, initialData });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validation = validateForm();
      if (!validation.isValid) {
        throw new Error(validation.errors.join('\n'));
      }
      
      onSubmit(getFormData());
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Wystąpił błąd podczas zapisywania umowy');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-4xl mx-4">
        <div className="modal-header">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">
              {editMode ? 'Edytuj umowę' : 'Nowa umowa'}
            </h2>
            <button onClick={onClose} className="btn-modal-close absolute top-4 right-4">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="mt-4 flex space-x-4">
            <button
              onClick={() => setSeason('current')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                season === 'current' 
                  ? 'bg-white text-red-900' 
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Bieżący sezon
            </button>
            <button
              onClick={() => setSeason('next')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                season === 'next' 
                  ? 'bg-white text-red-900' 
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Następny sezon
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Miasto szkoły
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onFocus={() => setShowSchoolCitySuggestions(true)}
                  onChange={(e) => {
                    setFormData({ ...formData, city: e.target.value });
                    const searchTerm = e.target.value.toLowerCase();
                    if (searchTerm.length >= 2) {
                      const suggestions = citySuggestions.voivodeships ? 
                        Object.keys(citySuggestions.voivodeships)
                          .filter(city => city.toLowerCase().includes(searchTerm))
                        : [];
                      setCitySuggestions(prev => ({ ...prev, school: suggestions }));
                    } else {
                      setCitySuggestions(prev => ({ ...prev, school: [] }));
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Wprowadź nazwę miasta"
                  required
                />
                {showSchoolCitySuggestions && citySuggestions.school.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {citySuggestions.school.map((cityName, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                        onClick={() => {
                          setFormData({ ...formData, city: cityName });
                          setShowSchoolCitySuggestions(false);
                          setCitySuggestions(prev => ({ ...prev, school: [] }));
                          // Load all schools for selected city
                          loadSchoolSuggestions(cityName);
                        }}
                      >
                        <div className="font-medium text-gray-900">{cityName}</div>
                        <div className="text-sm text-gray-500">
                          {citySuggestions.voivodeships[cityName]}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nazwa szkoły
              </label>
              <div className="relative">
                <input
                  type="text"
                  onFocus={() => setShowSchoolSuggestions(true)}
                  value={formData.schoolName}
                  onChange={(e) => {
                    setFormData({ ...formData, schoolName: e.target.value });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
                {showSchoolSuggestions && formData.city && schoolSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {schoolSuggestions
                      .filter(school => 
                        formData.schoolName === '' || 
                        school.name.toLowerCase().includes(formData.schoolName.toLowerCase())
                      )
                      .map((school, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            schoolName: school.name,
                            schoolAddress: school.address,
                            teacherName: school.teacher_name || '',
                            teacherPhone: school.teacher_phone || '',
                            teacherEmail: school.teacher_email || ''
                          });
                          setShowSchoolSuggestions(false);
                          setCitySuggestions({ school: [], event: [], voivodeships: citySuggestions.voivodeships });
                        }}
                      >
                        <div className="font-medium text-gray-900">{school.name}</div>
                        <div className="text-sm text-gray-500">{school.address}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adres szkoły
              </label>
              <input
                type="text"
                value={formData.schoolAddress}
                onChange={(e) => setFormData({ ...formData, schoolAddress: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Imię i nazwisko nauczyciela
              </label>
              <input
                type="text"
                value={formData.teacherName}
                onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon
              </label>
              <input
                type="tel"
                value={formData.teacherPhone}
                onChange={(e) => setFormData({ ...formData, teacherPhone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.teacherEmail}
                onChange={(e) => setFormData({ ...formData, teacherEmail: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Miasto wydarzenia
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.hallCityName}
                  onFocus={() => setShowEventCitySuggestions(true)}
                  onChange={(e) => {
                    const searchTerm = e.target.value.toLowerCase();
                    setFormData({ ...formData, hallCityName: e.target.value, hallName: '' });
                    setSelectedCityId(''); // Reset selected city ID
                    
                    if (searchTerm.length >= 2) {
                      const suggestions = citySuggestions.event.filter(city => 
                        city.name.toLowerCase().includes(searchTerm)
                      );
                      setCitySuggestions(prev => ({ ...prev, event: suggestions }));
                    } else {
                      setCitySuggestions(prev => ({ ...prev, event: [] }));
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Wprowadź nazwę miasta"
                  required
                />
                {showEventCitySuggestions && citySuggestions.event.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {citySuggestions.event.map((city) => (
                      <button
                        key={city.id}
                        type="button"
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                        onClick={() => {
                          setFormData({ ...formData, hallCityName: city.name, hallName: '' });
                          setSelectedCityId(city.id);
                          setCitySuggestions(prev => ({ ...prev, event: [] }));
                          setShowEventCitySuggestions(false);
                        }}
                      >
                        <div className="font-medium text-gray-900">{city.name}</div>
                        <div className="text-sm text-gray-500">{city.voivodeship}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nazwa sali
                {filteredHalls.length === 0 && (
                  <span className="text-xs text-red-500 ml-2">
                    Brak dostępnych sal w tym mieście
                  </span>
                )}
              </label>
              <select
                value={formData.hallName}
                onChange={(e) => setFormData({ ...formData, hallName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              >
                <option value="">Wybierz salę</option>
                {filteredHalls.map(hall => (
                  <option key={hall.id} value={hall.name}>
                    {hall.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Spektakle</h3>
              <button
                type="button"
                onClick={addPerformance}
                disabled={performances.length >= 5}
                className="px-4 py-2 text-sm bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-6">
              {performances.map((performance, index) => (
              <div key={index} className="bg-white border border-gray-200 shadow-sm p-6 rounded-xl">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-900 font-semibold text-base shadow-sm">
                      {index + 1}
                    </span>
                    <h4 className="text-lg font-semibold text-gray-900">Spektakl</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {performances.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePerformance(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors hover:shadow-sm"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 bg-gray-50 p-4 rounded-lg mb-6">
                  <div>
                    <PerformanceDateSelector
                      value={performance.date}
                      onChange={(date, calendarId) => {
                        const newPerformances = [...performances];
                        newPerformances[index].date = date;
                        // Reset show title if calendar changes
                        if (calendarId) {
                          newPerformances[index].showTitleId = '';
                        }
                        setPerformances(newPerformances);
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tytuł
                    </label>
                    <select
                      value={performance.showTitleId}
                      onChange={(e) => {
                        const newPerformances = [...performances];
                        newPerformances[index].showTitleId = e.target.value;
                        setPerformances(newPerformances);
                      }}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white shadow-sm"
                      required
                    >
                      <option value="">Wybierz tytuł</option>
                      {getFilteredShowTitles(performance.date).map(title => (
                        <option key={title.id} value={title.id}>{title.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Godzina
                    </label>
                    <TimeSelector
                      value={performance.time}
                      onChange={(e) => {
                        const newPerformances = [...performances];
                        newPerformances[index].time = e;
                        setPerformances(newPerformances);
                      }}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-6 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Miejscówki płatne
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={performance.paidTickets}
                      onChange={(e) => {
                        const newPerformances = [...performances];
                        newPerformances[index].paidTickets = parseInt(e.target.value) || 0;
                        setPerformances(newPerformances);
                      }}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white shadow-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Miejscówki niepłatne
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={performance.unpaidTickets}
                      onChange={(e) => {
                        const newPerformances = [...performances];
                        newPerformances[index].unpaidTickets = parseInt(e.target.value) || 0;
                        setPerformances(newPerformances);
                      }}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white shadow-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Miejscówki dla nauczycieli
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={performance.teacherTickets}
                      onChange={(e) => {
                        const newPerformances = [...performances];
                        newPerformances[index].teacherTickets = parseInt(e.target.value) || 0;
                        setPerformances(newPerformances);
                      }}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white shadow-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Koszt
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={performance.cost}
                      onChange={(e) => {
                        const newPerformances = [...performances];
                        newPerformances[index].cost = parseFloat(e.target.value) || 0;
                        setPerformances(newPerformances);
                      }}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white shadow-sm"
                      required
                    />
                  </div>
                </div>

                <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Uwagi
                  </label>
                  <textarea
                    value={performance.notes}
                    onChange={(e) => {
                      const newPerformances = [...performances];
                      newPerformances[index].notes = e.target.value;
                      setPerformances(newPerformances);
                    }}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white shadow-sm resize-none"
                  />
                </div>
              </div>
            ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={onClose}
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={performances.length === 0}
              className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors"
            >
              Zapisz umowę
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgreementModal;