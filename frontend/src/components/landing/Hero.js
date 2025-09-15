// src/components/landing/Hero.js
import React from "react";
import { Shield, Zap, Globe, Play } from "lucide-react";
import Button from "../common/Button";

const Hero = () => {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="hero"
      className="bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 min-h-screen flex items-center relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-black opacity-10"></div>

      {/* Floating icons avec animations */}
      <div className="floating-icons absolute top-20 right-20 text-white opacity-20 animate-pulse-bordeaux">
        <Shield className="w-16 h-16" />
      </div>
      <div
        className="floating-icons absolute bottom-32 left-16 text-white opacity-20"
        style={{ animationDelay: "-2s" }}
      >
        <Zap className="w-12 h-12" />
      </div>
      <div
        className="floating-icons absolute top-40 left-1/4 text-white opacity-20"
        style={{ animationDelay: "-4s" }}
      >
        <Globe className="w-14 h-14" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center text-white">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Surveillez vos sites web
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mt-2">
              24/7 sans effort
            </span>
          </h1>

          <p className="text-lg md:text-xl lg:text-2xl mb-8 text-gray-100 max-w-3xl mx-auto leading-relaxed">
            Détectez les pannes instantanément, recevez des alertes en temps
            réel et garantissez une disponibilité maximale pour vos clients.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              variant="white"
              size="lg"
              onClick={() => scrollToSection("signup")}
              className="transform hover:scale-105 transition-transform"
            >
              🚀 Essai gratuit 14 jours
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => scrollToSection("demo")}
              className="border-white text-white hover:bg-white hover:text-primary-800"
            >
              <Play className="w-5 h-5 mr-2" />
              Voir la démo
            </Button>
          </div>

          <div className="text-sm text-gray-200 space-y-2">
            <div className="flex flex-wrap justify-center gap-6 text-center">
              <span className="flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                Sans engagement
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                Configuration en 2 minutes
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                Support français
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
