import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export const Layout = () => {
    return (
        <div className="h-[100dvh] w-full bg-pl-dark text-white selection:bg-pl-green selection:text-pl-dark flex flex-col overflow-hidden">
            <Navbar />
            <main className="flex-1 flex flex-col relative overflow-y-auto overflow-x-hidden scrollbar-hide">
                <Outlet />
            </main>
        </div>
    );
};
