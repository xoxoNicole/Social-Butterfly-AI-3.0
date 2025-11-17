import React from 'react';

const ButterflyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-fuchsia-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    onGoHome?: () => void;
    onToggleTasks?: () => void;
    onOpenProfile?: () => void;
    isChatPage?: boolean;
    profile?: { name: string; business: string; photo: string };
}

const Header: React.FC<HeaderProps> = ({ onEnterApp, onGoHome, onToggleTasks, onOpenProfile, isChatPage, profile }) => {
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
        const element = document.getElementById(targetId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Brand />
                    {isChatPage ? (
                        <div className="flex items-center space-x-2 sm:space-x-4">
                             <button
                                onClick={onOpenProfile}
                                className="rounded-full hover:ring-2 hover:ring-fuchsia-300 transition-all focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
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
                            <button
                                onClick={onToggleTasks}
                                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                                aria-label="Open tasks"
                            >
                                <span className="material-icons text-gray-600">checklist</span>
                            </button>
                            <button
                                onClick={onGoHome}
                                className="px-4 py-2 text-sm font-medium text-fuchsia-600 border border-fuchsia-600 rounded-md hover:bg-fuchsia-50 transition-colors"
                            >
                                Home
                            </button>
                        </div>
                    ) : (
                        <nav className="flex items-center space-x-4">
                            <a href="#features" onClick={(e) => handleScroll(e, 'features')} className="text-gray-600 hover:text-fuchsia-600 font-medium hidden md:block">Features</a>
                            <a href="#for-everyone" onClick={(e) => handleScroll(e, 'for-everyone')} className="text-gray-600 hover:text-fuchsia-600 font-medium hidden md:block">For Everyone</a>
                            <a href="#testimonials" onClick={(e) => handleScroll(e, 'testimonials')} className="text-gray-600 hover:text-fuchsia-600 font-medium hidden md:block">Testimonials</a>
                            <a href="#pricing" onClick={(e) => handleScroll(e, 'pricing')} className="text-gray-600 hover:text-fuchsia-600 font-medium hidden md:block">Pricing</a>
                            <button
                                onClick={onEnterApp}
                                className="px-6 py-2 text-sm font-medium text-white bg-fuchsia-600 rounded-full hover:bg-fuchsia-700 transition-colors"
                            >
                                Get Started
                            </button>
                        </nav>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;