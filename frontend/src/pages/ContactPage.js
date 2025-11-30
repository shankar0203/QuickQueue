import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Mail, Phone, MapPin, Send, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all fields');
      return;
    }
    
    try {
      setSubmitting(true);
      await axios.post('/contact', formData);
      toast.success('Message sent successfully!');
      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
      
      // Reset submitted state after 3 seconds
      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="section-gap container-padding">
        <div className="text-center mb-16">
          <h1 className="heading text-display text-white mb-6">Get in Touch</h1>
          <p className="text-body-lg max-w-2xl mx-auto">
            Have questions about QuickQueue or need help with your events? 
            We're here to help you create amazing experiences.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="heading text-2xl text-white flex items-center">
                  <MessageSquare className="w-6 h-6 mr-2" />
                  Send us a Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Message Sent!</h3>
                    <p className="text-slate-400">
                      Thank you for reaching out. We'll get back to you within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Your Name *
                        </label>
                        <Input
                          type="text"
                          placeholder="Enter your full name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="input-premium"
                          required
                          data-testid="contact-name-input"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Email Address *
                        </label>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="input-premium"
                          required
                          data-testid="contact-email-input"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Message *
                      </label>
                      <Textarea
                        placeholder="Tell us how we can help you..."
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        className="input-premium min-h-[150px]"
                        required
                        data-testid="contact-message-input"
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      className="w-full btn-primary py-6 text-lg"
                      disabled={submitting}
                      data-testid="submit-contact-button"
                    >
                      {submitting ? (
                        <>
                          <div className="spinner mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                    
                    <p className="text-slate-500 text-sm text-center">
                      We'll respond to your message within 24 hours during business days.
                    </p>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Details */}
            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="heading text-xl text-white">Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">Email Us</h4>
                      <p className="text-slate-400 text-sm mb-2">
                        Get support or ask questions
                      </p>
                      <a 
                        href="mailto:support@quickqueue.com"
                        className="text-primary hover:text-primary/80 text-sm"
                        data-testid="contact-email-link"
                      >
                        support@quickqueue.com
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">Call Us</h4>
                      <p className="text-slate-400 text-sm mb-2">
                        Mon-Fri, 9 AM - 6 PM IST
                      </p>
                      <a 
                        href="tel:+91-8888-999-000"
                        className="text-green-400 hover:text-green-300 text-sm"
                        data-testid="contact-phone-link"
                      >
                        +91 8888 999 000
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">Visit Us</h4>
                      <p className="text-slate-400 text-sm mb-2">
                        Our office location
                      </p>
                      <address className="text-amber-400 text-sm not-italic">
                        Koramangala, Bangalore<br />
                        Karnataka 560095, India
                      </address>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Response Time */}
            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="heading text-xl text-white">Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-white font-medium text-sm">Email Support</p>
                      <p className="text-slate-400 text-xs">Within 24 hours</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-white font-medium text-sm">Phone Support</p>
                      <p className="text-slate-400 text-xs">Immediate assistance</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-white font-medium text-sm">Live Chat</p>
                      <p className="text-slate-400 text-xs">Available 9 AM - 6 PM</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Help */}
            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="heading text-xl text-white">Quick Help</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-slate-300 text-sm mb-4">
                    Looking for quick answers? Check out our most common topics:
                  </p>
                  
                  <div className="space-y-2">
                    <button className="w-full text-left p-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/30 rounded transition-colors">
                      How to create an event?
                    </button>
                    <button className="w-full text-left p-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/30 rounded transition-colors">
                      Payment and refund policy
                    </button>
                    <button className="w-full text-left p-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/30 rounded transition-colors">
                      QR code not working?
                    </button>
                    <button className="w-full text-left p-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/30 rounded transition-colors">
                      How to become an organizer?
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 container-padding border-t border-white/10">
        <div className="text-center mb-12">
          <h2 className="heading text-heading text-white mb-4">Frequently Asked Questions</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Find answers to common questions about QuickQueue and our event management platform.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="card-premium">
            <CardContent className="p-6">
              <h3 className="text-white font-semibold mb-2">How do QR tickets work?</h3>
              <p className="text-slate-300 text-sm">
                After payment, you'll receive a unique QR code ticket. Simply show this QR code 
                at the venue entrance for quick and contactless entry.
              </p>
            </CardContent>
          </Card>
          
          <Card className="card-premium">
            <CardContent className="p-6">
              <h3 className="text-white font-semibold mb-2">Can I get a refund?</h3>
              <p className="text-slate-300 text-sm">
                Refund policies vary by event organizer. Please check the event terms and 
                conditions or contact the organizer directly for refund requests.
              </p>
            </CardContent>
          </Card>
          
          <Card className="card-premium">
            <CardContent className="p-6">
              <h3 className="text-white font-semibold mb-2">How do I become an organizer?</h3>
              <p className="text-slate-300 text-sm">
                Sign up for a QuickQueue account and contact our support team to get organizer 
                access. We'll verify your details and activate your organizer privileges.
              </p>
            </CardContent>
          </Card>
          
          <Card className="card-premium">
            <CardContent className="p-6">
              <h3 className="text-white font-semibold mb-2">Is my payment secure?</h3>
              <p className="text-slate-300 text-sm">
                Yes! We use industry-standard encryption and trusted payment gateways like 
                Razorpay to ensure your payment information is completely secure.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;