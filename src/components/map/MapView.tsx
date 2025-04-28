import React, { useEffect, useRef, useState } from 'react';
import { Calendar, City, CalendarEvent, User } from '../../types';
import { EVENT_STATUSES } from '../../utils/statusConstants';
import { initializeMap, clearMarkers, addMarker, fitMapToBounds } from '../../utils/mapUtils';
import { formatDate } from '../../utils/dateUtils';
import SeasonSelector from './SeasonSelector';
import MapFilters from './MapFilters';
import { useAuth } from '../../context/AuthContext';

// Poland's center coordinates
const POLAND_CENTER: [number, number] = [19.4803, 52.0692];

interface MapViewProps {
  calendars: Calendar[];
  cities: City[];
  users: User[];
  onClose: () => void;
}

const MapView: React.FC<MapViewProps> = ({ calendars, cities, users, onClose }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
  const [hideEmptyCities, setHideEmptyCities] = useState(true);
  const [hideCitiesWithEvents, setHideCitiesWithEvents] = useState(false);
  const [visibleCities, setVisibleCities] = useState<City[]>(cities);
  const [selectedSeason, setSelectedSeason] = useState(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    return currentMonth >= 9 
      ? `${currentYear}/${currentYear + 1}`
      : `${currentYear - 1}/${currentYear}`;
  });

  // Only show w_trakcie and zrobiony statuses
  const relevantStatuses = ['w_trakcie', 'zrobiony'];

  // Update visible cities when user selection changes
  useEffect(() => {
    if (!selectedUserId) {
      // For no selection, show unique assigned cities based on role
      if (currentUser?.role === 'administrator') {
        // Show each city only once
        const uniqueCityIds = new Set(
          users.flatMap(user => user.assignedCityIds)
        );
        setVisibleCities(cities.filter(city => uniqueCityIds.has(city.id)));
      } else if (currentUser?.role === 'supervisor') {
        // Show supervisor's cities and their organizers' cities
        const organizerIds = currentUser.organizatorIds || [];
        const organizerCities = users
          .filter(u => organizerIds.includes(u.id))
          .flatMap(u => u.assignedCityIds);
        
        const allCityIds = new Set([
          ...currentUser.assignedCityIds,
          ...organizerCities
        ]);
        
        setVisibleCities(cities.filter(city => allCityIds.has(city.id)));
      } else {
        // For organizers, show only their assigned cities
        setVisibleCities(cities.filter(city => 
          currentUser?.assignedCityIds.includes(city.id)
        ));
      }
      return;
    }

    const selectedUser = users.find(u => u.id === selectedUserId);
    if (!selectedUser) {
      setVisibleCities(currentUser?.role === 'administrator' ? cities : []);
      return;
    }

    // For administrators, show selected user's cities
    if (currentUser?.role === 'administrator') {
      setVisibleCities(cities.filter(city => 
        selectedUser.assignedCityIds.includes(city.id)
      ));
      return;
    }

    // For supervisors, show their cities and their organizers' cities
    if (currentUser?.role === 'supervisor') {
      const organizerIds = currentUser.organizatorIds || [];
      const allCityIds = new Set([
        ...currentUser.assignedCityIds,
        ...organizerIds.includes(selectedUserId) ? selectedUser.assignedCityIds : []
      ]);
      setVisibleCities(cities.filter(city => allCityIds.has(city.id)));
      return;
    }

    // For organizers, only show their assigned cities
    if (currentUser?.role === 'organizator') {
      setVisibleCities(cities.filter(city => 
        currentUser.assignedCityIds.includes(city.id)
      ));
    }
  }, [selectedUserId, cities, users, currentUser]);

  const getSeasonDateRange = (season: string): { start: Date; end: Date } => {
    const [startYear, endYear] = season.split('/').map(Number);
    return {
      start: new Date(startYear, 8, 1), // September 1st
      end: new Date(endYear, 5, 30) // June 30th
    };
  };

  const isDateInSeason = (date: Date, seasonRange: { start: Date; end: Date }): boolean => {
    return date >= seasonRange.start && date <= seasonRange.end;
  };

  useEffect(() => {
    if (!mapRef.current || !currentUser) return;

    // Initialize map first
    const map = initializeMap(mapRef.current);

    // Clear existing markers
    clearMarkers();

    // If no visible cities, just center the map on Poland
    if (!visibleCities.length) {
      map.setCenter(POLAND_CENTER);
      map.setZoom(6);
      return;
    }

    const seasonRange = getSeasonDateRange(selectedSeason);

    // Get all events for the selected season
    const allEvents = calendars
      .filter(calendar => selectedCalendarIds.length === 0 || selectedCalendarIds.includes(calendar.id))
      .flatMap(calendar => 
      calendar.events.filter(event => 
        event.city?.id && 
        relevantStatuses.includes(event.status) &&
        isDateInSeason(event.date, seasonRange)
      ).map(event => ({
        ...event,
        calendarName: calendar.name
      }))
    );

    // Create markers for each city
    visibleCities.forEach(city => {
      // Skip cities without coordinates
      if (typeof city.latitude !== 'number' || typeof city.longitude !== 'number') {
        console.warn(`City ${city.name} is missing coordinates`);
        return;
      }

      const cityEvents = allEvents.filter(event => event.city?.id === city.id) || [];
      
      // Skip cities based on filters
      if ((hideEmptyCities && cityEvents.length === 0) || 
          (hideCitiesWithEvents && cityEvents.length > 0) || 
          !city.latitude || 
          !city.longitude) {
        return;
      }

      // Determine pin color based on event statuses
      let pinColor: 'red' | 'green' | 'blue' = 'red';
      
      // If there's at least one 'w_trakcie' event, use blue pin
      if (cityEvents.some(event => event.status === 'w_trakcie')) {
        pinColor = 'blue';
      }
      // Otherwise, if all events are 'zrobiony', use green pin
      else if (cityEvents.length > 0 && cityEvents.every(event => event.status === 'zrobiony')) {
        pinColor = 'green';
      }

      // Create tooltip content
      let tooltipContent = `
        <div class="p-2 max-w-[15rem]">
          <div class="font-bold text-sm mb-2 text-gray-900 border-b-2 border-red-500 pb-2">
            ${city.name} 
            <div class="text-xs font-normal text-gray-600 mt-1">
              ${city.voivodeship}
            </div>
            <div class="text-xs font-medium text-gray-700 mt-1">
              Przypisani użytkownicy:
              ${users
                .filter(user => user.assignedCityIds.includes(city.id))
                .map(user => `<span class="text-red-700">${user.name}</span>`)
                .join(', ')}
            </div>
          </div>
      `;

      if (cityEvents.length > 0) {
        tooltipContent += `
          <div class="max-h-[300px] overflow-y-auto pr-1.5 mt-2">
            ${(selectedCalendarIds.length > 0 
                ? cityEvents.filter(event => selectedCalendarIds.includes(event.calendarId))
                : cityEvents)
              .sort((a, b) => a.date.getTime() - b.date.getTime())
              .map(event => {
                const user = users.find(u => u.id === event.userId);
                return `
                  <div class="mb-2 p-2 bg-gray-50 rounded-md">
                    <div class="flex items-center gap-1.5">
                      <span class="w-3 h-3 rounded-full bg-${
                        event.status === 'zrobiony' ? 'green' :
                        event.status === 'w_trakcie' ? 'blue' :
                        'red'
                      }-500"></span>
                      <span class="font-semibold text-gray-900 text-xs">${formatDate(event.date)}</span>
                    </div>
                    <div class="ml-4.5 mt-1">
                      <span class="text-xs font-medium text-gray-800">
                        ${user?.name || ''}
                      </span>
                    </div>
                    <div class="text-xs text-gray-600 ml-4.5 mt-1">
                      ${event.calendarName}
                    </div>
                    <div class="text-[10px] text-gray-500 ml-4.5 mt-0.5">
                      ${EVENT_STATUSES[event.status].label}
                    </div>
                  </div>
                `;
              }).join('')}
          </div>
        `;
      }

      tooltipContent += '</div>';

      // Create marker with custom icon
      addMarker(
        [city.longitude, city.latitude],
        pinColor,
        tooltipContent
      );
    });

    // Fit map to markers
    fitMapToBounds(50);

  }, [
    calendars,
    cities,
    selectedSeason,
    visibleCities,
    selectedUserId,
    selectedCalendarIds,
    hideEmptyCities,
    hideCitiesWithEvents,
    users,
    currentUser
  ]);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl flex flex-col h-[90vh] overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-red-900 to-red-800 text-white">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">Mapa wydarzeń</h2>
              <p className="text-sm text-white/80 mt-1">
                {selectedUserId ? (
                  `Wyświetlane miasta: ${visibleCities.length}`
                ) : (
                  `Wszystkie przypisane miasta: ${visibleCities.length}`
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-white/10 rounded-lg transition-colors text-white text-2xl"
            >
              ×
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full">
              <div className="flex items-center gap-6">
                <SeasonSelector
                  selectedSeason={selectedSeason}
                  onSeasonChange={setSelectedSeason}
                />
                <MapFilters
                  users={users}
                  calendars={calendars}
                  selectedUserId={selectedUserId}
                  selectedCalendarIds={selectedCalendarIds}
                  onUserChange={setSelectedUserId}
                  onCalendarChange={setSelectedCalendarIds}
                />
              </div>
              <div className="flex flex-col gap-2 ml-auto">
                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hideEmptyCities}
                      onChange={(e) => setHideEmptyCities(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                  <span className="text-xs text-white font-medium whitespace-nowrap">Ukryj miasta bez wydarzeń</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hideCitiesWithEvents}
                      onChange={(e) => setHideCitiesWithEvents(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                  <span className="text-xs text-white font-medium whitespace-nowrap">Ukryj miasta z wydarzeniami</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 p-4 min-h-0">
          <div 
            ref={mapRef} 
            className="map-container rounded-xl overflow-hidden"
          />
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          {currentUser?.role === 'administrator' && !selectedUserId ? (
            <div className="text-center text-gray-600 text-sm">
              Wybierz użytkownika, aby zobaczyć przypisane miasta
            </div>
          ) : (
            <div className="flex flex-wrap gap-3 justify-center">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 transform rotate-45 bg-red-500" />
                <span className="text-sm text-gray-700">Miasto bez wydarzeń</span>
              </div>
              {relevantStatuses.map(status => (
                <div key={status} className="flex items-center space-x-2">
                  <span className={`w-3 h-3 transform rotate-45 ${
                    status === 'zrobiony' ? 'bg-green-500' :
                    status === 'w_trakcie' ? 'bg-blue-500' :
                    'bg-red-500'
                  }`} />
                  <span className="text-sm text-gray-700">{EVENT_STATUSES[status].label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapView;