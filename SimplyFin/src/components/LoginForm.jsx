import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "./UI/Button";
import { loginUser, registerUser } from "../services/api";
import Modal from "./UI/Modal"; // Importujemy Twój komponent Modal
export default function LoginForm({ type }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const navigate = useNavigate();

  const handleModalClose = () => {
    setIsModalOpen(false);
    if (type === "register") {
      navigate("/login");}
    else
          navigate("/dashboard"); // Przekierowanie po zamknięciu modala
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (type === "register") {
        // Validation for registration
        if (password !== confirmPassword) {
          setError("Hasła nie są identyczne");
          setLoading(false);
          return;
        }
        
        if (password.length < 6) {
          setError("Hasło musi mieć co najmniej 6 znaków");
          setLoading(false);
          return;
        }

        if (!nickname.trim()) {
          setError("Imię użytkownika nie może być puste");
          setLoading(false);
          return;
        }

        // Call register API
        const user = await registerUser(email, password, nickname);
        setModalMessage(`Witaj ${user.nickname}! Rejestracja zakończona sukcesem!`);
        setIsModalOpen(true); 
      } else {
        // Call login API
        const data = await loginUser(email, password);

        const name = data.user?.nickname || data.nickname || 'użytkowniku';

        setModalMessage(`Witaj ponownie, ${name}!`);
        setIsModalOpen(true); 
      }
    } catch (err) {
      setError(err.message || "Błąd podczas logowania/rejestracji");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex justify-center my-8">
      <form 
        className="flex flex-col w-full max-w-md space-y-4" 
        onSubmit={handleSubmit}
      >
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />
        
        {type === "register" && (
          <input
            type="text"
            placeholder="Imię użytkownika"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        )}

        <input
          type="password"
          placeholder="Hasło"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />
        
        {type === "register" && (
          <input
            type="password"
            placeholder="Potwierdź hasło"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        )}

        {error && (
          <div className="px-4 py-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <Button 
          type="submit" 
          className="mt-6 w-full"
          disabled={loading}
        >
          {loading 
            ? (type === "login" ? "Logowanie..." : "Rejestracja...") 
            : (type === "login" ? "Zaloguj się" : "Zarejestruj się")
          }
        </Button>

        {type === "login" ? (
          <p className="text-center text-gray-600">
            Nie masz konta?{" "}
            <Link to="/register" className="text-violet-500 hover:text-violet-600 font-semibold">
              Zarejestruj się tutaj
            </Link>
          </p>
        ) : (
          <p className="text-center text-gray-600">
            Już masz konto?{" "}
            <Link to="/login" className="text-violet-500 hover:text-violet-600 font-semibold">
              Zaloguj się tutaj
            </Link>
          </p>
        )}
      </form>
      {/* NASZ NOWY MODAL */}
      <Modal isOpen={isModalOpen} onClose={handleModalClose}>
        <div className="flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-10 w-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-800">Sukces!</h2>
          <p className="mb-8 text-gray-600">{modalMessage}</p>
          <Button onClick={handleModalClose} className="w-full">
            Przejdź do aplikacji
          </Button>
        </div>
      </Modal>
    </section>
  );
}