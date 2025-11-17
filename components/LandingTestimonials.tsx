import React from 'react';
import { testimonials } from '../testimonials';

const QuoteIcon = () => (
    <svg className="w-10 h-10 text-fuchsia-200" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 14">
        <path d="M6 0H2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v1a3 3 0 0 1-3 3H2a1 1 0 0 0 0 2h1a5.006 5.006 0 0 0 5-5V2a2 2 0 0 0-2-2Zm10 0h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v1a3 3 0 0 1-3 3h-1a1 1 0 0 0 0 2h1a5.006 5.006 0 0 0 5-5V2a2 2 0 0 0-2-2Z"/>
    </svg>
);


const LandingTestimonials: React.FC = () => {
  return (
    <section id="testimonials" className="py-20 bg-white scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Trusted by Visionary Entrepreneurs
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Hear how Social Butterfly-AI has helped others build with clarity and confidence.
          </p>
        </div>
        <div className="mt-16 grid gap-12 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div key={testimonial.name} className="flex flex-col text-center">
              <div className="relative">
                <QuoteIcon />
                <blockquote className="mt-4">
                  <p className="text-lg font-medium text-gray-700">
                    "{testimonial.quote}"
                  </p>
                </blockquote>
              </div>
              <footer className="mt-8">
                <div className="flex flex-col items-center">
                  <img className="h-12 w-12 rounded-full" src={testimonial.avatarUrl} alt={testimonial.name} />
                  <div className="mt-3 text-center">
                    <p className="text-base font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm font-medium text-fuchsia-600">{testimonial.title}</p>
                  </div>
                </div>
              </footer>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingTestimonials;
