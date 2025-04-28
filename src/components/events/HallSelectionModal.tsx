import React, { useState, useEffect } from 'react';
import { X, Search, MapPin, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { sanitizeLayoutBlocks, sanitizeSectionData } from '../../utils/hall_layout_utils';

interface HallSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  currentCityId?: string;
  onHallSelected: () => void;
}

interface City {
  id: string;
  name: string;
  voivodeship: string;
}

interface Hall {
  id: string;
  name: string;
  address: string;
  city_id: string;
  city: {
    name: string;
    voivodeship: string;
  };
  has_layout: boolean;
}

const HallSelectionModal: React.FC<HallSelectionModalProps> = ({
  isOpen,
  onClose,
  eventId,
  currentCityId,
  onHallSelected
}) => {
  const [cities, setCities] = useState<City[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<string>(currentCityId || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCities = async () => {
      try {
        const { data, error } = await supabase
          .from('cities')
          .select('id, name, voivodeship')
          .order('name');

        if (error) throw error;
        setCities(data || []);
      } catch (err) {
        console.error('Error loading cities:', err);
        setError('Failed to load cities');
      }
    };

    if (isOpen) {
      loadCities();
      if (selectedCityId) {
        loadHalls(selectedCityId);
      } else {
        setLoading(false);
      }
    }
  }, [isOpen, selectedCityId]);

  const loadHalls = async (cityId: string) => {
    setLoading(true);
    try {
      const { data: hallsData, error: hallsError } = await supabase
        .from('halls')
        .select(`
          id, 
          name, 
          address, 
          city_id,
          cities (
            name,
            voivodeship
          ),
          hall_layouts (
            id,
            total_seats
          )
        `)
        .eq('city_id', cityId)
        .order('name');

      if (hallsError) throw hallsError;

      const hallsWithLayoutInfo = (hallsData || []).map(hall => ({
        ...hall,
        has_layout: !!hall.hall_layouts
      }));

      setHalls(hallsWithLayoutInfo);
    } catch (err) {
      console.error('Error loading halls:', err);
      setError('Failed to load halls');
    } finally {
      setLoading(false);
    }
  };

  const handleCityChange = (cityId: string) => {
    setSelectedCityId(cityId);
    setSearchTerm('');
  };

  const handleHallSelect = async (hall: Hall) => {
    try {
      setLoading(true);
      
      try {
        // First check if there's a hall layout for this hall
        const { data: hallLayout, error: layoutError } = await supabase
          .from('hall_layouts')
          .select('id, layout_data, total_seats')
          .eq('hall_id', hall.id)
          .maybeSingle();

        if (layoutError) {
          console.error('Error checking hall layout:', layoutError);
          // Continue even if there's an error - we'll use a default layout
        }

        // Get current event data
        const { data: eventData, error: eventError } = await supabase
          .from('calendar_events')
          .select(`
            layout_blocks,
            city_id,
            id
          `)
          .eq('id', eventId)
          .single();

        if (eventError) {
          console.error('Error getting event data:', eventError);
          throw new Error(`Failed to get event data: ${eventError.message}`);
        }

        // Initialize layout_blocks with a safe default structure
        let layoutBlocks = eventData?.layout_blocks && Array.isArray(eventData.layout_blocks) 
          ? [...eventData.layout_blocks] 
          : [];

        // Create a default layout structure when no existing layout is found
        const createSimpleLayoutData = () => ({
          sections: {
            'main': {
              name: 'PARTER',
              rows: 1,
              rowSeats: [1],
              removedSeats: {},
              emptyRows: [],
              orientation: 'horizontal',
              numbering_style: 'arabic',
              numbering_direction: 'ltr',
              alignment: 'center',
              position: 'center'
            }
          },
          assignments: {},
          schools: []
        });

        // Get hall layout data or create a default one
        const hallLayoutData = hallLayout?.layout_data || createSimpleLayoutData();

        // Ensure hallLayoutData is properly structured
        const sanitizedHallLayoutData = hallLayoutData ? {
          ...hallLayoutData,
          sections: Object.entries(hallLayoutData.sections || {}).reduce((acc, [key, section]) => ({
            ...acc,
            [key]: sanitizeSectionData(section)
          }), {})
        } : {};

        // Find or create the seat_assignments block
        const seatAssignmentsIndex = layoutBlocks.findIndex(block => block && block.type === 'seat_assignments');
        
        if (seatAssignmentsIndex >= 0) {
          // Update existing block with sanitized layout data
          layoutBlocks[seatAssignmentsIndex] = {
            type: 'seat_assignments',
            sections: sanitizedHallLayoutData.sections || {},
            assignments: layoutBlocks[seatAssignmentsIndex].assignments || {},
            schools: layoutBlocks[seatAssignmentsIndex].schools || []
          };
        } else {
          // Create new seat_assignments block with default values
          layoutBlocks.push({
            type: 'seat_assignments',
            sections: sanitizedHallLayoutData.sections || {},
            assignments: {},
            schools: []
          });
        }

        // Sanitize the entire layout_blocks array
        const sanitizedLayoutBlocks = sanitizeLayoutBlocks(layoutBlocks);

        // First update only the hall_id field
        const { error: updateError } = await supabase
          .from('calendar_events')
          .update({ hall_id: hall.id })
          .eq('id', eventId);

        if (updateError) {
          console.error('Error updating event:', updateError);
          throw new Error('Failed to update event hall ID');
        }
        
        // Then update the layout_blocks in a separate query
        const { error: layoutUpdateError } = await supabase
          .from('calendar_events')
          .update({ layout_blocks: sanitizedLayoutBlocks })
          .eq('id', eventId);
          
        if (layoutUpdateError) {
          console.error('Error updating event layout:', layoutUpdateError);
          throw new Error('Failed to update event layout');
        }

      } catch (error) {
        console.error('Error assigning hall:', error);
        throw error;
      }

      toast.success(`Sala "${hall.name}" została przypisana do wydarzenia`);
      onHallSelected();
      onClose();
    } catch (err) {
      console.error('Error assigning hall:', err);
      
      if (err instanceof Error && err.message.includes('JWT')) {
        toast.error('Sesja wygasła. Proszę zalogować się ponownie.');
      } else {
        toast.error('Nie udało się przypisać sali do wydarzenia');
      }
    }
  };

  const filteredHalls = halls.filter(hall => 
    hall.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hall.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-3xl mx-4">
        <div className="modal-header">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Wybierz salę dla wydarzenia</h2>
            <button
              onClick={onClose}
              className="btn-modal-close absolute top-4 right-4"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-white mb-1">
                Miasto
              </label>
              <select
                value={selectedCityId}
                onChange={(e) => handleCityChange(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-gray-900 focus:ring-2 focus:ring-white/30 focus:border-transparent"
              >
                <option value="">Wybierz miasto</option>
                {cities.map(city => (
                  <option key={city.id} value={city.id}>
                    {city.name} ({city.voivodeship})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-white mb-1">
                Szukaj sali
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Wyszukaj po nazwie lub adresie"
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/30 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-white/30 focus:border-transparent"
                  disabled={!selectedCityId}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-900"></div>
              <p className="mt-2 text-gray-600">Ładowanie sal...</p>
            </div>
          ) : selectedCityId ? (
            filteredHalls.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredHalls.map(hall => (
                  <div
                    key={hall.id}
                    className={`p-4 rounded-lg border ${hall.has_layout ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'} hover:shadow-md transition-all cursor-pointer`}
                    onClick={() => handleHallSelect(hall)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${hall.has_layout ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{hall.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{hall.address || 'Brak adresu'}</p>
                        <div className="flex items-center mt-2 space-x-2">
                          <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-xs text-gray-500">
                            {hall.city?.name ? `${hall.city.name}, ${hall.city.voivodeship}` : 'Brak danych o mieście'}
                          </span>
                        </div>
                        {hall.hall_layouts && hall.hall_layouts.length > 0 && (
                          <div className="mt-2 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded inline-flex items-center">Sala dostępna</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Brak sal w wybranym mieście</p>
                <p className="text-sm text-gray-400 mt-2">Dodaj sale w sekcji "Sale" lub wybierz inne miasto</p>
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Wybierz miasto, aby zobaczyć dostępne sale</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="btn-modal-secondary"
            >
              Anuluj
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HallSelectionModal;