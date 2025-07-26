import { Button } from "../components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/newcard";
import { Heart, Shield, Clock, Users, ArrowRight, Stethoscope, Calendar, MessageCircle, Star, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Calendar,
      title: "Smart Booking",
      description: "AI-powered appointment scheduling with real-time availability",
      color: "bg-gradient-primary"
    },
    {
      icon: Shield,
      title: "Secure & Verified",
      description: "ML-validated clinic registrations and secure patient data",
      color: "bg-gradient-medical"
    },
    {
      icon: MessageCircle,
      title: "AI Assistant",
      description: "24/7 chatbot support for booking guidance and inquiries",
      color: "bg-gradient-secondary"
    },
    {
      icon: Heart,
      title: "Complete Care",
      description: "Comprehensive healthcare management in one platform",
      color: "bg-gradient-accent"
    }
  ];

  const userTypes = [
    {
      title: "For Patients",
      description: "Book appointments, manage health records, and connect with verified clinics",
      icon: Users,
      action: () => navigate("/signup?role=patient"),
      gradient: "bg-gradient-primary",
      features: ["Easy Appointment Booking", "Health Records Management", "24/7 AI Support"]
    },
    {
      title: "For Clinics",
      description: "Register your clinic, manage appointments, and grow your practice",
      icon: Stethoscope,
      action: () => navigate("/clinic-signup"),
      gradient: "bg-gradient-medical",
      features: ["Patient Management", "Appointment Scheduling", "Practice Analytics"]
    },
    {
      title: "For Doctors",
      description: "Access patient records, manage consultations, and streamline practice",
      icon: Heart,
      action: () => navigate("/signup?role=doctor"),
      gradient: "bg-gradient-secondary",
      features: ["Patient Records Access", "Consultation Management", "Practice Tools"]
    }
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
            <a href="#features" className="text-muted-foreground hover:text-primary-600 transition-colors font-medium">Features</a>
            <a href="#about" className="text-muted-foreground hover:text-primary-600 transition-colors font-medium">About</a>
            <Button variant="outline" size="sm" onClick={() => navigate("/signin")} className="border-primary-200 text-primary-600 hover:bg-primary-50">Sign In</Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-5"></div>
        <div className="relative max-w-4xl mx-auto">
          <div className="animate-bounce-gentle mb-8">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-full text-sm font-medium">
              <Star className="h-4 w-4 fill-primary-500" />
              Trusted by 10,000+ healthcare professionals
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 animate-slide-up leading-tight">
            Your Healthcare,{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Simplified
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up leading-relaxed">
            Connect with verified clinics, book appointments seamlessly, and manage your health journey with AI-powered assistance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Button variant="gradient" size="lg" onClick={() => navigate("/signup")} className="text-lg px-8 py-4">
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4 border-primary-200 text-primary-600 hover:bg-primary-50">
             <Link to="/learn-more"><span>Learn More</span></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-card relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-50/20 to-secondary-50/20"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Healthcare Innovation
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Advanced technology meets compassionate care
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-hover transition-all duration-300 bg-white border-0 shadow-card group animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardHeader>
                  <div className={`mx-auto p-4 ${feature.color} rounded-2xl w-fit shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl text-foreground">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Choose Your Journey
            </h2>
            <p className="text-xl text-muted-foreground">
              Tailored experiences for every healthcare need
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {userTypes.map((type, index) => (
              <Card key={index} className="hover:shadow-hover transition-all duration-300 bg-white border-0 shadow-card group cursor-pointer animate-scale-in" style={{ animationDelay: `${index * 0.2}s` }} onClick={type.action}>
                <CardHeader className="text-center">
                  <div className={`mx-auto p-4 ${type.gradient} rounded-2xl w-fit shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <type.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl text-foreground">{type.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="mb-6 text-muted-foreground leading-relaxed">
                    {type.description}
                  </CardDescription>
                  <div className="space-y-2 mb-6">
                    {type.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-medical-500" />
                        {feature}
                      </div>
                    ))}
                  </div>
                  <Button variant="primary" size="md" className="w-full group-hover:shadow-glow">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
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
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="animate-float">
              <div className="text-5xl font-bold text-secondary-600 mb-2">500+</div>
              <div className="text-secondary-100 font-medium">Verified Clinics</div>
            </div>
            <div className="animate-float" style={{ animationDelay: '0.5s' }}>
              <div className="text-5xl font-bold text-secondary-600 mb-2">10K+</div>
              <div className="text-secondary-100 font-medium">Happy Patients</div>
            </div>
            <div className="animate-float" style={{ animationDelay: '1s' }}>
              <div className="text-5xl font-bold text-secondary-600 mb-2">24/7</div>
              <div className="text-secondary-100 font-medium">AI Support</div>
            </div>
            <div className="animate-float" style={{ animationDelay: '1.5s' }}>
              <div className="text-5xl font-bold text-secondary-600 mb-2">99.9%</div>
              <div className="text-secondary-100 font-medium">Uptime</div>
            </div>
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

export default LandingPage;