// src/components/landing/Pricing.js
import React from "react";
import { Check } from "lucide-react";
import Button from "../common/Button";
import { cn } from "../../utils/cn";

const Pricing = () => {
  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: 19,
      description: "Parfait pour débuter",
      features: [
        "Jusqu'à 10 sites web",
        "Vérifications toutes les 5 min",
        "Alertes email",
        "1 utilisateur",
        "Support email",
      ],
      recommended: false,
    },
    {
      id: "professional",
      name: "Professional",
      price: 49,
      description: "Pour les équipes en croissance",
      features: [
        "Jusqu'à 50 sites web",
        "Vérifications toutes les 1 min",
        "Alertes email + SMS",
        "5 utilisateurs",
        "Rapports avancés",
        "Support prioritaire",
      ],
      recommended: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 149,
      description: "Pour les grandes organisations",
      features: [
        "Jusqu'à 200 sites web",
        "Vérifications en temps réel",
        "Alertes multi-canaux",
        "Utilisateurs illimités",
        "API complète",
        "Support dédié",
      ],
      recommended: false,
    },
  ];

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Choisissez votre plan
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Des tarifs transparents qui évoluent avec vos besoins. Pas de frais
            cachés, pas d'engagement.
          </p>
        </div>

        {/* Mobile: Horizontal scroll */}
        <div className="md:hidden">
          <div className="flex space-x-6 overflow-x-auto pb-6 snap-x snap-mandatory">
            {plans.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                className="min-w-[300px] snap-center"
                onSelectPlan={() => scrollToSection("signup")}
              />
            ))}
          </div>
        </div>

        {/* Desktop: Grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              onSelectPlan={() => scrollToSection("signup")}
            />
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Besoin de plus ? Contactez-nous pour un plan sur mesure.
          </p>
          <button
            onClick={() => scrollToSection("contact")}
            className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
          >
            Parler à un expert →
          </button>
        </div>
      </div>
    </section>
  );
};

const PricingCard = ({ plan, className = "", onSelectPlan }) => {
  const cardClasses = cn(
    "bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-200 relative transition-all duration-300 hover:-translate-y-2 hover:shadow-xl",
    plan.recommended &&
      "ring-2 ring-primary-800 scale-105 bg-gradient-to-br from-white to-primary-50",
    className
  );

  return (
    <div className={cardClasses}>
      {plan.recommended && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-primary-800 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
            PLUS POPULAIRE
          </div>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
          {plan.name}
        </h3>
        <p className="text-gray-600 mb-6">{plan.description}</p>
        <div className="mb-6">
          <span className="text-4xl md:text-5xl font-bold text-gray-900">
            {plan.price}€
          </span>
          <span className="text-gray-600 text-lg">/mois</span>
        </div>
      </div>

      <ul className="space-y-4 mb-8">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700 text-sm md:text-base">
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <Button
        variant={plan.recommended ? "primary" : "outline"}
        className="w-full"
        onClick={onSelectPlan}
      >
        Choisir {plan.name}
      </Button>
    </div>
  );
};

export default Pricing;
