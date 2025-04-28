import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { groupBy } from '../../utils/arrayUtils';

interface EventSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShowTitle {
  id: string;
  name: string;
  active: boolean;
  current_season: boolean;
  next_season: boolean;
  type_id: string | null;
}

interface PerformanceType {
  id: string;
  name: string;
  min_age: number;
  max_age: number | null;
  description: string;
}

const EventSettingsModal: React.FC<EventSettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'current' | 'next' | 'all'>('current');
  const [showTitles, setShowTitles] = useState<ShowTitle[]>([]);
  const [performanceTypes, setPerformanceTypes] = useState<PerformanceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    current_season: false,
    next_season: false,
    type_id: ''
  });
  const [showNewTitleForm, setShowNewTitleForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [calendars, setCalendars] = useState<{ id: string; name: string; }[]>([]);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  const [showCalendarAssignment, setShowCalendarAssignment] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState<ShowTitle | null>(null);
  const [filters, setFilters] = useState({
    active: true,
    season: ''
  });

  useEffect(() => {
    const loadShowTitles = async () => {
      try {
        setLoading(true);
        const [
          { data: titles, error: titlesError }, 
          { data: calendarData, error: calendarsError },
          { data: types, error: typesError }
        ] = await Promise.all([
          supabase
          .from('show_titles')
          .select(`
            id,
            name,
            active,
            current_season,
            next_season,
            type_id,
            calendar_show_titles(calendar_id)
          `)
          .order('name'),
          supabase
          .from('calendars')
          .select('id, name')
          .order('name'),
          supabase
          .from('performance_types')
          .select('*')
          .order('name')
        ]);

        if (titlesError) throw titlesError;
        if (calendarsError) throw calendarsError;
        if (typesError) throw typesError;

        setCalendars(calendarData || []);
        setPerformanceTypes(types || []);
        setShowTitles(titles?.map(title => ({
          ...title,
          calendars: title.calendar_show_titles.map((cst: any) => cst.calendar_id)
        })) || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load show titles');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadShowTitles();
    }
  }, [isOpen]);

  const handleAssignCalendars = async (titleId: string, calendarIds: string[]) => {
    try {
      // First remove all existing assignments
      await supabase
        .from('calendar_show_titles')
        .delete()
        .eq('show_title_id', titleId);

      // Then add new assignments
      if (calendarIds.length > 0) {
        const { error } = await supabase
          .from('calendar_show_titles')
          .insert(
            calendarIds.map(calendarId => ({
              show_title_id: titleId,
              calendar_id: calendarId
            }))
          );

        if (error) throw error;
      }

      // Update local state
      setShowTitles(showTitles.map(title =>
        title.id === titleId
          ? { ...title, calendars: calendarIds }
          : title
      ));

      setShowCalendarAssignment(false);
      setSelectedTitle(null);
      setSelectedCalendars([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign calendars');
    }
  };

  const handleAddTitle = async (name: string) => {
    try {
      // Only set season flags if explicitly selected
      const seasonData = {
        current_season: activeTab === 'current' || formData.current_season,
        next_season: activeTab === 'next' || formData.next_season,
        type_id: formData.type_id || null
      };

      const { data, error } = await supabase
        .from('show_titles')
        .insert([{
          name: formData.name,
          active: true,
          ...seasonData
        }])
        .select()
        .single();

      if (error) throw error;
      setShowTitles([...showTitles, data]);
      setFormData({
        name: '',
        current_season: false,
        next_season: false,
        type_id: ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add show title');
    }
  };

  const handleUpdateTitle = async (id: string, updates: Partial<ShowTitle>) => {
    try {
      const { error } = await supabase
        .from('show_titles')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setShowTitles(showTitles.map(title => 
        title.id === id ? { ...title, ...updates } : title
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update show title');
    }
  };

  const filteredTitles = showTitles.filter(title => {
    const matchesSearch = title.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesActive = !filters.active || title.active;
    const matchesType = !filters.type || title.type_id === filters.type;
    
    switch (activeTab) {
      case 'all':
        return matchesSearch && matchesActive && matchesType;
      case 'current':
        return matchesSearch && matchesActive && matchesType && title.current_season;
      case 'next':
        return matchesSearch && matchesActive && matchesType && title.next_season;
      default:
        return false;
    }
  });

  // Group titles by performance type
  const groupedTitles = groupBy(filteredTitles, 'type_id');

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-4xl mx-4 h-[90vh] flex flex-col">
        <div className="modal-header">
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">
                Zarządzanie spektaklami
              </h2>
              <button
                onClick={onClose}
                className="btn-modal-close absolute top-4 right-4"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('current')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'current'
                    ? 'bg-white text-red-900'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Bieżący sezon
              </button>
              <button
                onClick={() => setActiveTab('next')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'next'
                    ? 'bg-white text-red-900'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Następny sezon
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'all'
                    ? 'bg-white text-red-900'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Wszystkie spektakle
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Szukaj spektakli..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-white/30 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showFilters ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                <Filter className="w-5 h-5 text-white" />
              </button>
            </div>

            {showFilters && (
              <div className="bg-white/10 rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center space-x-2 text-white">
                    <input
                      type="checkbox"
                      checked={filters.active}
                      onChange={(e) => setFilters({ ...filters, active: e.target.checked })}
                      className="rounded border-white/30 bg-white/10 text-red-600 focus:ring-red-500"
                    />
                    <span>Tylko aktywne</span>
                  </label>
                  <select
                    value={filters.season}
                    onChange={(e) => setFilters({ ...filters, season: e.target.value })}
                    className="bg-white/10 text-white border border-white/30 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-white/30 focus:border-transparent"
                  >
                    <option value="">Wszystkie sezony</option>
                    <option value="current">Bieżący sezon</option>
                    <option value="next">Następny sezon</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          <div className="space-y-4">
            {loading && (
              <div className="text-center py-8 text-gray-500">
                Ładowanie spektakli...
              </div>
            )}
            {!loading && filteredTitles.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Brak spektakli do wyświetlenia
              </div>
            )}
            {!loading && filteredTitles.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {performanceTypes.map(type => {
                  const typeTitles = groupedTitles[type.id] || [];
                  if (typeTitles.length === 0) return null;
                  
                  return (
                    <div key={type.id} className="space-y-4">
                      <div className="bg-gradient-to-r from-red-900 to-red-800 text-white p-3 rounded-lg">
                        <h3 className="text-lg font-medium">
                          {type.name}
                        </h3>
                      </div>
                      <div className="space-y-2">
                        {typeTitles.map(title => (
                          <div
                            key={title.id}
                            className="bg-white rounded-lg border border-gray-200 p-3 hover:border-red-200 transition-all hover:shadow-md"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium text-gray-900">{title.name}</h4>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => {
                                    const newName = prompt('Podaj nową nazwę spektaklu:', title.name);
                                    if (newName) handleUpdateTitle(title.id, { name: newName });
                                  }}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (window.confirm('Czy na pewno chcesz usunąć ten spektakl?')) {
                                      try {
                                        const { error } = await supabase
                                          .from('show_titles')
                                          .delete()
                                          .eq('id', title.id);
                                        
                                        if (error) throw error;
                                        
                                        setShowTitles(showTitles.filter(t => t.id !== title.id));
                                      } catch (err) {
                                        setError(err instanceof Error ? err.message : 'Failed to delete title');
                                      }
                                    }
                                  }}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            
                            <div className="mt-2 flex flex-wrap gap-1">
                              {title.calendars?.map(calendarId => {
                                const calendar = calendars.find(c => c.id === calendarId);
                                if (!calendar) return null;
                                return (
                                  <span
                                    key={calendarId}
                                    className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px]"
                                  >
                                    {calendar.name}
                                  </span>
                                );
                              })}
                            </div>
                            
                            {activeTab === 'all' && (
                              <div className="mt-3 flex items-center space-x-2 text-[11px] border-t border-gray-100 pt-2">
                                <label className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={title.current_season}
                                    onChange={async () => {
                                      try {
                                        const { error } = await supabase
                                          .from('show_titles')
                                          .update({ current_season: !title.current_season })
                                          .eq('id', title.id);
                                        
                                        if (error) throw error;
                                        
                                        setShowTitles(showTitles.map(t => 
                                          t.id === title.id ? { ...t, current_season: !t.current_season } : t
                                        ));
                                      } catch (err) {
                                        setError(err instanceof Error ? err.message : 'Failed to update season');
                                      }
                                    }}
                                    className="rounded w-3 h-3 border-gray-300 text-red-600 focus:ring-red-500"
                                  />
                                  <span className="font-medium text-gray-600">Bieżący sezon</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={title.next_season}
                                    onChange={async () => {
                                      try {
                                        const { error } = await supabase
                                          .from('show_titles')
                                          .update({ next_season: !title.next_season })
                                          .eq('id', title.id);
                                        
                                        if (error) throw error;
                                        
                                        setShowTitles(showTitles.map(t => 
                                          t.id === title.id ? { ...t, next_season: !t.next_season } : t
                                        ));
                                      } catch (err) {
                                        setError(err instanceof Error ? err.message : 'Failed to update season');
                                      }
                                    }}
                                    className="rounded w-3 h-3 border-gray-300 text-red-600 focus:ring-red-500"
                                  />
                                  <span className="font-medium text-gray-600">Następny sezon</span>
                                </label>
                              </div>
                            )}
                            
                            <button
                              onClick={() => {
                                setSelectedTitle(title);
                                setSelectedCalendars(title.calendars || []);
                                setShowCalendarAssignment(true);
                              }}
                              className="mt-3 px-2 py-1.5 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors text-xs font-medium w-full"
                            >
                              Przypisz kalendarze
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {showCalendarAssignment && selectedTitle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">
                  Przypisz kalendarze do spektaklu
                </h3>
                <p className="text-sm text-gray-500 mt-1">{selectedTitle.name}</p>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <div className="space-y-3">
                  {calendars.map(calendar => (
                    <label
                      key={calendar.id}
                      className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-red-200 transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCalendars.includes(calendar.id)}
                        onChange={(e) => {
                          setSelectedCalendars(prev =>
                            e.target.checked
                              ? [...prev, calendar.id]
                              : prev.filter(id => id !== calendar.id)
                          );
                        }}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="ml-3 text-gray-900">{calendar.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowCalendarAssignment(false);
                      setSelectedTitle(null);
                      setSelectedCalendars([]);
                    }}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Anuluj
                  </button>
                  <button
                    onClick={() => handleAssignCalendars(selectedTitle.id, selectedCalendars)}
                    className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors"
                  >
                    Zapisz przypisania
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventSettingsModal;