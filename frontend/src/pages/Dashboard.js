import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Plus, Calendar, Users, DollarSign, TrendingUp, Eye, Edit, Trash2,
  QrCode, Download, CheckCircle, Clock, MapPin, Ticket
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import axios from 'axios';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [events, setEvents] = useState([]);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    venue: '',
    date: '',
    duration: 2,
    category: '',
    image_url: '',
    ticket_types: [{ name: 'General', price: 0, available: 100 }],
    terms: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    'Music', 'Stand-up', 'Workshops', 'Exhibitions', 
    'College fests', 'Sports', 'Temple booking', 'Societies'
  ];

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      if (user?.role === 'admin') {
        const response = await axios.get('/dashboard/admin');
        setDashboardData(response.data);
        setEvents(response.data.recent_events || []);
      } else if (user?.role === 'organizer') {
        const response = await axios.get('/dashboard/organizer');
        setDashboardData(response.data);
        setEvents(response.data.events || []);
      } else {
        // Regular user - show their bookings
        const eventsResponse = await axios.get('/events');
        setEvents(eventsResponse.data.slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    
    if (!newEvent.title || !newEvent.venue || !newEvent.date) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      setSubmitting(true);
      await axios.post('/events', newEvent);
      toast.success('Event created successfully!');
      setShowCreateEvent(false);
      setNewEvent({
        title: '',
        description: '',
        venue: '',
        date: '',
        duration: 2,
        category: '',
        image_url: '',
        ticket_types: [{ name: 'General', price: 0, available: 100 }],
        terms: ''
      });
      fetchDashboardData();
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  const addTicketType = () => {
    setNewEvent(prev => ({
      ...prev,
      ticket_types: [...prev.ticket_types, { name: '', price: 0, available: 100 }]
    }));
  };

  const updateTicketType = (index, field, value) => {
    setNewEvent(prev => ({
      ...prev,
      ticket_types: prev.ticket_types.map((ticket, i) => 
        i === index ? { ...ticket, [field]: value } : ticket
      )
    }));
  };

  const removeTicketType = (index) => {
    if (newEvent.ticket_types.length > 1) {
      setNewEvent(prev => ({
        ...prev,
        ticket_types: prev.ticket_types.filter((_, i) => i !== index)
      }));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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
          <p className="text-white">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16">
      <div className="section-gap container-padding">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="heading text-heading text-white mb-2">
              {user?.role === 'admin' ? 'Admin Dashboard' : 
               user?.role === 'organizer' ? 'Organizer Dashboard' : 'My Dashboard'}
            </h1>
            <p className="text-slate-400">
              Welcome back, {user?.name}!
            </p>
          </div>
          
          {(user?.role === 'organizer' || user?.role === 'admin') && (
            <Dialog open={showCreateEvent} onOpenChange={setShowCreateEvent}>
              <DialogTrigger asChild>
                <Button className="btn-primary" data-testid="create-event-button">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-white/10">
                <DialogHeader>
                  <DialogTitle className="heading text-2xl text-white">Create New Event</DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleCreateEvent} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Event Title *
                      </label>
                      <Input
                        type="text"
                        placeholder="Enter event title"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                        className="input-premium"
                        required
                        data-testid="event-title-input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Category *
                      </label>
                      <Select value={newEvent.category} onValueChange={(value) => setNewEvent(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger className="input-premium">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10">
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Description *
                    </label>
                    <Textarea
                      placeholder="Describe your event..."
                      value={newEvent.description}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                      className="input-premium min-h-[120px]"
                      required
                      data-testid="event-description-input"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Venue *
                      </label>
                      <Input
                        type="text"
                        placeholder="Event venue"
                        value={newEvent.venue}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, venue: e.target.value }))}
                        className="input-premium"
                        required
                        data-testid="event-venue-input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Date & Time *
                      </label>
                      <Input
                        type="datetime-local"
                        value={newEvent.date}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                        className="input-premium"
                        required
                        data-testid="event-date-input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Duration (hours)
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="24"
                        value={newEvent.duration}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                        className="input-premium"
                        data-testid="event-duration-input"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Event Image URL
                    </label>
                    <Input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={newEvent.image_url}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, image_url: e.target.value }))}
                      className="input-premium"
                      data-testid="event-image-input"
                    />
                  </div>
                  
                  {/* Ticket Types */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-slate-300">
                        Ticket Types
                      </label>
                      <Button
                        type="button"
                        onClick={addTicketType}
                        className="btn-secondary text-xs py-2 px-3"
                        data-testid="add-ticket-type-button"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Type
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {newEvent.ticket_types.map((ticket, index) => (
                        <div key={index} className="grid grid-cols-4 gap-2 p-3 border border-white/10 rounded-lg">
                          <Input
                            placeholder="Type name"
                            value={ticket.name}
                            onChange={(e) => updateTicketType(index, 'name', e.target.value)}
                            className="input-premium"
                            data-testid={`ticket-name-${index}`}
                          />
                          <Input
                            type="number"
                            min="0"
                            placeholder="Price"
                            value={ticket.price}
                            onChange={(e) => updateTicketType(index, 'price', parseFloat(e.target.value) || 0)}
                            className="input-premium"
                            data-testid={`ticket-price-${index}`}
                          />
                          <Input
                            type="number"
                            min="1"
                            placeholder="Available"
                            value={ticket.available}
                            onChange={(e) => updateTicketType(index, 'available', parseInt(e.target.value) || 0)}
                            className="input-premium"
                            data-testid={`ticket-available-${index}`}
                          />
                          {newEvent.ticket_types.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => removeTicketType(index)}
                              className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                              data-testid={`remove-ticket-${index}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Terms & Conditions
                    </label>
                    <Textarea
                      placeholder="Event terms and conditions..."
                      value={newEvent.terms}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, terms: e.target.value }))}
                      className="input-premium"
                      data-testid="event-terms-input"
                    />
                  </div>
                  
                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      className="btn-primary flex-1"
                      disabled={submitting}
                      data-testid="submit-event-button"
                    >
                      {submitting ? (
                        <>
                          <div className="spinner mr-2"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <Calendar className="w-4 h-4 mr-2" />
                          Create Event
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowCreateEvent(false)}
                      className="btn-secondary"
                      data-testid="cancel-event-button"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Stats Cards */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="card-premium">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Total Events</p>
                    <p className="text-2xl font-bold text-white">
                      {dashboardData.stats?.total_events || events.length}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="card-premium">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold text-white">
                      ₹{dashboardData.stats?.total_revenue?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="card-premium">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">
                      {user?.role === 'admin' ? 'Total Users' : 'Tickets Sold'}
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {dashboardData.stats?.total_users || dashboardData.stats?.total_tickets_sold || '0'}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="card-premium">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">
                      {user?.role === 'admin' ? 'Total Bookings' : 'Check-ins'}
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {dashboardData.stats?.total_bookings || dashboardData.stats?.total_check_ins || '0'}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-amber-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Events List */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="heading text-2xl text-white flex items-center">
              <Calendar className="w-6 h-6 mr-2" />
              {user?.role === 'admin' ? 'Recent Events' : 
               user?.role === 'organizer' ? 'My Events' : 'Available Events'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg mb-2">No events found</p>
                <p className="text-slate-500 text-sm">
                  {(user?.role === 'organizer' || user?.role === 'admin') ? 
                    'Create your first event to get started' : 
                    'Check back later for new events'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border border-white/10 rounded-lg hover:border-primary/30 transition-colors"
                    data-testid={`event-item-${event.id}`}
                  >
                    <div className="flex items-start space-x-4 flex-1">
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-lg mb-1">{event.title}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-400 mb-2">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(event.date)}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {event.venue}
                          </div>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {event.organizer_name}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <Badge className="badge-neutral">{event.category}</Badge>
                          <Badge className={`px-2 py-1 text-xs ${
                            event.status === 'published' ? 'badge-success' :
                            event.status === 'draft' ? 'badge-warning' :
                            'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {event.status?.toUpperCase() || 'PUBLISHED'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-4 md:mt-0">
                      <Link to={`/events/${event.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/10 text-slate-300 hover:text-white"
                          data-testid={`view-event-${event.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      
                      {(user?.role === 'organizer' || user?.role === 'admin') && event.organizer_id === user?.id && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
                            data-testid={`edit-event-${event.id}`}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-green-500/20 text-green-400 hover:bg-green-500/10"
                            data-testid={`qr-scanner-${event.id}`}
                          >
                            <QrCode className="w-4 h-4 mr-1" />
                            QR Scanner
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;