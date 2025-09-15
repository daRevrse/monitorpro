// src/pages/Signup.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, ArrowLeft, ArrowRight, Check } from "lucide-react";
import Button from "../components/common/Button";
import api from "../services/api";

const Signup = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Étape 1: Informations entreprise
    companyName: "",
    industry: "",
    companySize: "",

    // Étape 2: Plan choisi
    selectedPlan: "professional",

    // Étape 3: Compte admin
    adminEmail: "",
    adminPassword: "",
    adminFirstName: "",
    adminLastName: "",
    acceptTerms: false,
  });

  const navigate = useNavigate();

  const industries = [
    "Technologie",
    "E-commerce",
    "Santé",
    "Finance",
    "Éducation",
    "Marketing",
    "Autre",
  ];

  const companySizes = [
    "1-10 employés",
    "11-50 employés",
    "51-200 employés",
    "200+ employés",
  ];

  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: 19,
      description: "Parfait pour débuter",
      maxSites: 10,
    },
    {
      id: "professional",
      name: "Professional",
      price: 49,
      description: "Pour les équipes en croissance",
      maxSites: 50,
      recommended: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 149,
      description: "Pour les grandes organisations",
      maxSites: 200,
    },
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post("/public/signup", formData);

      if (response.data.success) {
        // Rediriger vers login avec message de succès
        navigate("/login", {
          state: {
            message:
              "Compte créé avec succès ! Connectez-vous pour accéder à votre tableau de bord.",
          },
        });
      }
    } catch (error) {
      console.error("Erreur inscription:", error);
      alert("Erreur lors de la création du compte. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return (
          formData.companyName && formData.industry && formData.companySize
        );
      case 2:
        return formData.selectedPlan;
      case 3:
        return (
          formData.adminEmail &&
          formData.adminPassword &&
          formData.adminFirstName &&
          formData.adminLastName &&
          formData.acceptTerms
        );
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center justify-center">
            <div className="w-12 h-12 bg-primary-800 rounded-xl flex items-center justify-center mb-4">
              <Activity className="w-7 h-7 text-white" />
            </div>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">
            Créer votre compte MonitorPro
          </h2>
          <p className="mt-2 text-gray-600">
            Étape {step} sur 3 -{" "}
            {step === 1
              ? "Informations entreprise"
              : step === 2
              ? "Choisir votre plan"
              : "Votre compte administrateur"}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-800 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form
            onSubmit={
              step === 3
                ? handleSubmit
                : (e) => {
                    e.preventDefault();
                    handleNext();
                  }
            }
          >
            {/* Étape 1: Informations entreprise */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Parlez-nous de votre entreprise
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de votre entreprise *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="MonEntreprise SAS"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secteur d'activité *
                  </label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Sélectionnez votre secteur</option>
                    {industries.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Taille de l'entreprise *
                  </label>
                  <select
                    name="companySize"
                    value={formData.companySize}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Sélectionnez la taille</option>
                    {companySizes.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Étape 2: Sélection du plan */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Choisissez votre plan
                </h3>

                <div className="grid gap-4">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        formData.selectedPlan === plan.id
                          ? "border-primary-800 bg-primary-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          selectedPlan: plan.id,
                        }))
                      }
                    >
                      {plan.recommended && (
                        <div className="absolute -top-2 left-4">
                          <span className="bg-primary-800 text-white text-xs font-bold px-2 py-1 rounded">
                            RECOMMANDÉ
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {plan.name}
                          </h4>
                          <p className="text-gray-600 text-sm">
                            {plan.description}
                          </p>
                          <p className="text-gray-600 text-sm">
                            Jusqu'à {plan.maxSites} sites
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {plan.price}€
                          </div>
                          <div className="text-gray-600 text-sm">/mois</div>
                        </div>
                      </div>

                      <input
                        type="radio"
                        name="selectedPlan"
                        value={plan.id}
                        checked={formData.selectedPlan === plan.id}
                        onChange={handleInputChange}
                        className="absolute top-4 right-4"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Étape 3: Compte administrateur */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Créez votre compte administrateur
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      name="adminFirstName"
                      value={formData.adminFirstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom *
                    </label>
                    <input
                      type="text"
                      name="adminLastName"
                      value={formData.adminLastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email administrateur *
                  </label>
                  <input
                    type="email"
                    name="adminEmail"
                    value={formData.adminEmail}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="admin@monentreprise.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe *
                  </label>
                  <input
                    type="password"
                    name="adminPassword"
                    value={formData.adminPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Minimum 8 caractères"
                    minLength="8"
                    required
                  />
                </div>

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleInputChange}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    required
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    J'accepte les{" "}
                    <a
                      href="#"
                      className="text-primary-600 hover:text-primary-500"
                    >
                      conditions d'utilisation
                    </a>{" "}
                    et la{" "}
                    <a
                      href="#"
                      className="text-primary-600 hover:text-primary-500"
                    >
                      politique de confidentialité
                    </a>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              {step > 1 ? (
                <Button type="button" variant="ghost" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              ) : (
                <Link
                  to="/"
                  className="flex items-center text-gray-600 hover:text-gray-800"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour au site
                </Link>
              )}

              <Button
                type="submit"
                variant="primary"
                disabled={!isStepValid()}
                loading={loading}
              >
                {step === 3 ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Créer mon compte
                  </>
                ) : (
                  <>
                    Continuer
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Lien connexion */}
        <div className="text-center">
          <p className="text-gray-600">
            Déjà un compte ?{" "}
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
