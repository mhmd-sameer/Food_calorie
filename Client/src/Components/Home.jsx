import React from 'react';
import { Link } from 'react-router-dom';
import { FaCalculator, FaRobot, FaLeaf, FaArrowRight, FaChartLine } from 'react-icons/fa';

const FeatureCard = ({ icon: Icon, title, description, delay }) => (
  <div 
    className="glass-card p-8 rounded-3xl flex flex-col items-center text-center group hover:-translate-y-2 transition-transform duration-500 animate-float"
    style={{ animationDelay: delay }}
  >
    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-blue-500/30">
      <Icon className="text-3xl text-indigo-600 drop-shadow-md" />
    </div>
    <h3 className="text-xl font-bold text-slate-800 mb-3">{title}</h3>
    <p className="text-slate-600 leading-relaxed font-medium">
      {description}
    </p>
  </div>
);

const Home = () => {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col justify-center animate-fade-in relative z-10">
      
      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-purple-400/30 rounded-full blur-[60px] -z-10 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-blue-400/30 rounded-full blur-[80px] -z-10 animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12 flex flex-col items-center text-center mt-10">
        
        {/* Badge */}
        <div className="inline-flex items-center space-x-2 glass px-4 py-2 rounded-full mb-8 animate-float border border-indigo-200 shadow-sm" style={{ animationDelay: '0.5s' }}>
          <span className="flex h-2 w-2 rounded-full bg-green-500 animate-ping"></span>
          <span className="text-sm font-semibold text-indigo-700">New: Enhanced AI Coaching</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-800 tracking-tight leading-tight mb-6">
          Nourish Your Body, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Elevate Your Life
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-600 max-w-3xl font-medium mb-12">
          Vitality provides intelligent calorie tracking, beautiful insights, and personalized AI coaching to help you reach your health goals effortlessly.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-24">
          <Link
            to="/register"
            className="glass-button px-8 py-4 rounded-2xl font-bold text-lg flex items-center space-x-3 w-full sm:w-auto justify-center"
          >
            <span>Start Your Journey</span>
            <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#features"
            className="px-8 py-4 rounded-2xl font-bold text-lg text-slate-700 bg-white/50 hover:bg-white/80 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 w-full sm:w-auto justify-center flex"
          >
            Explore Features
          </a>
        </div>

        {/* Features Section */}
        <div id="features" className="w-full pt-16 mt-8 border-t border-white/40 scroll-mt-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">Everything You Need</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              A comprehensive suite of tools designed to make healthy eating intuitive and enjoyable.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={FaCalculator}
              title="Smart Tracking"
              description="Log your meals in seconds with our expansive database and intuitive interface."
              delay="0s"
            />
            <FeatureCard 
              icon={FaChartLine}
              title="Visual Progress"
              description="Watch your goals become reality with beautiful, easy-to-understand charts and metrics."
              delay="0.2s"
            />
            <FeatureCard 
              icon={FaRobot}
              title="AI Coaching"
              description="Get personalized nutritional advice and recipe suggestions from your virtual assistant."
              delay="0.4s"
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;
