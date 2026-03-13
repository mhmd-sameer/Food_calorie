import React from 'react';
import { FaLeaf, FaGithub, FaTwitter, FaHeart } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="glass mt-auto border-t border-white/20 pb-6 pt-10">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center md:items-start text-center md:text-left mb-8">
          
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start space-y-4">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl text-white shadow-md group-hover:scale-110 transition-transform duration-300">
                <FaLeaf className="text-lg" />
              </div>
              <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">
                Vitality
              </span>
            </Link>
            <p className="text-slate-500 text-sm max-w-xs font-medium">
              Empowering your wellness journey with intelligent tracking and insights.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col items-center md:items-start space-y-2">
            <h4 className="font-bold text-slate-800 mb-2">Quick Links</h4>
            <Link to="/" className="text-slate-500 hover:text-indigo-600 transition-colors font-medium text-sm">Home</Link>
            <Link to="/calorie" className="text-slate-500 hover:text-indigo-600 transition-colors font-medium text-sm">Tracker</Link>
            <Link to="/login" className="text-slate-500 hover:text-indigo-600 transition-colors font-medium text-sm">Sign In</Link>
          </div>

          {/* Social */}
          <div className="flex flex-col items-center md:items-end space-y-4">
            <h4 className="font-bold text-slate-800 mb-2">Connect</h4>
            <div className="flex space-x-4">
              <a href="#" className="p-2 rounded-full glass hover:bg-white/60 transition-colors text-slate-600 hover:text-indigo-600">
                <FaTwitter className="text-xl" />
              </a>
              <a href="#" className="p-2 rounded-full glass hover:bg-white/60 transition-colors text-slate-600 hover:text-indigo-600">
                <FaGithub className="text-xl" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-6 border-t border-slate-200/50 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500 font-medium">
          <p>© {new Date().getFullYear()} Vitality Platform. All rights reserved.</p>
          <p className="flex items-center mt-2 md:mt-0">
            Made with <FaHeart className="text-red-500 mx-1" /> by Vitality Team
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
