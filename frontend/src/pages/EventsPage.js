import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Search, Filter, Calendar, MapPin, Clock, Users, Grid, List, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';

const EventsPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [loading, setLoading] = useState(true);

  const categories = [
    'Music', 'Stand-up', 'Workshops', 'Exhibitions', 
    'College fests', 'Sports', 'Temple booking', 'Societies'
  ];

  const filters = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'free', label: 'Free Events' },
    { value: 'paid', label: 'Paid Events' }
  ];

  useEffect(() => {
    fetchEvents();
  }, [searchTerm, selectedCategory, selectedFilter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedFilter) params.append('filter_type', selectedFilter);
      
      const response = await axios.get(`/events?${params.toString()}`);
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
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

  const getLowestPrice = (ticketTypes) => {
    const prices = ticketTypes.map(t => t.price).filter(p => p > 0);
    if (prices.length === 0) return 'Free';
    return `₹${Math.min(...prices)}`;
  };

  const EventCard = ({ event, isListView = false }) => (
    <Card className={`card-premium group cursor-pointer ${isListView ? 'flex-row overflow-hidden' : ''}`} data-testid={`event-card-${event.id}`}>
      {isListView ? (
        <>
          <div className="w-48 relative flex-shrink-0">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
            <Badge className="absolute top-4 left-4 badge-neutral">
              {event.category}
            </Badge>
          </div>
          
          <CardContent className="flex-1 p-6 flex justify-between items-center">
            <div className="flex-1">
              <h3 className="heading text-xl font-semibold mb-2 text-white group-hover:text-primary transition-colors">
                {event.title}
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div className="flex items-center text-slate-400 text-sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  {formatDate(event.date)}
                </div>
                <div className="flex items-center text-slate-400 text-sm">
                  <MapPin className="w-4 h-4 mr-2" />
                  {event.venue}
                </div>
                <div className="flex items-center text-slate-400 text-sm">
                  <Clock className="w-4 h-4 mr-2" />
                  {event.duration} hours
                </div>
                <div className="flex items-center text-slate-400 text-sm">
                  <Users className="w-4 h-4 mr-2" />
                  by {event.organizer_name}
                </div>
              </div>
              
              <p className="text-slate-300 text-sm line-clamp-2">
                {event.description}
              </p>
            </div>
            
            <div className="flex flex-col items-end space-y-3 ml-6">
              <Badge className="badge-success text-lg px-4 py-2">
                {getLowestPrice(event.ticket_types)}
              </Badge>
              <Link to={`/events/${event.id}`}>
                <Button className="btn-primary px-6" data-testid={`book-now-${event.id}`}>
                  Book Now
                </Button>
              </Link>
            </div>
          </CardContent>
        </>
      ) : (
        <>
          <div className="relative overflow-hidden">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <Badge className="absolute top-4 left-4 badge-neutral">
              {event.category}
            </Badge>
            <Badge className="absolute top-4 right-4 badge-success">
              {getLowestPrice(event.ticket_types)}
            </Badge>
          </div>
          
          <CardContent className="p-6">
            <h3 className="heading text-xl font-semibold mb-2 text-white group-hover:text-primary transition-colors">
              {event.title}
            </h3>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-slate-400 text-sm">
                <Calendar className="w-4 h-4 mr-2" />
                {formatDate(event.date)}
              </div>
              <div className="flex items-center text-slate-400 text-sm">
                <MapPin className="w-4 h-4 mr-2" />
                {event.venue}
              </div>
              <div className="flex items-center text-slate-400 text-sm">
                <Clock className="w-4 h-4 mr-2" />
                {event.duration} hours
              </div>
              <div className="flex items-center text-slate-400 text-sm">
                <Users className="w-4 h-4 mr-2" />
                by {event.organizer_name}
              </div>
            </div>
            
            <p className="text-slate-300 text-sm mb-4 line-clamp-2">
              {event.description}
            </p>
            
            <Link to={`/events/${event.id}`}>
              <Button className="w-full btn-primary" data-testid={`book-now-${event.id}`}>
                Book Now
              </Button>
            </Link>
          </CardContent>
        </>
      )}
    </Card>
  );

  return (
    <div className="pt-16">
      <div className="section-gap container-padding">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="heading text-heading mb-2">All Events</h1>
            <p className="text-slate-400">Discover amazing events happening around you</p>
          </div>
          
          {user && (user.role === 'organizer' || user.role === 'admin') && (
            <Link to="/dashboard">
              <Button className="btn-primary" data-testid="create-event-button">
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </Link>
          )}
        </div>

        {/* Search and Filters */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
              <Input
                placeholder="Search events, venues, organizers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-premium pl-10"
                data-testid="search-events-input"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory || "all"} onValueChange={(value) => setSelectedCategory(value === "all" ? "" : value)}>
              <SelectTrigger className="input-premium" data-testid="category-filter">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Time Filter */}
            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger className="input-premium" data-testid="time-filter">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                <SelectItem value="">All Time</SelectItem>
                {filters.map(filter => (
                  <SelectItem key={filter.value} value={filter.value}>{filter.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-slate-400">
            {loading ? 'Loading...' : `${events.length} events found`}
          </p>
          
          <div className="flex bg-slate-900/50 rounded-lg p-1 border border-white/10">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}
              data-testid="grid-view-button"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}
              data-testid="list-view-button"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Events */}
        {loading ? (
          <div className="text-center py-12">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-slate-400">Loading amazing events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No events found matching your criteria</p>
            <p className="text-slate-500 text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' : 'space-y-6'}>
            {events.map((event) => (
              <EventCard key={event.id} event={event} isListView={viewMode === 'list'} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;