import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Building2, MapPin, Trash2, Pencil, LayoutGrid } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { City } from '../../types';
import AddHallModal from './AddHallModal';
import EditHallModal from './EditHallModal';
import SimpleConfirmationModal from '../common/SimpleConfirmationModal';

interface Hall {
  id: string;
  city_id: string;
  name: string;
  address: string;
  active: boolean;
  created_at: string;
  hall_layouts?: { id: string; total_seats: number }[];
}

interface HallWithCity extends Hall {
  city: City;
}

const Halls: React.FC = () => {
  const navigate = useNavigate();
  const [halls, setHalls] = useState<Hall[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedHall, setSelectedHall] = useState<Hall | null>(null);
  const [filters, setFilters] = useState({
    active: true,
    city: '',
    minCapacity: '',
    maxCapacity: ''
  });
  const [hallToDelete, setHallToDelete] = useState<Hall | null>(null);

  useEffect(() => {
    const loadHalls = async () => {
      try {
        const [
         { data: hallsData, error: hallsError },
          { data: citiesData, error: citiesError }
        ] = await Promise.all([
          supabase
            .from('halls')
           .select(`
             id,
             name,
             address,
             city_id,
             active,
             created_at,
             hall_layouts (
               id,
               total_seats
             )
           `)
            .order('name'),
          supabase
            .from('cities')
            .select('*')
            .order('name')
        ]);

        if (hallsError) throw hallsError;
        if (citiesError) throw citiesError;

        setHalls(hallsData || []);
        setCities(citiesData || []);
      } catch (error) {
        console.error('Failed to load halls:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHalls();
  }, []);

  const hallsWithCities: HallWithCity[] = halls.map(hall => ({
    ...hall,
    city: cities.find(city => city.id === hall.city_id)!
  }));

  const filteredHalls = hallsWithCities.filter(hall => {
    const matchesSearch = !searchTerm || 
      hall.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hall.city?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hall.city?.voivodeship.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesActive = !filters.active || hall.active;
    const matchesCity = !filters.city || hall.city?.name === filters.city;
    const matchesCapacity = (!filters.minCapacity || hall.capacity >= parseInt(filters.minCapacity)) &&
                          (!filters.maxCapacity || hall.capacity <= parseInt(filters.maxCapacity));

    return matchesSearch && matchesActive && matchesCity && matchesCapacity;
  });

  const uniqueCities = [...new Set(cities.map(city => city.name))].sort();

  const handleAddHall = async (hallData: { name: string; city_id: string; address: string; capacity: number }) => {
    try {
      const { data, error } = await supabase
        .from('halls')
        .insert([{
          name: hallData.name,
          city_id: hallData.city_id,
          address: hallData.address,
          active: true
        }])
        .select()
        .single();

      if (error) throw error;
      setHalls([...halls, data]);
      setShowAddModal(false);
      toast.success('Hall added successfully');
    } catch (error) {
      console.error('Failed to add hall:', error);
      toast.error('Failed to add hall');
      throw error;
    }
  };

  const handleEditHall = async (hallId: string, updates: { name: string; address: string }) => {
    try {
      const { error } = await supabase
        .from('halls')
        .update({
          name: updates.name,
          address: updates.address
        })
        .eq('id', hallId);

      if (error) throw error;

      setHalls(halls.map(hall => 
        hall.id === hallId 
          ? { ...hall, ...updates }
          : hall
      ));
      setSelectedHall(null);
      setShowEditModal(false);
      toast.success('Hall updated successfully');
    } catch (error) {
      console.error('Failed to update hall:', error);
    }
  };

  const handleDeleteHall = async (hall: Hall) => {
    try {
      const { error } = await supabase
        .from('halls')
        .delete()
        .eq('id', hall.id);

      if (error) throw error;
      setHalls(halls.filter(h => h.id !== hall.id));
      setHallToDelete(null);
      toast.success('Hall deleted successfully');
    } catch (error) {
      console.error('Failed to delete hall:', error);
      toast.error('Failed to delete hall');
    }
  };

  return (
    <div className="w-full max-w-6xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <h2 className="text-2xl font-bold text-gray-900">Sale</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Dodaj salę</span>
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
                placeholder="Szukaj sal..."
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
                    Status
                  </label>
                  <select
                    value={filters.active ? 'active' : 'all'}
                    onChange={(e) => setFilters({ ...filters, active: e.target.value === 'active' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="all">Wszystkie sale</option>
                    <option value="active">Tylko aktywne</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Miasto
                  </label>
                  <select
                    value={filters.city}
                    onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Wszystkie miasta</option>
                    {uniqueCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min. pojemność
                  </label>
                  <input
                    type="number"
                    value={filters.minCapacity}
                    onChange={(e) => setFilters({ ...filters, minCapacity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Minimalna pojemność"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max. pojemność
                  </label>
                  <input
                    type="number"
                    value={filters.maxCapacity}
                    onChange={(e) => setFilters({ ...filters, maxCapacity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Maksymalna pojemność"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center text-gray-500">
              Ładowanie sal...
            </div>
          ) : filteredHalls.length === 0 ? (
            <div className="text-center text-gray-500">
              Brak sal do wyświetlenia
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHalls.map(hall => {
                const seatCount = Array.isArray(hall.hall_layouts)
                  ? Math.max(...hall.hall_layouts.map(l => l.total_seats || 0))
                  : hall.hall_layouts?.total_seats || 0;

                return (
                  <div
                    key={hall.id}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-red-200 transition-all hover:shadow-md py-2 px-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-gray-900">
                          {hall.city?.name}
                        </span>
                        <span className="text-gray-400 mx-1">/</span>
                        <span className="text-sm text-gray-700">
                          {hall.name} <span className="text-xs text-gray-500">({seatCount} miejsc)</span>
                        </span>
                        <span className={`ml-2 px-2 py-0.5 text-[10px] rounded-full ${
                          hall.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {hall.active ? 'Aktywna' : 'Nieaktywna'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{hall.address}</span>
                        <button
                          onClick={() => navigate(`/events/halls/${hall.id}/layout`)}
                          className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-lg transition-colors flex items-center gap-1"
                          title="Plan sali"
                        >
                          <LayoutGrid className="w-3 h-3" />
                          <span>Plan sali</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedHall(hall);
                            setShowEditModal(true);
                          }}
                          className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edytuj</span>
                        </button>
                        <button
                          onClick={() => setHallToDelete(hall)}
                          className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 hover:bg-red-200 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Usuń</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AddHallModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        cities={cities}
        onAdd={handleAddHall}
      />

      {selectedHall && (
        <EditHallModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedHall(null);
          }}
          onSave={(updates) => handleEditHall(selectedHall.id, updates)}
          initialData={{
            name: selectedHall.name,
            address: selectedHall.address
          }}
        />
      )}

      {hallToDelete && (
        <SimpleConfirmationModal
          isOpen={true}
          onClose={() => setHallToDelete(null)}
          onConfirm={() => handleDeleteHall(hallToDelete)}
          title="Usuń salę"
          message={`Czy na pewno chcesz usunąć salę "${hallToDelete.name}"? Ta operacja jest nieodwracalna.`}
        />
      )}
    </div>
  );
};

export default Halls;
