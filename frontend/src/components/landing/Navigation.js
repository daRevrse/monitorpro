// src/components/landing/Navigation.js
import React, { useState, useEffect } from "react";
import { Menu, X, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../common/Button";
import { cn } from "../../utils/cn";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMenuOpen(false);
    }
  };

  const navClasses = cn(
    "fixed w-full top-0 z-50 transition-all duration-300",
    isScrolled ? "bg-white/95 backdrop-blur-sm shadow-lg" : "bg-transparent"
  );

  const textClasses = cn(
    "transition-colors duration-300 font-medium",
    isScrolled
      ? "text-gray-900 hover:text-primary-800"
      : "text-white hover:text-gray-200"
  );

  const logoClasses = cn(
    "transition-colors duration-300 text-xl font-bold",
    isScrolled ? "text-gray-900" : "text-white"
  );

  return (
    <nav className={navClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div
            className="flex items-center cursor-pointer"
            onClick={() => scrollToSection("hero")}
          >
            <div className="w-8 h-8 bg-primary-800 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className={logoClasses}>MonitorPro</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection("features")}
              className={textClasses}
            >
              Fonctionnalités
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className={textClasses}
            >
              Tarifs
            </button>
            <button
              onClick={() => scrollToSection("testimonials")}
              className={textClasses}
            >
              Témoignages
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className={textClasses}
            >
              Contact
            </button>
            <Link to="/login" className={textClasses}>
              Connexion
            </Link>
            <Button
              variant={isScrolled ? "primary" : "white"}
              size="sm"
              onClick={() => scrollToSection("signup")}
            >
              Commencer
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={cn("p-2 rounded-md transition-colors", textClasses)}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 py-6 space-y-4">
              <button
                onClick={() => scrollToSection("features")}
                className="block w-full text-left text-gray-700 hover:text-primary-800 transition-colors py-2"
              >
                Fonctionnalités
              </button>
              <button
                onClick={() => scrollToSection("pricing")}
                className="block w-full text-left text-gray-700 hover:text-primary-800 transition-colors py-2"
              >
                Tarifs
              </button>
              <button
                onClick={() => scrollToSection("testimonials")}
                className="block w-full text-left text-gray-700 hover:text-primary-800 transition-colors py-2"
              >
                Témoignages
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="block w-full text-left text-gray-700 hover:text-primary-800 transition-colors py-2"
              >
                Contact
              </button>
              <Link
                to="/login"
                className="block text-primary-800 hover:text-primary-700 transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Connexion
              </Link>
              <Button
                variant="primary"
                className="w-full mt-4"
                onClick={() => scrollToSection("signup")}
              >
                Commencer
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
