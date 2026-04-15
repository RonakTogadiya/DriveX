import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-slate-900 border-t border-slate-800 text-slate-300 py-12 mt-10">
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Brand & Project Info */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-black text-white font-orbitron uppercase tracking-wider">
                        DriveLink
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Your premium car rental and sharing platform. Find your perfect ride or share your vehicle with the community seamlessly.
                    </p>
                </div>

                {/* Main Navigation */}
                <div>
                    <h3 className="text-white font-semibold mb-4 text-emerald-400 uppercase text-xs tracking-widest">Explore</h3>
                    <ul className="space-y-2 text-sm text-slate-400">
                        <li><Link to="/listings" className="hover:text-emerald-400 transition-colors">Explore Vehicles</Link></li>
                        <li><Link to="/map" className="hover:text-emerald-400 transition-colors">Nearby Vehicles</Link></li>
                        <li><Link to="/about" className="hover:text-emerald-400 transition-colors">About Us</Link></li>
                    </ul>
                </div>

                {/* Suggested Section 1: User Accounts (Highly relevant for a rental platform) */}
                <div>
                    <h3 className="text-white font-semibold mb-4 text-emerald-400 uppercase text-xs tracking-widest">Accounts</h3>
                    <ul className="space-y-2 text-sm text-slate-400">
                        <li><Link to="/login" className="hover:text-emerald-400 transition-colors">Sign In / Register</Link></li>
                        <li><Link to="/dashboard" className="hover:text-emerald-400 transition-colors">Renter Dashboard</Link></li>
                        <li><Link to="/owner-dashboard" className="hover:text-emerald-400 transition-colors">Host / Owner Dashboard</Link></li>
                    </ul>
                </div>

                {/* Suggested Section 2: Support & Legal */}
                <div>
                    <h3 className="text-white font-semibold mb-4 text-emerald-400 uppercase text-xs tracking-widest">Support & Legal</h3>
                    <ul className="space-y-2 text-sm text-slate-400">
                        <li><Link to="#" className="hover:text-emerald-400 transition-colors">Policy</Link></li>
                        <li><Link to="#" className="hover:text-emerald-400 transition-colors">Terms and Service</Link></li>
                        <li><Link to="#" className="hover:text-emerald-400 transition-colors">Contact Support</Link></li>
                    </ul>
                </div>
            </div>
            
            <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-slate-800 text-sm text-slate-500 flex flex-col md:flex-row justify-between items-center">
                <p>&copy; {new Date().getFullYear()} DriveLink Platform. All rights reserved.</p>
                <div className="flex space-x-6 mt-4 md:mt-0">
                    <Link to="#" className="text-slate-400 hover:text-emerald-400 transition-colors" aria-label="Instagram">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                        </svg>
                    </Link>
                    <Link to="#" className="text-slate-400 hover:text-emerald-400 transition-colors" aria-label="Twitter">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                        </svg>
                    </Link>
                    <Link to="#" className="text-slate-400 hover:text-emerald-400 transition-colors" aria-label="LinkedIn">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                            <rect x="2" y="9" width="4" height="12"></rect>
                            <circle cx="4" cy="4" r="2"></circle>
                        </svg>
                    </Link>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
