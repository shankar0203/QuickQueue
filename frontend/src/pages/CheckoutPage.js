import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, CreditCard, Smartphone, Building2, Shield, CheckCircle, Calendar, MapPin, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

const CheckoutPage = () => {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [selectedTicketType, setSelectedTicketType] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [bookingData, setBookingData] = useState({
    buyer_name: '',
    buyer_email: '',
    buyer_phone: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
    
    // Get ticket type from URL params
    const ticketType = searchParams.get('ticket_type');
    if (ticketType) {
      setSelectedTicketType(ticketType);
    }
  }, [eventId, searchParams]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/events/${eventId}`);
      setEvent(response.data);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Failed to load event details');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedTicket = () => {
    if (!event || !selectedTicketType) return null;
    return event.ticket_types.find(t => t.name === selectedTicketType);
  };

  const calculateTotal = () => {
    const ticket = getSelectedTicket();
    if (!ticket) return 0;
    return ticket.price * quantity;
  };

  const handleInputChange = (field, value) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedTicketType) {
      toast.error('Please select a ticket type');
      return;
    }
    
    if (!bookingData.buyer_name || !bookingData.buyer_email || !bookingData.buyer_phone) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Create booking
      const bookingResponse = await axios.post('/bookings', {
        event_id: eventId,
        buyer_name: bookingData.buyer_name,
        buyer_email: bookingData.buyer_email,
        buyer_phone: bookingData.buyer_phone,
        ticket_type: selectedTicketType,
        quantity: quantity
      });
      
      const booking = bookingResponse.data;
      const total = calculateTotal();
      
      if (total === 0) {
        // Free event - redirect directly to ticket
        toast.success('Free ticket booked successfully!');
        navigate(`/ticket/${booking.ticket_number}`);
        return;
      }
      
      // Create payment order
      const orderResponse = await axios.post('/payments/create-order', {
        booking_id: booking.id,
        amount: total
      });
      
      const order = orderResponse.data;
      
      // Initialize Razorpay
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_mock',
        amount: order.amount,
        currency: order.currency,
        name: 'QuickQueue',
        description: `Ticket for ${event.title}`,
        order_id: order.order_id,
        handler: async function (response) {
          try {
            // Verify payment
            const verifyResponse = await axios.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            
            if (verifyResponse.data.status === 'success') {
              toast.success('Payment successful! Ticket booked.');
              navigate(`/ticket/${verifyResponse.data.ticket_number}`);
            } else {
              toast.error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: bookingData.buyer_name,
          email: bookingData.buyer_email,
          contact: bookingData.buyer_phone
        },
        theme: {
          color: '#6366f1'
        },
        modal: {
          ondismiss: function() {
            toast.error('Payment cancelled');
          }
        }
      };
      
      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          const rzp = new window.Razorpay(options);
          rzp.open();
        };
        document.body.appendChild(script);
      } else {
        const rzp = new window.Razorpay(options);
        rzp.open();
      }
      
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-white">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="pt-16 min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Event not found</p>
          <Link to="/events">
            <Button className="btn-primary">Back to Events</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16">
      <div className="section-gap container-padding">
        {/* Header */}
        <div className="mb-8">
          <Link to={`/events/${eventId}`}>
            <Button variant="ghost" className="text-slate-400 hover:text-white mb-4" data-testid="back-to-event">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Event
            </Button>
          </Link>
          <h1 className="heading text-heading text-white mb-2">Checkout</h1>
          <p className="text-slate-400">Complete your booking for {event.title}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Ticket Selection */}
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle className="heading text-xl text-white">Select Tickets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Ticket Type */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Ticket Type *
                      </label>
                      <Select value={selectedTicketType} onValueChange={setSelectedTicketType}>
                        <SelectTrigger className="input-premium" data-testid="ticket-type-select">
                          <SelectValue placeholder="Choose ticket type" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10">
                          {event.ticket_types.map((ticket, index) => (
                            <SelectItem 
                              key={index} 
                              value={ticket.name}
                              disabled={ticket.available === 0}
                            >
                              <div className="flex justify-between items-center w-full">
                                <span>{ticket.name}</span>
                                <span className="ml-4">
                                  {ticket.price === 0 ? 'Free' : `₹${ticket.price}`}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Quantity *
                      </label>
                      <Select value={quantity.toString()} onValueChange={(value) => setQuantity(parseInt(value))}>
                        <SelectTrigger className="input-premium" data-testid="quantity-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10">
                          {[1, 2, 3, 4, 5].map(num => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} {num === 1 ? 'Ticket' : 'Tickets'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Buyer Information */}
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle className="heading text-xl text-white">Buyer Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Full Name *
                      </label>
                      <Input
                        type="text"
                        placeholder="Enter your full name"
                        value={bookingData.buyer_name}
                        onChange={(e) => handleInputChange('buyer_name', e.target.value)}
                        className="input-premium"
                        data-testid="buyer-name-input"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Email Address *
                      </label>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={bookingData.buyer_email}
                        onChange={(e) => handleInputChange('buyer_email', e.target.value)}
                        className="input-premium"
                        data-testid="buyer-email-input"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Phone Number *
                      </label>
                      <Input
                        type="tel"
                        placeholder="Enter your phone number"
                        value={bookingData.buyer_phone}
                        onChange={(e) => handleInputChange('buyer_phone', e.target.value)}
                        className="input-premium"
                        data-testid="buyer-phone-input"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              {calculateTotal() > 0 && (
                <Card className="card-premium">
                  <CardHeader>
                    <CardTitle className="heading text-xl text-white">Payment Method</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center p-4 border border-primary/50 rounded-lg bg-primary/5">
                        <CreditCard className="w-6 h-6 text-primary mr-3" />
                        <div>
                          <p className="text-white font-medium">Cards</p>
                          <p className="text-slate-400 text-xs">Visa, MasterCard</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center p-4 border border-white/10 rounded-lg">
                        <Smartphone className="w-6 h-6 text-green-400 mr-3" />
                        <div>
                          <p className="text-white font-medium">UPI</p>
                          <p className="text-slate-400 text-xs">Google Pay, PhonePe</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center p-4 border border-white/10 rounded-lg">
                        <Building2 className="w-6 h-6 text-blue-400 mr-3" />
                        <div>
                          <p className="text-white font-medium">Net Banking</p>
                          <p className="text-slate-400 text-xs">All major banks</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center text-slate-400 text-sm">
                      <Shield className="w-4 h-4 mr-2" />
                      <span>Secured by Razorpay SSL Encryption</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full btn-primary py-6 text-lg"
                disabled={submitting || !selectedTicketType}
                data-testid="complete-booking-button"
              >
                {submitting ? (
                  <>
                    <div className="spinner mr-2"></div>
                    Processing...
                  </>
                ) : calculateTotal() === 0 ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Complete Free Booking
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Pay ₹{calculateTotal()} & Complete Booking
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle className="heading text-xl text-white">Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Event Info */}
                  <div className="space-y-3 mb-6">
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <h3 className="text-white font-semibold">{event.title}</h3>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-slate-400">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(event.date)}
                      </div>
                      <div className="flex items-center text-slate-400">
                        <MapPin className="w-4 h-4 mr-2" />
                        {event.venue}
                      </div>
                      <div className="flex items-center text-slate-400">
                        <Users className="w-4 h-4 mr-2" />
                        by {event.organizer_name}
                      </div>
                    </div>
                  </div>

                  {/* Ticket Details */}
                  {selectedTicketType && (
                    <div className="space-y-4 border-t border-white/10 pt-6">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">Ticket Type:</span>
                        <Badge className="badge-neutral">{selectedTicketType}</Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">Quantity:</span>
                        <span className="text-white">{quantity}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">Price per ticket:</span>
                        <span className="text-white">
                          {getSelectedTicket()?.price === 0 ? 'Free' : `₹${getSelectedTicket()?.price}`}
                        </span>
                      </div>
                      
                      <div className="border-t border-white/10 pt-4">
                        <div className="flex justify-between items-center text-lg font-semibold">
                          <span className="text-white">Total:</span>
                          <span className="text-accent">
                            {calculateTotal() === 0 ? 'Free' : `₹${calculateTotal()}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Security Info */}
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="space-y-2 text-sm text-slate-400">
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                        <span>Instant QR ticket delivery</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                        <span>Secure payment processing</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                        <span>24/7 customer support</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;