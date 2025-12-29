import React from 'react';
import { ArrowRight, Trophy, Users, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Home = () => {
    return (
        <div className="relative isolate overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.pl.purple),theme(colors.pl.dark))] opacity-50" />
            <div className="absolute inset-y-0 right-1/2 -z-10 mr-16 w-[200%] origin-bottom-left skew-x-[-30deg] bg-pl-dark shadow-xl shadow-pl-green/10 ring-1 ring-white/10 sm:mr-28 lg:mr-0 xl:mr-16 xl:origin-center" />

            <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
                <div className="mx-auto max-w-2xl flex-shrink-0 lg:mx-0 lg:max-w-xl lg:pt-8">
                    <div className="mt-24 sm:mt-32 lg:mt-16">
                        <a href="#" className="inline-flex space-x-6">
                            <span className="rounded-full bg-pl-green/10 px-3 py-1 text-sm font-semibold leading-6 text-pl-green ring-1 ring-inset ring-pl-green/20">
                                Season 25/26
                            </span>
                            <span className="inline-flex items-center space-x-2 text-sm font-medium leading-6 text-gray-300">
                                <span>PianginaCUP v1.0</span>
                            </span>
                        </a>
                    </div>
                    <h1 className="mt-10 text-4xl font-bold tracking-tight text-white sm:text-6xl font-sans">
                        The Premier League <span className="text-pl-green">Fantacalcio</span>
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-gray-300">
                        Experience the intensity of English football with Italian Fantasy rules.
                        Auction based. Head-to-Head leagues. Live scores.
                    </p>
                    <div className="mt-10 flex items-center gap-x-6">
                        <Link
                            to="/dashboard"
                            className="rounded-md bg-pl-green px-3.5 py-2.5 text-sm font-bold text-pl-dark shadow-sm hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pl-green transition-all flex items-center gap-2"
                        >
                            Enter Dashboard <ArrowRight size={16} />
                        </Link>
                        <Link to="/admin/votes" className="text-sm font-semibold leading-6 text-white hover:text-pl-blue transition-colors">
                            Admin Access <span aria-hidden="true">→</span>
                        </Link>
                    </div>
                </div>

                {/* Hero Image / Stats Card */}
                <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mt-0 lg:mr-0 lg:max-w-none lg:flex-none xl:ml-32">
                    <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
                        <div className="rounded-xl bg-gray-900/50 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4 backdrop-blur-md border border-white/10">
                            <div className="rounded-lg bg-pl-card p-6 shadow-2xl relative overflow-hidden group hover:scale-[1.01] transition-transform duration-500">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Trophy size={120} />
                                </div>

                                <h3 className="text-pl-green font-bold uppercase tracking-widest text-sm mb-4">Live Matchday</h3>

                                <div className="flex items-center justify-between mb-8">
                                    <div className="text-center">
                                        <div className="text-3xl font-black text-white">LIV</div>
                                        <div className="text-gray-400 text-xs">Anfield</div>
                                    </div>
                                    <div className="text-4xl font-black text-pl-blue px-4">2 - 1</div>
                                    <div className="text-center">
                                        <div className="text-3xl font-black text-white">CHE</div>
                                        <div className="text-gray-400 text-xs">Away</div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between border-b border-gray-700 pb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-yellow-500">GK</div>
                                            <div>
                                                <div className="text-sm font-bold text-white">Alisson Block</div>
                                                <div className="text-xs text-green-400">Penalty Saved (+3)</div>
                                            </div>
                                        </div>
                                        <div className="text-xl font-bold text-pl-green">9.5</div>
                                    </div>

                                    <div className="flex items-center justify-between border-b border-gray-700 pb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-red-500">ATT</div>
                                            <div>
                                                <div className="text-sm font-bold text-white">M. Salah</div>
                                                <div className="text-xs text-blue-400">1 Goal, 1 Assist</div>
                                            </div>
                                        </div>
                                        <div className="text-xl font-bold text-pl-green">11.5</div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
