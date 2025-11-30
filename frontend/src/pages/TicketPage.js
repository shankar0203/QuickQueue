import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Calendar, MapPin, Download, Share2, CheckCircle, Clock, User, Ticket, QrCode, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const TicketPage = () => {
  const { ticketNumber } = useParams();
  const [ticket, setTicket] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ticketNumber) {
      fetchTicket();
    }
  }, [ticketNumber]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/tickets/${ticketNumber}`);
      const ticketData = response.data;
      setTicket(ticketData);
      
      // Fetch event details
      const eventResponse = await axios.get(`/events/${ticketData.event_id}`);
      setEvent(eventResponse.data);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      toast.error('Ticket not found');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const downloadTicket = () => {
    // Create a printable version
    const printWindow = window.open('', '_blank');
    const printContent = `
      <html>
        <head>
          <title>QuickQueue Ticket - ${ticket.ticket_number}</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 20px;
              background: #f5f5f5;
            }
            .ticket {
              background: white;
              border-radius: 10px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              max-width: 600px;
              margin: 0 auto;
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #6366f1, #8b5cf6);
              color: white;
              padding: 20px;
              text-align: center;
            }
            .content {
              padding: 20px;
            }
            .qr-section {
              text-align: center;
              margin: 20px 0;
            }
            .details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin: 20px 0;
            }
            .detail-item {
              padding: 10px;
              background: #f8f9fa;
              border-radius: 5px;
            }
            .detail-label {
              font-weight: bold;
              color: #6b7280;
              font-size: 12px;
              margin-bottom: 5px;
            }
            .detail-value {
              color: #111827;
              font-size: 14px;
            }
            .footer {
              text-align: center;
              padding: 15px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 12px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <h1>QuickQueue</h1>
              <h2>${event?.title || 'Event Ticket'}</h2>
            </div>
            <div class="content">
              <div class="qr-section">
                ${ticket.qr_code ? `<img src="${ticket.qr_code}" alt="QR Code" style="width: 200px; height: 200px;">` : '<p>QR Code not available</p>'}
                <p><strong>Ticket #${ticket.ticket_number}</strong></p>
              </div>
              <div class="details">
                <div class="detail-item">
                  <div class="detail-label">HOLDER NAME</div>
                  <div class="detail-value">${ticket.buyer_name}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">TICKET TYPE</div>
                  <div class="detail-value">${ticket.ticket_type}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">EVENT DATE</div>
                  <div class="detail-value">${event ? formatDate(event.date) : 'TBD'}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">VENUE</div>
                  <div class="detail-value">${event?.venue || 'TBD'}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">QUANTITY</div>
                  <div class="detail-value">${ticket.quantity}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">STATUS</div>
                  <div class="detail-value">${ticket.payment_status.toUpperCase()}</div>
                </div>
              </div>
            </div>
            <div class="footer">
              <p>Present this QR code at the venue for entry</p>
              <p>© 2025 QuickQueue - Digital Ticketing Platform</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Auto print after a short delay
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const shareTicket = () => {
    const text = `I got my ticket for ${event?.title || 'an awesome event'}! 🎉\n\nTicket #${ticket.ticket_number}\nSee you there!`;
    
    if (navigator.share) {
      navigator.share({
        title: 'My Event Ticket',
        text: text
      });
    } else {
      // Fallback to WhatsApp
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-white">Loading your ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket || !event) {
    return (
      <div className="pt-16 min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Ticket className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-white text-xl mb-2">Ticket not found</p>
          <p className="text-slate-400 mb-6">Please check your ticket number and try again</p>
          <Link to="/events">
            <Button className="btn-primary">Browse Events</Button>
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
          <Link to="/events">
            <Button variant="ghost" className="text-slate-400 hover:text-white mb-4" data-testid="back-to-events">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Events
            </Button>
          </Link>
          <h1 className="heading text-heading text-white mb-2">Your Ticket</h1>
          <p className="text-slate-400">Present this QR code at the venue for entry</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Ticket Card */}
            <div className="lg:col-span-2">
              <Card className="card-premium overflow-hidden" data-testid="ticket-card">
                {/* Ticket Header */}
                <div className="bg-gradient-to-r from-primary to-purple-600 p-6 text-white relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">Q</span>
                        </div>
                        <span className="heading text-xl font-bold">QuickQueue</span>
                      </div>
                      <Badge className={`px-3 py-1 ${
                        ticket.payment_status === 'paid' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                        ticket.payment_status === 'pending' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                        'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}>
                        {ticket.payment_status.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <h2 className="heading text-2xl font-bold mb-2">{event.title}</h2>
                    <p className="text-white/80">Ticket #{ticket.ticket_number}</p>
                  </div>
                </div>

                {/* QR Code Section */}
                <CardContent className="p-8 text-center">
                  {ticket.qr_code ? (
                    <div className="mb-6">
                      <div className="inline-block p-4 bg-white rounded-xl shadow-lg">
                        <img
                          src={ticket.qr_code}
                          alt="Ticket QR Code"
                          className="w-48 h-48 mx-auto"
                          data-testid="qr-code-image"
                        />
                      </div>
                      <p className="text-slate-400 text-sm mt-4">
                        Scan this QR code at the venue entrance
                      </p>
                    </div>
                  ) : (
                    <div className="mb-6">
                      <div className="w-48 h-48 mx-auto bg-slate-800 rounded-xl flex items-center justify-center">
                        <QrCode className="w-16 h-16 text-slate-600" />
                      </div>
                      <p className="text-slate-400 text-sm mt-4">
                        QR code will be generated after payment confirmation
                      </p>
                    </div>
                  )}

                  {/* Ticket Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="text-left p-4 bg-slate-800/30 rounded-lg">
                      <div className="flex items-center text-slate-400 text-sm mb-1">
                        <User className="w-4 h-4 mr-2" />
                        HOLDER NAME
                      </div>
                      <p className="text-white font-medium">{ticket.buyer_name}</p>
                    </div>
                    
                    <div className="text-left p-4 bg-slate-800/30 rounded-lg">
                      <div className="flex items-center text-slate-400 text-sm mb-1">
                        <Ticket className="w-4 h-4 mr-2" />
                        TICKET TYPE
                      </div>
                      <p className="text-white font-medium">{ticket.ticket_type}</p>
                    </div>
                    
                    <div className="text-left p-4 bg-slate-800/30 rounded-lg">
                      <div className="flex items-center text-slate-400 text-sm mb-1">
                        <Calendar className="w-4 h-4 mr-2" />
                        EVENT DATE
                      </div>
                      <p className="text-white font-medium">{formatDate(event.date)}</p>
                    </div>
                    
                    <div className="text-left p-4 bg-slate-800/30 rounded-lg">
                      <div className="flex items-center text-slate-400 text-sm mb-1">
                        <MapPin className="w-4 h-4 mr-2" />
                        VENUE
                      </div>
                      <p className="text-white font-medium">{event.venue}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={downloadTicket}
                      className="btn-primary flex-1"
                      data-testid="download-ticket-button"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button
                      onClick={shareTicket}
                      className="btn-secondary flex-1"
                      data-testid="share-ticket-button"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Ticket
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Event Info Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Event Details */}
                <Card className="card-premium">
                  <CardHeader>
                    <CardTitle className="heading text-xl text-white">Event Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-32 object-cover rounded-lg mb-4"
                    />
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center text-slate-400">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-center text-slate-400">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>Duration: {event.duration} hours</span>
                      </div>
                      <div className="flex items-center text-slate-400">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{event.venue}</span>
                      </div>
                    </div>
                    
                    <Link to={`/events/${event.id}`} className="block mt-4">
                      <Button variant="outline" className="w-full border-white/10 text-slate-300 hover:text-white">
                        View Event Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Check-in Status */}
                <Card className="card-premium">
                  <CardHeader>
                    <CardTitle className="heading text-xl text-white">Check-in Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {ticket.checked_in ? (
                      <div className="text-center">
                        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                        <p className="text-green-400 font-medium mb-2">Checked In</p>
                        <p className="text-slate-400 text-sm">
                          {new Date(ticket.checked_in_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Clock className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                        <p className="text-amber-400 font-medium mb-2">Not Checked In</p>
                        <p className="text-slate-400 text-sm">
                          Present QR code at venue entrance
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Support */}
                <Card className="card-premium">
                  <CardHeader>
                    <CardTitle className="heading text-xl text-white">Need Help?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-300 text-sm mb-4">
                      Having trouble with your ticket? Our support team is here to help.
                    </p>
                    <Link to="/contact">
                      <Button variant="outline" className="w-full border-white/10 text-slate-300 hover:text-white">
                        Contact Support
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketPage;