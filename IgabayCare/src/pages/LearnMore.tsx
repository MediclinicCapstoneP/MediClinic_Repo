import { Button } from "../components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/newcard";
import { 
  Heart, 
  Shield, 
  Clock, 
  Users, 
  ArrowRight, 
  Stethoscope, 
  Calendar, 
  MessageCircle, 
  Star, 
  CheckCircle,
  Zap,
  Lock,
  Globe,
  Award,
  TrendingUp,
  Smartphone,
  Database,
  Brain,
  Eye,
  Handshake,
  Target,
  ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const LearnMore = () => {
  const navigate = useNavigate();

  const platformFeatures = [
    {
      icon: Brain,
      title: "AI-Powered Intelligence",
      description: "Advanced machine learning algorithms that understand healthcare workflows and provide intelligent recommendations",
      benefits: ["Smart appointment matching", "Predictive analytics", "Automated patient triage"]
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level security protocols ensuring your data is protected with the highest standards",
      benefits: ["HIPAA compliant", "End-to-end encryption", "Regular security audits"]
    },
    {
      icon: Globe,
      title: "Global Accessibility",
      description: "Access your healthcare platform from anywhere, anytime with our cloud-based solution",
      benefits: ["24/7 availability", "Cross-platform support", "Real-time synchronization"]
    }
  ];

  const technologyStack = [
    {
      icon: Zap,
      title: "Real-time Processing",
      description: "Lightning-fast appointment booking and data processing"
    },
    {
      icon: Database,
      title: "Scalable Infrastructure",
      description: "Built to handle millions of users and growing healthcare demands"
    },
    {
      icon: Smartphone,
      title: "Mobile-First Design",
      description: "Optimized for mobile devices with native app-like experience"
    }
  ];

  const testimonials = [
    {
      name: "Dr. Sarah Johnson",
      role: "Family Physician",
      clinic: "HealthFirst Medical Center",
      content: "iGabayAtiCare has transformed how we manage our practice. The AI-powered scheduling has reduced no-shows by 40%.",
      rating: 5
    },
    {
      name: "Maria Rodriguez",
      role: "Patient",
      content: "Booking appointments has never been easier. The chatbot helped me find the perfect specialist in minutes.",
      rating: 5
    },
    {
      name: "Dr. Michael Chen",
      role: "Cardiologist",
      clinic: "HeartCare Specialists",
      content: "The platform's security and ease of use make it our preferred choice for patient management.",
      rating: 5
    }
  ];

  const stats = [
    { number: "500+", label: "Verified Clinics", icon: Stethoscope },
    { number: "10K+", label: "Happy Patients", icon: Heart },
    { number: "24/7", label: "AI Support", icon: MessageCircle },
    { number: "99.9%", label: "Uptime", icon: Shield },
    { number: "40%", label: "Reduced No-shows", icon: TrendingUp },
    { number: "50+", label: "Cities Served", icon: Globe }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-50/30 to-secondary-50/30">
      {/* Header */}
      <header className="border-b border-primary-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-primary rounded-xl shadow-lg">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">iGabayAtiCare</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Button variant="outline" size="sm" onClick={() => navigate("/")} className="border-primary-200 text-primary-600 hover:bg-primary-50">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-5"></div>
        <div className="relative max-w-4xl mx-auto">
          <div className="animate-bounce-gentle mb-8">
            <div className="inline-flex items-center gap-2 bg-secondary-50 text-secondary-700 px-4 py-2 rounded-full text-sm font-medium">
              <Award className="h-4 w-4 fill-secondary-500" />
              Award-winning healthcare platform
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 animate-slide-up leading-tight">
            Discover How We{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Transform Healthcare
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up leading-relaxed">
            Learn about our innovative approach to healthcare management, powered by cutting-edge technology and designed for the future of medicine.
          </p>
        </div>
      </section>

      {/* Platform Overview */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Why Choose iGabayAtiCare?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We're not just another healthcare platform. We're a comprehensive solution that addresses the real challenges faced by healthcare providers and patients.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {platformFeatures.map((feature, index) => (
              <Card key={index} className="hover:shadow-hover transition-all duration-300 bg-white border-0 shadow-card group animate-fade-in" style={{ animationDelay: `${index * 0.2}s` }}>
                <CardHeader className="text-center">
                  <div className="mx-auto p-4 bg-gradient-secondary rounded-2xl w-fit shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl text-foreground">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground leading-relaxed mb-6">
                    {feature.description}
                  </CardDescription>
                  <div className="space-y-3">
                    {feature.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-sm">
                        <CheckCircle className="h-4 w-4 text-medical-500 flex-shrink-0" />
                        <span className="text-foreground">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 bg-gradient-card relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-50/20 to-secondary-50/20"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Built with Modern Technology
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our platform leverages the latest technologies to deliver exceptional performance and reliability.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {technologyStack.map((tech, index) => (
              <Card key={index} className="text-center hover:shadow-hover transition-all duration-300 bg-white border-0 shadow-card group animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardHeader>
                  <div className="mx-auto p-4 bg-gradient-primary rounded-2xl w-fit shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <tech.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl text-foreground">{tech.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                    {tech.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-secondary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-secondary-600/10 to-primary-600/10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Impact by the Numbers
            </h2>
            <p className="text-xl text-secondary-100 max-w-2xl mx-auto">
              Real results from real healthcare providers and patients.
            </p>
          </div>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center animate-float" style={{ animationDelay: `${index * 0.2}s` }}>
                <div className="mx-auto p-3 bg-white/20 rounded-2xl w-fit mb-4">
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-secondary-100 font-medium text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Hear from healthcare professionals and patients who have experienced the iGabayAtiCare difference.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-hover transition-all duration-300 bg-white border-0 shadow-card animate-fade-in" style={{ animationDelay: `${index * 0.3}s` }}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-accent-500 text-accent-500" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 leading-relaxed italic">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-primary rounded-full">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      {testimonial.clinic && (
                        <div className="text-sm text-primary-600">{testimonial.clinic}</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 to-secondary-600/10"></div>
        <div className="container mx-auto px-4 relative text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Healthcare Experience?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of healthcare providers and patients who have already discovered the future of healthcare management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="gradient" size="lg" onClick={() => navigate("/signup")} className="text-lg px-8 py-4 bg-white text-primary-600 hover:bg-gray-50">
              Get Started Today <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-primary-600">
              Schedule a Demo
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