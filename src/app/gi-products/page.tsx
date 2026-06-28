'use client'
import { useState } from 'react'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────────────────────────

interface GIProduct {
  id: number
  name: string
  state: string
  giTag: string
  year: string
  category: 'textile' | 'handicraft' | 'agricultural' | 'food'
  accent: string
  emoji: string
  tagline: string
  womenRole: string
  history: string
  materials: string
  district: string
  womenPercent: number
}

// ─── Data ────────────────────────────────────────────────────────────────────

const GI_PRODUCTS: GIProduct[] = [
  // Bihar
  {
    id: 1, name: 'Madhubani Painting', state: 'Bihar', giTag: 'GI Tag No. 213', year: '2007',
    category: 'handicraft', accent: '#8B1A1A', emoji: '🎨', womenPercent: 95,
    tagline: 'Ancient ritual art transformed into livelihood by Mithila women',
    womenRole: 'Madhubani painting has been exclusively practiced by women for over 2,500 years. What began as ritual art painted on mud walls during festivals and weddings evolved into a global craft. Women from Maithil and Muslim communities contribute distinct styles — Bharni, Katchni, Tantrik, Godna, and Kohbar — each passed from mother to daughter. Today, over 10,000 women in the Mithila region earn their primary livelihood through this art. National awardee Ganga Devi survived cancer and continued painting from her hospital bed, creating a visual autobiography of her illness — now in the Smithsonian collection.',
    history: 'Originating in Mithila (Bihar), Madhubani painting traces back to the Ramayana era — King Janaka commissioned artists for daughter Sita\'s wedding. For centuries women painted on freshly plastered walls and floors. In 1934, British officer W.G. Archer discovered these paintings during earthquake relief, bringing them to national attention. A 1967 drought prompted the Bihar government to encourage women to sell paintings for income — transforming a ritual practice into a commercial livelihood. UNESCO recognized it as Intangible Cultural Heritage; the GI tag followed in 2007.',
    materials: 'Natural pigments (turmeric, indigo, rice paste), bamboo twigs, fingers, handmade paper',
    district: 'Madhubani, Darbhanga, Sitamarhi, East Champaran',
  },
  {
    id: 2, name: 'Bhagalpur Silk (Tussar)', state: 'Bihar', giTag: 'GI Tag No. 174', year: '2005',
    category: 'textile', accent: '#8B6914', emoji: '🧵', womenPercent: 60,
    tagline: 'Women SHGs of the "Silk City" now export directly to European fashion houses',
    womenRole: 'Bhagalpur\'s Tussar silk industry employs over 60,000 weavers, with women dominating dyeing, spinning, and finishing. Women SHGs (Self Help Groups) transformed the industry — groups like "Reshmi Mahila SHG" export directly to European markets. The UNESCO Craft Network recognized Bhagalpur weavers\' contribution to sustainable fashion. Women\'s incomes tripled after SHG formation bypassed traditional middle-men.',
    history: 'Bhagalpur\'s silk weaving spans 300+ years. The city sits along the Ganges where silkworms thrive on mulberry and arjun trees. Unlike cultivated Mulberry silk, Tussar is produced from wild silkworms, giving it a distinctive golden texture and natural slub. The GI tag protects this unique character — power looms cannot replicate the texture. Bhagalpur Tussar was part of Aurangzeb\'s wardrobe and later became the preferred silk of Mahatma Gandhi for his khadi movement.',
    materials: 'Wild Tussar silkworm cocoons, natural dyes (marigold, indigo), traditional pit looms',
    district: 'Bhagalpur, Banka, Godda',
  },
  {
    id: 3, name: 'Sujini Embroidery', state: 'Bihar', giTag: 'GI Tag No. 453', year: '2012',
    category: 'textile', accent: '#C94B1A', emoji: '🪡', womenPercent: 100,
    tagline: 'Born from grief after the 1974 floods — now a global women\'s art movement',
    womenRole: 'Sujini was revived in 1977 by activist Shashi Kant Thakur after the devastating 1974 Bihar floods. He organized destitute women into collectives to stitch Sujinis — narrative quilts telling stories of village life, migration, and women\'s struggles. Today, over 2,000 women in 35 villages earn through cooperatives. Their work has been exhibited at the Smithsonian, collected by MoMA, and worn at Paris Fashion Week. Master embroiderer Mahasundari Devi received the Padma Shri for keeping this tradition alive.',
    history: 'Sujini is an ancient form of kantha embroidery unique to Mithila. Traditionally, women stitched old saris together with running stitches (sujao) to create warm quilts, embroidering scenes from the Mahabharata and daily life. The 1974 floods devastated Bihar — Sujini became a tool of economic and emotional recovery. The Benipatti Sujini cooperative was established with World Bank support in 1994, enabling rural women to access national craft exhibitions and eventually international galleries.',
    materials: 'Recycled cotton saris, cotton thread, simple running stitches, natural dyes',
    district: 'Muzaffarpur, Sitamarhi, Madhubani',
  },

  // Jammu & Kashmir
  {
    id: 4, name: 'Pashmina Shawl', state: 'Jammu & Kashmir', giTag: 'GI Tag No. 285', year: '2008',
    category: 'textile', accent: '#4A3728', emoji: '🧣', womenPercent: 100,
    tagline: 'World\'s finest fiber — Kashmir\'s women spin 12-micron threads thinner than human hair',
    womenRole: 'The entire Pashmina spinning process is exclusively done by women on traditional wooden charkhas during winter months. A single shawl takes 3–6 months to complete. The yarn is so fine it can pass through a wedding ring — earning it the name "ring shawl." Women\'s cooperatives like the Pashmina Haat helped weavers command fair prices against industrial duplication. After 15 years of advocacy by women artisans, the GI tag finally passed in 2008, protecting authentic hand-spun Kashmiri Pashmina from Chinese machine-made counterfeits.',
    history: 'Pashmina comes from the underbelly fleece of the Changthangi goat at 14,000 feet in Ladakh\'s Changthang plateau. The craft arrived in Kashmir with Sultan Zain-ul-Abidin in the 15th century. Mughal Emperor Akbar was so captivated he called them "Parmana" (supreme). Napoleon gifted a Kashmiri Pashmina to Empress Joséphine, starting a European obsession. The 19th-century Paisley mills of Scotland tried to copy the design — the Paisley pattern is a tribute to Kashmir\'s never-exactly-replicated artistry.',
    materials: 'Changthangi goat fleece (12-19 microns), hand-spun on charkha, natural dyes, 300+ thread count',
    district: 'Srinagar, Kargil, Leh (Ladakh)',
  },
  {
    id: 5, name: 'Kani Shawl', state: 'Jammu & Kashmir', giTag: 'GI Tag No. 286', year: '2008',
    category: 'textile', accent: '#1B2E4A', emoji: '🌸', womenPercent: 80,
    tagline: 'Woven with 800 wooden sticks — Kashmir\'s most complex textile secret',
    womenRole: 'Kani shawl weaving uses the "ta\'lim" — a coded manuscript in a special script that dictates every thread movement. Women weavers who master this earn Rs. 80,000–1,20,000 per shawl (3–12 months\' work). Women\'s SHGs have digitized ta\'lim manuscripts and train younger girls to preserve this dying art — only ~800 artisan families still practice authentic Kani weaving. The "Craft Documentation Project" led by women artisans recorded 1,200 ta\'lim patterns that were in danger of extinction.',
    history: 'Kani weaving arrived in Kashmir from Persia in the 15th century. The technique uses hundreds of small wooden spools (kanis) instead of a shuttle — unique in the world. During the Mughal period, a single Kani shawl could cost the equivalent of an elephant. French traveler Bernier documented Kani weaving in the 1660s. The British East India Company smuggled Kani weavers to Paisley, Scotland — yet the craft was never replicated because the ta\'lim system is oral and embodied in the hands.',
    materials: 'Pashmina fiber, wooden kani spools, handwritten ta\'lim charts, 100+ design passes per cm',
    district: 'Kanihama (Budgam), Srinagar',
  },

  // West Bengal
  {
    id: 6, name: 'Darjeeling Tea', state: 'West Bengal', giTag: 'GI Tag No. 1', year: '2004',
    category: 'agricultural', accent: '#3B5A2F', emoji: '🍵', womenPercent: 70,
    tagline: 'India\'s first GI tag — women pluck the "Champagne of teas" by hand, every season',
    womenRole: 'Women constitute over 70% of the tea plucking workforce in Darjeeling\'s 87 tea gardens — predominantly from Gorkha, Lepcha, Limbu, and Sherpa communities. These women are custodians of the "two leaves and a bud" standard that defines Darjeeling quality. Women\'s Tea Garden worker unions fought for fair wages and housing rights since the 1970s. In 2019, the Tea Board of India partnered with women\'s unions to develop a "Women of Darjeeling" labeling initiative that commands a 20% premium at London auctions.',
    history: 'Darjeeling Tea\'s story begins in 1841 when British surgeon Arthur Campbell planted Chinese tea seeds in his garden. The climate — foggy mornings, cool nights, well-drained slopes at 2,000m — created unique "muscatel" notes no other region can replicate. By 1874, over 113 tea gardens existed. The "first flush" (March-April) and "second flush" (May-June) harvests command premium prices. Darjeeling Tea became India\'s first GI product in 2004 — a landmark in Indian IP history.',
    materials: 'Camellia sinensis var. sinensis (Chinese tea variety), hand-plucked, orthodox processing method',
    district: 'Darjeeling, Kurseong, Kalimpong',
  },
  {
    id: 7, name: 'Baluchari Saree', state: 'West Bengal', giTag: 'GI Tag No. 236', year: '2007',
    category: 'textile', accent: '#7A3B52', emoji: '🧶', womenPercent: 65,
    tagline: 'Mahabharata scenes woven in silk — 400 lost patterns revived by women of Bishnupur',
    womenRole: 'Baluchari sarees are made by women weavers in Bishnupur and Murshidabad whose pallus depict mythological scenes — women design these narrative panels, a rare privilege in textile arts. After the 1971 Bangladesh Liberation War, refugee women from Dhaka brought their weaving expertise, enriching the tradition. The Baluchari Weavers\' Cooperative now has 800 women members who revived 400 lost patterns using specimens from the V&A London and Kolkata museums.',
    history: 'Baluchari silk originates from Baluchar village in Murshidabad, flourishing under Nawab Murshid Quli Khan (18th century). Persian merchants brought fine silk yarn and motif designs. The craft declined after the 1857 revolt but was revived in the 1950s by master weaver Akshay Kumar Datta, who spent 12 years reconstructing lost patterns. The jacquard loom, introduced in 1950, allows the complex mythological narratives to be woven with precision — but each design must first be hand-drawn on point paper by women artisans.',
    materials: 'Murshidabad silk, Resham thread, traditional throw-shuttle looms with jacquard attachment',
    district: 'Bishnupur (Bankura), Murshidabad',
  },

  // Uttar Pradesh
  {
    id: 8, name: 'Banarasi Silk', state: 'Uttar Pradesh', giTag: 'GI Tag No. 9', year: '2009',
    category: 'textile', accent: '#B8860B', emoji: '✨', womenPercent: 60,
    tagline: 'UNESCO heritage silk — 1.2 million families sustained by women weavers of Varanasi',
    womenRole: 'Banarasi silk weaving supports 1.2 million people in Varanasi, with women performing 60% of production — warping, dyeing, and finishing. Women from Muslim ansari weaver families have traditionally powered this industry. The Varanasi Weavers Cooperative trained 5,000 women in digital design using CAD software while preserving traditional Meenakari, Jangla, and Butidar patterns. A genuine Banarasi saree\'s GI tag includes a QR code linking to the individual weaver\'s profile.',
    history: 'Banarasi silk weaving dates to the Mughal era (16th century) when Akbar invited Persian weavers to Varanasi. The distinctive gold and silver brocade work (zari) was introduced from Persian courts. Sarees were exclusively worn by royalty — a single Banarasi wedding saree took 6 months to weave. UNESCO recognized Varanasi\'s handloom tradition. The GI tag (2009) came after a decade of advocacy, as power-loom copies from Surat and China flooded the market at 1/10th the price.',
    materials: 'Fine silk yarn, gold/silver zari (brocade), pit looms, Jacquard cards for repeat patterns',
    district: 'Varanasi, Chandauli, Jaunpur, Azamgarh, Mirzapur',
  },
  {
    id: 9, name: 'Lucknow Chikankari', state: 'Uttar Pradesh', giTag: 'GI Tag No. 6', year: '2008',
    category: 'textile', accent: '#C94B1A', emoji: '🌼', womenPercent: 100,
    tagline: '250,000 women in Lucknow\'s slums live by the needle — 36 ancient stitches',
    womenRole: 'Chikankari is 100% women\'s work. An estimated 2.5 lakh women embroider chikan for their livelihood. Women earn piece-rate wages — a crisis that fair trade organizations Dastakar and Seva fought by creating direct export markets. Master embroiderer Farida Haidari received the National Craft Master award for teaching 36 authentic chikan stitches to 3,000 women. Each stitch has a name, a purpose, and a technique passed down through generations of mothers.',
    history: 'Chikankari was introduced to Lucknow by Noor Jahan, wife of Mughal Emperor Jahangir, in the early 17th century. She adapted Persian whitework embroidery to Indian tastes. During the Nawabi era of Awadh (18th century), chikankari reached its peak. The 36 stitches include Tepchi, Bakhiya, Murri, Phanda, and Jali — each creating a different texture. In the 1990s, synthetic thread replaced natural silk in many workshops — but the GI tag (2008) mandated return to traditional materials.',
    materials: 'Fine cotton voile/georgette/organza, white embroidery thread, 36 traditional hand stitches',
    district: 'Lucknow, Unnao, Hardoi, Raebareli',
  },

  // Rajasthan
  {
    id: 10, name: 'Sanganer Block Print', state: 'Rajasthan', giTag: 'GI Tag No. 117', year: '2010',
    category: 'handicraft', accent: '#C94B1A', emoji: '🖼️', womenPercent: 70,
    tagline: 'Women-led Rangsutra cooperative designs for IKEA and Fabindia from Jaipur',
    womenRole: 'While wood-block carving is traditionally male, women perform all washing, sizing, printing, and finishing of Sanganer cloth. Women\'s cooperatives moved into designing — the Rangsutra collective (founded by Sumita Ghose) now has 3,000 women artisans designing contemporary Sanganer prints for Fabindia, IKEA, and global fashion brands. The indigo-printing revival at Bagru village was led entirely by women SHGs, who restored a dying natural-dye tradition.',
    history: 'Sanganer block printing originated in the 16th century when Maharaja Prithviraj II invited Chippa artisan communities near Jaipur. The craft was powered by the crystal-clear Saraswati River — its iron-free water produced the cleanest natural dye results. By 1900, Sanganer cloth was exported to Britain and Europe as "Indian chintz." The GI tag covers 100+ traditional motifs including Buta, Jaal, Leheriya, and Bandhani-style prints. The natural indigo revival has made Sanganer printing one of India\'s most sustainable craft exports.',
    materials: 'Hand-carved teak wood blocks, natural dyes (indigo, iron-rust, alum mordants), pre-washed cotton/silk',
    district: 'Sanganer (Jaipur), Bagru, Barmer',
  },
  {
    id: 11, name: 'Kota Doria', state: 'Rajasthan', giTag: 'GI Tag No. 177', year: '2005',
    category: 'textile', accent: '#B8860B', emoji: '💛', womenPercent: 85,
    tagline: 'Women of Kaithun weave the world\'s lightest saree — folds into a matchbox',
    womenRole: 'Kota Doria is woven in Kaithun town by women who have practiced this craft for 8 generations. The characteristic square-check pattern (khat) is created on a pit loom that demands 6–8 hours of focused work — making it an almost exclusively women\'s household occupation. National Award winner Mamta Devi revived the ancient "sona-rupa" (gold-silver) Kota Doria variant that had disappeared for 50 years. Women\'s weavers recently secured a geographical indication enforcement against illegal machine-made copies from Surat.',
    history: 'Kota Doria was developed in the 17th century when Rao Kishore Singh, ruler of Kota, invited weavers from Mysore to weave fine cotton for the royal court. These Masuria weavers merged their cotton tradition with local Rajasthani gold thread work — creating an ultra-light fabric. A Kota Doria saree weighs only 100 grams, can be folded into a matchbox, yet withstands decades of use. The square check pattern comes from alternating hard-twist cotton and silk yarns in both warp and weft.',
    materials: 'Fine cotton, silk threads, pit looms, vegetable dyes for zari work',
    district: 'Kota, Kaithun, Bundi',
  },

  // Tamil Nadu
  {
    id: 12, name: 'Kanchipuram Silk', state: 'Tamil Nadu', giTag: 'GI Tag No. 2', year: '2005',
    category: 'textile', accent: '#7A3B52', emoji: '🏛️', womenPercent: 65,
    tagline: 'India\'s second GI product — 6,000 silk threads interlocked by women in one sacred saree',
    womenRole: 'Kanchipuram silk weaving is a family craft where women are primary quality controllers and design innovators. Women from Devanga and Sourashtrian weaver communities design the rich temple borders (korvai) and distinctive contrast pallus. Over 5,000 women weavers work from home looms, earning Rs. 15,000–40,000 per saree. The Weavers Service Centre trains 2,000 women annually in advanced design. Women artisans successfully campaigned for the mandatory GI logo on all authentic Kanchipuram sarees — protecting buyers from power-loom counterfeits.',
    history: 'Kanchipuram has been weaving silk for 400+ years. The craft was brought by Devanga weavers who migrated from Andhra Pradesh under Vijayanagara Empire patronage. A genuine Kanchipuram saree weighs 700–900g, uses 6,000–7,000 mulberry silk threads per inch, and the body and pallu are woven separately then interlocked — the "korvai" technique unique to Kanchipuram. This is the only silk saree where the body and border are woven simultaneously as separate structures, then joined.',
    materials: 'Mulberry silk, zari (gold/silver), contrast silk weft for pallu, temple design motifs',
    district: 'Kanchipuram, Sriperumbudur, Walajabad',
  },
  {
    id: 13, name: 'Thanjavur Painting', state: 'Tamil Nadu', giTag: 'GI Tag No. 177', year: '2008',
    category: 'handicraft', accent: '#B8860B', emoji: '🌟', womenPercent: 60,
    tagline: 'Chola court art — women revivalists embedded real gold and precious stones in divine paintings',
    womenRole: 'Women artisans dominate Thanjavur painting\'s revival movement. The "Thanjavur Art Gallery Women\'s Cooperative" (300 members) produces paintings using 24-carat gold leaf and semi-precious stones. Master artist Kalpana Devi won the National Craftsperson Award for reviving lost techniques of cutting and embedding glass pieces in Thanjavur compositions. In 2019, a Thanjavur painting by women artisans was gifted to Pope Francis by the Odisha — Tamilnadu government delegation.',
    history: 'Thanjavur painting originated in the 16th century under the Nayaka rulers. The art peaked under the Maratha rulers (17th–18th centuries). The style features rich colors, gold leaf coating, and semi-precious stones embedded in the surface. Subjects are exclusively Hindu deities, particularly Krishna, Vishnu, Lakshmi, and the Navagraha. The Tanjore district\'s art tradition produced a complete cultural movement encompassing music, dance (Bharatanatyam), and painting.',
    materials: '24-carat gold foil, semi-precious stones, lampblack, tempera, wooden boards, chalk paste base',
    district: 'Thanjavur, Kumbakonam, Swamimalai',
  },

  // Assam
  {
    id: 14, name: 'Muga Silk', state: 'Assam', giTag: 'GI Tag No. 425', year: '2007',
    category: 'textile', accent: '#8B6914', emoji: '✨', womenPercent: 100,
    tagline: 'World\'s only naturally golden silk — every Assamese woman weaves her own Mekhela Sador',
    womenRole: 'Muga silk weaving is exclusively women\'s art in Assam. Every Assamese woman traditionally learns to weave on the eri loom as part of her education — a girl who cannot weave has historically been considered unmarriageable. The Muga Silk Weavers Association in Sualkuchi has 3,000 women members with formal export market access. Assam\'s first female IAS officer wore a Muga Mekhela Sador at her swearing-in ceremony, making national news and tripling demand overnight.',
    history: 'Muga silk is produced exclusively in Assam from Antheraea assamensis silkworms feeding on Som and Soalu trees. The silk has a natural golden sheen that intensifies with each washing — unique in the world. Muga silk was used for royal garments by the Ahom kings who ruled Assam for 600 years. Chinese traveler Xuan Zang (7th century) documented Assam\'s golden silk. The GI certification ensures only Assamese Muga earns this protection — Chinese synthetic "golden silk" cannot imitate the natural luster that develops with age.',
    materials: 'Antheraea assamensis silkworm cocoons (wild, semi-cultivated), local plant dyes',
    district: 'Sualkuchi (Kamrup), Sibsagar, Jorhat, Dhubri',
  },

  // Punjab
  {
    id: 15, name: 'Phulkari', state: 'Punjab', giTag: 'GI Tag No. 393', year: '2011',
    category: 'textile', accent: '#C94B1A', emoji: '🌸', womenPercent: 100,
    tagline: 'Punjab\'s "flower work" — embroidered by every Punjabi bride for 1,000 years',
    womenRole: 'Phulkari is 100% women\'s tradition. Every Punjabi girl was traditionally trained from childhood. A mother would begin embroidering a Bagh (full Phulkari) for her daughter\'s trousseau the moment she was born. The embroidery was done in "Bhambhiri" groups — women singing folk songs while working together, making it a social bond as much as a craft. Women\'s cooperatives in Patiala and Bathinda have 25,000 members selling to global markets. A complete Bagh Phulkari — covering the entire cloth in silk thread — represents 2–3 years of a woman\'s creative life.',
    history: 'Phulkari\'s history spans 1,000+ years — mentions appear in Waris Shah\'s 18th-century Punjabi epic "Heer-Ranjha." The word means "flower work" — dense darning stitch on coarse khaddar cotton. The most prestigious form — Bagh — covers the entire cloth in silk thread, leaving no base fabric visible. Phulkari pieces were used for birth, marriage, and death rituals. Colonial-era Phulkaris are now in major museum collections including the V&A London and the Smithsonian. The craft nearly died during the 1947 Partition trauma — its revival was a conscious act of women preserving Punjab\'s identity.',
    materials: 'Hand-spun cotton (khaddar), silk thread, darning stitches, natural vegetable dyes',
    district: 'Patiala, Bathinda, Amritsar, Ludhiana, Gurdaspur',
  },

  // Karnataka
  {
    id: 16, name: 'Mysore Silk', state: 'Karnataka', giTag: 'GI Tag No. 20', year: '2005',
    category: 'textile', accent: '#7A3B52', emoji: '👑', womenPercent: 70,
    tagline: 'Wadiyar dynasty\'s royal silk — 70% women workforce weaves pure silk with real gold',
    womenRole: 'The Karnataka Silk Industries Corporation (KSIC) in Mysore employs 1,800 workers, 70% women. Women design saree borders incorporating the famous "crepe silk" technique that gives Mysore silk its distinctive fluid drape. The Bangalore Silk Weaver Women\'s Cooperative trains underprivileged women in silk reeling, dyeing, and weaving — providing livelihoods to 5,000 women annually. Women designers at KSIC have created 200 new contemporary patterns while preserving the traditional "Mysore traditional" design registry.',
    history: 'Mysore silk production was established by Tipu Sultan in the 18th century, who brought Chinese silk expertise. After Tipu\'s defeat in 1799, the Wadiyar Maharajas expanded the industry — founding KSIC in 1912. Mysore silk is characterized by 100% pure silk warp and weft with real gold/silver zari. The distinctive "crepe" texture requires special twisting of the silk yarn — a technique patented only by KSIC. A genuine Mysore silk saree bears a silk mark and GI tag issued together.',
    materials: 'Pure 2-ply silk, real gold/silver zari, vegetable dyes, jacquard weave',
    district: 'Mysore, Shivasamudra, Krishnaraja pet',
  },
  {
    id: 17, name: 'Channapatna Toys', state: 'Karnataka', giTag: 'GI Tag No. 43', year: '2005',
    category: 'handicraft', accent: '#3B5A2F', emoji: '🎭', womenPercent: 55,
    tagline: 'Tipu Sultan\'s "Toy Town" — women revive this 230-year craft for global children',
    womenRole: 'Channapatna toy-making was historically male, but women entered in force through SEWA cooperatives — they now perform all lacquering, painting, and quality control. The "Karnataka Rural Development" program trained 1,200 women to use non-toxic natural lacquers, making toys globally exportable to European child safety markets. Women artisan Pavithra R. received the Shilpa Guru Award for developing child-safe natural finishes approved by EU toy safety regulations — opening a €2 million export market.',
    history: 'Channapatna toys were introduced when Tipu Sultan invited Persian toy craftsman Siddiqui Ibrahim in 1790. The craft uses indigenous Hale wood (Doddal tree) turned on a manual lathe. The distinctive bright colors come from natural lacquers applied while the wood spins. Channapatna is called "Gombegala Ooru" (Toy Town) — producing 20 million toys annually. The town\'s craft is credited with inspiring the modern toy design movement in India.',
    materials: 'Hale wood, natural lac (lacquer), vegetable pigments, manual lathe turning',
    district: 'Channapatna (Ramanagara district)',
  },

  // Madhya Pradesh
  {
    id: 18, name: 'Chanderi Fabric', state: 'Madhya Pradesh', giTag: 'GI Tag No. 161', year: '2005',
    category: 'textile', accent: '#1B2E4A', emoji: '🌙', womenPercent: 80,
    tagline: '800 years of "woven air" — Chanderi women create India\'s most sheer fabric',
    womenRole: 'Chanderi weaving employs 15,000 weavers, women doing 40% weaving and 80% finishing. The Chanderi Women Weavers Cooperative (est. 2008) gave women direct national market access — bypassing middlemen who paid 1/10th the retail price. Women artisan Parvati Devi Malviya became the first woman in Chanderi to start her own export business, now supplying 12 countries. NIFT collaborated with Chanderi women to develop a "Chanderi Bridal Collection" that won the India Design Council award.',
    history: 'Chanderi\'s textile tradition dates to the 11th century — a major trading hub on the Malwa-Deccan route. Chanderi fabric\'s sheer translucency ("woven air") comes from using fine silk and cotton in special proportion. During the Malwa Sultanate and Mughal era, Chanderi fabric was reserved for royalty. The unique Chanderi weave creates a slightly glazed finish without chemical treatment — purely from silk thread tension. Akbar\'s court records mention 1,000 looms operating in Chanderi.',
    materials: 'Pure silk, fine cotton, silver/gold zari, pit loom, traditional Chanderi motifs (dandidar, butidar)',
    district: 'Chanderi (Ashoknagar), Guna',
  },
  {
    id: 19, name: 'Maheshwari Saree', state: 'Madhya Pradesh', giTag: 'GI Tag No. 391', year: '2010',
    category: 'textile', accent: '#C94B1A', emoji: '👸', womenPercent: 100,
    tagline: 'Queen Ahilya Bai\'s legacy — a royal saree woven 100% by women at the Rehwa Society',
    womenRole: 'Maheshwari sarees were created at the personal command of Ahilya Bai Holkar — one of India\'s greatest women rulers — who invited weavers to Maheshwar in 1770. Today, the "Rehwa Society" (est. 1979 by Sally and Richard Holkar) employs 100% women weavers. The Society pays above-market wages, provides healthcare, and has trained 1,500 women in 40 years. Maheshwari weavers hold the rare distinction of earning over Rs. 20,000/month — triple the regional agricultural wage.',
    history: 'Maheshwari sarees carry a 250-year royal lineage. The town of Maheshwar on the Narmada River was the capital of the Holkar dynasty. Ahilya Bai Holkar (ruled 1767–1795) — whom the UN recognized as one of history\'s greatest women rulers — transformed Maheshwar into a spiritual and cultural center. The distinctive features: reversible "Seeri" border, 5 border patterns (Eenthi, Heera, Chatai, Chameli, Kareel), and a plain woven body that can be worn on either side.',
    materials: 'Silk and cotton blend, zari borders, pit looms, reversible border weave technique',
    district: 'Maheshwar (Khargone), Burhanpur',
  },

  // Odisha
  {
    id: 20, name: 'Sambalpuri Ikat', state: 'Odisha', giTag: 'GI Tag No. 64', year: '2007',
    category: 'textile', accent: '#8B1A1A', emoji: '🌀', womenPercent: 80,
    tagline: 'Women tie 100,000 knots before a single thread is woven — Odisha\'s bandha magic',
    womenRole: 'Women perform the critical "Bandha" (tie-resist) step — tying thousands of tiny thread bundles before dyeing, creating patterns before weaving begins. This pre-weave tie-dying is exclusively a women\'s skill in the Meher community. The Sambalpuri Bastralaya cooperative has 8,000 women members. Designer Sanjukta Dey won the National Award for creating contemporary Sambalpuri designs preserving traditional "shankha" (conch) and "chakra" (wheel) motifs while making them globally wearable.',
    history: 'Sambalpuri Ikat (Bandha) weaving dates to the 10th century, documented in the Madala Panji (Puri Jagannath temple chronicles) — indicating that Sambalpuri cloth was offered to Lord Jagannath for centuries. The intricate tie-dye patterns — inspired by temple sculptures, tribal motifs, and nature — take months to execute. A single complex Sambalpuri saree requires 3 months of tying alone before a thread is woven. This is one of only three double-ikat traditions in the world.',
    materials: 'Cotton and silk, natural dyes (turmeric, indigo, mud), tie-resist method (bandha)',
    district: 'Sambalpur, Bargarh, Bolangir, Sonepur, Boudh',
  },
  {
    id: 21, name: 'Pattachitra', state: 'Odisha', giTag: 'GI Tag No. 124', year: '2006',
    category: 'handicraft', accent: '#B8860B', emoji: '🎨', womenPercent: 70,
    tagline: 'Jagannath\'s sacred painting — Raghurajpur women paint for God, 12 months a year',
    womenRole: 'Pattachitra is created by the Chitrakara community in Raghurajpur — a "Heritage Craft Village" where every household paints. Women are the primary painters, training beginning at age 5–6. The "Raghurajpur Women Artists\' Collective" exports to Japan, Germany, and the USA. In 2019, a Pattachitra by women artisans was gifted to Pope Francis. When COVID destroyed tourism, women\'s online cooperatives sustained 200 families through direct digital sales.',
    history: 'Pattachitra (cloth picture) originated as ritual art for the Jagannath Temple in Puri. When the main idol is being repainted every 12 years ("Nabakalebara"), Pattachitras serve as his substitute. The style features bold natural colors (red from hingul, black from lampblack, yellow from haritali), intricate floral borders, and elongated eyes. The entire creation uses only natural materials: tamarind seeds for sizing, clay and cow dung for the base cloth, squirrel-hair brushes.',
    materials: 'Cotton/silk cloth, natural mineral and vegetable colors, tamarind paste, squirrel-hair brushes',
    district: 'Raghurajpur (Puri), Paralakhemundi (Gajapati)',
  },

  // Himachal Pradesh
  {
    id: 22, name: 'Kullu Shawl', state: 'Himachal Pradesh', giTag: 'GI Tag No. 31', year: '2004',
    category: 'textile', accent: '#8B1A1A', emoji: '❄️', womenPercent: 90,
    tagline: 'Himalayan women weave mountain geometry through winter on backstrap looms',
    womenRole: 'Kullu shawl weaving is exclusively women\'s work in the valley. Women weave on pit looms or backstrap looms during long mountain winters. The characteristic geometric "patti" borders with angular designs in 5-color combinations are passed down orally from mother to daughter. The Kullu Shawl Weavers Federation has 12,000 women members enabling direct sales at government emporiums. Women artisans successfully sued a Delhi-based manufacturer for using "Kullu" branding on machine-made shawls — one of India\'s first GI infringement victories by artisans.',
    history: 'Kullu shawls acquired their distinctive identity in the 17th century under Raja Jagat Singh, who invited weavers from Lahore (now Pakistan) bringing the Pattu technique. The shawls were traditionally woven from local Angora wool and Pashmina, with each valley developing distinct color traditions. The British discovered Kullu shawls in 1820 and began exporting to Europe. The GI tag (one of India\'s first 30) protects the geometric "pattu" border pattern unique to Kullu Valley.',
    materials: 'Merino wool, Angora rabbit hair, Pashmina, vegetable dyes (walnut, madder, indigo)',
    district: 'Kullu, Manali, Shimla',
  },

  // Gujarat
  {
    id: 23, name: 'Kutch Embroidery', state: 'Gujarat', giTag: 'GI Tag No. 286', year: '2008',
    category: 'handicraft', accent: '#C94B1A', emoji: '🪞', womenPercent: 100,
    tagline: 'Women rebuilt after the 2001 earthquake — Kutch needlework became a Rs. 200-crore industry',
    womenRole: 'Kutch embroidery is 100% women\'s work — practiced by 16 different communities (Rabari, Ahir, Jat, Mutwa, Sindhi) each with distinct stitching styles. After the devastating 2001 earthquake (26,000 deaths), women\'s embroidery cooperatives became the primary economic recovery mechanism for 50,000 women. Organizations "Khamir" and "Qasab" created global supply chains. Women designers Judith Frater and Gita Ram elevated Kutch embroidery to Paris and New York Fashion Week runways.',
    history: 'Kutch embroidery\'s distinct styles developed as different pastoral and nomadic communities settled in the Rann of Kutch over centuries. The Rabari community\'s embroidery features mirror work (abhla bharat) and bold chain stitch; Ahir uses satin stitch flowers; Jat and Mutwa use cross stitch with geometric patterns. The 2001 earthquake destroyed 80% of Kutch\'s heritage infrastructure — but embroidery survived because the craft exists in human hands. The global craft+design boom post-2001 turned Kutch embroidery into a Rs. 200 crore industry within a decade.',
    materials: 'Cotton or silk base, silk thread, mirrors (abhla), cross stitch, satin stitch, chain stitch',
    district: 'Bhuj, Anjar, Mandvi, Mundra, Abdasa',
  },

  // Maharashtra
  {
    id: 24, name: 'Paithani Saree', state: 'Maharashtra', giTag: 'GI Tag No. 153', year: '2009',
    category: 'textile', accent: '#1B2E4A', emoji: '🦚', womenPercent: 65,
    tagline: 'Maharashtra\'s sacred wedding silk — each peacock motif takes 3 days to weave',
    womenRole: 'Paithani weaving was revived largely by women\'s determination. During the MSSIDC revival program in the 1970s, women from Paithan learned advanced weaving when male weavers migrated to cities. Today, 65% of master Paithani weavers are women. Women\'s cooperatives in Yeola and Paithan produce sarees selling for Rs. 5,000–5 lakhs. The iconic peacock motif in the pallu — a Paithani signature — is exclusively designed and woven by women artisans who guard these designs as family intellectual property.',
    history: 'Paithani silk sarees come from ancient Paithan (Pratishthana) on the Godavari River — capital of the Satavahana Empire 2,000 years ago, a major Silk Route hub. The distinctive Paithani features: square-design body with single-color warp, each weft thread distinctly colored creating iridescent shimmer, and iconic peacock and flower motifs in the pallu. Mughal emperors gifted Paithani sarees to Persian royalty as diplomatic gifts. A genuine Paithani\'s body and pallu are woven using a tapestry-like interlocking technique.',
    materials: 'Pure mulberry silk, real gold/silver zari, tapestry-like interlocking weft technique',
    district: 'Paithan (Aurangabad), Yeola (Nashik)',
  },

  // Telangana
  {
    id: 25, name: 'Pochampally Ikat', state: 'Telangana', giTag: 'GI Tag No. 122', year: '2004',
    category: 'textile', accent: '#3B5A2F', emoji: '🔮', womenPercent: 75,
    tagline: 'UNESCO World Craft City — 30,000 women weave optical-illusion double ikat',
    womenRole: 'Women of the Padmasali and Devanga weaver communities perform the entire tying-and-dyeing process — one of the world\'s most complex textile techniques. The "Pochampally Handloom Park Women\'s Cooperative" has 4,000 members. Designer Gaurang Shah\'s collaboration with Pochampally women brought their work to the Cannes Film Festival. Yadadri district now has a "Women\'s Ikat Weaving Village" — 200 families, all women-led, exporting directly to Japan and Europe.',
    history: 'Pochampally Ikat originated in Bhoodan Pochampally village, where Acharya Vinoba Bhave launched the landmark Bhoodan land reform movement in 1951. The village\'s weavers developed double ikat — both warp and weft threads tied and dyed before weaving — practiced in only 3 places globally (Pochampally, Patan-Gujarat, Bali-Indonesia). The precision is extraordinary: dyed threads must align perfectly when woven to create the pattern. UNESCO designated Pochampally a "World Craft City" in 2021.',
    materials: 'Cotton and silk, chemical and natural dyes, precise tie-resist dying of both warp and weft threads',
    district: 'Pochampally (Bhongir), Nalgonda, Warangal',
  },

  // Andhra Pradesh
  {
    id: 26, name: 'Kondapalli Toys', state: 'Andhra Pradesh', giTag: 'GI Tag No. 36', year: '2004',
    category: 'handicraft', accent: '#C94B1A', emoji: '🎪', womenPercent: 60,
    tagline: '400-year-old sacred craft — women carvers and painters keep Kondapalli alive',
    womenRole: 'Kondapalli toy-making is a family craft where women now paint and increasingly carve too. Aruna Kumari won the State Award for her innovations in carving technique. The "Kondapalli Women Toy-Makers Cooperative" (500 members) sells directly to government departments. Women introduced female deity figures and women warriors into traditionally male-dominated toy narratives — expanding the cultural story of this ancient craft. Women artisans also secured a government order for 50,000 Kondapalli toys as diplomatic gifts.',
    history: 'Kondapalli toys were developed 400 years ago in Krishna district by migrants from Rajasthan known as the Aryakshatriya community. The soft Poniki wood (Tella Poniki tree) can be carved into delicate shapes. Toys traditionally depicted scenes from the Ramayana and Mahabharata. UNESCO recognized Kondapalli as an Intangible Cultural Heritage. The 7-step production (carving → gluing → sanding → sizing → painting → finishing → lacquering) takes 3–4 days per toy.',
    materials: 'Poniki wood (Cochlospermum religiosum), sawdust + tamarind seed paste, natural mineral colors',
    district: 'Kondapalli (Krishna), Vijayawada',
  },
]

const ALL_STATES = ['All States', ...Array.from(new Set(GI_PRODUCTS.map(p => p.state))).sort()]

const CATEGORY_COLORS: Record<string, string> = {
  textile: '#1B2E4A',
  handicraft: '#C94B1A',
  agricultural: '#3B5A2F',
  food: '#7A3B52',
}

const CATEGORY_LABELS: Record<string, string> = {
  textile: 'Textile',
  handicraft: 'Handicraft',
  agricultural: 'Agricultural',
  food: 'Food & Natural',
}

// ─── Card visual patterns ─────────────────────────────────────────────────────

function CardVisual({ product }: { product: GIProduct }) {
  const patterns: Record<string, string> = {
    textile: `repeating-linear-gradient(45deg, ${product.accent}22 0px, ${product.accent}22 2px, transparent 2px, transparent 14px), repeating-linear-gradient(-45deg, ${product.accent}22 0px, ${product.accent}22 2px, transparent 2px, transparent 14px)`,
    handicraft: `radial-gradient(circle at 25% 25%, ${product.accent}30 2px, transparent 2px), radial-gradient(circle at 75% 75%, ${product.accent}30 2px, transparent 2px)`,
    agricultural: `repeating-linear-gradient(90deg, ${product.accent}20 0, ${product.accent}20 1px, transparent 1px, transparent 20px), repeating-linear-gradient(0deg, ${product.accent}20 0, ${product.accent}20 1px, transparent 1px, transparent 20px)`,
    food: `radial-gradient(ellipse at center, ${product.accent}25 0%, transparent 70%)`,
  }

  return (
    <div style={{
      height: 160,
      background: `linear-gradient(135deg, ${product.accent}18, ${product.accent}30)`,
      backgroundImage: patterns[product.category],
      backgroundSize: product.category === 'handicraft' ? '30px 30px' : '20px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      borderRadius: '10px 10px 0 0',
    }}>
      <span style={{ fontSize: '3.5rem', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.2))' }}>{product.emoji}</span>
      <div style={{
        position: 'absolute', top: 10, left: 10,
        background: CATEGORY_COLORS[product.category],
        color: '#fff', fontSize: '0.62rem', fontWeight: 700,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        padding: '3px 8px', borderRadius: 4,
        fontFamily: "'Lato', sans-serif",
      }}>
        {CATEGORY_LABELS[product.category]}
      </div>
      <div style={{
        position: 'absolute', top: 10, right: 10,
        background: '#B8860B', color: '#fff',
        fontSize: '0.6rem', fontWeight: 700,
        padding: '3px 8px', borderRadius: 4,
        fontFamily: "'Lato', sans-serif",
      }}>
        GI CERTIFIED
      </div>
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function ProductModal({ product, onClose }: { product: GIProduct; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(10,5,0,0.65)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FFFEF9', borderRadius: 16, maxWidth: 720, width: '100%',
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
          border: '1.5px solid #D9C9A8',
        }}
      >
        {/* Modal header visual */}
        <div style={{
          height: 140,
          background: `linear-gradient(135deg, ${product.accent}25, ${product.accent}45)`,
          borderRadius: '14px 14px 0 0',
          display: 'flex', alignItems: 'center', gap: '1.5rem',
          padding: '0 2rem',
          position: 'relative',
        }}>
          <span style={{ fontSize: '4rem', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))' }}>{product.emoji}</span>
          <div>
            <div style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: product.accent, marginBottom: 4 }}>
              {product.state} · {product.year}
            </div>
            <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 700, color: '#1B2E4A', margin: 0 }}>
              {product.name}
            </h2>
            <div style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.72rem', color: '#7A6A5A', marginTop: 4 }}>
              {product.giTag}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 14, right: 14,
              background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%',
              width: 34, height: 34, cursor: 'pointer', fontSize: '1.1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#5C5542', fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '2rem' }}>
          {/* Women involvement */}
          <div style={{
            background: 'linear-gradient(135deg, #FFF5F0, #FFF8F2)',
            border: `1.5px solid ${product.accent}40`,
            borderLeft: `4px solid ${product.accent}`,
            borderRadius: 10, padding: '1.25rem 1.5rem', marginBottom: '1.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.2rem' }}>👩‍🎨</span>
              <span style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: product.accent }}>
                Women & Heritage
              </span>
              <span style={{
                background: product.accent, color: '#fff',
                fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                fontFamily: "'Lato', sans-serif",
              }}>
                {product.womenPercent}% Women
              </span>
            </div>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.05rem', lineHeight: 1.8, color: '#3A2E22', margin: 0 }}>
              {product.womenRole}
            </p>
          </div>

          {/* History */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1rem' }}>📜</span>
              <span style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5C5542' }}>
                History & Heritage
              </span>
            </div>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.05rem', lineHeight: 1.85, color: '#3A2E22', margin: 0 }}>
              {product.history}
            </p>
          </div>

          {/* Details grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ background: '#F8F2E8', borderRadius: 8, padding: '1rem' }}>
              <div style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9A8E7A', marginBottom: 6 }}>Materials</div>
              <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.88rem', color: '#3A2E22', lineHeight: 1.6, margin: 0 }}>{product.materials}</p>
            </div>
            <div style={{ background: '#F8F2E8', borderRadius: 8, padding: '1rem' }}>
              <div style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9A8E7A', marginBottom: 6 }}>Districts</div>
              <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.88rem', color: '#3A2E22', lineHeight: 1.6, margin: 0 }}>{product.district}</p>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #EDE0C8' }}>
            <div style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.8rem', color: '#9A8E7A' }}>
              {product.giTag} · Certified {product.year}
            </div>
            <Link
              href={`/shop?state=${encodeURIComponent(product.state)}`}
              style={{
                background: '#C94B1A', color: '#fff',
                fontFamily: "'Lato', sans-serif", fontSize: '0.78rem', fontWeight: 700,
                letterSpacing: '0.07em', textTransform: 'uppercase',
                padding: '8px 18px', borderRadius: 6, textDecoration: 'none',
              }}
            >
              Shop {product.state} Products →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GIProductsPage() {
  const [activeState, setActiveState] = useState('All States')
  const [selectedProduct, setSelectedProduct] = useState<GIProduct | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = GI_PRODUCTS.filter(p => {
    const matchState = activeState === 'All States' || p.state === activeState
    const q = searchQuery.toLowerCase()
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.state.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    return matchState && matchSearch
  })

  const stateCount = (state: string) =>
    state === 'All States' ? GI_PRODUCTS.length : GI_PRODUCTS.filter(p => p.state === state).length

  return (
    <div style={{ background: 'var(--parchment)', minHeight: '100vh' }}>

      {/* ── Hero ── */}
      <div style={{
        background: 'linear-gradient(160deg, #1B2E4A 0%, #0D1E33 100%)',
        padding: '4rem 5% 5rem',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative mandala SVG */}
        <div style={{ position: 'absolute', right: '5%', top: '50%', transform: 'translateY(-50%)', opacity: 0.06, pointerEvents: 'none' }}>
          <svg width="420" height="420" viewBox="0 0 420 420" fill="none">
            <circle cx="210" cy="210" r="200" stroke="#B8860B" strokeWidth="1" />
            <circle cx="210" cy="210" r="160" stroke="#B8860B" strokeWidth="1" />
            <circle cx="210" cy="210" r="120" stroke="#B8860B" strokeWidth="1" />
            <circle cx="210" cy="210" r="80" stroke="#B8860B" strokeWidth="1" />
            {[0,30,60,90,120,150,180,210,240,270,300,330].map(angle => (
              <line key={angle}
                x1="210" y1="10" x2="210" y2="210"
                stroke="#B8860B" strokeWidth="0.5"
                transform={`rotate(${angle} 210 210)`}
              />
            ))}
          </svg>
        </div>

        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#B8860B', marginBottom: '0.75rem' }}>
            <Link href="/" style={{ color: '#B8860B', textDecoration: 'none' }}>Home</Link>
            <span style={{ margin: '0 0.5rem', opacity: 0.6 }}>/</span>
            GI Products
          </p>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', fontWeight: 700, color: '#fff', lineHeight: 1.15, marginBottom: '1rem' }}>
            Heritage <span style={{ color: '#B8860B', fontStyle: 'italic' }}>by Her</span>
          </h1>
          <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: 'rgba(255,255,255,0.75)', lineHeight: 1.85, maxWidth: 640, marginBottom: '2rem' }}>
            India has 478 Geographical Indication (GI) certified products — each carrying centuries of women's knowledge, craft, and identity. Explore the living heritage held in women's hands across every state.
          </p>

          {/* Stats row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
            {[
              { n: '478', l: 'GI Tags in India' },
              { n: '26', l: 'Products Profiled' },
              { n: '16', l: 'States Covered' },
              { n: '2,500+', l: 'Women Voices' },
            ].map(({ n, l }) => (
              <div key={l}>
                <div style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#B8860B', lineHeight: 1 }}>{n}</div>
                <div style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Controls ── */}
      <div style={{ background: '#fff', borderBottom: '1.5px solid #D9C9A8', position: 'sticky', top: 64, zIndex: 50 }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', padding: '0 4%' }}>
          {/* State tabs */}
          <div style={{ overflowX: 'auto', display: 'flex', gap: '0.15rem', padding: '0.75rem 0', scrollbarWidth: 'none' }}>
            {ALL_STATES.map(state => {
              const active = state === activeState
              return (
                <button
                  key={state}
                  onClick={() => setActiveState(state)}
                  style={{
                    flexShrink: 0,
                    fontFamily: "'Lato', sans-serif",
                    fontSize: '0.78rem', fontWeight: 700,
                    letterSpacing: '0.05em',
                    padding: '7px 14px',
                    borderRadius: 6,
                    border: active ? '1.5px solid #C94B1A' : '1.5px solid transparent',
                    background: active ? '#C94B1A' : 'transparent',
                    color: active ? '#fff' : '#5C5542',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {state}
                  <span style={{
                    marginLeft: 6,
                    background: active ? 'rgba(255,255,255,0.25)' : '#EDE0C8',
                    color: active ? '#fff' : '#7A6A5A',
                    borderRadius: 10, padding: '1px 7px',
                    fontSize: '0.65rem', fontWeight: 700,
                  }}>
                    {stateCount(state)}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Search */}
          <div style={{ padding: '0.6rem 0', borderTop: '1px solid #EDE0C8' }}>
            <input
              type="text"
              placeholder="Search by product name, state, or craft type..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', maxWidth: 480,
                fontFamily: "'Lato', sans-serif", fontSize: '0.88rem',
                padding: '8px 14px',
                border: '1.5px solid #D9C9A8', borderRadius: 8,
                background: '#FFFEF9', color: '#1B2E4A',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '2.5rem 4%' }}>
        {/* Result count */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.85rem', color: '#7A6A5A', margin: 0 }}>
            Showing <strong style={{ color: '#1B2E4A' }}>{filtered.length}</strong> GI certified product{filtered.length !== 1 ? 's' : ''}
            {activeState !== 'All States' && <> from <strong style={{ color: '#C94B1A' }}>{activeState}</strong></>}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <span key={key} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontFamily: "'Lato', sans-serif", fontSize: '0.7rem', fontWeight: 700,
                padding: '4px 10px', borderRadius: 20,
                background: `${CATEGORY_COLORS[key]}15`,
                color: CATEGORY_COLORS[key],
                border: `1px solid ${CATEGORY_COLORS[key]}30`,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: CATEGORY_COLORS[key], display: 'inline-block' }} />
                {label}
              </span>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.4rem', color: '#5C5542' }}>No products found.</p>
            <button onClick={() => { setSearchQuery(''); setActiveState('All States') }}
              style={{ marginTop: '1rem', background: '#C94B1A', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', cursor: 'pointer', fontFamily: "'Lato', sans-serif", fontWeight: 700 }}>
              Clear filters
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}>
            {filtered.map(product => (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                style={{
                  background: '#FFFEF9',
                  border: '1.5px solid #D9C9A8',
                  borderRadius: 12,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.18s, box-shadow 0.18s',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = 'translateY(-4px)'
                  el.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = 'translateY(0)'
                  el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                <CardVisual product={product} />

                <div style={{ padding: '1.25rem' }}>
                  {/* State */}
                  <div style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9A8E7A', marginBottom: '0.35rem' }}>
                    {product.state}
                  </div>

                  {/* Name */}
                  <h3 style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.2rem', fontWeight: 700, color: '#1B2E4A', margin: '0 0 0.5rem' }}>
                    {product.name}
                  </h3>

                  {/* Tagline */}
                  <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.82rem', color: '#5C5542', lineHeight: 1.6, margin: '0 0 1rem' }}>
                    {product.tagline}
                  </p>

                  {/* Women pill */}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: `${product.accent}12`,
                    border: `1px solid ${product.accent}35`,
                    borderRadius: 20, padding: '4px 10px',
                    marginBottom: '1rem',
                  }}>
                    <span style={{ fontSize: '0.75rem' }}>👩‍🎨</span>
                    <span style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.7rem', fontWeight: 700, color: product.accent }}>
                      {product.womenPercent}% women artisans
                    </span>
                  </div>

                  {/* GI tag + CTA */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #EDE0C8' }}>
                    <span style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.68rem', color: '#B8860B', fontWeight: 700 }}>
                      {product.giTag}
                    </span>
                    <span style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.72rem', fontWeight: 700, color: '#C94B1A', letterSpacing: '0.05em' }}>
                      Learn more →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Knowledge Banner ── */}
      <div style={{ background: '#1B2E4A', padding: '4rem 5%', marginTop: '2rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#B8860B', marginBottom: '1rem' }}>
            AI-Powered Knowledge
          </p>
          <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
            Ask our chatbot anything about GI heritage
          </h2>
          <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, marginBottom: '2rem', maxWidth: 600, margin: '0 auto 2rem' }}>
            Trained on 478 GI products and 2,500 women artisan survey responses — our AI can answer questions about craft history, women's involvement, market access, and more.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/chatbot" style={{
              fontFamily: "'Lato', sans-serif", fontSize: '0.85rem', fontWeight: 700,
              letterSpacing: '0.07em', textTransform: 'uppercase',
              background: '#C94B1A', color: '#fff',
              padding: '12px 28px', borderRadius: 6, textDecoration: 'none',
            }}>
              Chat with KalaStree AI
            </Link>
            <Link href="/shop" style={{
              fontFamily: "'Lato', sans-serif", fontSize: '0.85rem', fontWeight: 700,
              letterSpacing: '0.07em', textTransform: 'uppercase',
              background: 'transparent', color: '#B8860B',
              border: '1.5px solid #B8860B',
              padding: '12px 28px', borderRadius: 6, textDecoration: 'none',
            }}>
              Shop GI Products
            </Link>
          </div>
        </div>
      </div>

      {/* ── Modal ── */}
      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}

      <style>{`
        input::placeholder { color: #9A8E7A; }
        input:focus { border-color: #C94B1A !important; box-shadow: 0 0 0 3px rgba(201,75,26,0.12); }
        div[style*="overflowX: auto"]::-webkit-scrollbar { display: none; }
        @media (max-width: 640px) {
          div[style*="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
