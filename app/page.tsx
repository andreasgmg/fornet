import Link from "next/link";
import { ArrowRight, Check, Shield, FileText, Phone, Users, HelpCircle, Star, CreditCard } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      
      {/* NAVIGATION */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <Shield className="text-blue-600" fill="currentColor" size={24} /> 
            Fornet.se
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-black transition-colors hidden sm:block">
              Logga in
            </Link>
            <Link 
              href="/login?view=signup" 
              className="bg-green-600 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-green-700 transition-all shadow-md hover:shadow-lg"
            >
              Prova gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION - Tryggt och inbjudande */}
      <section className="pt-40 pb-20 px-6 text-center bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 text-sm font-medium text-gray-600 mb-8 shadow-sm">
            <span className="text-green-600">★ ★ ★ ★ ★</span>
            Används av vägföreningar & klubbar i hela Sverige
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-gray-900 leading-[1.2]">
            En enkel hemsida för din förening. <br/>
            <span className="text-blue-600">Klar på 2 minuter.</span>
          </h1>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Samla styrelsen, dokumenten och medlemmarna på ett ställe. 
            Ingen krånglig teknik, ingen installation. Fungerar lika bra i mobilen som på datorn.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/login?view=signup" 
              className="w-full sm:w-auto bg-green-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              Starta 60 dagars gratis provperiod <ArrowRight size={20} />
            </Link>
            <Link 
              href="#hur-funkar-det" 
              className="w-full sm:w-auto bg-white border border-gray-200 text-gray-900 px-8 py-4 rounded-xl text-lg font-bold hover:bg-gray-50 transition-all"
            >
              Hur funkar det?
            </Link>
          </div>
          
          <p className="mt-6 text-sm text-gray-500 font-medium">
            <Check size={14} className="inline text-green-600 mr-1"/> Helt gratis i 60 dagar
            <span className="mx-3 text-gray-300">|</span>
            <Check size={14} className="inline text-green-600 mr-1"/> Avsluta när du vill - kostar 0 kr
          </p>
        </div>
      </section>

      {/* PROBLEM / LÖSNING (Igenkänning) */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">Känner du igen dig?</h2>
                <p className="text-gray-500 max-w-2xl mx-auto">Att sitta i styrelsen innebär ofta mycket jobb som ingen ser.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-6 mx-auto">
                        <Phone size={24} />
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-center">Telefonen ringer...</h3>
                    <p className="text-gray-600 text-center text-sm">
                        "Har plogbilen varit här?", "När sätts vattnet på?", "Var är årsmötesprotokollet?". Samma frågor, om och om igen.
                    </p>
                </div>
                
                <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mb-6 mx-auto">
                        <FileText size={24} />
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-center">Papper i pärmar</h3>
                    <p className="text-gray-600 text-center text-sm">
                        Viktiga dokument ligger i en pärm hos kassören eller på en gammal hårddisk. Ingen hittar dem när det väl gäller.
                    </p>
                </div>

                <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-6 mx-auto">
                        <Users size={24} />
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-center">Krångliga bokningar</h3>
                    <p className="text-gray-600 text-center text-sm">
                        Bokning av tvättstuga eller gästlägenhet sker via lappar i brevlådan eller sms-kedjor som ingen har koll på.
                    </p>
                </div>
            </div>
        </div>
      </section>

      {/* HUR FUNKAR DET? */}
      <section id="hur-funkar-det" className="py-24 bg-gray-900 text-white px-6">
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Så här enkelt är det</h2>
                <p className="text-gray-400">Du behöver inte kunna koda. Kan du skicka ett mail, kan du använda Fornet.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-12 text-center relative">
                {/* Linje mellan stegen (Desktop) */}
                <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gray-800 -z-10"></div>

                <div>
                    <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 border-8 border-gray-800 shadow-xl">1</div>
                    <h3 className="text-xl font-bold mb-2">Skapa konto</h3>
                    <p className="text-gray-400 text-sm">Registrera din förening på 30 sekunder. Du får en egen adress direkt (t.ex. bjorken.fornet.se).</p>
                </div>
                <div>
                    <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 border-8 border-gray-800 shadow-xl">2</div>
                    <h3 className="text-xl font-bold mb-2">Välj funktioner</h3>
                    <p className="text-gray-400 text-sm">Klicka i vad ni behöver: Bokning, Dokumentarkiv eller bara Nyheter. Vi har färdiga mallar.</p>
                </div>
                <div>
                    <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 border-8 border-gray-800 shadow-xl">3</div>
                    <h3 className="text-xl font-bold mb-2">Bjud in medlemmar</h3>
                    <p className="text-gray-400 text-sm">Skicka länken till grannarna. Nu kan de själva se info och boka tider i mobilen.</p>
                </div>
            </div>
        </div>
      </section>

      {/* PRICING - Tydligt och tryggt */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">Vad kostar det?</h2>
            <p className="text-gray-500 text-lg mb-12 max-w-xl mx-auto">
              Ett lågt pris som alla föreningar har råd med. Inga startavgifter.
            </p>

            <div className="bg-white border border-gray-200 rounded-3xl p-8 md:p-12 shadow-xl max-w-lg mx-auto relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 bg-green-50 text-green-800 text-xs font-bold py-2 uppercase tracking-wide border-b border-green-100">
                Prova riskfritt i 60 dagar
              </div>
              
              <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-8 mb-8 border-b border-gray-100 pb-8">
                  <div className="text-left">
                      <h3 className="text-2xl font-bold text-gray-900">Helår</h3>
                      <p className="text-gray-500 text-sm">Det smartaste valet.</p>
                  </div>
                  <div className="text-right">
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-extrabold text-gray-900">79</span>
                        <span className="text-gray-500 font-medium">kr / mån</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">948 kr faktureras årsvis</p>
                  </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 text-left mb-10">
                <li className="flex gap-3 text-sm font-medium text-gray-700"><Check size={18} className="text-green-600 flex-shrink-0"/> Egen hemsida</li>
                <li className="flex gap-3 text-sm font-medium text-gray-700"><Check size={18} className="text-green-600 flex-shrink-0"/> Bokningssystem</li>
                <li className="flex gap-3 text-sm font-medium text-gray-700"><Check size={18} className="text-green-600 flex-shrink-0"/> 10 GB för dokument</li>
                <li className="flex gap-3 text-sm font-medium text-gray-700"><Check size={18} className="text-green-600 flex-shrink-0"/> Obegränsat medlemmar</li>
                <li className="flex gap-3 text-sm font-medium text-gray-700"><Check size={18} className="text-green-600 flex-shrink-0"/> Mobilanpassat</li>
                <li className="flex gap-3 text-sm font-medium text-gray-700"><Check size={18} className="text-green-600 flex-shrink-0"/> Svensk support</li>
              </div>

              <Link 
                href="/login?view=signup" 
                className="block w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700 transition-colors shadow-lg"
              >
                Starta provperiod
              </Link>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                <CreditCard size={12} />
                <p>Ingen dragning idag. Avsluta när du vill under testperioden utan kostnad.</p>
              </div>
            </div>
        </div>
      </section>

      {/* FAQ - Svara på Oves frågor */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">Vanliga frågor</h2>
            
            <div className="space-y-8">
                <div>
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><HelpCircle size={18} className="text-blue-600"/> Kostar det verkligen ingenting att prova?</h3>
                    <p className="text-gray-600">Precis! Du får 60 dagar helt gratis. Om du avslutar prenumerationen inom dessa 60 dagar dras inte en enda krona.</p>
                </div>
                <div>
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><HelpCircle size={18} className="text-blue-600"/> Behöver jag installera något?</h3>
                    <p className="text-gray-600">Nej, Fornet är helt webbaserat. Du och dina medlemmar loggar in via webbläsaren i datorn eller mobilen.</p>
                </div>
                <div>
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><HelpCircle size={18} className="text-blue-600"/> Är det svårt att byta om vi inte är nöjda?</h3>
                    <p className="text-gray-600">Inte alls. Det finns ingen bindningstid. Du kan när som helst avsluta och ladda ner era dokument.</p>
                </div>
                <div>
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><HelpCircle size={18} className="text-blue-600"/> Kan vi ha en egen domän (t.ex. www.byvägen.se)?</h3>
                    <p className="text-gray-600">Ja, det går att peka om er befintliga adress till oss. Kontakta supporten så hjälper vi er!</p>
                </div>
            </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-white">
            <Shield size={20} className="text-blue-500" /> Fornet.se
          </div>
          <div className="text-sm">
            &copy; {new Date().getFullYear()} Svenska Föreningsnätet AB.
          </div>
        </div>
      </footer>

    </div>
  );
}