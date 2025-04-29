import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export interface Agreement {
  id: string;
  agreement_number: string;
  season: string;
  agreement_date: string;
  school_name: string;
  school_address: string;
  teacher_name: string;
  teacher_phone: string;
  teacher_email: string;
  hall_city_name: string;
  hall_name: string;
  created_at: string;
}

export interface Performance {
  id?: string;
  date: string;
  showTitleId: string;
  time: string;
  paidTickets: number;
  unpaidTickets: number;
  teacherTickets: number;
  cost: number;
  notes: string;
  show_title?: { name: string } | null;
}

export interface AgreementFormData {
  season: string;
  date: string;
  schoolName: string;
  schoolAddress: string;
  teacherName: string;
  teacherPhone: string;
  teacherEmail: string;
  hallCityName: string;
  hallName: string;
  performances: Performance[];
}

export const useAgreement = () => {
  const { currentUser } = useAuth();
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [performances, setPerformances] = useState<Record<string, Performance[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch all agreements and their performances
  useEffect(() => {
    const loadAgreements = async () => {
      try {
        setLoading(true);
        const { data: agreementsData, error: agreementsError } = await supabase
          .from('agreements')
          .select('*')
          .order('created_at', { ascending: false });

        if (agreementsError) throw agreementsError;
        setAgreements(agreementsData || []);

        // Fetch performances for each agreement
        const { data: performancesData, error: performancesError } = await supabase
          .from('agreement_performances')
          .select(`
            id,
            agreement_id,
            performance_date,
            performance_time,
            paid_tickets,
            unpaid_tickets,
            teacher_tickets,
            cost,
            notes,
            show_title:show_titles(name),
            show_title_id
          `);

        if (performancesError) throw performancesError;

        // Group performances by agreement_id
        const performancesByAgreement = (performancesData || []).reduce((acc, perf) => {
          if (!acc[perf.agreement_id]) {
            acc[perf.agreement_id] = [];
          }
          acc[perf.agreement_id].push({
            id: perf.id,
            date: perf.performance_date,
            showTitleId: perf.show_title_id,
            time: perf.performance_time,
            paidTickets: perf.paid_tickets,
            unpaidTickets: perf.unpaid_tickets,
            teacherTickets: perf.teacher_tickets,
            cost: perf.cost,
            notes: perf.notes,
            show_title: perf.show_title
          });
          return acc;
        }, {} as Record<string, Performance[]>);

        setPerformances(performancesByAgreement);
      } catch (error) {
        console.error('Failed to load agreements:', error);
        setError('Failed to load agreements');
      } finally {
        setLoading(false);
      }
    };

    loadAgreements();
  }, [refreshTrigger]);

  // Create a new agreement
  const createAgreement = async (data: AgreementFormData) => {
    try {
      setError(null);
      
      // Insert agreement
      const { data: agreement, error: agreementError } = await supabase
        .from('agreements')
        .insert([{
          season: data.season,
          agreement_date: data.date,
          school_name: data.schoolName,
          school_address: data.schoolAddress,
          teacher_name: data.teacherName,
          teacher_phone: data.teacherPhone,
          teacher_email: data.teacherEmail,
          hall_city_name: data.hallCityName,
          hall_name: data.hallName
        }])
        .select()
        .single();

      if (agreementError) throw agreementError;

      // Insert performances
      const { error: performancesError } = await supabase
        .from('agreement_performances')
        .insert(
          data.performances.map(perf => ({
            agreement_id: agreement.id,
            performance_date: perf.date,
            show_title_id: perf.showTitleId,
            performance_time: perf.time,
            paid_tickets: perf.paidTickets,
            unpaid_tickets: perf.unpaidTickets,
            teacher_tickets: perf.teacherTickets,
            cost: perf.cost,
            notes: perf.notes
          }))
        );

      if (performancesError) throw performancesError;

      // Refresh agreements list
      setRefreshTrigger(prev => prev + 1);
      
      toast.success('Umowa została utworzona');
      return true;
    } catch (error) {
      console.error('Failed to create agreement:', error);
      setError('Failed to create agreement');
      toast.error('Nie udało się utworzyć umowy');
      return false;
    }
  };

  // Update an existing agreement
  const updateAgreement = async (agreementId: string, data: AgreementFormData) => {
    try {
      setError(null);
      
      // Update agreement
      const { error: agreementError } = await supabase
        .from('agreements')
        .update({
          season: data.season,
          agreement_date: data.date,
          school_name: data.schoolName,
          school_address: data.schoolAddress,
          teacher_name: data.teacherName,
          teacher_phone: data.teacherPhone,
          teacher_email: data.teacherEmail,
          hall_city_name: data.hallCityName,
          hall_name: data.hallName
        })
        .eq('id', agreementId);

      if (agreementError) throw agreementError;

      // Delete existing performances
      const { error: deleteError } = await supabase
        .from('agreement_performances')
        .delete()
        .eq('agreement_id', agreementId);

      if (deleteError) throw deleteError;

      // Insert updated performances
      const { error: performancesError } = await supabase
        .from('agreement_performances')
        .insert(
          data.performances.map(perf => ({
            agreement_id: agreementId,
            performance_date: perf.date,
            show_title_id: perf.showTitleId,
            performance_time: perf.time,
            paid_tickets: perf.paidTickets,
            unpaid_tickets: perf.unpaidTickets,
            teacher_tickets: perf.teacherTickets,
            cost: perf.cost,
            notes: perf.notes
          }))
        );

      if (performancesError) throw performancesError;

      // Refresh agreements list
      setRefreshTrigger(prev => prev + 1);
      
      toast.success('Umowa została zaktualizowana');
      return true;
    } catch (error) {
      console.error('Failed to update agreement:', error);
      setError('Failed to update agreement');
      toast.error('Nie udało się zaktualizować umowy');
      return false;
    }
  };

  // Delete an agreement
  const deleteAgreement = async (agreementId: string) => {
    try {
      setError(null);
      
      // Delete all performances associated with this agreement
      const { error: performancesError } = await supabase
        .from('agreement_performances')
        .delete()
        .eq('agreement_id', agreementId);

      if (performancesError) throw performancesError;

      // Delete the agreement
      const { error: agreementError } = await supabase
        .from('agreements')
        .delete()
        .eq('id', agreementId);

      if (agreementError) throw agreementError;

      // Refresh agreements list
      setRefreshTrigger(prev => prev + 1);
      
      toast.success('Umowa została usunięta');
      return true;
    } catch (error) {
      console.error('Failed to delete agreement:', error);
      setError('Failed to delete agreement');
      toast.error('Nie udało się usunąć umowy');
      return false;
    }
  };
  
  // Format date to local format
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  return {
    agreements,
    performances,
    loading,
    error,
    createAgreement,
    updateAgreement,
    deleteAgreement,
    formatDate,
    refreshData: () => setRefreshTrigger(prev => prev + 1)
  };
}; 