import Image from 'next/image';
import { Phone, ArrowUpRight } from 'lucide-react';
import { Anton, Space_Mono } from 'next/font/google';

// /events/beyond-the-street
// Registration is by phone call — no online form or payment on this page.
// Server component: no client JS needed (marquee is pure CSS).

const anton = Anton({ subsets: ['latin'], weight: '400', variable: '--font-bts-display' });
const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-bts-mono',
});

// --------------- Event details ---------------
const PHONE_DISPLAY = '+91 87878 89470';
const PHONE_TEL = 'tel:++91 87878 89470';
const CALL_LABEL = 'Call +91 87878 89470 to register';
const ENTRY_FEE = 349;

const MARQUEE = [
  'Beyond the Street',
  '04 Oct 2026',
  'Imphal',
  '7 to Smoke',
  'Breaking',
  'Hip Hop',
  'All Style',
  `Call ${PHONE_DISPLAY}`,
];

const LINEUP = [
  {
    n: '01',
    name: 'Popper Vivek R.K',
    tag: '7 to Smoke · Hip Hop',
    image: '/beyond-the-street/popper-vivek-rk.jpg',
    alt: 'Popper Vivek R.K — 7 to Smoke Hip Hop at Beyond the Street, 4 October 2026',
    bio: 'Vivek R.K is a professional choreographer, performer and instructor. He is the proprietor of Pumpkin Dance Centre and the leader of Pumpkin Crew, and has been an active figure in the Indian dance community. He has judged dance events across different states, showcasing his expertise and commitment to uplifting emerging talents. His achievements include receiving the Dr Ambedkar National Award and being featured on major dance platforms such as Freeze, Break, The Floor, Stage Break, TO BE B-boy Vol.2 (North East India Breaking Operation) and Manfete at Manipur University from 2012 to 2018, among many others.',
  },
  {
    n: '02',
    name: 'B-boy Hip',
    tag: '7 to Smoke · Breaking',
    image: '/beyond-the-street/bboy-hip.jpg',
    alt: 'B-boy Hip — 7 to Smoke Breaking at Beyond the Street, 4 October 2026',
    bio: 'B-boy Hip is a professional break dancer and pioneer from Manipur, and the leader of the Smiley Crew. He is well known for his powerful style, dynamic movement, musicality and strong foundation. He has represented the Indian breaking scene at major events and has judged various dance events, making him a valuable voice on the judging panel. His achievements include a top 4 at the Red Bull BC One Cypher India 2016, a top 8 placement at the Red Bull BC One Cypher India 2017, and a finalist spot at Bharat Jam 2020.',
  },
  {
    n: '03',
    name: 'Create Nusanz',
    tag: 'Okiedokie DJ',
    image: '/beyond-the-street/create-nusanz.jpg',
    alt: 'Create Nusanz, Okiedokie DJ, playing at Beyond the Street on 4 October 2026',
    bio: 'Heisnam Shantanu Singh aka Create Nusanz is a DJ, producer and cultural practitioner from Manipur. His sets move through tech-house, electronic grooves, ethnic rhythms, samples and vocals, bringing together sounds with the cultural textures of the Northeast.',
  },
];

const BATTLES = [
  { n: '01', name: '7 to Smoke', style: 'Breaking & Hip Hop', level: 'Open' },
  { n: '02', name: 'Breaking', style: 'One vs One', level: 'Junior' },
  { n: '03', name: 'All Style', style: 'One vs One', level: 'Junior' },
];

const CULTURE_PARTNERS = [
  'Lanleima Amplified Communications',
  'Okie Dokie',
  'S. Tashing',
  'Mateng',
  'Kakyel Combat',
  'Ema Cafe',
];

const CSS = `
.bts-display{font-family:var(--font-bts-display),Impact,'Arial Narrow',sans-serif;text-transform:uppercase;letter-spacing:0.01em;font-weight:400}
.bts-mono{font-family:var(--font-bts-mono),ui-monospace,monospace}
.bts-outline{-webkit-text-stroke:2px #F2F0E8;color:transparent}
.bts-outline-ink{-webkit-text-stroke:2px #0A0A0A;color:transparent}
@keyframes bts-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.bts-marquee-track{display:flex;width:max-content;animation:bts-marquee 34s linear infinite}
@media (prefers-reduced-motion:reduce){.bts-marquee-track{animation:none}}
`;

function Marquee() {
  const items = [...MARQUEE, ...MARQUEE];
  return (
    <div
      className="bg-[#FF2D1A] text-[#0A0A0A] border-y-[3px] border-[#0A0A0A] overflow-hidden"
      aria-hidden="true"
    >
      <div className="bts-marquee-track py-2">
        {items.map((text, i) => (
          <span
            key={i}
            className="bts-mono text-xs sm:text-sm font-bold uppercase tracking-[0.2em] whitespace-nowrap px-5"
          >
            {text}
            <span className="pl-10">✱</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function BeyondTheStreetPage() {
  return (
    <div
      className={`${anton.variable} ${spaceMono.variable} w-full bg-[#0A0A0A] text-[#F2F0E8] pb-16 md:pb-0`}
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden">
        <Marquee />

        <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-10 sm:pt-16 pb-16 sm:pb-24 grid lg:grid-cols-12 gap-14 lg:gap-8 items-center">
          <div className="lg:col-span-7">
            <p className="bts-mono text-[11px] sm:text-xs tracking-[0.2em] uppercase text-[#FF2D1A]">
              Underground hip hop dance community
            </p>

            <h1 className="bts-display mt-4 leading-[0.82] text-[26vw] sm:text-[19vw] lg:text-[10.5rem] xl:text-[12rem]">
              <span className="block">Beyond</span>
              <span className="block bts-outline">the</span>
              <span className="block text-[#FF2D1A]">Street</span>
            </h1>

            <div className="mt-8 sm:mt-10 flex flex-wrap items-end gap-x-10 gap-y-7">
              <div>
                <p className="bts-mono text-[11px] uppercase tracking-[0.2em] text-[#F2F0E8]/70">
                  Dancesport battle
                </p>
                <p className="bts-display text-5xl sm:text-6xl leading-none mt-1">04.10.26</p>
              </div>

              <a
                href={PHONE_TEL}
                aria-label={CALL_LABEL}
                className="inline-flex items-center gap-3 bg-[#F2F0E8] text-[#0A0A0A] px-6 py-4 bts-display text-xl sm:text-2xl tracking-wide shadow-[6px_6px_0_#FF2D1A] transition-all duration-150 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0_#FF2D1A] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none"
              >
                <Phone className="h-5 w-5" />
                Call to register
                <ArrowUpRight className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 relative w-[90%] mx-auto lg:w-full max-w-md lg:max-w-none">
            <div className="relative aspect-square border-[3px] border-[#F2F0E8] rotate-[3deg] shadow-[12px_12px_0_#FF2D1A]">
              <Image
                src="/beyond-the-street.jpeg"
                alt="Beyond the Street Dancesport Battle poster — 4th October 2026, Imphal"
                fill
                priority
                sizes="(min-width: 1024px) 520px, 90vw"
                className="object-cover"
              />
            </div>
            <span
              aria-hidden="true"
              className="absolute -top-3 left-4 w-24 h-7 bg-[#F2F0E8]/85 -rotate-6"
            />
          </div>
        </div>
      </section>

      {/* ---------------- LINEUP ---------------- */}
      <section className="bg-[#F2F0E8] text-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
          <div className="flex items-end justify-between gap-6 border-b-[3px] border-[#0A0A0A] pb-4">
            <h2 className="bts-display text-6xl sm:text-8xl leading-[0.9]">
              The
              <br />
              Line—Up
            </h2>
            <span className="bts-mono text-[11px] sm:text-xs uppercase tracking-[0.2em] text-right">
              Featuring
              <br />
              03 names
            </span>
          </div>

          {LINEUP.map((person, i) => (
            <article
              key={person.name}
              className="grid md:grid-cols-12 gap-10 md:gap-14 items-center py-12 sm:py-16 border-b-[3px] border-[#0A0A0A] last:border-b-0 last:pb-0"
            >
              <div className={`md:col-span-5 px-2 ${i % 2 === 1 ? 'md:order-2' : ''}`}>
                <div
                  className={`border-[3px] border-[#0A0A0A] shadow-[10px_10px_0_#0A0A0A] ${
                    i % 2 === 0 ? '-rotate-2' : 'rotate-2'
                  }`}
                >
                  <Image
                    src={person.image}
                    alt={person.alt}
                    width={1280}
                    height={1280}
                    sizes="(min-width: 768px) 480px, 90vw"
                    className="block w-full h-auto"
                  />
                </div>
              </div>

              <div className="md:col-span-7">
                <span className="bts-display bts-outline-ink block text-8xl sm:text-9xl leading-none">
                  {person.n}
                </span>
                <span className="inline-block mt-4 bts-mono text-[11px] uppercase tracking-[0.18em] bg-[#0A0A0A] text-[#F2F0E8] px-3 py-1.5">
                  {person.tag}
                </span>
                <h3 className="bts-display mt-4 text-5xl sm:text-7xl leading-[0.95]">{person.name}</h3>
                <p className="mt-5 text-sm sm:text-base leading-relaxed max-w-prose">{person.bio}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ---------------- BATTLES ---------------- */}
      <section>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
          <div className="flex items-end justify-between gap-6">
            <h2 className="bts-display text-6xl sm:text-8xl leading-[0.9]">
              The
              <br />
              Battles
            </h2>
            <span className="bts-mono text-[11px] sm:text-xs uppercase tracking-[0.2em] text-right">
              Pick
              <br />
              your arena
            </span>
          </div>

          <ul className="mt-10 border-t-[3px] border-[#F2F0E8]">
            {BATTLES.map((battle) => (
              <li
                key={battle.n}
                className="border-b-[3px] border-[#F2F0E8] transition-colors duration-200 hover:bg-[#FF2D1A] hover:text-[#0A0A0A]"
              >
                <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 px-1 sm:px-4 py-6 sm:py-8">
                  <span className="bts-mono text-sm tracking-[0.2em]">{battle.n}</span>
                  <span className="bts-display text-5xl sm:text-7xl lg:text-8xl leading-none flex-1 min-w-[55%]">
                    {battle.name}
                  </span>
                  <span className="bts-mono text-xs sm:text-sm uppercase tracking-[0.18em]">
                    {battle.style}
                  </span>
                  <span className="bts-mono text-xs uppercase tracking-[0.18em] border-2 border-current px-3 py-1">
                    {battle.level}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------- DATE / VENUE / ENTRY ---------------- */}
      <section className="bg-[#FF2D1A] text-[#0A0A0A] border-y-[3px] border-[#0A0A0A]">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 divide-y-[3px] md:divide-y-0 md:divide-x-[3px] divide-[#0A0A0A]">
          <div className="px-5 sm:px-8 py-8 sm:py-12">
            <p className="bts-mono text-[11px] uppercase tracking-[0.2em]">Date</p>
            <p className="bts-display mt-2 text-5xl sm:text-6xl leading-none">04 Oct 2026</p>
            <p className="mt-2 text-sm">Dancesport battle</p>
          </div>
          <div className="px-5 sm:px-8 py-8 sm:py-12">
            <p className="bts-mono text-[11px] uppercase tracking-[0.2em]">Venue</p>
            <p className="bts-display mt-2 text-4xl sm:text-5xl leading-[0.95]">Thangmeiband Cheiraoching</p>
            <p className="mt-2 text-sm">Imphal West · 795001</p>
          </div>
          <div className="px-5 sm:px-8 py-8 sm:py-12">
            <p className="bts-mono text-[11px] uppercase tracking-[0.2em]">Entry</p>
            <p className="bts-display mt-2 text-5xl sm:text-6xl leading-none">₹{ENTRY_FEE}</p>
            <p className="mt-2 text-sm">Registration fee</p>
          </div>
        </div>
      </section>

      {/* ---------------- REGISTER BY CALL ---------------- */}
      <section id="register" className="bg-[#F2F0E8] text-[#0A0A0A] scroll-mt-16">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-24 grid lg:grid-cols-12 gap-12 lg:gap-8 items-end">
          <div className="lg:col-span-7">
            <p className="bts-mono text-[11px] sm:text-xs uppercase tracking-[0.2em]">Registration</p>
            <h2 className="bts-display mt-3 text-[16vw] sm:text-8xl lg:text-9xl leading-[0.88]">
              Pick up
              <br />
              the <span className="text-[#FF2D1A]">phone.</span>
            </h2>
            <p className="mt-6 max-w-md text-sm sm:text-base leading-relaxed">
              Registration for Beyond the Street is by phone call. Entry fee is ₹{ENTRY_FEE}.
            </p>
          </div>

          <div className="lg:col-span-5">
            <a
              href={PHONE_TEL}
              aria-label={CALL_LABEL}
              className="block bg-[#0A0A0A] text-[#F2F0E8] px-6 sm:px-8 py-7 sm:py-9 shadow-[8px_8px_0_#FF2D1A] transition-all duration-150 hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0_#FF2D1A] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none"
            >
              <span className="flex items-center gap-2 bts-mono text-[11px] sm:text-xs uppercase tracking-[0.2em] text-[#FF2D1A]">
                <Phone className="h-4 w-4" />
                Call to register
              </span>
              <span className="bts-display mt-3 block text-6xl sm:text-7xl leading-none">
                {PHONE_DISPLAY}
              </span>
              <span className="mt-4 flex items-center justify-between bts-mono text-[11px] uppercase tracking-[0.2em] text-[#F2F0E8]/70">
                <span>Tap to dial</span>
                <ArrowUpRight className="h-5 w-5 text-[#F2F0E8]" />
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* ---------------- CULTURE PARTNERS ---------------- */}
      <section className="border-t-[3px] border-[#F2F0E8]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
          <p className="bts-mono text-[11px] sm:text-xs uppercase tracking-[0.2em] text-[#F2F0E8]/70">
            Culture partners
          </p>
          <ul className="mt-5 flex flex-wrap gap-3">
            {CULTURE_PARTNERS.map((name) => (
              <li
                key={name}
                className="border-2 border-[#F2F0E8] px-4 py-2 bts-display text-lg sm:text-2xl"
              >
                {name}
              </li>
            ))}
          </ul>
          <p className="bts-mono text-[11px] uppercase tracking-[0.2em] text-[#F2F0E8]/50 mt-10">
            Beyond the Street · Underground hip hop dance community · 04 Oct 2026
          </p>
        </div>
      </section>

      {/* ---------------- STICKY CALL BAR (mobile) ---------------- */}
      <a
        href={PHONE_TEL}
        aria-label={CALL_LABEL}
        className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-center justify-center gap-3 bg-[#FF2D1A] text-[#0A0A0A] border-t-[3px] border-[#0A0A0A] py-3.5 bts-display text-xl tracking-wide"
      >
        <Phone className="h-5 w-5" />
        Call to register · {PHONE_DISPLAY}
      </a>
    </div>
  );
}