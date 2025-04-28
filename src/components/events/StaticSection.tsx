@@ .. @@
   onSectionUpdate?: (updates: Partial<SectionBlock>) => void;
   seatAssignments?: Record<string, string>;
   schools?: { name: string; color: string }[];
   sectionColor?: string;
+  numberingDirection?: 'ltr' | 'rtl';
 }
 
 const StaticSection: React.FC<StaticSectionProps> = ({
@@ .. @@
   onSectionUpdate,
   seatAssignments = {},
   schools = [],
-  sectionColor = 'border-gray-200'
+  sectionColor = 'border-gray-200',
+  numberingDirection = 'ltr'
 }) => {
   // Helper function to get row label based on numbering style
   const getRowLabel = (index: number, style: 'arabic' | 'roman' | 'letters'): string => {
@@ .. @@
   // Calculate seat number within a row with proper numbering direction
   const getSeatNumber = (rowIndex: number, seatIndex: number): number => {
     let seatNumber = 1;
 
     for (let i = 0; i < seatIndex; i++) {
       if (!isSeatRemoved(rowIndex, i) && !shouldRenderGap(rowIndex, i)) {
         seatNumber++;
       }
     }
 
     // For RTL numbering direction, invert the seat number
-    if (section.numberingDirection === 'rtl') {
    if (numberingDirection === 'rtl' || section.numberingDirection === 'rtl') {
       const totalVisibleSeats = (section.rowSeats[rowIndex] || 0) - 
         ((section.removedSeats[rowIndex]?.size || 0)) - 
         ((section.seatGaps[rowIndex]?.size || 0));
 
       return totalVisibleSeats - seatNumber + 1;
     }
 
     return seatNumber;
   };