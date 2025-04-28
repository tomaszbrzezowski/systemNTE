@@ .. @@
   if (!isOpen) return null;

   return (
-    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
-      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
-        <div className="p-6 border-b border-gray-200">
+    <div className="modal-backdrop">
+      <div className="modal-content max-w-2xl mx-4 max-h-[80vh] flex flex-col">
+        <div className="modal-header">
           <div className="flex justify-between items-center">
             <div>
-              <h2 className="text-xl font-semibold text-gray-800">
+              <h2 className="text-xl font-semibold text-white">
                 Przypisz miasta dla użytkownika
               </h2>
-              <p className="text-sm text-gray-500 mt-1">{user.name}</p>
+              <p className="text-sm text-white/80 mt-1">{user.name}</p>
             </div>
             <button
               onClick={onClose}
-              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
+              className="btn-modal-close absolute top-4 right-4"
             >
-              <X className="w-5 h-5 text-gray-500" />
+              <X className="w-5 h-5 text-white" />
             </button>
           </div>