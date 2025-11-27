import React, { useState } from 'react';
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Heart, Shield, Users, ArrowRight, Stethoscope, Calendar, MessageCircle, Star, CheckCircle, Activity, Award, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [hoveredUserType, setHoveredUserType] = useState<number | null>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const features = [
    {
      icon: Calendar,
      title: "Smart Booking",
      description: "AI-powered appointment scheduling with real-time availability and automated reminders",
      color: "bg-gradient-primary"
    },
    {
      icon: Shield,
      title: "HIPAA Compliant",
      description: "Bank-level security with end-to-end encryption for patient data protection",
      color: "bg-gradient-medical"
    },
    {
      icon: Activity,
      title: "Digital Health Records",
      description: "Comprehensive electronic health records with seamless provider integration",
      color: "bg-gradient-clinical"
    },
    {
      icon: Heart,
      title: "Telehealth Ready",
      description: "Built-in video consultations with secure messaging and file sharing",
      color: "bg-gradient-primary"
    }
  ];

  const userTypes = [
    {
      title: "For Patients",
      description: "Book appointments, access health records, and connect with verified healthcare providers",
      icon: Users,
      action: () => navigate("/signup?role=patient"),
      gradient: "bg-gradient-primary",
      features: ["Instant Appointment Booking", "Health Records Access", "Prescription Management", "24/7 Support"]
    },
    {
      title: "For Clinics",
      description: "Streamline operations, manage patient flow, and grow your medical practice efficiently",
      icon: Stethoscope,
      action: () => navigate("/clinic-signup"),
      gradient: "bg-gradient-clinical",
      features: ["Patient Management System", "Appointment Scheduling", "Practice Analytics", "Staff Coordination"]
    },
    {
      title: "For Doctors",
      description: "Access patient records, conduct consultations, and manage your medical practice seamlessly",
      icon: Heart,
      action: () => navigate("/doctor-signup?role=doctor"),
      gradient: "bg-gradient-medical",
      features: ["Electronic Health Records", "Telemedicine Platform", "Clinical Decision Support", "Professional Network"]
    }
  ];

  const medicalStats = [
    {
      value: "500+",
      label: "Verified Medical Centers",
      icon: Award,
      description: "Accredited healthcare facilities"
    },
    {
      value: "10K+",
      label: "Satisfied Patients",
      icon: Users,
      description: "Patients served monthly"
    },
    {
      value: "24/7",
      label: "Medical Support",
      icon: Clock,
      description: "Round-the-clock assistance"
    },
    {
      value: "99.9%",
      label: "System Uptime",
      icon: Shield,
      description: "Reliable healthcare platform"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-medical-50 to-clinical-50 text-foreground">

      {/* Header */}
      <header className="border-b border-primary-200 bg-white/90 backdrop-blur-sm sticky top-0 z-50 shadow-medical">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-primary rounded-xl shadow-medical">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">IgabayCare</span>
            <span className="text-xs text-medical-600 font-medium px-2 py-1 bg-medical-50 rounded-full border border-medical-200">Medical Platform</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-neutral-600 hover:text-primary-600 transition-colors font-medium flex items-center">
              <Activity className="h-4 w-4 mr-1" />
              Features
            </a>
            <a href="#about" className="text-neutral-600 hover:text-primary-600 transition-colors font-medium flex items-center">
              <Shield className="h-4 w-4 mr-1" />
              About
            </a>
            <Button variant="outline" size="sm" onClick={() => navigate("/signin")} className="border-primary-500 text-primary-600 hover:bg-primary-50">
              Patient Portal
            </Button>
            <Button variant="medical" size="sm" onClick={() => navigate("/clinic-signin")} className="bg-clinical-500 hover:bg-clinical-600">
              Provider Access
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-50/30 via-medical-50/30 to-clinical-50/30 rounded-3xl"></div>
        <div className="absolute top-10 left-10 w-20 h-20 bg-primary-200/30 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-medical-200/30 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-clinical-200/30 rounded-full blur-lg"></div>

        <div className="relative max-w-5xl mx-auto">
          <div className="animate-bounce-gentle mb-8">
            <div className="inline-flex items-center gap-3 bg-white/80 text-primary-700 px-6 py-3 rounded-full text-sm font-medium shadow-medical border border-primary-200">
              <div className="flex items-center">
                <Award className="h-4 w-4 text-clinical-500 mr-1" />
                <span className="text-clinical-600 font-semibold">HIPAA Compliant</span>
              </div>
              <div className="w-px h-4 bg-neutral-300"></div>
              <div className="flex items-center">
                <Shield className="h-4 w-4 text-primary-500 mr-1" />
                <span>Trusted by 500+ Clinics</span>
              </div>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 animate-slide-up leading-tight">
            Professional Healthcare,{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Digitally Enhanced
            </span>
          </h1>
          
          <p className="text-xl text-neutral-600 mb-8 max-w-3xl mx-auto animate-slide-up leading-relaxed">
            Connect patients with verified healthcare providers through our secure, 
            HIPAA-compliant platform. Streamline appointments, manage health records, 
            and deliver exceptional patient care.
          </p>
          
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up mb-12">
          <Button 
            variant="primary" 
            size="lg" 
            onClick={() => navigate("/signup")} 
            className="text-lg px-8 py-4 shadow-primary-glow hover:shadow-xl"
          >
            <Heart className="mr-2 h-5 w-5" />
            Start Your Healthcare Journey
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="text-lg px-8 py-4 border-primary-300 text-primary-700 hover:bg-primary-50"
          >
            <Link to="/learn-more" className="flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              <span>Learn About Security</span>
            </Link>
          </Button>
          <Button 
            variant="medical" 
            size="lg" 
            onClick={() => navigate("/chat")} 
            className="text-lg px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            Try AI Assistant
          </Button>
        </div>

          {/* Trust indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            {medicalStats.map((stat, index) => (
              <div 
                key={index} 
                className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-neutral-200 shadow-sm hover:shadow-md transition-all duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-center mb-2">
                  <div className="p-2 bg-gradient-primary rounded-lg">
                    <stat.icon className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-neutral-900 mb-1">{stat.value}</div>
                <div className="text-sm font-medium text-neutral-700 mb-1">{stat.label}</div>
                <div className="text-xs text-neutral-500">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-50/10 to-medical-50/10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Activity className="h-4 w-4" />
              Platform Features
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Advanced Healthcare Technology
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              Enterprise-grade features designed for modern healthcare delivery
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer ${
                  hoveredFeature === index ? 'ring-2 ring-primary-300 shadow-primary-glow' : ''
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <Card className="text-center transition-all duration-300 bg-white border border-neutral-200 shadow-medical-card group animate-fade-in h-full">
                  <CardHeader className="pb-4">
                    <div className={`mx-auto p-4 ${feature.color} rounded-2xl w-fit shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4`}>
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl text-foreground group-hover:text-primary-600 transition-colors mb-2">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-sm text-neutral-600 leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
          
          {/* Additional feature highlights */}
          <div className="mt-16 bg-gradient-to-r from-primary-50 to-medical-50 rounded-2xl p-8 border border-primary-200">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-neutral-900 mb-2">Why Healthcare Providers Choose Us</h3>
              <p className="text-neutral-600">Built specifically for medical professionals and healthcare organizations</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-clinical-100 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-clinical-600" />
                </div>
                <h4 className="font-semibold text-neutral-900 mb-1">HIPAA Compliance</h4>
                <p className="text-sm text-neutral-600">Full compliance with healthcare data protection standards</p>
              </div>
              <div className="text-center">
                <div className="bg-primary-100 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-primary-600" />
                </div>
                <h4 className="font-semibold text-neutral-900 mb-1">Real-time Sync</h4>
                <p className="text-sm text-neutral-600">Instant updates across all devices and platforms</p>
              </div>
              <div className="text-center">
                <div className="bg-medical-100 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <Award className="h-6 w-6 text-medical-600" />
                </div>
                <h4 className="font-semibold text-neutral-900 mb-1">Medical Grade</h4>
                <p className="text-sm text-neutral-600">Meets healthcare industry standards and regulations</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-20 bg-gradient-to-br from-primary-50/50 via-medical-50/30 to-clinical-50/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-medical-50 text-medical-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Stethoscope className="h-4 w-4" />
              Healthcare Solutions
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Tailored for Every Healthcare Role
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              Specialized platforms designed for patients, providers, and healthcare organizations
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {userTypes.map((type, index) => (
              <div
                key={index}
                className={`transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer ${
                  hoveredUserType === index ? 'ring-2 ring-primary-300 shadow-primary-glow' : ''
                }`}
                style={{ animationDelay: `${index * 0.2}s` }}
                onMouseEnter={() => setHoveredUserType(index)}
                onMouseLeave={() => setHoveredUserType(null)}
                onClick={type.action}
              >
                <Card className="hover:shadow-hover transition-all duration-300 bg-white border border-neutral-200 shadow-medical-card group animate-scale-in h-full">
                  <CardHeader className="text-center pb-4">
                    <div className={`mx-auto p-4 ${type.gradient} rounded-2xl w-fit shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4`}>
                      <type.icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl text-foreground mb-2">{type.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center flex-1 flex flex-col">
                    <CardDescription className="mb-6 text-neutral-600 leading-relaxed flex-1">
                      {type.description}
                    </CardDescription>
                    <div className="space-y-3 mb-6">
                      {type.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-sm text-neutral-600">
                          <div className="flex-shrink-0 w-5 h-5 bg-clinical-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-3 w-3 text-clinical-600" />
                          </div>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button 
                      variant="primary" 
                      size="md" 
                      className="w-full group-hover:shadow-glow bg-primary-500 hover:bg-primary-600 transition-all duration-300"
                    >
                      Get Started 
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
          
          {/* Integration highlight */}
          <div className="mt-16 text-center">
            <div className="bg-white rounded-2xl p-8 shadow-medical border border-neutral-200">
              <h3 className="text-2xl font-bold text-neutral-900 mb-4">Seamless Integration</h3>
              <p className="text-neutral-600 mb-6 max-w-2xl mx-auto">
                All platforms work together seamlessly, ensuring smooth communication between patients, 
                doctors, and healthcare facilities for optimal care coordination.
              </p>
              <div className="flex items-center justify-center space-x-8">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-primary-500" />
                  <span className="text-sm font-medium text-neutral-700">Patients</span>
                </div>
                <div className="w-8 h-px bg-neutral-300"></div>
                <div className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-medical-500" />
                  <span className="text-sm font-medium text-neutral-700">Doctors</span>
                </div>
                <div className="w-8 h-px bg-neutral-300"></div>
                <div className="flex items-center space-x-2">
                  <Stethoscope className="h-5 w-5 text-clinical-500" />
                  <span className="text-sm font-medium text-neutral-700">Clinics</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-primary-500 via-medical-500 to-clinical-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white/10 rounded-full blur-lg"></div>
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Trusted Healthcare Platform
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Join thousands of healthcare providers and patients using our secure platform
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {medicalStats.map((stat, index) => (
              <div key={index} className="animate-float" style={{ animationDelay: `${index * 0.5}s` }}>
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30">
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-white/90 font-medium mb-1">{stat.label}</div>
                  <div className="text-sm text-white/70">{stat.description}</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <Button 
              variant="outline" 
              size="lg" 
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
              onClick={() => navigate("/signup")}
            >
              Join Our Healthcare Network
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-primary rounded-lg shadow-lg">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">IgabayCare</span>
              </div>
              <p className="text-neutral-300 text-sm leading-relaxed mb-4">
                Professional healthcare technology platform designed for modern medical practice 
                and patient care coordination.
              </p>
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <div className="w-8 h-8 bg-medical-600 rounded-lg flex items-center justify-center">
                  <Award className="h-4 w-4 text-white" />
                </div>
                <div className="w-8 h-8 bg-clinical-600 rounded-lg flex items-center justify-center">
                  <Activity className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Platform
              </h3>
              <ul className="space-y-2 text-sm text-neutral-300">
                <li className="hover:text-primary-400 transition-colors cursor-pointer">For Patients</li>
                <li className="hover:text-primary-400 transition-colors cursor-pointer">For Clinics</li>
                <li className="hover:text-primary-400 transition-colors cursor-pointer">For Doctors</li>
                <li className="hover:text-primary-400 transition-colors cursor-pointer">For Administrators</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Security & Compliance
              </h3>
              <ul className="space-y-2 text-sm text-neutral-300">
                <li className="hover:text-primary-400 transition-colors cursor-pointer">HIPAA Compliance</li>
                <li className="hover:text-primary-400 transition-colors cursor-pointer">Data Security</li>
                <li className="hover:text-primary-400 transition-colors cursor-pointer">Privacy Policy</li>
                <li className="hover:text-primary-400 transition-colors cursor-pointer">Terms of Service</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white flex items-center">
                <Heart className="h-4 w-4 mr-2" />
                Support
              </h3>
              <ul className="space-y-2 text-sm text-neutral-300">
                <li className="hover:text-primary-400 transition-colors cursor-pointer">Help Center</li>
                <li className="hover:text-primary-400 transition-colors cursor-pointer">Contact Support</li>
                <li className="hover:text-primary-400 transition-colors cursor-pointer">Training Resources</li>
                <li className="hover:text-primary-400 transition-colors cursor-pointer">System Status</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-sm text-neutral-400 mb-4 md:mb-0">
                © 2024 IgabayCare. All rights reserved. HIPAA Compliant Healthcare Platform.
              </div>
              <div className="flex items-center space-x-6">
                <span className="text-xs text-neutral-500 flex items-center">
                  <Shield className="h-3 w-3 mr-1" />
                  SOC 2 Certified
                </span>
                <span className="text-xs text-neutral-500 flex items-center">
                  <Award className="h-3 w-3 mr-1" />
                  Medical Grade
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;