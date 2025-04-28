import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Building2, MapPin, Phone, Mail, User, X, Edit2, Check, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../utils/dateUtils';
import { ChevronDown } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  nip: string;
  phone: string;
  email: string;
  contact_person: string;
  notes: string;
  active: boolean;
  created_at: string;
  last_agreement_date?: string;
  total_agreements?: number;
  agreement_id?: string; // Added to store the latest agreement ID
}

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const [editedPhone, setEditedPhone] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [filters, setFilters] = useState({
    active: true,
    city: '',
  });

  useEffect(() => {
    const loadClients = async () => {
      try {
        // First get all agreements to extract unique schools
        const { data: agreements, error: agreementsError } = await supabase
          .from('agreements')
          .select('*')
          .order('created_at', { ascending: false });

        if (agreementsError) throw agreementsError;

        // Process agreements to create unique clients
        const clientsMap = new Map<string, Client>();
        
        agreements?.forEach(agreement => {
          const key = `${agreement.school_name}-${agreement.school_address}`;
          
          if (!clientsMap.has(key)) {
            // Create new client
            clientsMap.set(key, {
              id: key, // Using composite key as ID
              name: agreement.school_name,
              address: agreement.school_address,
              city: agreement.hall_city_name,
              postal_code: agreement.school_address.match(/\d{2}-\d{3}/)?.[ 0] || '',
              nip: '',
              phone: agreement.teacher_phone,
              email: agreement.teacher_email,
              contact_person: agreement.teacher_name,
              notes: '',
              active: true,
              created_at: agreement.created_at,
              last_agreement_date: agreement.agreement_date,
              total_agreements: 1,
              agreement_id: agreement.id // Store the agreement ID
            });
          } else {
            // Update existing client
            const client = clientsMap.get(key)!;
            client.total_agreements = (client.total_agreements || 0) + 1;
            
            // Update last agreement date if newer
            if (!client.last_agreement_date || 
                new Date(agreement.agreement_date) > new Date(client.last_agreement_date)) {
              client.last_agreement_date = agreement.agreement_date;
              client.agreement_id = agreement.id; // Update to latest agreement ID
            }
          }
        });

        setClients(Array.from(clientsMap.values()));
      } catch (error) {
        console.error('Failed to load clients:', error);
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  const filteredClients = clients.filter(client => {
    const matchesSearch = !searchTerm || 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.nip.includes(searchTerm);

    const matchesActive = !filters.active || client.active;
    const matchesCity = !filters.city || client.city === filters.city;

    return matchesSearch && matchesActive && matchesCity;
  });

  const uniqueCities = [...new Set(clients.map(client => client.city))].sort();

  const handleEditClient = (client: Client) => {
    setEditingClient(client.id);
    setEditedPhone(client.phone || '');
    setEditedEmail(client.email || '');
  };

  const handleSaveClientChanges = async (clientId: string) => {
    try {
      const client = clients.find(c => c.id === clientId);
      if (!client?.agreement_id) {
        throw new Error('No agreement ID found for client');
      }

      const { error } = await supabase
        .from('agreements')
        .update({
          teacher_phone: editedPhone,
          teacher_email: editedEmail
        })
        .eq('id', client.agreement_id);

      if (error) throw error;

      // Update local state
      setClients(clients.map(client => 
        client.id === clientId 
          ? { ...client, phone: editedPhone, email: editedEmail } 
          : client
      ));

      setEditingClient(null);
    } catch (error) {
      console.error('Failed to update client:', error);
      alert('Nie udało się zaktualizować danych klienta');
    }
  };

  const handleCancelEdit = () => {
    setEditingClient(null);
  };

  return (
    <div className="w-full max-w-6xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <h2 className="text-2xl font-bold text-gray-900">Klienci</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              try {
                const { data, error } = await supabase
                  .from('agreements')
                  .insert([{
                    school_name: 'Nowa szkoła',
                    school_address: '',
                    hall_city_name: '',
                    teacher_name: '',
                    teacher_phone: '',
                    teacher_email: '',
                    agreement_date: new Date().toISOString().split('T')[0],
                    season: new Date().getFullYear().toString()
                  }])
                  .select()
                  .single();
  
                if (error) throw error;

                const newClient: Client = {
                  id: `${data.school_name}-${data.school_address}`,
                  name: data.school_name,
                  address: data.school_address,
                  city: data.hall_city_name,
                  postal_code: '',
                  nip: '',
                  phone: data.teacher_phone,
                  email: data.teacher_email,
                  contact_person: data.teacher_name,
                  notes: '',
                  active: true,
                  created_at: data.created_at,
                  last_agreement_date: data.agreement_date,
                  total_agreements: 1,
                  agreement_id: data.id
                };

                setClients([newClient, ...clients]);
              } catch (error) {
                console.error('Failed to add client:', error);
              }
            }}
            className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Dodaj klienta</span>
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
                placeholder="Szukaj klientów..."
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.active ? 'active' : 'all'}
                    onChange={(e) => setFilters({ ...filters, active: e.target.value === 'active' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="all">Wszyscy klienci</option>
                    <option value="active">Tylko aktywni</option>
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
              </div>
            </div>
          )}
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center text-gray-500">
              Ładowanie klientów...
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center text-gray-500">
              Brak klientów do wyświetlenia
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClients.map(client => (
                <div
                  key={client.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-red-200 transition-all hover:shadow-md"
                >
                  <div 
                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      const expandedId = expandedClient === client.id ? null : client.id;
                      setExpandedClient(expandedId);
                    }}
                  >
                    <div className="flex items-center min-w-0">
                      <Building2 className="w-5 h-5 text-red-600 flex-shrink-0 mr-3" />
                      <div className="truncate">
                        <h3 className="text-base font-medium text-gray-900 truncate">
                          {client.name}
                          {client.total_agreements && (
                            <span className="ml-2 text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded-full">
                              {client.total_agreements} umów
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">
                          {client.city}, {client.postal_code}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        client.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {client.active ? 'Aktywny' : 'Nieaktywny'}
                      </span>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedClient === client.id ? 'transform rotate-180' : ''
                      }`} />
                    </div>
                  </div>
                  
                  {/* Expandable content */}
                  <div className={`overflow-hidden transition-all duration-300 ${
                    expandedClient === client.id ? 'max-h-[500px]' : 'max-h-0'
                  }`}>
                    <div className="p-4 border-t border-gray-100 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <div className="text-sm">
                            <p className="text-gray-900">{client.address}</p>
                            <p className="text-gray-600">{client.postal_code} {client.city}</p>
                          </div>
                        </div>

                        {client.contact_person && (
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{client.contact_person}</span>
                          </div>
                        )}

                        {client.phone && (
                          editingClient === client.id ? (
                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <input
                                type="tel"
                                value={editedPhone}
                                onChange={(e) => setEditedPhone(e.target.value)}
                                className="text-sm text-gray-900 border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                placeholder="Numer telefonu"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-900">{client.phone}</span>
                            </div>
                          )
                        )}

                        {client.email && (
                          editingClient === client.id ? (
                            <div className="flex items-center space-x-2">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <input
                                type="email"
                                value={editedEmail}
                                onChange={(e) => setEditedEmail(e.target.value)}
                                className="text-sm text-gray-900 border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                placeholder="Adres email"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-900">{client.email}</span>
                            </div>
                          )
                        )}
                      </div>
                      
                      <div className="mt-4 flex justify-end">
                        {editingClient === client.id ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              Anuluj
                            </button>
                            <button
                              onClick={() => handleSaveClientChanges(client.id)}
                              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
                            >
                              <Save className="w-4 h-4" />
                              <span>Zapisz zmiany</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditClient(client)}
                            className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center space-x-1"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span>Edytuj dane kontaktowe</span>
                          </button>
                        )}
                      </div>
                      
                      {client.last_agreement_date && (
                        <div className="mt-3 text-sm text-gray-600">
                          <span className="font-medium">Ostatnia umowa:</span> {formatDate(new Date(client.last_agreement_date))}
                        </div>
                      )}

                      {client.notes && (
                        <div className="mt-3 text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">
                          <span className="font-medium">Uwagi:</span> {client.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Clients;