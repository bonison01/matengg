// app/(main)/manipur_blog/page.tsx
import Hero from "@/components/manipur/Hero";
import SectionNav from "@/components/manipur/SectionNav";
import Section from "@/components/manipur/Section";
import { StaggerGroup, StaggerItem } from "@/components/manipur/Stagger";
import CountUp from "@/components/manipur/CountUp";
import Photo from "@/components/manipur/Photo";
import Gallery, { GalleryItem } from "@/components/manipur/Gallery";
import Visit from "@/components/manipur/Visit";
import VisitCommunity from "@/components/manipur/VisitCommunity";
import { CommunityEntries, CommentThread } from "@/components/manipur/Community";
import { PhotoMosaic, PhotoBand } from "@/components/manipur/PhotoBlocks";
import { P } from "@/components/manipur/photos";
import {
  Accordion,
  Draggable,
  Gallop,
  PeopleGrid,
  PlaceExplorer,
  Tabs,
} from "@/components/manipur/Interactive";
import {
  SangaiMotif,
  RiderMotif,
  LatticeMotif,
  RidgeMotif,
  LoktakMotif,
} from "@/components/manipur/Motifs";

const people = [
  {
    name: "Mary Kom",
    role: "Boxer",
    note: "Six-time World Champion and the only woman boxer to win a medal at every one of the first eight World Championships; carried India's flag at the 2012 Olympics.",
  },
  {
    name: "Mirabai Chanu",
    role: "Weightlifter",
    note: "Won silver in the 49kg category at the Tokyo Olympics, the first Indian weightlifting medal at the Games in 21 years.",
  },
  {
    name: "Ratan Thiyam",
    role: "Theatre director",
    note: "Founder of the Chorus Repertory Theatre; brought Manipuri physical theatre to stages worldwide and received the Padma Bhushan.",
  },
  {
    name: "Kunjarani Devi",
    role: "Weightlifter",
    note: "Multiple world-champion lifter through the 1990s, among the athletes who first put Manipur on India's Olympic sports map.",
  },
];

const places = [
  {
    name: "Loktak Lake",
    note: "The largest freshwater lake in the northeast, famous for its phumdis — floating mats of vegetation thick enough to walk on.",
    motif: <LoktakMotif className="text-teal" />,
  },
  {
    name: "Keibul Lamjao National Park",
    note: "Set on Loktak's phumdis, the only floating national park on earth and the last natural refuge of the Sangai deer.",
    motif: <SangaiMotif />,
  },
  {
    name: "Kangla Fort",
    note: "Former seat of Manipur's kings on the Imphal river, sacred to Sanamahi belief and reopened to the public in 2004.",
    motif: <RidgeMotif />,
  },
  {
    name: "Ima Keithel",
    note: "The Mothers' Market in central Imphal, run entirely by women traders and reputed to be the largest of its kind anywhere.",
    motif: <LatticeMotif className="w-64" />,
  },
  {
    name: "Shirui Hill",
    note: "Home to the Shirui lily, a rare bloom found nowhere else on earth, flowering each May above Ukhrul town.",
    motif: <RidgeMotif />,
  },
  {
    name: "Dzuko Valley",
    note: "A high alpine valley on the Nagaland border, carpeted in seasonal lilies and reached by a steep two-day trek.",
    motif: <RidgeMotif className="text-teal" />,
  },
];

// Loads a file straight from Wikimedia Commons (resized to 1600px wide).
const commons = (file: string) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${file}?width=1600`;
const LOKTAK_PHOTO = commons("Loktak_Lake_Fishing_Boats_Moirang_Manipur_India.jpg");
const KANGLA_PHOTO = commons(
  "Manung_Thangapat_-_the_Inner_Moat_of_the_Kangla_Fort_in_Imphal.jpg"
);

// Everything else: drop your photos into  public/manipur/  with these file names.
// Missing files are skipped automatically, so you can add them one by one.
const placePhotos: Record<string, string> = {
  "Loktak Lake": LOKTAK_PHOTO,
  "Keibul Lamjao National Park": "/manipur/keibul-lamjao.jpg",
  "Kangla Fort": KANGLA_PHOTO,
  "Ima Keithel": "/manipur/ima-keithel.jpg",
  "Shirui Hill": "/manipur/shirui.jpg",
  "Dzuko Valley": "/manipur/dzuko.jpg",
};

const gallery: GalleryItem[] = [
  // TODO: replace "Wikimedia Commons" with the photographer's name and licence
  // from the file's Commons page before publishing.
  { src: LOKTAK_PHOTO, alt: "Fishing boats on Loktak Lake", caption: "Fishing boats on Loktak Lake", credit: "Wikimedia Commons" },
  { src: "/manipur/sangai.jpg", alt: "A Sangai deer", caption: "The Sangai, Manipur's brow-antlered deer" },
  { src: "/manipur/ras-lila.jpg", alt: "Manipuri Ras Lila performance", caption: "Ras Lila, one of India's classical dance forms" },
  { src: "/manipur/polo.jpg", alt: "Sagol Kangjei on horseback", caption: "Sagol Kangjei, the horseback game behind modern polo" },
  { src: "/manipur/ima-keithel.jpg", alt: "Ima Keithel, the Mothers' Market", caption: "Ima Keithel, the market run by women traders" },
  { src: "/manipur/handloom.jpg", alt: "Handloom weaving", caption: "Handloom weaving, Manipur's largest cottage industry" },
  { src: KANGLA_PHOTO, alt: "The inner moat of Kangla Fort", caption: "The inner moat of Kangla Fort, Imphal", credit: "Wikimedia Commons" },
  { src: "/manipur/shirui.jpg", alt: "Shirui lily in bloom", caption: "The Shirui lily, flowering each May above Ukhrul" },
  { src: "/manipur/sangai-festival.jpg", alt: "Sangai Festival", caption: "Sangai Festival, held each November in Imphal" },
];

const works = [
  {
    title: "Sangai Festival",
    tag: "Tourism",
    body: "A state-wide tourism showcase held each November across Imphal, bringing together handloom, cuisine, sport, and music under one calendar.",
  },
  {
    title: "Startup Manipur",
    tag: "Enterprise",
    body: "State incubation and seed-funding programme aimed at drawing young entrepreneurs back to Imphal's growing IT and services sector.",
  },
  {
    title: "National Sports University",
    tag: "Sport",
    body: "India's first dedicated sports university, sited in Imphal to formalise the coaching pipelines that already produce national athletes.",
  },
  {
    title: "Ima Market redevelopment",
    tag: "Civic",
    body: "A multi-phase rebuild of the Ima Keithel complex to modernise stalls while keeping the market entirely trader-run.",
  },
];

const musicItems = [
  {
    title: "The pena",
    tag: "Oldest tradition",
    body: "A single-stringed bowed instrument played resting on the ground, it carries Manipur's oldest musical tradition. Pena khongba bards once recited royal chronicles to its sound, and a handful of players keep the practice alive today.",
  },
  {
    title: "Sankirtana",
    tag: "UNESCO, 2013",
    body: "Ritual singing, drumming, and dance performed at Vaishnavite temples and life-cycle ceremonies across the valley. It bridges temple ritual and public performance, drummers and singers moving in tightly choreographed unison.",
  },
  {
    title: "Thang-ta",
    tag: "Martial art",
    body: "A martial art built around sword and spear, with its own dance form drawn from the same footwork, performed at festivals as a display of both combat skill and rhythm.",
  },
  {
    title: "New voices",
    tag: "Contemporary",
    body: "Newer generations have carried Manipuri music outward through playback singing, indie bands, and a small but committed local film industry.",
  },
];

const cultureTabs = [
  {
    id: "valley",
    label: "The valley",
    body: (
      <>
        <p>
          The Imphal valley is home to the Meitei community. Its older
          spiritual life, Sanamahism, sits alongside Vaishnavism, introduced in
          the eighteenth century.
        </p>
        <p>
          Meira Paibi, torch-bearing women&rsquo;s patrols, remain a fixture of
          civic life in Meitei localities, watching over their neighbourhoods
          after dark.
        </p>
      </>
    ),
  },
  {
    id: "hills",
    label: "The hills",
    body: (
      <>
        <p>
          Naga and Kuki-Zo peoples live across the ringing hills, each with
          distinct dress, dialect, and festival cycles.
        </p>
        <p>
          Naga communities mark Lui-Ngai-Ni, a seed-sowing festival held every
          spring, while Kuki-Zo villages celebrate Kut each autumn in thanks
          for the harvest.
        </p>
      </>
    ),
  },
  {
    id: "dance",
    label: "Faith & dance",
    body: (
      <>
        <p>
          Vaishnavism gave rise to Ras Lila &ndash; a devotional dance-drama of
          Krishna&rsquo;s life recognised as one of India&rsquo;s eight
          classical dance forms.
        </p>
        <p>
          Every valley festival has a hill counterpart, and neither waits for
          the other&rsquo;s calendar.
        </p>
      </>
    ),
  },
];

export default function Home() {
  return (
    <main id="top" className="manipur-page relative z-10 bg-white text-ink">
      <Hero />
      <SectionNav />

      {/* CULTURE */}
      <Section
        id="culture"
        index="01"
        eyebrow="Culture"
        title="Nine ranges of hills, a hundred ways of belonging"
        aside={
          <div className="space-y-8">
            <Photo
              src="/manipur/ras-lila.jpg"
              alt="Manipuri Ras Lila performance"
              className="aspect-[4/3] rounded-2xl"
            />
            <Draggable hint="Drag the ridge">
              <RidgeMotif className="h-40 w-full text-maroon/70" />
            </Draggable>
          </div>
        }
      >
        <Tabs items={cultureTabs} />
        <PhotoMosaic
          className="mt-8"
          items={[
            { src: P.meitei, alt: "Meitei traditional dress", caption: "The valley" },
            { src: P.nagaFestival, alt: "Naga festival", caption: "Naga festival" },
            { src: P.kukiKut, alt: "Kut festival", caption: "Kut, the autumn harvest" },
          ]}
        />
      </Section>

      {/* MUSIC & DANCE */}
      <Section
        id="music"
        index="02"
        eyebrow="Music & dance"
        title="An instrument strung from a single thread"
        aside={
          <div className="space-y-6">
            <Photo
              src={P.sankirtana}
              alt="Sankirtana performance"
              className="aspect-[4/3] rounded-2xl"
            />
            <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <p className="label text-maroon">Inscribed by UNESCO, 2013</p>
              <p className="mt-3 font-display text-xl italic leading-snug">
                Sankirtana &ndash; ritual singing, drumming, and dance performed
                at Vaishnavite temples and life-cycle ceremonies across the
                valley.
              </p>
            </div>
          </div>
        }
      >
        <Accordion items={musicItems} />
        <PhotoMosaic
          className="mt-8"
          items={[
            { src: P.pena, alt: "A pena player", caption: "The pena" },
            { src: P.thangta, alt: "Thang-ta display", caption: "Thang-ta" },
          ]}
        />
      </Section>

      {/* SPORTS */}
      <Section
        id="sports"
        index="03"
        eyebrow="Sports"
        title="Where modern polo began on horseback"
        aside={
          <div className="space-y-6">
            <Photo
              src="/manipur/polo.jpg"
              alt="Sagol Kangjei on horseback"
              className="aspect-[4/3] rounded-2xl"
            />
            <Gallop>
              <RiderMotif className="h-44 w-full text-maroon/80" />
            </Gallop>
            <p className="text-sm text-ink/60">
              Hover the rider. Sagol Kangjei, Manipur&rsquo;s indigenous
              horseback game, is widely credited as the root of modern polo,
              adapted by British planters in the nineteenth century.
            </p>
          </div>
        }
      >
        <p>
          For a state of roughly three million people, Manipur&rsquo;s record
          in Olympic sport is disproportionate. Mary Kom built a six-time world
          boxing championship from a training ground outside Imphal; Mirabai
          Chanu brought home an Olympic silver in weightlifting from Tokyo; and
          a steady line of footballers, archers, and wushu athletes have passed
          through the state&rsquo;s sports academies onto national squads.
        </p>
        <p>
          Sagol Kangjei is still played on festival days, riders striking a
          wooden ball at full gallop with a cane mallet &ndash; the same shape
          of game that gave the sport its English name, borrowed from the
          Manipuri word for ball, pulu.
        </p>
        <PhotoMosaic
          className="mt-8"
          items={[
            { src: P.boxing, alt: "Boxing training in Imphal", caption: "Training ground, Imphal" },
            { src: P.weightlifting, alt: "Weightlifting", caption: "Weightlifting" },
            { src: P.sportsUni, alt: "National Sports University", caption: "National Sports University" },
          ]}
        />
      </Section>

      {/* BUSINESS */}
      <Section
        id="business"
        index="04"
        eyebrow="Business & economy"
        title="A market of four thousand women traders"
        aside={
          <div className="space-y-4">
            <LatticeMotif className="h-8 w-full text-gold" />
            <p className="text-sm text-ink/60">
              Moirang Phee and Leirum are among the handwoven textile patterns
              that mark the loom traditions of different communities.
            </p>
            <LatticeMotif className="h-8 w-full rotate-180 text-maroon/70" />
          </div>
        }
      >
        <p>
          Handloom weaving is Manipur&rsquo;s largest cottage industry, and in
          much of the valley it is a household skill rather than a specialist
          trade &ndash; looms sit on verandas and under stilted houses,
          producing textiles like the ceremonial Moirang Phee and the
          black-and-white striped Leirum. At the centre of Imphal, Ima Keithel,
          the Mothers&rsquo; Market, is reputed to be the largest market
          anywhere run exclusively by women, with roughly four thousand traders
          selling everything from fish to fabric.
        </p>
        <p>
          Beyond textiles, the state&rsquo;s economy runs on bamboo craft,
          organic agriculture &ndash; Chak-hao black rice and king chilli among
          its known crops &ndash; and a newer push into IT services, with
          state-backed incubators working to keep young graduates building
          businesses in Imphal rather than leaving for larger cities.
        </p>
        <PhotoMosaic
          className="mt-8"
          items={[
            { src: P.ima, alt: "Ima Keithel", caption: "Ima Keithel, the Mothers' Market" },
            { src: P.handloom, alt: "Handloom weaving", caption: "On the loom" },
            { src: P.blackRice, alt: "Chak-hao black rice", caption: "Chak-hao black rice" },
          ]}
        />
      </Section>

      {/* PEOPLE */}
      <Section
        id="people"
        index="05"
        eyebrow="People"
        layout="stacked"
        title="Names carried past the state's borders"
      >
        <p className="mb-8 max-w-prose text-ink/70">
          A handful of the athletes, artists, and organisers whose work reached
          far beyond Manipur. Filter by field, tap a card to read more.
        </p>
        <PeopleGrid people={people} />
      </Section>

      {/* PLACES */}
      <Section
        id="places"
        index="06"
        eyebrow="Places"
        layout="stacked"
        title="A lake that grows its own islands"
      >
        <PhotoBand
          src={LOKTAK_PHOTO}
          alt="Fishing boats on Loktak Lake"
          caption="Loktak Lake, where the islands float"
        />
        <div className="mt-10">
          <PlaceExplorer
            places={places.map((p) => ({ ...p, photo: placePhotos[p.name] }))}
          />
        </div>
      </Section>

      {/* VISIT (single section: curated + community spots) */}
      <Section
        id="visit"
        index="07"
        eyebrow="Visit"
        layout="stacked"
        title="Where to go, and where to hang out"
      >
        <PhotoMosaic
          className="mb-10"
          items={[
            { src: P.imphalStreet, alt: "An Imphal street", caption: "Imphal" },
            { src: P.cafe, alt: "A hangout café", caption: "Hangout spots" },
            { src: P.sendra, alt: "Sendra island on Loktak", caption: "Sendra, Loktak" },
          ]}
        />
        <Visit />
        <VisitCommunity />
      </Section>

      {/* GALLERY */}
      <Section
        id="gallery"
        index="08"
        eyebrow="Gallery"
        layout="stacked"
        title="Manipur, seen up close"
      >
        <Gallery items={gallery} />
      </Section>

      {/* ACHIEVEMENTS */}
      <Section
        id="achievements"
        index="09"
        eyebrow="Achievements"
        layout="stacked"
        title="Recognition out of proportion to size"
      >
        <StaggerGroup className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <StaggerItem>
            <Stat value={2013} label="Sankirtana inscribed on UNESCO's Intangible Heritage list" />
          </StaggerItem>
          <StaggerItem>
            <Stat value={8} label="Classical Indian dance forms, including Manipuri Ras Lila" />
          </StaggerItem>
          <StaggerItem>
            <Stat value={4} suffix="+" label="Geographical Indication tags, including Chak-hao rice and Sangai" />
          </StaggerItem>
        </StaggerGroup>
        <div className="mt-10 grid items-center gap-8 md:grid-cols-2">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <Draggable hint="Drag the Sangai" className="w-40 shrink-0">
              <SangaiMotif className="h-40 w-full text-maroon/70" />
            </Draggable>
            <p className="leading-relaxed text-ink/80">
              Loktak Lake carries Ramsar recognition as a wetland of
              international importance. In sport, Olympic and World
              Championship medals from a state that holds well under half a
              percent of India&rsquo;s population point to a coaching pipeline
              built with unusually little to spare.
            </p>
          </div>
          <Photo
            src={P.sangai}
            alt="A Sangai deer on the phumdis"
            className="aspect-[4/3] rounded-2xl"
          />
        </div>
      </Section>

      {/* WORKS & PROJECTS */}
      <Section
        id="works"
        index="10"
        eyebrow="Works & projects"
        layout="stacked"
        title="Building for what the state does next"
      >
        <PhotoBand
          src={P.sangaiFest}
          alt="Sangai Festival"
          caption="Sangai Festival, every November"
        />
        <div className="mt-8 max-w-3xl">
          <Accordion items={works} startOpen={null} />
        </div>
      </Section>

      {/* COMMUNITY */}
      <Section
        id="community"
        index="11"
        eyebrow="Community"
        layout="stacked"
        title="Know something about Manipur? Add it."
      >
        <PhotoBand
          src={P.shirui}
          alt="Shirui lilies in bloom"
          caption="Your photos could be here next"
        />
        <div className="mt-10">
          <CommunityEntries />
        </div>
      </Section>

      {/* REVIEWS */}
      <Section
        id="reviews"
        index="12"
        eyebrow="Reviews & comments"
        layout="stacked"
        title="What do you think of Manipur?"
      >
        <div className="max-w-3xl">
          <CommentThread />
        </div>
      </Section>

      <footer className="border-t border-ink/10 bg-white text-ink/60">
        <div className="mx-auto max-w-6xl px-6 py-14 sm:px-10">
          <p className="font-display text-2xl italic text-maroon">Manipur</p>
          <p className="mt-4 max-w-prose text-sm leading-relaxed">
            An overview page built to introduce the state&rsquo;s culture,
            sport, and craft. Facts and figures are illustrative of a landing
            page and worth checking against current official sources before
            publishing.
          </p>
        </div>
      </footer>
    </main>
  );
}

function Stat({
  value,
  suffix = "",
  label,
}: {
  value: number;
  suffix?: string;
  label: string;
}) {
  return (
    <div className="h-full rounded-2xl border border-ink/10 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-maroon hover:shadow-md">
      <p className="font-display text-5xl text-maroon">
        <CountUp value={value} suffix={suffix} />
      </p>
      <p className="mt-3 text-sm leading-snug text-ink/70">{label}</p>
    </div>
  );
}