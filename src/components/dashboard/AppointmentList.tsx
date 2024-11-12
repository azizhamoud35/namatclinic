import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Fixed import path
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, FileText } from 'lucide-react';
import { NotesDialog } from './NotesDialog';
import { format } from 'date-fns';

interface Appointment {
  id: string;
  customerId: string;
  customerName?: string;
  date: Date;
  status: string;
  notes?: string;
}

export function AppointmentList() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser?.uid) {
      fetchAppointments();
    }
  }, [currentUser]);

  const fetchAppointments = async () => {
    if (!currentUser?.uid) return;

    try {
      setLoading(true);
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('coachId', '==', currentUser.uid),
        where('date', '>=', Timestamp.now())
      );
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      
      const appointmentsData = appointmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      }));

      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No upcoming appointments
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <div
          key={appointment.id}
          className="flex items-center justify-between p-4 border rounded-lg bg-card"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{appointment.customerName}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {format(appointment.date, 'PPP p')}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant={
              appointment.status === 'completed' ? 'success' :
              appointment.status === 'missed' ? 'destructive' :
              'secondary'
            }>
              {appointment.status}
            </Badge>
            <Button
              onClick={() => setSelectedAppointment(appointment)}
              variant="outline"
            >
              <FileText className="h-4 w-4 mr-2" />
              Open File
            </Button>
          </div>
        </div>
      ))}

      <NotesDialog
        appointment={selectedAppointment}
        onOpenChange={(open) => !open && setSelectedAppointment(null)}
      />
    </div>
  );
}