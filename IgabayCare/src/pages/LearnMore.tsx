import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Star, Users, Shield, Clock, Heart, Zap, Award, Globe, Play, Download, Mail, Phone, MapPin, TrendingUp, Activity, Building, UserCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

const LearnMore = () => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: Shield,
      title: "Secure & HIPAA Compliant",
      description: "Your health data is protected with enterprise-grade security and full HIPAA compliance",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "AI-powered booking and instant notifications for seamless healthcare access",
      color: "from-yellow-500 to-orange-500",
      bgColor: "bg-yellow-50"
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Built by healthcare professionals for better patient care and clinic management",
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50"
    },
    {
      icon: Globe,
      title: "Accessible Everywhere",
      description: "Available on web and mobile devices for healthcare on-the-go",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  const testimonials = [
    {
      name: "Dr. Sarah Johnson",
      role: "Family Physician",
      clinic: "HealthFirst Medical Center",
      content: "iGabayAtiCare has transformed how we manage our practice. The AI assistant helps patients 24/7, and the booking system is incredibly efficient.",
      rating: 5,
      avatar: "https://images.pexels.com/photos/4167541/pexels-photo-4167541.jpeg?auto=compress&cs=tinysrgb&w=100"
    },
    {
      name: "Maria Rodriguez",
      role: "Patient",
      clinic: "Regular User",
      content: "Finding and booking appointments has never been easier. The platform is intuitive and the AI assistant is incredibly helpful.",
      rating: 5,
      avatar: "https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=100"
    },
    {
      name: "Dr. Michael Chen",
      role: "Clinic Director",
      clinic: "Metro Wellness Center",
      content: "The analytics and patient management tools have helped us improve our efficiency and patient satisfaction significantly.",
      rating: 5,
      avatar: "https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=100"
    }
  ];

  const stats = [
    {
      value: "500+",
      label: "Verified Clinics",
      icon: Building,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      value: "10K+",
      label: "Happy Patients",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      value: "24/7",
      label: "AI Support",
      icon: Activity,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      value: "99.9%",
      label: "Uptime",
      icon: Shield,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  const techStack = [
    { name: "React", category: "Frontend" },
    { name: "TypeScript", category: "Language" },
    { name: "Supabase", category: "Backend" },
    { name: "Tailwind CSS", category: "Styling" },
    { name: "AI/ML", category: "Intelligence" },
    { name: "PostgreSQL", category: "Database" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-5"></div>
        <div className="relative max-w-4xl mx-auto">
          <div className="animate-bounce-gentle mb-8">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-full text-sm font-medium">
              <Star className="h-4 w-4 fill-primary-500" />
              Learn more about our platform
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 animate-slide-up leading-tight">
            Discover{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              iGabayAtiCare
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up leading-relaxed">
            A comprehensive healthcare platform that connects patients with verified clinics through AI-powered technology and compassionate care.
          </p>
          <div className="flex flex-wrap justify-center gap-4 animate-slide-up">
            <Button variant="primary" size="lg" onClick={() => window.location.href = '/signup'}>
              Get Started Today <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg">
              <Play className="mr-2 h-4 w-4" />
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className={`text-center transform transition-all duration-300 hover:scale-105 cursor-pointer ${
                  hoveredCard === index ? 'ring-2 ring-primary-200' : ''
                }`}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className={`inline-flex p-4 rounded-full ${stat.bgColor} mb-4`}>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-r from-primary-50/50 to-secondary-50/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-50/20 to-secondary-50/20"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Why Choose iGabayAtiCare?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Advanced technology meets compassionate care
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer ${
                  hoveredCard === index ? 'ring-2 ring-primary-200' : ''
                }`}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <Card className="text-center transition-all duration-300 bg-white border-0 shadow-card group h-full">
                  <CardContent className="p-6">
                    <div className={`mx-auto p-4 bg-gradient-to-r ${feature.color} rounded-2xl w-fit shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4`}>
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Built with Modern Technology
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Cutting-edge tools and frameworks for reliable healthcare solutions
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {techStack.map((tech, index) => (
              <Card
                key={tech.name}
                className="text-center group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                    {tech.name}
                  </div>
                  <div className="text-sm text-gray-500">{tech.category}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-r from-secondary-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Real feedback from healthcare professionals and patients
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <Card className="relative overflow-hidden">
              <CardContent className="p-0">
                <div className="relative h-96">
                  {testimonials.map((testimonial, index) => (
                    <div
                      key={testimonial.name}
                      className={`absolute inset-0 p-8 transition-all duration-500 ${
                        activeTestimonial === index ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
                      }`}
                    >
                      <div className="text-center h-full flex flex-col justify-center">
                        <div className="flex justify-center mb-6">
                          <img
                            src={testimonial.avatar}
                            alt={testimonial.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        </div>
                        <div className="flex justify-center mb-4">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                          ))}
                        </div>
                        <blockquote className="text-lg text-gray-700 mb-6 italic">
                          "{testimonial.content}"
                        </blockquote>
                        <div>
                          <div className="font-semibold text-gray-900">{testimonial.name}</div>
                          <div className="text-sm text-gray-600">{testimonial.role} • {testimonial.clinic}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Navigation Dots */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {testimonials.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveTestimonial(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          activeTestimonial === index ? 'bg-primary-600 w-6' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 relative text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Healthcare?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of healthcare professionals and patients who trust iGabayAtiCare
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              variant="gradient" 
              size="lg"
              onClick={() => window.location.href = '/signup'}
              className="bg-white text-primary-600 hover:bg-gray-50"
            >
              Get Started Today <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-white text-white hover:bg-white hover:text-primary-600"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-primary-100 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-gradient-primary rounded-lg shadow-lg">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold bg-gradient-hero bg-clip-text text-transparent">iGabayAtiCare</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Revolutionizing healthcare access through technology and compassion.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-foreground">Platform</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-primary-600 transition-colors cursor-pointer">For Patients</li>
                <li className="hover:text-primary-600 transition-colors cursor-pointer">For Clinics</li>
                <li className="hover:text-primary-600 transition-colors cursor-pointer">For Doctors</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-foreground">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-primary-600 transition-colors cursor-pointer">Help Center</li>
                <li className="hover:text-primary-600 transition-colors cursor-pointer">Contact Us</li>
                <li className="hover:text-primary-600 transition-colors cursor-pointer">Privacy Policy</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-foreground">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-primary-600 transition-colors cursor-pointer">About Us</li>
                <li className="hover:text-primary-600 transition-colors cursor-pointer">Careers</li>
                <li className="hover:text-primary-600 transition-colors cursor-pointer">Press</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-primary-100 mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2024 iGabayAtiCare. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LearnMore; 