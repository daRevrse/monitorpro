// src/pages/Landing.js
import React from "react";
import Navigation from "../components/landing/Navigation";
import Hero from "../components/landing/Hero";
import Stats from "../components/landing/Stats";
import Features from "../components/landing/Features";
import Pricing from "../components/landing/Pricing";
import Testimonials from "../components/landing/Testimonials";
import CallToAction from "../components/landing/CallToAction";
import Footer from "../components/landing/Footer";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <Hero />
      <Stats />
      <Features />
      <Pricing />
      <Testimonials />
      <CallToAction />
      <Footer />
    </div>
  );
};

export default Landing;
