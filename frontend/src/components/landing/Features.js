// src/components/landing/Features.js
import React from "react";
import { Clock, Bell, BarChart3, ShieldCheck, Users, Code } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Clock,
      title: "Monitoring temps réel",
      description:
        "Vérifications automatiques toutes les 30 secondes avec détection instantanée des pannes et problèmes de performance.",
      color: "bg-blue-500",
    },
    {
      icon: Bell,
      title: "Alertes multi-canaux",
      description:
        "Notifications par email, SMS, Slack, Teams et webhooks personnalisés pour ne jamais rater un incident.",
      color: "bg-green-500",
    },
    {
      icon: BarChart3,
      title: "Rapports détaillés",
      description:
        "Analytics avancées, SLA reporting et rapports d'uptime pour optimiser vos performances.",
      color: "bg-purple-500",
    },
    {
      icon: ShieldCheck,
      title: "Monitoring SSL",
      description:
        "Surveillance des certificats SSL avec alertes d'expiration et vérification de la sécurité.",
      color: "bg-red-500",
    },
    {
      icon: Users,
      title: "Équipes collaboratives",
      description:
        "Gestion d'équipes, rôles personnalisés et escalation automatique des incidents.",
      color: "bg-yellow-500",
    },
    {
      icon: Code,
      title: "API complète",
      description:
        "Intégration facile avec vos outils existants grâce à notre API RESTful complète.",
      color: "bg-indigo-500",
    },
  ];

  return (
    <section
      id="features"
      className="py-20 bg-gradient-to-br from-gray-50 to-gray-100"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Une solution complète de monitoring qui s'adapte à vos besoins, de
            la startup à l'entreprise.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ feature, index }) => {
  const Icon = feature.icon;

  return (
    <div
      className="bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-white/20 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-xl group"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div
        className={`${feature.color} w-14 h-14 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
      >
        <Icon className="w-7 h-7 text-white" />
      </div>

      <h3 className="text-xl font-semibold mb-4 text-gray-900 group-hover:text-primary-800 transition-colors">
        {feature.title}
      </h3>

      <p className="text-gray-600 leading-relaxed">{feature.description}</p>
    </div>
  );
};

export default Features;
