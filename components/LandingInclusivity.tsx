import React from 'react';

const LandingInclusivity: React.FC = () => {
    return (
        <section id="for-everyone" className="py-20 bg-gray-50 scroll-mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
                    <div>
                        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                            For Every Visionary. For Every Mission.
                        </h2>
                        <p className="mt-4 text-lg text-gray-600">
                            Whether you're building a tech startup, a creative agency, or a non-profit, Social Butterfly-AI is your strategic partner. We provide world-class business architecture for everyone.
                        </p>
                        <div className="mt-8 p-6 bg-fuchsia-50 rounded-lg border-l-4 border-fuchsia-500">
                            <h3 className="text-lg font-semibold text-fuchsia-900">
                                A Special Lens for Faith-Led Builders
                            </h3>
                            <p className="mt-2 text-fuchsia-800">
                                For entrepreneurs who feel a sense of purpose or calling in their work, we offer an optional <strong className="font-bold">Faith Alignment Lens</strong>. This unique mode helps you build a Christ-centered business with integrity, ensuring your strategy honors your values without compromising excellence. It's a tool for discernment, not dogma—built to support, not to preach.
                            </p>
                        </div>
                    </div>
                    <div className="mt-10 lg:mt-0 flex items-center justify-center p-8 bg-white rounded-lg shadow-xl" style={{ height: '400px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-48 w-48 text-fuchsia-400 opacity-75" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 12c0-2.667 2-4 4-4s4 1.333 4 4c0 2.667-2 4-4 4s-4-1.333-4-4z" />
                            <path d="M12 12c0-2.667-2-4-4-4S4 9.333 4 12c0 2.667 2 4 4 4s4-1.333 4-4z" />
                            <path d="M16 12a4 4 0 01-4 4" />
                            <path d="M8 12a4 4 0 004 4" />
                            <path d="M12 2v2" />
                            <path d="M12 20v2" />
                            <path d="M20 12h2" />
                            <path d="M2 12h2" />
                        </svg>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LandingInclusivity;
