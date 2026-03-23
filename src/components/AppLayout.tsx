import LeftSidebar from "./LeftSidebar";
import BottomNav from "./BottomNav";
import RightSidebar from "./RightSidebar";

interface AppLayoutProps {
  children: React.ReactNode;
  showRightSidebar?: boolean;
}

const AppLayout = ({ children, showRightSidebar = true }: AppLayoutProps) => {
  return (
    <div className="min-h-screen">
      <LeftSidebar />
      <BottomNav />
      <div className="flex justify-center min-h-screen">
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
