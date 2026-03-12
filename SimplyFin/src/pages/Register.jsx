import LoginForm from "../components/LoginForm";
import Button from "../components/UI/Button";
export default function RegisterPage() {
  return (
    <>
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <Button variant="outline" size="lg">← Back</Button>

      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-violet-500 text-3xl font-bold text-center mb-8">
         Stwórz konto
        </h1>

    <LoginForm type="register"/>
      </div>
    </div>    </>

  );
}
