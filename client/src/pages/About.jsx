import { Atom, Target, Heart, Lightbulb } from 'lucide-react';

export default function About() {
  return (
    <div>
      <section className="bg-gradient-soft py-14">
        <div className="container-x max-w-3xl">
          <span className="chip bg-white border border-brand-100 text-brand-700 mb-3">
            <Atom size={14} /> About Us
          </span>
          <h1 className="font-display text-4xl font-extrabold">
            India's most loved <span className="gradient-text">Chemistry Platform</span>
          </h1>
          <p className="text-slate-600 mt-4 text-lg leading-relaxed">
            Ace2Examz was built by Chemistry educators who believed Chemistry deserved a
            dedicated, world-class platform. From CBSE and IGCSE to A-Levels, university entrance
            exams, and professional certifications — we cover every major curriculum with the same rigour and care.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container-x grid md:grid-cols-3 gap-6">
          {[
            { i: Target, t: 'Our Mission', d: 'Make world-class Chemistry education affordable and accessible for every aspirant.' },
            { i: Heart, t: 'Our Values', d: 'Student-first, quality over quantity, and absolute transparency.' },
            { i: Lightbulb, t: 'Our Vision', d: 'To produce the next generation of chemists, researchers, and problem-solvers.' },
          ].map((v, i) => (
            <div key={i} className="card p-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-brand grid place-items-center text-white mb-3">
                <v.i size={22} />
              </div>
              <h3 className="font-bold text-lg">{v.t}</h3>
              <p className="text-slate-500 mt-1 text-sm">{v.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
