import LoginForm from "../components/LoginForm";
import Button from "../components/UI/Button";
import {Link} from "react-router-dom";
export default function LoginPage() {
  return (
    <>
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <Link to="/"><Button variant="outline" size="lg">← Wróć</Button></Link>

      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-violet-500 text-3xl font-bold text-center mb-8">
          Witaj z powrotem!
        </h1>

    <LoginForm type="login"/>
      </div>
    </div>    </>

  );
}
