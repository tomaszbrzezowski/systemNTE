import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Performance, AgreementFormData } from './useAgreement';
import { validateAgreementForm } from '../utils/agreementUtils';

export interface City {
  id: string;
  name: string;
  voivodeship: string;
}

export interface School {
  name: string;
  address: string;
  teacher_name?: string;
  teacher_phone?: string;
  teacher_email?: string;
}

export interface ShowTitle {
  id: string;
  name: string;
  current_season: boolean;
  next_season: boolean;
  type_id?: string;
}

export interface Calendar {
  id: string;
  name: string;
  events: {
    date: Date;
  }[];
}

export interface CalendarShowTitle {
  calendar_id: string;
  show_title_id: string;
}

export interface Hall {
  id: string;
  name: string;
  city_id: string;
}

export interface CitySuggestions {
  school: string[];
  event: City[];
  voivodeships: { [key: string]: string };
}

export interface EventData {
  id: string;
  date: string;
  status: string;
  calendar_id: string;
}

export interface PerformanceType {
  id: string;
  name: string;
}

interface UseAgreementFormProps {
  editMode?: boolean;
  initialData?: AgreementFormData;
}

export const useAgreementForm = ({
  editMode = false,
  initialData
}: UseAgreementFormProps = {}) => {
  const { currentUser } = useAuth();
  const [season, setSeason] = useState<'current' | 'next'>(
    editMode && initialData 
      ? (initialData.season === new Date().getFullYear().toString() ? 'current' : 'next') 
      : 'current'
  );
  
  // Data from API
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [showTitles, setShowTitles] = useState<ShowTitle[]>([]);
  const [calendarShowTitles, setCalendarShowTitles] = useState<CalendarShowTitle[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [performanceTypes, setPerformanceTypes] = useState<PerformanceType[]>([]);
  
  // UI state
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestions>({
    school: [],
    event: [],
    voivodeships: {}
  });
  const [schoolSuggestions, setSchoolSuggestions] = useState<School[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [filteredHalls, setFilteredHalls] = useState<Hall[]>([]);
  const [showSchoolCitySuggestions, setShowSchoolCitySuggestions] = useState(false);
  const [showEventCitySuggestions, setShowEventCitySuggestions] = useState(false);
  const [showSchoolSuggestions, setShowSchoolSuggestions] = useState(false);
  
  // Form data
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
  
  // Performances
  const [performances, setPerformances] = useState<Performance[]>(
    editMode && initialData?.performances ? initialData.performances : [{
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
      
      setCitySuggestions(prev => ({ ...prev, voivodeships }));
    };

    loadCities();
  }, []);

  // Load main data
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

      if (titlesData) setShowTitles(titlesData);
      if (typesData) setPerformanceTypes(typesData);
      if (citiesData) setCities(citiesData);
      if (hallsData) setHalls(hallsData);
      if (calendarTitlesData) setCalendarShowTitles(calendarTitlesData);
      if (calendarsData) setCalendars(calendarsData);
      if (eventsData) setEvents(eventsData);
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

  // Callbacks
  const loadSchoolSuggestions = useCallback(async (cityName: string) => {
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
      address: `${school.street} ${school.home_number}${school.local_number ? '/' + school.local_number : ''}, ${school.postcode} ${school.post}`,
      teacher_name: school.teacher_name,
      teacher_phone: school.teacher_phone,
      teacher_email: school.teacher_email
    })));
  }, []);

  const getFilteredShowTitles = useCallback((date: string) => {
    if (!date) return [];

    // Find the event for this date
    const event = events.find(e => e.date === date);
    if (!event?.calendar_id) return [];

    // Get show titles assigned to this calendar
    const assignedTitleIds = calendarShowTitles
      .filter(cst => cst.calendar_id === event.calendar_id)
      .map(cst => cst.show_title_id);

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
      
      const getTypeWeight = (title: ShowTitle) => {
        const type = title.type_id;
        if (!type) return 999; // Put titles without type at the end
        const performanceType = performanceTypes?.find(pt => pt.id === type);
        return typeOrder[performanceType?.name as keyof typeof typeOrder] || 999;
      };
      
      return getTypeWeight(a) - getTypeWeight(b);
    });
  }, [events, calendarShowTitles, showTitles, season, performanceTypes]);

  // Add/remove performances
  const addPerformance = useCallback(() => {
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
  }, [performances]);

  const removePerformance = useCallback((index: number) => {
    if (performances.length > 1) {
      setPerformances(performances.filter((_, i) => i !== index));
    }
  }, [performances]);

  // Validate form
  const validateForm = useCallback(() => {
    return validateAgreementForm({
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
  }, [formData, performances, season]);

  // Prepare form data for submission
  const getFormData = useCallback((): AgreementFormData => {
    return {
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
    };
  }, [formData, performances, season]);

  // Update form data
  const updateFormField = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Update performance data
  const updatePerformanceField = useCallback((index: number, field: string, value: any) => {
    const newPerformances = [...performances];
    (newPerformances[index] as any)[field] = value;
    setPerformances(newPerformances);
  }, [performances]);

  return {
    // State
    formData,
    performances,
    season,
    calendars,
    showTitles,
    cities,
    events,
    filteredHalls,
    citySuggestions,
    schoolSuggestions,
    showSchoolCitySuggestions,
    showEventCitySuggestions,
    showSchoolSuggestions,
    
    // Actions
    setSeason,
    setFormData,
    setPerformances,
    setSelectedCityId,
    setCitySuggestions,
    setShowSchoolCitySuggestions,
    setShowEventCitySuggestions,
    setShowSchoolSuggestions,
    
    // Callbacks
    loadSchoolSuggestions,
    getFilteredShowTitles,
    addPerformance,
    removePerformance,
    validateForm,
    getFormData,
    updateFormField,
    updatePerformanceField
  };
}; 