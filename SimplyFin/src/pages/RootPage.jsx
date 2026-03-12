import NavBar from "../components/NavBar";
import Button from "../components/UI/Button";
import ChartImage from "../assets/chart.jpg";
import DashboardImage from "../assets/Dashboard_Image.jpg";
import WydatkiImage from "../assets/Wydatki_Image.jpg";
import OszczednosciImage from "../assets/Oszczednosci_Image.jpg"; 

export default function RootPage() {
   const features = [
    {
      id: 1,
      title: "Przegląd Finansów",
      description: "Zdobądź kompletny obraz swoich finansów na pierwszy rzut oka. Śledź swoje wydatki, oszczędności i postęp budżetowy w jednym miejscu z pięknymi, łatwymi do odczytania wykresami.",
      image: DashboardImage
    },
    {
      id: 2,
      title: "Analiza Wydatków i Przychodów", 
      description: "Zagłęb się w swoje wydatki i przychody, według kategorii. Nie zapominaj o subskrypcjach i rachunkach cyklicznych dzięki inteligentnym przypomnieniom. Analizuj swoje finanse dzięki interaktywnym wykresom i raportom.",
      image: WydatkiImage
    },
    {
      id: 3,
      title: "Cele Oszczędzania",
      description: "Ustaw i śledź oszczędności, ustaw daty końcowe, połącz konta oszczędnościowe lub lokaty i obserwuj postępy w realizacji swoich celów finansowych.",
      image: OszczednosciImage
    }
  ];
  return (
        <div className="min-h-screen bg-gray-50">
      <NavBar />
{/* Hero Section */}
      <section className="relative bg-gradient-to-br from-violet-50 to-gray-100 overflow-hidden">
        {/* Background Image - Faded */}
        <div className="absolute inset-0 opacity-10">
          <img 
            src={ChartImage} 
            alt="Chart background"
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Weź kontrolę nad swoją
              <span className="text-violet-600 block">Finansową Przyszłością</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Ta aplikacja pomoże Ci budżetować wydatki, śledzić wydatki i osiągać cele oszczędnościowe dzięki inteligentnym spostrzeżeniom i prognozom.
            </p>
        <Button variant="secondary" width="px-20">Zacznij teraz!</Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Wszystko, czego potrzebujesz do zarządzania swoimi pieniędzmi
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Potężne funkcje zaprojektowane, by pomóc Ci zrozumieć, kontrolować i optymalizować swoje życie finansowe.
            </p>
          </div>

          <div className="space-y-20">
            {features.map((feature, index) => (
              <div key={feature.id} className={`flex flex-col lg:flex-row items-center gap-12 ${
                index % 2 === 1 ? 'lg:flex-row-reverse' : ''
              }`}>
                {/* Image */}
                <div className="flex-1 w-full">
                  <div className="aspect-video bg-gray-200 rounded-xl overflow-hidden shadow-lg">
                    <img 
                      src={feature.image} 
                      alt={feature.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 text-center lg:text-left">
                  <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">
                    {feature.title}
                  </h3>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-violet-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
           Gotowy do rozpoczęcia swojej podróży finansowej?
          </h2>
          <p className="text-xl text-violet-100 mb-8">
            Dołącz do użytkowników, którzy już przejęli kontrolę nad swoimi finansami.
          </p>
          <button className="bg-white hover:bg-gray-50 text-violet-600 px-8 py-4 rounded-lg font-semibold text-lg transition-colors shadow-lg">
            Zacznij teraz!
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-4">SimplyFin</h3>
            <p className="text-gray-400">
              © 2025 SimplyFin
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
