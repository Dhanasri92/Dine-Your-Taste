
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { reservationsApi } from "@/lib/apiClient";

const AdminReservations = () => {
  const { data: reservationsData, isLoading, error } = useQuery({
    queryKey: ['admin-all-reservations'],
    queryFn: async () => {
      const data = await reservationsApi.getAll();
      return data.reservations || [];
    }
  });

  const reservations = reservationsData || [];

  if (isLoading) {
    return (
      <div className="min-h-screen py-16 flex items-center justify-center">
        <div className="text-royal-gold text-xl">Loading reservations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-16 flex items-center justify-center">
        <div className="text-destructive text-xl">
          Failed to load reservations. Make sure the backend server is running.
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-500";
      case "pending": return "bg-yellow-500";
      case "completed": return "bg-blue-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <h1 className="font-playfair text-4xl font-bold text-royal-gold mb-8">
          Reservation Management
        </h1>
        
        {reservations && reservations.length > 0 ? (
          <div className="space-y-6">
            {reservations.map((reservation: any) => (
              <Card key={reservation._id || reservation.id} className="card-royal">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <h3 className="font-semibold text-royal-gold">{reservation.full_name}</h3>
                      <p className="text-sm text-muted-foreground">ID: {(reservation._id || reservation.id || '').slice(0, 8).toUpperCase()}</p>
                      <p className="text-sm text-muted-foreground">Email: {reservation.email}</p>
                      <p className="text-sm text-muted-foreground">Phone: {reservation.phone}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-royal-gold" />
                      <div>
                        <p className="font-semibold">Table {reservation.table_number}</p>
                        <p className="text-sm text-muted-foreground">{reservation.num_people} people</p>
                        <p className="text-sm text-muted-foreground">{reservation.purpose}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-royal-gold" />
                      <div>
                        <p className="font-semibold">{reservation.arrival_time}</p>
                        <p className="text-sm text-muted-foreground">{reservation.arrival_date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={`${getStatusColor(reservation.status)} text-white mb-2`}>
                        {reservation.status}
                      </Badge>
                      <p className="font-bold text-royal-gold">₹{reservation.total_amount || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="card-royal">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground text-lg">No reservations found</p>
              <p className="text-sm text-muted-foreground mt-2">Reservations will appear here once customers start booking tables</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminReservations;
