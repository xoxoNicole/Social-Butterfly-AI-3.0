import React from 'react';

const Footer: React.FC = () => {
    const BrandText = () => (
        <div>
            <h3 className="text-lg font-bold text-gray-800">Social Butterfly-AI 3.0</h3>
            <p className="text-sm text-gray-500">Your best friend in business.</p>
        </div>
    );
    
    return (
        <footer className="bg-gray-50 border-t border-gray-200">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                    <BrandText />
                    <div className="flex space-x-6">
                        <a href="#features" className="text-base text-gray-500 hover:text-gray-900">Features</a>
                        <a href="#for-everyone" className="text-base text-gray-500 hover:text-gray-900">For Everyone</a>
                        <a href="#testimonials" className="text-base text-gray-500 hover:text-gray-900">Testimonials</a>
                        <a href="#pricing" className="text-base text-gray-500 hover:text-gray-900">Pricing</a>
                    </div>
                    <p className="text-base text-gray-400">
                        &copy; {new Date().getFullYear()} Social Butterfly-AI. 
                        <a href="#" className="ml-4 text-sm text-gray-500 hover:text-gray-900">Terms</a>
                        <a href="#" className="ml-4 text-sm text-gray-500 hover:text-gray-900">Privacy</a>
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
