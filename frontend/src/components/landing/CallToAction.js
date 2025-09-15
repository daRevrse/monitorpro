// src/components/landing/CallToAction.js
import React, { useState } from "react";
import Button from "../common/Button";

const CallToAction = () => {
  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simuler l'envoi du formulaire
    try {
      // Ici vous pouvez ajouter l'appel API réel
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSubmitted(true);
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <section
        id="signup"
        className="py-20 bg-gradient-to-r from-primary-600 to-primary-800"
      >
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-auto shadow-2xl">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Merci !</h3>
            <p className="text-gray-600 mb-6">
              Nous vous contacterons dans les plus brefs délais pour configurer
              votre compte MonitorPro.
            </p>
            <Button
              variant="primary"
              onClick={() => setSubmitted(false)}
              className="w-full"
            >
              Retour
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="signup"
      className="py-20 bg-gradient-to-r from-primary-600 to-primary-800"
    >
      <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
          Prêt à commencer ?
        </h2>
        <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Rejoignez des centaines d'entreprises qui font confiance à MonitorPro
          pour surveiller leurs sites web.
        </p>

        <div className="bg-white rounded-2xl p-8 max-w-md mx-auto shadow-2xl">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Essai gratuit 14 jours
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                name="companyName"
                placeholder="Nom de votre entreprise"
                value={formData.companyName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                required
              />
            </div>

            <div>
              <input
                type="email"
                name="email"
                placeholder="Votre email professionnel"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={!formData.companyName || !formData.email}
              className="w-full"
            >
              🚀 Créer mon compte gratuitement
            </Button>
          </form>

          <p className="text-sm text-gray-600 mt-4">
            Aucune carte bancaire requise • Annulation à tout moment
          </p>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
