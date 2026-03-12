import { Menu } from "lucide-react";
export default function TopBar({children, title, openSidebar}) {
    return (
                <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={openSidebar}
                className="lg:hidden text-gray-600 hover:text-gray-900"
              >
                <Menu size={24} />
              </button>
              <h1 className="text-2xl lg:text-3xl font-bold text-violet-600">{title}</h1>
            </div>
        {children}
                  </div>
        </header>
    );
}