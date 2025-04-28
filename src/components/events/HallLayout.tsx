import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, MapPin, Save, Plus, Minus, Check, Settings, Edit2, ListOrdered, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useHallLayout } from '../../hooks/useHallLayout';
import SectionOverviewModal from './SectionOverviewModal';
import HallLayoutGrid from './HallLayoutGrid';
import SectionNameEditModal from './SectionNameEditModal';
import PrintPreview from './PrintPreview';
import LayoutConfigDrawer from './LayoutConfigDrawer';
import RowSeatsModal from './RowSeatsModal';
import { SectionType } from '../../utils/hallLayoutUtils';

const HallLayout: React.FC = () => {
  const navigate = useNavigate();
  const { id: hallId } = useParams<{ id: string }>();
  const {
    // State
    loading,
    error,
    hallName,
    hallCity,
    hallAddress,
    drawerOpen,
    expandedSections,
    sections,
    sectionNumberingStyles,
    saving,
    selectedSection,
    showSectionConfig,
    rowLabels,
    totalSeats,
    showSectionNameModal,
    sectionToEdit,
    emptyRows,
    showPrintPreview,
    skipRemovedSeatsVisual,
    autoRenumberSeats,
    removedSeats,
    rowSeatsPerRow,
    showRowSeatsModal,
    selectedRow,
    numberingDirections,
    sectionNames,
    rowAlignments,
    sectionAlignments,
    
    // Actions
    setHallName,
    setHallCity,
    setHallAddress,
    setDrawerOpen,
    setExpandedSections,
    setShowSectionConfig,
    setShowPrintPreview,
    setSkipRemovedSeatsVisual,
    setAutoRenumberSeats,
    setSectionAlignments,
    setShowSectionNameModal,
    setShowRowSeatsModal,
    setSectionToEdit,
    
    // Operations
    resetLayout,
    handleSave,
    handleSelectSection,
    toggleSection,
    updateSectionConfig,
    updateSectionNumberingStyle,
    handleSectionNameChange,
    openSectionNameModal,
    handleRenumberSeats,
    handleRenumberRows,
    handleRemoveSeat,
    handleAddEmptyRow,
    handleUpdateRowSeats,
    openRowSeatsModal,
    handleEditRowLabel,
    toggleNumberingDirection,
  } = useHallLayout({ hallId });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-gray-400 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-600 mb-4 text-xl">Błąd: {error}</div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Powrót
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/events/halls')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-medium text-gray-900">
              Plan sali: {hallName}
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center text-sm text-gray-600">
              <Building2 className="w-4 h-4 mr-1.5" />
              <span>{hallCity}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-1.5" />
              <span>{hallAddress}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between mb-4">
          <div>
            <span className="text-gray-700 text-sm font-medium">
              Łączna liczba miejsc: <span className="font-bold text-blue-700">{totalSeats}</span>
            </span>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={resetLayout}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Reset</span>
            </button>
            <button
              onClick={() => setShowPrintPreview(true)}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-2"
            >
              <Settings className="w-5 h-5" />
              <span>Podgląd wydruku</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? 'Zapisywanie...' : 'Zapisz plan'}</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 mb-4 overflow-visible">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Konfiguracja planu sali
            </h2>
            
            <button
              onClick={() => setShowSectionConfig(!showSectionConfig)}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center space-x-1.5 ml-2"
            >
              <Settings className="w-4 h-4" />
              <span>Konfiguruj sekcje</span>
            </button>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {Object.entries(sections)
              .filter(([_, config]) => config.enabled)
              .map(([sectionKey, _]) => (
                <button
                  key={sectionKey}
                  onClick={() => {
                    handleSelectSection(sectionKey as SectionType);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                    selectedSection === sectionKey 
                      ? 'bg-blue-600 text-white' 
                      : sectionKey === 'main'
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : sectionKey.startsWith('left')
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : sectionKey.startsWith('right')
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>{sectionNames[sectionKey]}</span>
                </button>
              ))}
          </div>
          <LayoutConfigDrawer 
            isOpen={drawerOpen} 
            onClose={() => setDrawerOpen(false)}
            selectedSection={selectedSection}
          >      
          {!showSectionConfig && selectedSection && (
            <>
              <div className="flex flex-col items-start gap-4 mb-4">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700 mr-2">
                    Sekcja: <span className="text-red-600 font-bold">{sectionNames[selectedSection]}</span>
                  </span>
                  <button
                    onClick={() => openSectionNameModal(selectedSection)}
                    className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                    title="Edytuj nazwę sekcji"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex flex-col w-full mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Liczba rzędów
                  </label>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateSectionConfig(
                        selectedSection, 
                        'rows', 
                        Math.max(1, sections[selectedSection].rows - 1)
                      )}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-l-lg border border-gray-300"
                    >
                      <Minus className="w-4 h-4 text-gray-700" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={sections[selectedSection].rows}
                      onChange={(e) => updateSectionConfig(
                        selectedSection, 
                        'rows', 
                        Math.max(1, Math.min(50, parseInt(e.target.value) || 1))
                      )}
                      className="w-12 text-center py-1 text-sm border-y border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => updateSectionConfig(
                        selectedSection, 
                        'rows', 
                        Math.min(50, sections[selectedSection].rows + 1)
                      )}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-r-lg border border-gray-300"
                    >
                      <Plus className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRenumberRows(selectedSection)}
                      className="p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                      title="Ponumeruj ponownie rzędy"
                    >
                      <ListOrdered className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col w-full mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Miejsca w rzędzie
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateSectionConfig(
                        selectedSection, 
                        'seatsPerRow', 
                        Math.max(1, sections[selectedSection].seatsPerRow - 1)
                      )}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-l-lg border border-gray-300"
                    >
                      <Minus className="w-4 h-4 text-gray-700" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={sections[selectedSection].seatsPerRow}
                      onChange={(e) => updateSectionConfig(
                        selectedSection, 
                        'seatsPerRow', 
                        Math.max(1, Math.min(50, parseInt(e.target.value) || 1))
                      )}
                      className="w-12 text-center py-1 text-sm border-y border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => updateSectionConfig(
                        selectedSection, 
                        'seatsPerRow', 
                        Math.min(50, sections[selectedSection].seatsPerRow + 1)
                      )}
                      className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-r-lg border border-gray-300"
                    >
                      <Plus className="w-3.5 h-3.5 text-gray-700" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setAutoRenumberSeats(prev => !prev)}
                      className={`px-3 py-1.5 rounded-lg border text-sm flex items-center gap-2
                        ${autoRenumberSeats ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-green-50 text-green-700 border-green-300'}
                      `}
                      title="Ponumeruj miejsca w rzędach"
                    >
                      <ListOrdered className="w-4 h-4" />
                      {autoRenumberSeats ? 'Numeruj całość' : 'Pomiń miejsca'}
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col w-full mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Styl numeracji rzędów dla {sectionNames[selectedSection]}
                  </label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => updateSectionNumberingStyle(selectedSection, 'arabic')}
                      className={`flex-1 py-1 px-2 rounded-lg border text-sm ${
                        sectionNumberingStyles[selectedSection] === 'arabic' 
                          ? 'bg-blue-50 border-blue-300 text-blue-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <span>1, 2, 3</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSectionNumberingStyle(selectedSection, 'roman')}
                      className={`flex-1 py-1 px-2 rounded-lg border text-sm ${
                        sectionNumberingStyles[selectedSection] === 'roman' 
                          ? 'bg-blue-50 border-blue-300 text-blue-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <span>I, II, III</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSectionNumberingStyle(selectedSection, 'letters')}
                      className={`flex-1 py-1 px-2 rounded-lg border text-sm ${
                        sectionNumberingStyles[selectedSection] === 'letters' 
                          ? 'bg-blue-50 border-blue-300 text-blue-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <span>A, B, C</span>
                      </div>
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col w-full mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kierunek numeracji
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleNumberingDirection(selectedSection)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg border text-sm text-gray-700"
                  >
                    {numberingDirections[selectedSection] === 'ltr' ? 'Od lewej do prawej' : 'Od prawej do lewej'}
                  </button>
                </div>
                
                <div className="flex flex-col w-full mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wyrównanie miejsc w sekcji
                  </label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setSectionAlignments(prev => ({
                        ...prev,
                        [selectedSection]: 'left'
                      }))}
                      className={`flex-1 py-1 px-2 rounded-lg border text-sm ${
                        sectionAlignments[selectedSection] === 'left' 
                          ? 'bg-blue-50 border-blue-300 text-blue-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <span>Do lewej</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSectionAlignments(prev => ({
                        ...prev,
                        [selectedSection]: 'center'
                      }))}
                      className={`flex-1 py-1 px-2 rounded-lg border text-sm ${
                        sectionAlignments[selectedSection] === 'center' 
                          ? 'bg-blue-50 border-blue-300 text-blue-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <span>Wyśrodkuj</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSectionAlignments(prev => ({
                        ...prev,
                        [selectedSection]: 'right'
                      }))}
                      className={`flex-1 py-1 px-2 rounded-lg border text-sm ${
                        sectionAlignments[selectedSection] === 'right' 
                          ? 'bg-blue-50 border-blue-300 text-blue-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <span>Do prawej</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
          </LayoutConfigDrawer>
          
          {/* Hall Layout Grid */}
          <HallLayoutGrid
            sections={sections}
            sectionNumberingStyles={sectionNumberingStyles}
            rowLabels={rowLabels}
            emptyRows={emptyRows}
            removedSeats={removedSeats}
            rowSeatsPerRow={rowSeatsPerRow}
            sectionNames={sectionNames}
            numberingDirections={numberingDirections}
            rowAlignments={rowAlignments}
            sectionAlignments={sectionAlignments}
            onSelectRow={openRowSeatsModal}
            onRemoveSeat={handleRemoveSeat}
            onAddEmptyRow={handleAddEmptyRow}
            skipRemovedSeatsVisual={skipRemovedSeatsVisual}
          />
        </div>
      </div>

      {/* Modals */}
      {showSectionNameModal && sectionToEdit && (
        <SectionNameEditModal
          isOpen={showSectionNameModal}
          onClose={() => setShowSectionNameModal(false)}
          section={sectionToEdit}
          initialName={sectionNames[sectionToEdit]}
          onSave={handleSectionNameChange}
        />
      )}
      
      {showRowSeatsModal && selectedRow && (
        <RowSeatsModal
          isOpen={showRowSeatsModal}
          onClose={() => setShowRowSeatsModal(false)}
          rowLabel={selectedRow.rowLabel}
          initialSeats={rowSeatsPerRow[selectedRow.section]?.[selectedRow.rowIndex] || 
            sections[selectedRow.section]?.seatsPerRow || 0}
          onSave={(seats) => handleUpdateRowSeats(selectedRow.rowIndex, seats)}
        />
      )}
      
      {showPrintPreview && (
        <PrintPreview
          isOpen={showPrintPreview}
          onClose={() => setShowPrintPreview(false)}
          hallName={hallName}
          hallAddress={hallAddress}
          hallCity={hallCity}
          totalSeats={totalSeats}
          sections={sections}
          sectionNumberingStyles={sectionNumberingStyles}
          rowLabels={rowLabels}
          emptyRows={emptyRows}
          removedSeats={removedSeats}
          rowSeatsPerRow={rowSeatsPerRow}
          sectionNames={sectionNames}
          numberingDirections={numberingDirections}
          sectionAlignments={sectionAlignments}
          rowAlignments={rowAlignments}
        />
      )}
    </div>
  );
};

export default HallLayout;