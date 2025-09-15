// src/components/landing/Stats.js
import React, { useEffect, useRef, useState } from "react";

const Stats = () => {
  const [isVisible, setIsVisible] = useState(false);
  const statsRef = useRef(null);

  const stats = [
    {
      value: 99.9,
      suffix: "%",
      label: "Uptime garanti",
      color: "text-primary-600",
    },
    {
      value: 30,
      suffix: "s",
      label: "Temps de détection",
      color: "text-green-600",
    },
    {
      value: 500,
      suffix: "+",
      label: "Sites surveillés",
      color: "text-purple-600",
    },
    {
      value: 24,
      suffix: "/7",
      label: "Support disponible",
      color: "text-orange-600",
    },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={statsRef} className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, index) => (
            <StatItem
              key={index}
              stat={stat}
              isVisible={isVisible}
              delay={index * 200}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const StatItem = ({ stat, isVisible, delay }) => {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        const increment = stat.value / 50;
        let current = 0;

        const counter = setInterval(() => {
          current += increment;
          if (current >= stat.value) {
            current = stat.value;
            clearInterval(counter);
          }
          setCurrentValue(current);
        }, 30);

        return () => clearInterval(counter);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [isVisible, stat.value, delay]);

  const displayValue =
    stat.value === 99.9 ? currentValue.toFixed(1) : Math.floor(currentValue);

  return (
    <div className="transform transition-all duration-700 hover:scale-105">
      <div className={`text-3xl md:text-4xl font-bold mb-2 ${stat.color}`}>
        {displayValue}
        {stat.suffix}
      </div>
      <div className="text-gray-600 text-sm md:text-base">{stat.label}</div>
    </div>
  );
};

export default Stats;
