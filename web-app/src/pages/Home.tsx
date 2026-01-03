import logo from '../assets/logo.png';

export const Home = () => {
    return (
        <div className="relative isolate overflow-hidden flex-1 w-full flex flex-col items-center justify-center p-4">
            {/* Enhanced Background Effects */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-pl-purple via-pl-dark to-pl-purple opacity-60" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,40,130,0.15),transparent_50%)]" />
            </div>

            {/* Main Content Container - Centered and grouped */}
            <div className="flex flex-col items-center justify-center space-y-4 md:space-y-8 z-10 w-full max-w-4xl px-4">

                {/* Season Tag - Now above logo */}
                <div className="animate-fade-in">
                    <span className="inline-flex items-center px-4 py-1.5 md:px-6 md:py-2 rounded-full bg-white/5 border border-white/10 text-xs md:text-base font-medium text-pl-teal backdrop-blur-sm shadow-lg">
                        Season 25/26
                    </span>
                </div>

                {/* Logo Image */}
                <div className="animate-fade-in relative flex-shrink-0">
                    <img
                        src={logo}
                        alt="FantaPL Logo"
                        className="w-32 md:w-72 h-auto drop-shadow-[0_0_25px_rgba(0,255,133,0.3)] hover:scale-105 transition-transform duration-500"
                    />
                </div>

                {/* Text Content */}
                <div className="animate-slide-up flex flex-col items-center text-center space-y-2">
                    <div className="space-y-0 md:space-y-2">
                        <h2 className="text-3xl md:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pl-teal to-pl-pink drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                            Fantacalcio
                        </h2>
                        <h1 className="text-2xl md:text-6xl font-bold text-white tracking-widest uppercase">
                            Premier League
                        </h1>
                    </div>

                    <div className="mt-2 md:mt-6 max-w-2xl mx-auto">
                        <p className="text-sm md:text-2xl text-gray-300 font-light italic leading-tight whitespace-nowrap">
                            L'intensità del calcio inglese con le regole del fantacalcio italiano
                        </p>
                    </div>
                </div>
            </div>

            {/* Custom Animations */}
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 1s ease-out;
                }
                .animate-slide-up {
                    animation: slide-up 1s ease-out 0.3s backwards;
                }
            `}</style>
        </div>
    );
};
