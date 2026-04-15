import React from 'react';
import { Link } from 'react-router-dom';

const AboutUs = () => {
    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4">
            <div className="max-w-4xl mx-auto space-y-16">

                {/* 1. Hero / Mission Statement */}
                <div className="text-center space-y-4">
                    <h1 className="font-orbitron font-black text-4xl md:text-5xl text-slate-900 uppercase">
                        About <span className="text-emerald-600">DriveLink</span>
                    </h1>
                    <p className="text-slate-600 max-w-2xl mx-auto text-lg">
                        DriveLink is your premier peer-to-peer vehicle rental platform. We connect vehicle owners with renters to provide simple, affordable, and reliable transportation options while helping owners earn from their idle vehicles.
                    </p>
                </div>

                {/* 3. Platform Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    {[
                        { label: 'Active Vehicles', value: '10+' },
                        { label: 'Happy Customers', value: '20+' },
                        { label: 'Cities Covered', value: '5+' },
                        { label: 'Total Trips', value: '10+' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <p className="text-3xl font-bold text-emerald-600 mb-1">{stat.value}</p>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* 4. Why Choose DriveLink (How It Works implicitly integrated here) */}
                <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                    <h2 className="font-bold text-2xl text-slate-900 mb-6">Why Choose Us?</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div>
                            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xl mb-4">🛡️</div>
                            <h3 className="font-bold text-slate-800 mb-2">Verified Vehicles</h3>
                            <p className="text-sm text-slate-600">Every vehicle and owner on our platform goes through a strict verification process to ensure your safety.</p>
                        </div>
                        <div>
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl mb-4">💸</div>
                            <h3 className="font-bold text-slate-800 mb-2">Best Prices</h3>
                            <p className="text-sm text-slate-600">Get the best rental rates with transparent pricing and no hidden fees, directly from owners.</p>
                        </div>
                        <div>
                            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xl mb-4">🤝</div>
                            <h3 className="font-bold text-slate-800 mb-2">24/7 Support</h3>
                            <p className="text-sm text-slate-600">Our dedicated support team is available around the clock to assist you with your bookings and queries.</p>
                        </div>
                    </div>
                </div>

                {/* 5. Our Team */}
                <div>
                    <div className="text-center mb-8">
                        <h2 className="font-bold text-3xl text-slate-900">Our Founders</h2>
                        <p className="text-slate-500 mt-2">The visionaries behind DriveLink</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { name: 'Ronak Togadiya', role: 'Founder', initial: 'RT' },
                            { name: 'Vasu Bhoraniya', role: 'Founder', initial: 'VB' },
                            { name: 'Prem Mahesuriya', role: 'Founder', initial: 'PM' },
                        ].map((member, i) => (
                            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-md">
                                    {member.initial}
                                </div>
                                <h3 className="font-bold text-lg text-slate-800">{member.name}</h3>
                                <p className="text-emerald-600 font-semibold text-sm">{member.role}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 6. Contact Us */}
                <div className="bg-emerald-600 text-white rounded-2xl p-8 shadow-lg text-center">
                    <h2 className="font-bold text-2xl mb-2">Get In Touch</h2>
                    <p className="text-emerald-100 mb-6">Have questions? We're here to help.</p>
                    <div className="flex flex-col md:flex-row justify-center gap-6 text-sm">
                        <div className="flex items-center justify-center gap-2">
                            <span>📧</span> vasubhoraniya7908@gmail.com
                        </div>
                        <div className="flex items-center justify-center gap-2">
                            <span>📞</span> +91 7405555555
                        </div>
                        <div className="flex items-center justify-center gap-2">
                            <span>📍</span> Ahmedabad, Gujarat, India
                        </div>
                    </div>
                </div>

                {/* 11. Terms & Privacy */}
                <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                    <h2 className="font-bold text-2xl text-slate-900 mb-6">Terms & Privacy</h2>
                    
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-bold text-slate-800 border-b pb-2 mb-3">Terms of Service Summary</h3>
                            <ul className="list-disc pl-5 text-sm text-slate-600 space-y-2">
                                <li>DriveLink is a peer-to-peer vehicle rental platform connecting owners and renters</li>
                                <li>Users must be 18+ with a valid driving license to rent vehicles</li>
                                <li>All bookings are subject to vehicle owner's approval and availability</li>
                                <li>Cancellation within 24 hours of booking creation is free; late cancellations may attract charges</li>
                                <li>Users are responsible for any damages during the rental period</li>
                                <li>DriveLink acts as an intermediary and is not liable for vehicle condition or disputes between parties</li>
                                <li>Fraudulent activity or misuse of the platform will result in account suspension</li>
                            </ul>
                        </div>
                        
                        <div>
                            <h3 className="font-bold text-slate-800 border-b pb-2 mb-3">Privacy Policy Summary</h3>
                            <ul className="list-disc pl-5 text-sm text-slate-600 space-y-2">
                                <li>We collect name, email, phone, and location to facilitate bookings</li>
                                <li>Your data is never sold to third parties</li>
                                <li>Payment information is processed securely and not stored on our servers</li>
                                <li>You can request deletion of your account and data at any time by contacting support</li>
                                <li>We use cookies for authentication and improving user experience</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <Link to="/listings" className="inline-block bg-slate-900 text-white font-semibold px-8 py-3 rounded-xl hover:bg-slate-800 transition-colors">
                        Explore Vehicles
                    </Link>
                </div>

            </div>
        </div>
    );
};

export default AboutUs;
