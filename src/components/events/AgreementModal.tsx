import React, { useState, useEffect } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { City, EventStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import TimeSelector from './TimeSelector';
import PerformanceDateSelector from './PerformanceDateSelector';

interface Performance {
  date: string;
  showTitleId: string;
  time: string;
  paidTickets: number;
  unpaidTickets: number;
  teacherTickets: number;
  cost: number;
  notes: string;
}

interface AgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  editMode: boolean;
  initialData?: {
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
  };
  onSubmit: (data: {
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
  }) => void;
}

const AgreementModal: React.FC<AgreementModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  editMode = false,
  initialData
}) => {
  const { currentUser } = useAuth();
  const [season, setSeason] = useState<'current' | 'next'>(
    editMode && initialData ? 
      (initialData.season === new Date().getFullYear().toString() ? 'current' : 'next') 
      : 'current'
  );
  const [calendars, setCalendars] = useState<{
    id: string;
    name: string;
    events: {
      date: Date;
    }[];
  }[]>([]);
  const [showTitles, setShowTitles] = useState<{ 
    id: string; 
    name: string; 
    current_season: boolean; 
    next_season: boolean
  }[]>([]);
  const [calendarShowTitles, setCalendarShowTitles] = useState<{
    calendar_id: string;
    show_title_id: string;
  }[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [citySuggestions, setCitySuggestions] = useState<{
    school: string[];
    event: City[],
    voivodeships: { [key: string]: string }
  }>({ school: [], event: [], voivodeships: {} });
  const [showSchoolCitySuggestions, setShowSchoolCitySuggestions] = useState(false);
  const [showEventCitySuggestions, setShowEventCitySuggestions] = useState(false);
  const [halls, setHalls] = useState<{ id: string; name: string; city_id: string }[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [filteredHalls, setFilteredHalls] = useState<{ id: string; name: string; city_id: string }[]>([]);
  const [formData, setFormData] = useState({
    city: editMode && initialData ? initialData.hallCityName : '',
    date: editMode && initialData ? initialData.date : '',
    schoolName: editMode && initialData ? initialData.schoolName : '',
    schoolAddress: editMode && initialData ? initialData.schoolAddress : '',
    teacherName: editMode && initialData ? initialData.teacherName : '',
    teacherPhone: editMode && initialData ? initialData.teacherPhone : '',
    teacherEmail: editMode && initialData ? initialData.teacherEmail : '',
    hallCityName: editMode && initialData ? initialData.hallCityName : '',
    hallName: editMode && initialData ? initialData.hallName : '',
  });
  const [showSchoolSuggestions, setShowSchoolSuggestions] = useState(false);
  const [events, setEvents] = useState<{
    id: string;
    date: string;
    status: EventStatus;
    calendar_id: string;
  }[]>([]);
  const [performanceTypes, setPerformanceTypes] = useState<{
    id: string;
    name: string;
  }[]>([]);
  const [performances, setPerformances] = useState<Performance[]>(
    editMode && initialData ? initialData.performances : [{
      date: '',
      showTitleId: '',
      time: '',
      paidTickets: 0,
      unpaidTickets: 0,
      teacherTickets: 0,
      cost: 0,
      notes: ''
    }]
  );

  const [schoolSuggestions, setSchoolSuggestions] = useState<{
    name: string;
    address: string;
    teacher_name?: string;
    teacher_phone?: string;
    teacher_email?: string;
  }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load unique cities from schools_list
  useEffect(() => {
    const loadCities = async () => {
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools_list')
        .select('city, voivodeship')
        .order('city');
      
      if (schoolsError) {
        console.error('Error loading cities:', schoolsError);
        return;
      }

      const uniqueCities = [...new Set(schoolsData.map(row => row.city))];
      const voivodeships = schoolsData.reduce((acc, row) => {
        acc[row.city] = row.voivodeship;
        return acc;
      }, {} as { [key: string]: string });
      
      setCities(uniqueCities);
      setCitySuggestions(prev => ({ ...prev, voivodeships }));
    };

    loadCities();
  }, []);

  // Load school suggestions when city is selected
  const loadSchoolSuggestions = async (cityName: string) => {
    const { data, error } = await supabase
      .from('schools_list')
      .select('*')
      .eq('city', cityName)
      .order('school_name')
      .limit(50);

    if (error) {
      console.error('Error loading schools:', error);
      return;
    }

    setSchoolSuggestions(data.map(school => ({
      name: school.school_name,
      address: `${school.street} ${school.home_number}${school.local_number ? '/' + school.local_number : ''}, ${school.postcode} ${school.post}`
    })));
  };

  useEffect(() => {
    const loadData = async () => {
      const [
        { data: titlesData, error: titlesError }, 
        { data: typesData, error: typesError },
        { data: citiesData, error: citiesError }, 
        { data: hallsData, error: hallsError }, 
        { data: calendarTitlesData, error: calendarTitlesError },
        { data: calendarsData, error: calendarsError },
        { data: eventsData, error: eventsError }
      ] = await Promise.all([
        supabase
        .from('show_titles')
        .select('id, name, current_season, next_season, type_id')
        .eq('active', true)
        .order('name'),
        supabase
        .from('performance_types')
        .select('id, name')
        .order('name'),
        supabase
        .from('cities')
        .select('*')
        .order('name'),
        supabase
        .from('halls')
        .select('*'),
        supabase
        .from('calendar_show_titles')
        .select('*'),
        supabase
        .from('calendars')
        .select('id, name'),
        supabase
        .from('calendar_events')
        .select('id, date, status, calendar_id')
        .eq('user_id', currentUser?.id)
        .order('date', { ascending: true })
      ]);
      
      if (titlesError) console.error('Error loading titles:', titlesError);
      if (citiesError) console.error('Error loading cities:', citiesError);
      if (hallsError) console.error('Error loading halls:', hallsError);
      if (calendarTitlesError) console.error('Error loading calendar titles:', calendarTitlesError);
      if (calendarsError) console.error('Error loading calendars:', calendarsError);
      if (eventsError) console.error('Error loading events:', eventsError);

      if (titlesData) {
        setShowTitles(titlesData);
      }
      if (typesData) {
        setPerformanceTypes(typesData);
      }
      if (citiesData) setCities(citiesData);
      if (hallsData) setHalls(hallsData);
      if (calendarTitlesData) setCalendarShowTitles(calendarTitlesData);
      if (calendarsData && eventsData) {
        setCalendars(calendarsData);
        setEvents(eventsData);
      }
    };
    loadData();
  }, [currentUser?.id]);

  // Update filtered halls when selected city changes
  useEffect(() => {
    if (selectedCityId) {
      const filtered = halls.filter(hall => hall.city_id === selectedCityId);
      setFilteredHalls(filtered);
    } else {
      setFilteredHalls([]);
    }
  }, [selectedCityId, halls]);

  const getFilteredShowTitles = (date: string) => {
    if (!date) return [];

    // Find the event for this date
    const event = events.find(e => e.date === date);
    if (!event?.calendar_id) return [];

    // Get show titles assigned to this calendar
    const assignedTitleIds = calendarShowTitles.filter(cst => 
      cst.calendar_id === event.calendar_id
    ).map(cst => cst.show_title_id);

    // Filter show titles by season and calendar assignment
    const filteredTitles = showTitles.filter(title =>
      assignedTitleIds.includes(title.id) &&
      (season === 'current' ? title.current_season : title.next_season)
    );

    // Sort titles by type (youngest to oldest)
    return filteredTitles.sort((a, b) => {
      const typeOrder = {
        'Dzieci Młodsze': 1,
        'Dzieci Starsze': 2,
        'Młodzież': 3,
        'Szkoły średnie': 4
      };
      
      const getTypeWeight = (title: typeof filteredTitles[0]) => {
        const type = showTitles.find(t => t.id === title.id)?.type_id;
        if (!type) return 999; // Put titles without type at the end
        const performanceType = performanceTypes?.find(pt => pt.id === type);
        return typeOrder[performanceType?.name as keyof typeof typeOrder] || 999;
      };
      
      return getTypeWeight(a) - getTypeWeight(b);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate required fields
      if (!formData.date || !formData.schoolName || !formData.schoolAddress || 
          !formData.teacherName || !formData.teacherPhone || !formData.teacherEmail ||
          !formData.hallCityName || !formData.hallName) {
        throw new Error('Wszystkie pola są wymagane');
      }
      
      // Validate performances
      if (!performances.length) {
        throw new Error('Dodaj przynajmniej jeden spektakl');
      }
      
      for (const perf of performances) {
        if (!perf.date || !perf.showTitleId || !perf.time) {
          throw new Error('Wypełnij wszystkie wymagane pola spektaklu');
        }
      }
      
      onSubmit({
        season: season === 'current' ? new Date().getFullYear().toString() : (new Date().getFullYear() + 1).toString(),
        date: formData.date,
        schoolName: formData.schoolName,
        schoolAddress: formData.schoolAddress,
        teacherName: formData.teacherName,
        teacherPhone: formData.teacherPhone,
        teacherEmail: formData.teacherEmail,
        hallCityName: formData.hallCityName,
        hallName: formData.hallName,
        performances
      });
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Wystąpił błąd podczas zapisywania umowy');
    }
  };

  const addPerformance = () => {
    if (performances.length < 5) {
      setPerformances([...performances, {
        date: '',
        showTitleId: '',
        time: '',
        paidTickets: 0,
        unpaidTickets: 0,
        teacherTickets: 0,
        cost: 0,
        notes: ''
      }]);
    }
  };

  const removePerformance = (index: number) => {
    if (performances.length > 1) {
      setPerformances(performances.filter((_, i) => i !== index));
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
                      const suggestions = cities
                        .filter(city => typeof city === 'string' ? city.toLowerCase().includes(searchTerm) : city.name.toLowerCase().includes(searchTerm))
                        .map(city => city.name);
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
                          setCitySuggestions({ school: [], event: [] });
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
                      const suggestions = cities.filter(city => 
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
                {selectedCityId && filteredHalls.length === 0 && (
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
                disabled={!selectedCityId}
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
                        if (calendarId && calendarId !== events.find(e => e.date === date)?.calendar_id) {
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