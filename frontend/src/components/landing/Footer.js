// src/components/landing/Footer.js
import React, { useState } from "react";
import { Activity, Twitter, Linkedin, Github, X } from "lucide-react";
import Button from "../common/Button";

const Footer = () => {
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    // Ici vous ajouteriez l'appel API
    console.log("Contact form submitted:", contactForm);
    alert("Merci ! Nous vous contacterons bientôt.");
    setShowContactModal(false);
    setContactForm({ name: "", email: "", company: "", message: "" });
  };

  const handleContactInputChange = (e) => {
    const { name, value } = e.target;
    setContactForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <>
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Logo et description */}
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-primary-800 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold">MonitorPro</span>
              </div>
              <p className="text-gray-400 mb-4 leading-relaxed">
                La solution de monitoring web de référence pour les entreprises
                qui ne peuvent pas se permettre de tomber en panne.
              </p>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Github className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Produit */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Produit</h4>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <button
                    onClick={() => scrollToSection("features")}
                    className="hover:text-white transition-colors text-left"
                  >
                    Fonctionnalités
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("pricing")}
                    className="hover:text-white transition-colors text-left"
                  >
                    Tarifs
                  </button>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Intégrations
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Statut des services
                  </a>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Support</h4>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Guides
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
                <li>
                  <button
                    onClick={() => setShowContactModal(true)}
                    className="hover:text-white transition-colors text-left"
                  >
                    Contact
                  </button>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Communauté
                  </a>
                </li>
              </ul>
            </div>

            {/* Entreprise */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Entreprise</h4>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    À propos
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Carrières
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Confidentialité
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Conditions
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>
              &copy; 2024 MonitorPro. Tous droits réservés. Fait avec ❤️ en
              France.
            </p>
          </div>
        </div>
      </footer>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 relative animate-fade-in">
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Contactez-nous
            </h3>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <input
                type="text"
                name="name"
                placeholder="Votre nom"
                value={contactForm.name}
                onChange={handleContactInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Votre email"
                value={contactForm.email}
                onChange={handleContactInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                required
              />
              <input
                type="text"
                name="company"
                placeholder="Entreprise"
                value={contactForm.company}
                onChange={handleContactInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
              <textarea
                name="message"
                placeholder="Votre message"
                rows="4"
                value={contactForm.message}
                onChange={handleContactInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
                required
              />
              <Button type="submit" variant="primary" className="w-full">
                Envoyer le message
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;
