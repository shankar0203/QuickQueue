import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Calendar, MapPin, Clock, Users, Ticket, ExternalLink, ArrowLeft, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchEvent();
    }
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/events/${id}`);
      setEvent(response.data);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Failed to load event details');
      navigate('/events');
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

  const formatDateShort = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openGoogleMaps = (venue) => {
    const encodedVenue = encodeURIComponent(venue);
    window.open(`https://maps.google.com/?q=${encodedVenue}`, '_blank');
  };

  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-white">Loading event details...</p>
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
      {/* Hero Section */}
      <section className="relative h-[60vh] overflow-hidden">
        <img
          src={event.image_url}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
        
        {/* Navigation */}
        <div className="absolute top-8 left-0 right-0 z-10">
          <div className="container-padding">
            <Link to="/events">
              <Button variant="ghost" className="text-white hover:bg-white/10" data-testid="back-to-events">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Events
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Event Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="container-padding pb-12">
            <div className="max-w-4xl">
              <Badge className="badge-neutral mb-4">
                {event.category}
              </Badge>
              <h1 className="heading text-display text-white mb-4">
                {event.title}
              </h1>
              <div className="flex flex-wrap gap-6 text-white/90">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  {formatDateShort(event.date)}
                </div>
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  {event.venue}
                </div>
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  by {event.organizer_name}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-gap container-padding">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Event Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="heading text-2xl text-white">About This Event</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 leading-relaxed">
                  {event.description}
                </p>
              </CardContent>
            </Card>

            {/* Event Details */}
            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="heading text-2xl text-white">Event Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <div className="flex items-center text-slate-400">
                      <Calendar className="w-5 h-5 mr-3" />
                      <span>Date & Time</span>
                    </div>
                    <span className="text-white font-medium">{formatDate(event.date)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <div className="flex items-center text-slate-400">
                      <Clock className="w-5 h-5 mr-3" />
                      <span>Duration</span>
                    </div>
                    <span className="text-white font-medium">{event.duration} hours</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <div className="flex items-center text-slate-400">
                      <MapPin className="w-5 h-5 mr-3" />
                      <span>Venue</span>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-medium block">{event.venue}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openGoogleMaps(event.venue)}
                        className="text-primary hover:text-primary/80 p-0 h-auto mt-1"
                        data-testid="view-on-maps"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View on Maps
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center py-3">
                    <div className="flex items-center text-slate-400">
                      <Users className="w-5 h-5 mr-3" />
                      <span>Organizer</span>
                    </div>
                    <span className="text-white font-medium">{event.organizer_name}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Terms & Conditions */}
            {event.terms && (
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle className="heading text-2xl text-white">Terms & Conditions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 leading-relaxed text-sm">
                    {event.terms}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle className="heading text-2xl text-white flex items-center">
                    <Ticket className="w-6 h-6 mr-2" />
                    Select Tickets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {event.ticket_types.map((ticket, index) => (
                      <div
                        key={index}
                        className="border border-white/10 rounded-lg p-4 hover:border-primary/50 transition-colors"
                        data-testid={`ticket-type-${index}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="text-white font-semibold">{ticket.name}</h4>
                            <p className="text-slate-400 text-sm">Available: {ticket.available}</p>
                          </div>
                          <div className="text-right">
                            {ticket.price === 0 ? (
                              <Badge className="badge-success">Free</Badge>
                            ) : (
                              <span className="text-accent font-bold text-lg">₹{ticket.price}</span>
                            )}
                          </div>
                        </div>
                        
                        <Link to={`/checkout/${event.id}?ticket_type=${encodeURIComponent(ticket.name)}`}>
                          <Button
                            className="w-full btn-primary"
                            disabled={ticket.available === 0}
                            data-testid={`book-ticket-${index}`}
                          >
                            {ticket.available === 0 ? (
                              'Sold Out'
                            ) : (
                              <>
                                <Star className="w-4 h-4 mr-2" />
                                Book {ticket.name}
                              </>
                            )}
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                  
                  {/* Event Status */}
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="flex items-center justify-center text-slate-400 text-sm">
                      <Star className="w-4 h-4 mr-2" />
                      <span>Secure booking with instant QR tickets</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Share Event */}
              <Card className="card-premium mt-6">
                <CardHeader>
                  <CardTitle className="heading text-xl text-white">Share This Event</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = window.location.href;
                        const text = `Check out this amazing event: ${event.title}`;
                        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
                        window.open(whatsappUrl, '_blank');
                      }}
                      className="flex-1 border-green-500/20 text-green-400 hover:bg-green-500/10"
                      data-testid="share-whatsapp"
                    >
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = window.location.href;
                        const text = `Check out this amazing event: ${event.title} ${url}`;
                        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
                        window.open(twitterUrl, '_blank');
                      }}
                      className="flex-1 border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
                      data-testid="share-twitter"
                    >
                      Twitter
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success('Link copied to clipboard!');
                      }}
                      className="flex-1 border-slate-500/20 text-slate-400 hover:bg-slate-500/10"
                      data-testid="copy-link"
                    >
                      Copy Link
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EventDetailsPage;