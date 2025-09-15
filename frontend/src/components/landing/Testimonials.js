// src/components/landing/Testimonials.js
import React from "react";
import { Star } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      name: "Marie Dubois",
      role: "CTO",
      company: "TechStart",
      avatar: "MD",
      avatarColor: "bg-blue-500",
      rating: 5,
      content:
        "MonitorPro nous a permis de détecter une panne critique à 3h du matin et de réagir immédiatement. Cela nous a évité une perte de revenus considérable.",
    },
    {
      id: 2,
      name: "Jean Martin",
      role: "Gérant",
      company: "WebAgency Pro",
      avatar: "JM",
      avatarColor: "bg-green-500",
      rating: 5,
      content:
        "L'interface est intuitive et les rapports sont parfaits pour nos clients. Nous avons réduit notre temps de résolution d'incidents de 60%.",
    },
    {
      id: 3,
      name: "Sophie Laurent",
      role: "DevOps",
      company: "InnovateCorp",
      avatar: "SL",
      avatarColor: "bg-purple-500",
      rating: 5,
      content:
        "Excellent support client et fonctionnalités très complètes. MonitorPro est devenu indispensable à notre infrastructure.",
    },
  ];

  return (
    <section id="testimonials" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Ils nous font confiance
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez comment MonitorPro aide des entreprises de toutes tailles
            à maintenir leurs services en ligne.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const TestimonialCard = ({ testimonial, index }) => {
  return (
    <div
      className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-8 shadow-lg transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-xl"
      style={{ animationDelay: `${index * 150}ms` }}
    >
      {/* Rating */}
      <div className="flex items-center mb-6">
        <div className="flex text-yellow-400">
          {[...Array(testimonial.rating)].map((_, i) => (
            <Star key={i} className="w-5 h-5 fill-current" />
          ))}
        </div>
      </div>

      {/* Content */}
      <p className="text-gray-700 mb-6 leading-relaxed italic">
        "{testimonial.content}"
      </p>

      {/* Author */}
      <div className="flex items-center">
        <div
          className={`w-12 h-12 ${testimonial.avatarColor} rounded-full flex items-center justify-center text-white font-bold text-lg`}
        >
          {testimonial.avatar}
        </div>
        <div className="ml-4">
          <div className="font-semibold text-gray-900">{testimonial.name}</div>
          <div className="text-gray-600 text-sm">
            {testimonial.role}, {testimonial.company}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
