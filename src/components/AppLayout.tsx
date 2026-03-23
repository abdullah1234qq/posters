import LeftSidebar from "./LeftSidebar";
import BottomNav from "./BottomNav";
import RightSidebar from "./RightSidebar";
import Navbar from "./Navbar";

interface AppLayoutProps {
  children: React.ReactNode;
  showRightSidebar?: boolean;
}

const AppLayout = ({ children, showRightSidebar = true }: AppLayoutProps) => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <LeftSidebar />
      <BottomNav />
      <div className="flex justify-center min-h-[calc(100vh-3.5rem)]">
        <div className={`flex w-full max-w-5xl gap-6 px-4 py-6 lg:pl-24 ${showRightSidebar ? 'xl:pr-4' : ''}`}>
          <main className="flex-1 min-w-0 max-w-2xl mx-auto lg:mx-0">
            {children}
          </main>
          {showRightSidebar && <RightSidebar />}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
