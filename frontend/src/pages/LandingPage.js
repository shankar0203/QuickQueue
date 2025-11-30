import React from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { Search, Filter, Calendar, MapPin, Clock, Users, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

const LandingPage = () => {
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('');
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

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="section-gap container-padding">
        <div className="hero-grid">
          <div className="hero-text animate-fade-up">
            <h1 className="heading text-display text-gradient mb-6">
              Book Local Events Easily. Skip the Queue.
            </h1>
            <p className="text-body-lg mb-8 max-w-2xl">
              QR-based smart ticketing for events, fests, exhibitions, temples & more. 
              Experience seamless booking with instant digital tickets.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                className="btn-primary"
                onClick={() => document.getElementById('events-section').scrollIntoView({ behavior: 'smooth' })}
                data-testid="find-events-button"
              >
                <Search className="w-5 h-5" />
                Find Events
              </Button>
              <Link to="/dashboard">
                <Button
                  className="btn-secondary"
                  data-testid="create-event-button"
                >
                  <Calendar className="w-5 h-5" />
                  Create Event
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="hero-image">
            <img
              src="https://images.unsplash.com/photo-1514701041007-014cfeef450e?q=80&w=2000&auto=format&fit=crop"
              alt="Live Event"
              className="absolute inset-0 w-full h-full object-cover rounded-2xl mask-gradient-b"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent rounded-2xl" />
          </div>
        </div>
      </section>

      {/* Events Discovery Section */}
      <section id="events-section" className="section-gap container-padding">
        <div className="text-center mb-16">
          <h2 className="heading text-heading mb-4">Discover Amazing Events</h2>
          <p className="text-body-lg max-w-2xl mx-auto">
            Find the perfect event for you with our smart search and filtering system.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
            <Select value={selectedFilter || "all"} onValueChange={(value) => setSelectedFilter(value === "all" ? "" : value)}>
              <SelectTrigger className="input-premium" data-testid="time-filter">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                <SelectItem value="all">All Time</SelectItem>
                {filters.map(filter => (
                  <SelectItem key={filter.value} value={filter.value}>{filter.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Events Grid */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <Card key={event.id} className="card-premium group cursor-pointer" data-testid={`event-card-${event.id}`}>
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
                    <Button
                      className="w-full btn-primary"
                      data-testid={`book-now-${event.id}`}
                    >
                      <Star className="w-4 h-4" />
                      Book Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-24">
        <div className="container-padding py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Q</span>
                </div>
                <span className="heading text-xl font-bold text-white">QuickQueue</span>
              </div>
              <p className="text-slate-400 max-w-md">
                Revolutionizing event ticketing with QR-based smart technology. 
                Book events easily and skip the queue.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <div className="space-y-2">
                <Link to="/" className="block text-slate-400 hover:text-white transition-colors">About</Link>
                <Link to="/" className="block text-slate-400 hover:text-white transition-colors">Terms</Link>
                <Link to="/" className="block text-slate-400 hover:text-white transition-colors">Privacy</Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <div className="space-y-2">
                <Link to="/contact" className="block text-slate-400 hover:text-white transition-colors">Contact</Link>
                <Link to="/" className="block text-slate-400 hover:text-white transition-colors">Help Center</Link>
                <Link to="/" className="block text-slate-400 hover:text-white transition-colors">FAQs</Link>
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-8 pt-8 text-center">
            <p className="text-slate-500 text-sm">
              © 2025 QuickQueue. All rights reserved. Crafted with premium design.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;