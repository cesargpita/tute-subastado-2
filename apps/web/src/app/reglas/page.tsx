import Link from "next/link";

export default function ReglasPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-8 md:px-8">
      <section className="rounded-3xl border border-[#5b3b24] bg-[#2f2015] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.45)] md:p-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-wide text-amber-100 md:text-3xl">Reglas de Tute Subastado</h1>
          <Link
            className="rounded-lg border border-amber-200/30 bg-amber-300 px-4 py-2 text-sm font-semibold text-[#1d130b] hover:bg-amber-200"
            href="/"
          >
            Volver a la mesa
          </Link>
        </div>

        <div className="space-y-5 text-sm text-amber-50/95 md:text-base">
          <section>
            <h2 className="mb-1 text-lg font-semibold text-amber-100">Baraja y objetivo</h2>
            <p>Se juega con baraja espanola de 40 cartas. El objetivo del subastador es cumplir su contrato de puntos.</p>
          </section>

          <section>
            <h2 className="mb-1 text-lg font-semibold text-amber-100">Subasta</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>La puja minima es 60.</li>
              <li>Las pujas suben de 5 en 5.</li>
              <li>Si todos pasan, se reparten nuevas cartas.</li>
              <li>Cuando termina la subasta, el ganador elige el triunfo.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-1 text-lg font-semibold text-amber-100">Obligaciones al jugar carta</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>Asistir: si tienes palo de salida, debes jugarlo.</li>
              <li>Montar: si puedes superar la carta mayor de ese palo, debes hacerlo.</li>
              <li>Fallar: si no tienes palo de salida, debes jugar triunfo.</li>
              <li>Pisar: si ya hay triunfo en mesa y puedes superarlo, debes superarlo.</li>
              <li>Contrafallar: si no puedes pisar, puedes jugar cualquier carta.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-1 text-lg font-semibold text-amber-100">Puntuacion</h2>
            <p>As = 11, Tres = 10, Rey = 4, Caballo = 3, Sota = 2. La ultima baza suma 10 puntos extra.</p>
          </section>

          <section>
            <h2 className="mb-1 text-lg font-semibold text-amber-100">Canto</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>El canto es la pareja Rey (12) + Caballo (11) del mismo palo.</li>
              <li>En esta mesa, el canto se detecta automaticamente al jugar una de las dos cartas y conservar la otra en mano.</li>
              <li>Si el palo cantado es triunfo, suma 40 puntos.</li>
              <li>Si el palo cantado no es triunfo, suma 20 puntos.</li>
              <li>No se puede cantar dos veces el mismo palo por el mismo jugador.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-1 text-lg font-semibold text-amber-100">Referencia oficial</h2>
            <p>
              Esta pagina resume las reglas aplicadas en el juego tomando como referencia:
              {" "}
              <a
                className="font-semibold text-cyan-200 underline hover:text-cyan-100"
                href="https://es.wikipedia.org/wiki/Tute_subastado"
                rel="noreferrer"
                target="_blank"
              >
                es.wikipedia.org/wiki/Tute_subastado
              </a>
              .
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
