import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { useUserCityHandlers } from '../../hooks/useUserCityHandlers';
import TransferRequestsList from '../notifications/TransferRequestsList';
import Header from '../layout/Header';
import CalendarCarousel from './CalendarCarousel';
import CalendarLegend from './CalendarLegend';
import AddCalendarModal from './AddCalendarModal';
import EditCalendarModal from './EditCalendarModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import UserManagementModal from '../users/UserManagementModal';
import CityManagementModal from '../cities/CityManagementModal';
import NotificationManager from '../notifications/NotificationManager';
import { translations } from '../../utils/translations';
import { useTransferNotifications } from '../../hooks/useTransferNotifications';
import { Calendar, CalendarEvent, User, City } from '../../types';
import { createCalendar, getCalendars, updateCalendar, deleteCalendar, updateCalendarEvent } from '../../services/calendar';
import { getUsers } from '../../services/auth';
import { getUserCities, updateCity } from '../../services/cities';

const CalendarApp: React.FC = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const permissions = usePermissions(currentUser);
  const { 
    pendingTransfers,
    showNotification,
    currentTransfer,
    setShowNotification,
    notificationCount,
    handleAcceptTransfer,
    handleRejectTransfer,
    refreshTransfers
  } = useTransferNotifications(currentUser);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [showTransfersList, setShowTransfersList] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState<Calendar | null>(null);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  const loadUsers = async () => {
    try {
      const loadedUsers = await getUsers();
      setUsers(loadedUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadCities = async () => {
    try {
      if (!currentUser) return;
      const loadedCities = await getUserCities(currentUser.id);
      if (!loadedCities) {
        console.warn('No cities returned');
        return;
      }
      setCities(loadedCities);
    } catch (error) {
      console.error('Failed to load cities:', error);
      // Set empty array to prevent undefined errors
      setCities([]);
    }
  };

  const loadCalendars = async () => {
    try {
      const loadedCalendars = await getCalendars();
      if (!loadedCalendars) {
        console.warn('No calendars returned');
        return;
      }
      setCalendars(loadedCalendars);
    } catch (error) {
      console.error('Failed to load calendars:', error);
      // Set empty array to prevent undefined errors
      setCalendars([]);
    }
  };

  const { handleUpdateUser, handleAddCity, handleDeleteCity } = useUserCityHandlers(
    currentUser,
    setUsers,
    setCities,
    loadUsers,
    loadCities
  );

  useEffect(() => {
    if (currentUser) {
      loadCalendars();
      loadUsers();
      loadCities();
      
      // Add listener for calendar refresh events
      const handleRefresh = () => {
        loadCalendars();
      };
      window.addEventListener('refreshCalendars', handleRefresh);
      
      return () => {
        window.removeEventListener('refreshCalendars', handleRefresh);
      };
    }
  }, [currentUser]);

  const handleAddCalendar = async (name: string) => {
    if (currentUser) {
      try {
        const newCalendar = await createCalendar(name, currentUser.id);
        setCalendars([...calendars, newCalendar]);
      } catch (error) {
        console.error('Failed to create calendar:', error);
      }
    }
  };

  const handleEditCalendar = async (name: string) => {
    if (selectedCalendar) {
      try {
        const updatedCalendar = await updateCalendar(selectedCalendar.id, name);
        setCalendars(calendars.map(cal => 
          cal.id === selectedCalendar.id ? { ...cal, name: updatedCalendar.name } : cal
        ));
        setSelectedCalendar(null);
        setIsEditModalOpen(false);
      } catch (error) {
        console.error('Failed to update calendar:', error);
      }
    }
  };

  const handleDeleteCalendar = async () => {
    if (selectedCalendar) {
      try {
        await deleteCalendar(selectedCalendar.id);
        setCalendars(calendars.filter(cal => cal.id !== selectedCalendar.id));
        setSelectedCalendar(null);
        setIsDeleteModalOpen(false);
      } catch (error) {
        console.error('Failed to delete calendar:', error);
      }
    }
  };

  const handleUpdateEvent = async (calendarId: string, dates: Date[], eventData: Partial<CalendarEvent>) => {
    try {
      await updateCalendarEvent(calendarId, dates, eventData);
      await loadCalendars();
    } catch (error) {
      console.error('Failed to update event:', error);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onAddCalendarClick={() => permissions.canManageCalendars && setIsAddModalOpen(true)}
        onShowTransfers={() => setShowTransfersList(true)}
        pendingTransfersCount={notificationCount}
        onUserClick={() => setIsUserModalOpen(true)}
        onCityClick={() => setIsCityModalOpen(true)}
        currentDate={currentDate}
        calendars={calendars}
        cities={cities}
        onMonthChange={setCurrentDate}
        userRole={currentUser?.role}
        onLogout={handleLogout}
      />

      <NotificationManager
        pendingTransfers={pendingTransfers}
        currentTransfer={currentTransfer}
        users={users}
        currentUser={currentUser}
        showNotification={showNotification}
        onClose={() => setShowNotification(false)}
        onViewTransfers={() => {
          setShowTransfersList(true);
          setShowNotification(false);
        }}
        onAccept={handleAcceptTransfer}
        onReject={handleRejectTransfer}
      />
      
      <TransferRequestsList
        isOpen={showTransfersList}
        onClose={() => setShowTransfersList(false)}
        onAccept={handleAcceptTransfer}
        onReject={handleRejectTransfer}
        pendingTransfers={pendingTransfers}
        users={users}
      />
      <main className="container-layout">
        {calendars.length > 0 ? (
          <>
            <CalendarCarousel
              calendars={calendars}
              currentDate={currentDate}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onEditCalendar={(calendar) => {
                setSelectedCalendar(calendar);
                setIsEditModalOpen(true);
              }}
              onDeleteCalendar={(calendar) => {
                setSelectedCalendar(calendar);
                setIsDeleteModalOpen(true);
              }}
              onUpdateEvent={handleUpdateEvent}
              users={users}
              cities={cities}
            />
            <CalendarLegend />
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">
              {translations.pl.messages.clickToAdd}
            </p>
          </div>
        )}
      </main>

      <AddCalendarModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddCalendar}
      />

      {selectedCalendar && (
        <>
          <EditCalendarModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedCalendar(null);
            }}
            onEdit={handleEditCalendar}
            currentName={selectedCalendar.name}
          />

          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedCalendar(null);
            }}
            onConfirm={handleDeleteCalendar}
            calendarName={selectedCalendar.name}
          />
        </>
      )}

      <UserManagementModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        users={users}
        cities={cities}
        onAddUser={(user) => {
          setUsers([...users, { ...user, id: Date.now().toString(), createdAt: new Date() }]);
        }}
        onUpdateUser={handleUpdateUser}
      />

      <CityManagementModal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        cities={cities}
        users={users}
        onAddCity={handleAddCity}
        onDeleteCity={handleDeleteCity}
        onUpdateCity={async (cityId: string, updatedCity: City) => {
          try {
            await updateCity(cityId, updatedCity);
            await loadCities();
          } catch (error) {
            console.error('Failed to update city:', error);
          }
        }}
      />
    </div>
  );
};

export default CalendarApp;