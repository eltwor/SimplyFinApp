import { Link } from "react-router-dom";
import Button from "./UI/Button";

export default function NavBar() {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18">
          <div className="flex items-center">
            <h2 className="text-2xl font-bold text-gray-900">SimplyFin</h2>
          </div>
          <Link to="/login"><Button width="px-10">Zaloguj</Button></Link>
        </div>
      </div>
    </nav>
  );
}
