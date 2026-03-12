import Sidebar from "./SideBar.jsx";
import { useState, useEffect } from "react";
export default function WrapperNav({isSettingOpen, children}) {
      const [sidebarOpen, setSidebarOpen] = useState(false);

    // Use useEffect to sync with prop changes
    useEffect(() => {
        if (isSettingOpen !== undefined) {
            setSidebarOpen(isSettingOpen);
        }
    }, [isSettingOpen]);


    return (
        <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
      {children}
        </div>
        </div>
    );
}