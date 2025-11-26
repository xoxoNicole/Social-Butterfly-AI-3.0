

import React, { useState, useRef, useEffect } from 'react';

export const ButterflyIcon = ({ className = "h-8 w-8 text-fuchsia-600" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 12c0-2.667 2-4 4-4s4 1.333 4 4c0 2.667-2 4-4 4s-4-1.333-4-4z" />
        <path d="M12 12c0-2.667-2-4-4-4S4 9.333 4 12c0 2.667 2 4 4 4s4-1.333 4-4z" />
        <path d="M16 12a4 4 0 01-4 4" />
        <path d="M8 12a4 4 0 004 4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="M20 12h2" />
        <path d="M2 12h2" />
    </svg>
);

interface HeaderProps {
    onEnterApp?: () => void;
    onLogin?: () => void;
    onGoHome?: () => void;
    onToggleTasks?: () => void;
    onOpenProfile?: () => void;
    onToggleSidebar?: () => void;
    onOpenExport?: () => void;
    onOpenUpdates?: () => void;
    onOpenAdmin?: () => void;
    onOpenSupport?: () => void;
    onLogout?: () => void;
    isChatPage?: boolean;
    showDashboard?: boolean;
    hasUnreadUpdates?: boolean;
    ticketCount?: number;
    profile?: { name: string; business: string; photo: string, credits?: number, role?: string, plan?: { id: string } };
}

const Header: React.FC<HeaderProps> = ({ onEnterApp, onLogin, onGoHome, onToggleTasks, onOpenProfile, onToggleSidebar, onOpenExport, onOpenUpdates, onOpenAdmin, onOpenSupport, onLogout, isChatPage, showDashboard, hasUnreadUpdates, ticketCount, profile }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isChatMobileMenuOpen, setIsChatMobileMenuOpen] = useState(false);
    const mobileMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
                setIsChatMobileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const Brand = () => (
        <div className="flex items-center space-x-2 cursor-pointer" onClick={onGoHome ?? (() => window.location.reload())}>
            <ButterflyIcon />
            <div>
                <h1 className="text-xl font-bold text-gray-800">Social Butterfly-AI</h1>
            </div>
        </div>
    );

    const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
        e.preventDefault();
        setIsMobileMenuOpen(false);
        const element = document.getElementById(targetId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const isFree = profile?.plan?.id === 'free';
    const isLowCredits = (profile?.credits ?? 0) < 50;

    return (
        <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                     {isChatPage ? (
                        <div className="flex items-center space-x-2 overflow-hidden">
                             <button onClick={onToggleSidebar} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 flex-shrink-0" aria-label="Toggle chat history">
                                <span className="material-icons">menu</span>
                            </button>
                            
                            {/* Back Arrow - Visible only when NOT on dashboard */}
                            {!showDashboard && (
                                <button onClick={onGoHome} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 flex-shrink-0" aria-label="Back to Dashboard">
                                    <span className="material-icons">arrow_back</span>
                                </button>
                            )}

                            <div className="flex-shrink-0">
                                <Brand />
                            </div>
                        </div>
                    ) : (
                        // Landing Page Brand + Mobile Menu Toggle
                         <div className="flex items-center justify-between w-full md:w-auto">
                             <Brand />
                             <button 
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                             >
                                <span className="material-icons">{isMobileMenuOpen ? 'close' : 'menu'}</span>
                             </button>
                         </div>
                    )}

                    {/* Desktop Nav (Landing Page) */}
                    {!isChatPage && (
                        <nav className="hidden md:flex items-center space-x-4">
                            <div className="flex space-x-4">
                                <a href="#features" onClick={(e) => handleScroll(e, 'features')} className="text-gray-600 hover:text-fuchsia-600 font-medium">Features</a>
                                <a href="#pricing" onClick={(e) => handleScroll(e, 'pricing')} className="text-gray-600 hover:text-fuchsia-600 font-medium">Pricing</a>
                            </div>
                            <div className="flex items-center space-x-2">
                                {onLogin && (
                                    <button
                                        onClick={onLogin}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-fuchsia-600 transition-colors"
                                    >
                                        Log In
                                    </button>
                                )}
                                <button
                                    onClick={onEnterApp}
                                    className="px-6 py-2 text-sm font-medium text-white bg-fuchsia-600 rounded-full hover:bg-fuchsia-700 transition-colors"
                                >
                                    Get Started
                                </button>
                            </div>
                        </nav>
                    )}

                    {/* Chat Page Actions */}
                    {isChatPage && (
                        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 relative">
                             {/* Credits Display - Desktop */}
                             <div className={`hidden sm:flex items-center space-x-2 rounded-full p-1 pr-3 mr-2 ${isLowCredits ? 'bg-red-50 border border-red-100' : 'bg-gray-100'}`}>
                                <span className={`material-icons text-sm pl-1 ${isLowCredits ? 'text-red-500' : 'text-amber-500'}`}>monetization_on</span>
                                <div className="flex flex-col leading-none justify-center">
                                    <span className={`font-semibold text-sm ${isLowCredits ? 'text-red-600 font-bold animate-pulse' : 'text-gray-700'}`}>
                                        {profile?.credits?.toLocaleString() ?? 0}
                                    </span>
                                    {isFree && <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider -mt-0.5">Trial Balance</span>}
                                </div>
                             </div>

                             {/* Desktop Only Buttons */}
                             <div className="hidden sm:flex items-center space-x-1">
                                 {onOpenAdmin && (
                                    <button
                                        onClick={onOpenAdmin}
                                        className="p-2 rounded-full hover:bg-gray-100 transition-colors text-fuchsia-600 relative"
                                        aria-label="Admin Dashboard"
                                        title="Admin Dashboard"
                                    >
                                        <span className="material-icons">admin_panel_settings</span>
                                        {ticketCount !== undefined && ticketCount > 0 && (
                                            <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full ring-2 ring-white bg-red-500"></span>
                                        )}
                                    </button>
                                 )}

                                 {onOpenUpdates && (
                                    <button
                                        onClick={onOpenUpdates}
                                        className="p-2 rounded-full hover:bg-gray-100 transition-colors relative group"
                                        aria-label="Updates & Fixes"
                                        title="What's New"
                                    >
                                        <span className="material-icons text-gray-600">notifications_none</span>
                                        {hasUnreadUpdates && (
                                            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
                                        )}
                                    </button>
                                 )}
                                 
                                 {onOpenSupport && (
                                    <button
                                        onClick={onOpenSupport}
                                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                                        aria-label="Contact Support"
                                        title="Contact Support"
                                    >
                                        <span className="material-icons text-gray-600">support_agent</span>
                                    </button>
                                 )}

                                 {onOpenExport && (
                                    <button
                                        onClick={onOpenExport}
                                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                                        aria-label="Export & Integrations"
                                        title="Export & Integrations"
                                    >
                                        <span className="material-icons text-gray-600">ios_share</span>
                                    </button>
                                 )}
                                 <button
                                    onClick={onToggleTasks}
                                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                                    aria-label="Open tasks"
                                >
                                    <span className="material-icons text-gray-600">checklist</span>
                                </button>
                             </div>

                             {/* Mobile More Button */}
                             <div className="sm:hidden flex items-center">
                                {onOpenExport && (
                                    <button
                                        onClick={onOpenExport}
                                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                                        aria-label="Export"
                                    >
                                        <span className="material-icons text-gray-600">ios_share</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsChatMobileMenuOpen(!isChatMobileMenuOpen)}
                                    className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
                                    aria-label="More options"
                                >
                                    <span className="material-icons text-gray-600">more_vert</span>
                                    {hasUnreadUpdates && (
                                        <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
                                    )}
                                </button>
                             </div>
                             
                             <button
                                onClick={onOpenProfile}
                                className="rounded-full hover:ring-2 hover:ring-fuchsia-300 transition-all focus:outline-none focus:ring-2 focus:ring-fuchsia-400 ml-1 flex-shrink-0"
                                aria-label="Open profile settings"
                            >
                                {profile?.photo ? (
                                    <img src={profile.photo} alt="User profile" className="h-9 w-9 rounded-full object-cover" />
                                ) : (
                                    <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center">
                                        <span className="material-icons text-gray-600">person_outline</span>
                                    </div>
                                )}
                            </button>

                            {/* Explicit Logout Button (Desktop) */}
                            {onLogout && (
                                <button 
                                    onClick={() => { if(window.confirm('Are you sure you want to log out?')) onLogout(); }}
                                    className="hidden sm:flex p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors ml-2 shadow-sm border border-red-100"
                                    title="Log Out"
                                    aria-label="Log Out"
                                >
                                    <span className="material-icons">power_settings_new</span>
                                </button>
                            )}

                            {/* Mobile Chat Menu Dropdown */}
                            {isChatMobileMenuOpen && (
                                <div ref={mobileMenuRef} className="absolute top-14 right-0 w-56 bg-white shadow-xl rounded-xl border border-gray-100 p-2 flex flex-col space-y-1 z-50 animate-[fadeIn_0.1s_ease-out]">
                                    {/* Mobile Credits */}
                                    <div className={`flex items-center justify-between px-3 py-2 rounded-lg mb-1 ${isLowCredits ? 'bg-red-50' : 'bg-gray-50'}`}>
                                        <div className="flex flex-col">
                                            <div className="flex items-center text-gray-600">
                                                <span className={`material-icons mr-2 text-sm ${isLowCredits ? 'text-red-500' : 'text-amber-500'}`}>monetization_on</span>
                                                <span className="text-sm font-medium">Credits</span>
                                            </div>
                                            {isFree && <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider ml-6">Trial Balance</span>}
                                        </div>
                                        <span className={`font-bold ${isLowCredits ? 'text-red-600 animate-pulse' : 'text-gray-900'}`}>{profile?.credits?.toLocaleString() ?? 0}</span>
                                    </div>
                                    
                                    <div className="h-px bg-gray-100 my-1"></div>

                                    {onOpenUpdates && (
                                        <button onClick={() => { onOpenUpdates(); setIsChatMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center justify-between">
                                            <div className="flex items-center">
                                                <span className="material-icons text-gray-400 mr-3 text-[20px]">notifications</span>
                                                Updates
                                            </div>
                                            {hasUnreadUpdates && <span className="h-2 w-2 bg-red-500 rounded-full"></span>}
                                        </button>
                                    )}

                                    {onOpenSupport && (
                                        <button onClick={() => { onOpenSupport(); setIsChatMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center">
                                            <span className="material-icons text-gray-400 mr-3 text-[20px]">support_agent</span>
                                            Support
                                        </button>
                                    )}

                                    {onToggleTasks && (
                                        <button onClick={() => { onToggleTasks(); setIsChatMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center">
                                            <span className="material-icons text-gray-400 mr-3 text-[20px]">checklist</span>
                                            My Tasks
                                        </button>
                                    )}

                                    {onOpenAdmin && (
                                         <button onClick={() => { onOpenAdmin(); setIsChatMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-fuchsia-600 hover:bg-fuchsia-50 rounded-lg flex items-center font-medium border-t border-gray-100 mt-1 pt-2">
                                            <span className="material-icons mr-3 text-[20px]">admin_panel_settings</span>
                                            Admin Dashboard
                                        </button>
                                    )}

                                    {onLogout && (
                                        <button onClick={() => { onLogout(); setIsChatMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center border-t border-gray-100 mt-1 pt-2">
                                            <span className="material-icons mr-3 text-[20px]">power_settings_new</span>
                                            Log Out
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Menu Dropdown (Landing Page Only) */}
            {!isChatPage && isMobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-200 absolute w-full left-0 shadow-lg py-4 px-4 flex flex-col space-y-4 animate-[fadeIn_0.2s_ease-out] z-50">
                    <a href="#features" onClick={(e) => handleScroll(e, 'features')} className="text-gray-700 hover:text-fuchsia-600 font-medium text-lg py-2 border-b border-gray-100">Features</a>
                    <a href="#pricing" onClick={(e) => handleScroll(e, 'pricing')} className="text-gray-700 hover:text-fuchsia-600 font-medium text-lg py-2 border-b border-gray-100">Pricing</a>
                    <div className="flex flex-col space-y-3 pt-2">
                        {onLogin && (
                            <button
                                onClick={() => { onLogin(); setIsMobileMenuOpen(false); }}
                                className="w-full px-4 py-3 text-center font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Log In
                            </button>
                        )}
                        <button
                            onClick={() => { onEnterApp?.(); setIsMobileMenuOpen(false); }}
                            className="w-full px-4 py-3 text-center font-medium text-white bg-fuchsia-600 rounded-lg hover:bg-fuchsia-700 transition-colors"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;