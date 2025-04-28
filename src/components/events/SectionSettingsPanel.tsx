</div>

               <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kierunek numeracji
                </label>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex flex-col space-y-3">
                    <label className="text-sm text-gray-600 font-medium">Numeracja miejsc w rzędach</label>
                    <button 
                      type="button"
                      onClick={() => {
                        setNumberingDirection('ltr');
                        onSectionUpdate({ numberingDirection: 'ltr' });
                      }}
                      className={`flex items-center justify-center py-2.5 px-4 rounded-lg border ${
                        numberingDirection === 'ltr' 
                          ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <ArrowRight className="w-5 h-5 mr-2" />
                      <span>Numeruj od lewej do prawej</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setNumberingDirection('rtl');
                        onSectionUpdate({ numberingDirection: 'rtl' });
                      }}
                      className={`flex items-center justify-center py-2.5 px-4 rounded-lg border ${
                        numberingDirection === 'rtl' 
                          ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <ArrowRight className="w-5 h-5 mr-2 transform rotate-180" />
                      <span>Numeruj od prawej do lewej</span>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Numeracja</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, numberingStyle: 'arabic' });
                      onUpdate({ ...formData, numberingStyle: 'arabic' });
                      if (onNumberingStyleChange) onNumberingStyleChange('arabic');
                    }}
                    className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors ${
                      formData.numberingStyle === 'arabic' 
                        ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Numeruj rzędy (1,2,3)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, numberingStyle: 'roman' });
                      onUpdate({ ...formData, numberingStyle: 'roman' });
                      if (onNumberingStyleChange) onNumberingStyleChange('roman');
                    }}
                    className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors ${
                      formData.numberingStyle === 'roman' 
                        ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Numeruj rzędy (I,II,III)</span>
                  </button>
                </div>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, numberingStyle: 'letters' });
                      onUpdate({ ...formData, numberingStyle: 'letters' });
                      if (onNumberingStyleChange) onNumberingStyleChange('letters');
                    }}
                    className={`flex items-center justify-center space-x-2 px-4 py-2 w-full rounded-lg hover:bg-blue-100 transition-colors ${
                      formData.numberingStyle === 'letters' 
                        ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Numeruj rzędy (A,B,C)</span>
                  </button>
                </div>
              </div>