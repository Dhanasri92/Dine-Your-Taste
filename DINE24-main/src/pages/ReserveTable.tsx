import { useState } from "react";
import ReservationForm from "@/components/ReservationForm";
import TableSelection from "@/components/TableSelection";
import OrderSelection from "@/components/OrderSelection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { reservationsApi } from "@/lib/apiClient";
import { generateReservationPDF } from "@/utils/pdfGenerator";

interface ReservationData {
  fullName: string;
  email: string;
  phone: string;
  numPeople: number;
  purpose: string;
  arrivalTime: string;
  arrivalDate: string;
}

interface OrderItem {
  id: number;
  name: string;
  quantity: string;
  price: number;
  offer_price?: number;
  category: string;
  rating: number;
  is_veg: boolean;
  selectedQuantity: number;
}

const ReserveTable = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [reservationData, setReservationData] = useState<ReservationData | null>(null);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [finalReservation, setFinalReservation] = useState<any>(null);
  const { toast } = useToast();

  const handleReservationSubmit = (data: ReservationData) => {
    setReservationData(data);
    setCurrentStep(2);
  };

  const handleTableSelect = (table: any) => {
    setSelectedTable(table);
    setCurrentStep(3);
  };

  const handleTableAIRecommendation = async () => {
    if (!reservationData) return;
    toast({
      title: "AI Table Recommendation",
      description: "AI recommendations are shown in the table selection section below based on your party size and purpose.",
      duration: 5000,
    });
  };

  const handleSkipOrdering = async () => {
    await completeReservation([]);
  };

  const handleOrderComplete = async (items: OrderItem[], total: number) => {
    setOrderItems(items);
    await completeReservation(items, 'now');
  };

  const completeReservation = async (items: OrderItem[], orderType: 'now' | 'later' = 'later') => {
    if (!reservationData || !selectedTable) return;

    try {
      const subtotal = items.reduce((sum, item) => 
        sum + (item.offer_price || item.price) * item.selectedQuantity, 0);
      const gst = Math.round(subtotal * 0.18); // 18% GST
      const totalAmount = subtotal + gst;

      // Submit reservation to Flask + MongoDB backend
      const response = await reservationsApi.create({
        full_name: reservationData.fullName,
        email: reservationData.email,
        phone: reservationData.phone,
        num_people: reservationData.numPeople,
        purpose: reservationData.purpose,
        arrival_time: reservationData.arrivalTime,
        arrival_date: reservationData.arrivalDate,
        table_number: selectedTable.table_number,
        table_capacity: selectedTable.seating_capacity,
        order_type: orderType,
        total_amount: totalAmount,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to create reservation');
      }

      const reservation = response.reservation;
      setFinalReservation(reservation);
      setCurrentStep(4);

      // Send email with PDF (best-effort)
      try {
        await sendConfirmationEmail(reservation, items);
      } catch (emailErr) {
        console.warn('Email sending failed:', emailErr);
      }

      toast({
        title: "Reservation Confirmed!",
        description: "Your table has been reserved. Check your email for confirmation.",
      });
    } catch (error) {
      console.error('Error completing reservation:', error);
      toast({
        title: "Error",
        description: "Failed to complete reservation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const sendConfirmationEmail = async (reservation: any, items: OrderItem[]) => {
    // Email is handled by the Flask backend on reservation creation
    // This is a no-op in frontend; confirmation appears on screen
    console.log('Reservation confirmed:', reservation._id || reservation.id);
  };

  const handleAISuggestion = async () => {
    toast({
      title: "AI Recommendation",
      description: "AI suggestions are available via the AI chat button on this page.",
      duration: 5000,
    });
  };

  const downloadBill = async () => {
    if (!finalReservation) return;
    
    try {
      const pdfContent = await generateReservationPDF(finalReservation, orderItems);
      const link = document.createElement('a');
      link.href = pdfContent;
      const reservationId = (finalReservation._id || finalReservation.id || 'unknown').slice(0, 8);
      link.download = `Dine24-Reservation-${reservationId}.pdf`;
      link.click();
      
      toast({
        title: "Download Started",
        description: "Your reservation bill is being downloaded.",
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Download Error",
        description: "Failed to download the bill. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Progress Indicator */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      currentStep >= step
                        ? 'bg-royal-gold text-black'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {step}
                  </div>
                  {step < 4 && (
                    <div
                      className={`w-12 h-1 mx-2 ${
                        currentStep > step ? 'bg-royal-gold' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          {currentStep === 1 && (
            <ReservationForm onSubmit={handleReservationSubmit} />
          )}

          {currentStep === 2 && reservationData && (
            <TableSelection
              reservationData={reservationData}
              onTableSelect={handleTableSelect}
              onAIRecommendation={handleTableAIRecommendation}
            />
          )}

          {currentStep === 3 && reservationData && selectedTable && (
            <div className="space-y-6">
              <Card className="card-royal">
                <CardHeader>
                  <CardTitle className="text-royal-gold text-center">
                    Choose Your Dining Experience
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    Would you like to pre-order your food or order after arrival?
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      className="btn-royal"
                      onClick={handleSkipOrdering}
                    >
                      Order After Arrival
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <OrderSelection
                reservationData={reservationData}
                selectedTable={selectedTable}
                onOrderComplete={handleOrderComplete}
              />
            </div>
          )}

          {currentStep === 4 && finalReservation && (
            <Card className="card-royal text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <CardTitle className="text-royal-gold text-2xl">
                  Reservation Confirmed!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/30 p-6 rounded-lg">
                  <h3 className="font-semibold text-royal-gold mb-4">Reservation Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Name:</strong> {finalReservation.full_name}</p>
                      <p><strong>Email:</strong> {finalReservation.email}</p>
                      <p><strong>Phone:</strong> {finalReservation.phone}</p>
                    </div>
                    <div>
                      <p><strong>Date:</strong> {finalReservation.arrival_date}</p>
                      <p><strong>Time:</strong> {finalReservation.arrival_time}</p>
                      <p><strong>Table:</strong> {finalReservation.table_number}</p>
                      <p><strong>Guests:</strong> {finalReservation.num_people}</p>
                    </div>
                  </div>
                  {orderItems.length > 0 && (
                    <div className="mt-4">
                      <p><strong>Total Amount:</strong> ₹{finalReservation.total_amount}</p>
                      <p className="text-sm text-muted-foreground">Payment: Pay on Arrival</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={downloadBill} className="btn-royal">
                    <Download className="h-4 w-4 mr-2" />
                    Download Bill PDF
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground">
                  A confirmation email with your reservation details and bill has been sent to {finalReservation.email}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReserveTable;
