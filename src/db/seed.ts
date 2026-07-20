import { db } from "./index";
import {
  categories,
  tools,
  locations,
  toolImages,
  toolAccessories,
  reservations,
  users,
  memberProfiles,
  projects,
  projectTools,
  relatedProjects,
  favorites,
  savedProjects,
  notifications,
  userPreferences,
} from "./schema";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...");

  await db.execute(sql`
    TRUNCATE TABLE
      notifications,
      user_preferences,
      saved_projects,
      favorites,
      related_projects,
      project_tools,
      projects,
      reservations,
      tool_accessories,
      tool_images,
      member_profiles,
      tools,
      categories,
      locations,
      sessions,
      accounts,
      verification_tokens,
      users
    CASCADE
  `);

  const [demoUser] = await db
    .insert(users)
    .values({
      name: "Demo Member",
      email: "demo@example.com",
      role: "member",
      isActive: true,
    })
    .returning();

  console.log(`  ✅ Demo user: ${demoUser.id}`);

  const [mainBranch, eastBranch] = await db
    .insert(locations)
    .values([
      {
        name: "Main Branch",
        address: "123 Main St",
        city: "Portland",
        state: "OR",
        zipCode: "97201",
        phone: "(503) 555-0100",
        email: "main@toollibrary.org",
        status: "active",
      },
      {
        name: "East Side Branch",
        address: "456 Burnside Ave",
        city: "Portland",
        state: "OR",
        zipCode: "97214",
        phone: "(503) 555-0200",
        email: "east@toollibrary.org",
        status: "active",
      },
    ])
    .returning();

  await db.insert(memberProfiles).values({
    userId: demoUser.id,
    memberNumber: "TL-2024-0001",
    phone: "503-555-9999",
    address: "789 Member Lane",
    city: "Portland",
    state: "OR",
    zipCode: "97205",
    membershipStatus: "active",
    preferredLocationId: mainBranch.id,
    joinDate: "2024-01-15",
expirationDate: "2026-01-15",
  });

  const categoryData = [
    { name: "Power Tools", slug: "power-tools", description: "Electric and battery-powered tools", icon: "⚡", sortOrder: 1 },
    { name: "Hand Tools", slug: "hand-tools", description: "Manual hand tools for various tasks", icon: "🔧", sortOrder: 2 },
    { name: "Woodworking", slug: "woodworking", description: "Specialized woodworking tools and equipment", icon: "🪵", sortOrder: 3 },
    { name: "Plumbing", slug: "plumbing", description: "Plumbing tools and equipment", icon: "🔩", sortOrder: 4 },
    { name: "Painting", slug: "painting", description: "Painting tools and supplies", icon: "🎨", sortOrder: 5 },
    { name: "Garden & Landscaping", slug: "garden-landscaping", description: "Outdoor and landscaping tools", icon: "🌿", sortOrder: 6 },
    { name: "Automotive", slug: "automotive", description: "Automotive repair and maintenance tools", icon: "🚗", sortOrder: 7 },
    { name: "Electrical", slug: "electrical", description: "Electrical work tools and testers", icon: "💡", sortOrder: 8 },
  ];

  const insertedCategories = await db.insert(categories).values(categoryData).returning();
  const catMap = new Map(insertedCategories.map((c) => [c.slug, c.id]));

  const insertedTools: (typeof tools.$inferSelect)[] = [];

  const [dewaltDrill] = await db.insert(tools).values({
    assetId: "TL-8942",
    name: "DeWalt 20V MAX Cordless Drill/Driver Kit",
    slug: "dewalt-20v-cordless-drill",
    description: "The DeWalt DCD771C2 20V MAX Cordless Drill/Driver Kit delivers power and performance in a compact, lightweight design.",
    brand: "DeWalt",
    model: "DCD771C2",
    categoryId: catMap.get("power-tools")!,
    locationId: mainBranch.id,
    status: "available",
    skillLevel: "beginner",
    replacementCost: "129.00",
    serialNumber: "DW-2024-001",
    specifications: {
      "Power": "20V MAX",
      "Speed": "0-450 / 0-1,500 RPM",
      "Max Torque": "300 UWO",
      "Chuck Size": "1/2 inch Ratcheting",
      "Weight": "3.6 lbs",
      "Battery": "20V MAX Lithium Ion",
    } as Record<string, string>,
    safetyInfo: "Always wear safety glasses when operating\nSecure workpiece before drilling",
    userManualUrl: "https://example.com/manuals/dewalt-dcd771c2.pdf",
    quickStartGuideUrl: "https://example.com/guides/dewalt-drill-quickstart.pdf",
  }).returning();
  insertedTools.push(dewaltDrill);

  const [milwaukeeSaw] = await db.insert(tools).values({
    assetId: "TL-7823",
    name: "Milwaukee M18 FUEL 7-1/4 inch Circular Saw",
    slug: "milwaukee-m18-circular-saw",
    description: "The Milwaukee M18 FUEL 7-1/4 inch Circular Saw delivers the power of a 15A corded saw with the portability of M18.",
    brand: "Milwaukee",
    model: "2731-20",
    categoryId: catMap.get("power-tools")!,
    locationId: mainBranch.id,
    status: "available",
    skillLevel: "intermediate",
    replacementCost: "249.00",
    serialNumber: "MW-2024-002",
    specifications: {
      "Power": "18V",
      "Blade Diameter": "7-1/4 inch",
      "No Load Speed": "5,800 RPM",
      "Bevel Capacity": "0-50 degrees",
      "Cutting Depth": "2-1/2 inch",
      "Weight": "7.2 lbs",
    } as Record<string, string>,
    safetyInfo: "Always wear safety glasses and hearing protection\nEnsure blade guard is functioning properly",
  }).returning();
  insertedTools.push(milwaukeeSaw);

  const [boschDriver] = await db.insert(tools).values({
    assetId: "TL-6541",
    name: "Bosch 12V Max EC Brushless Impact Driver",
    slug: "bosch-12v-impact-driver",
    description: "The Bosch PS41-2A 12V Max Impact Driver features best-in-class power and a compact design.",
    brand: "Bosch",
    model: "PS41-2A",
    categoryId: catMap.get("power-tools")!,
    locationId: mainBranch.id,
    status: "available",
    skillLevel: "beginner",
    replacementCost: "119.00",
    serialNumber: "BS-2024-004",
    specifications: {
      "Power": "12V Max",
      "Max Torque": "1,300 in-lbs",
      "No Load Speed": "0-2,600 RPM",
      "Impact Rate": "0-3,100 BPM",
      "Weight": "2.0 lbs",
      "Chuck": "1/4 inch Hex",
    } as Record<string, string>,
    safetyInfo: "Wear safety glasses\nSecure small workpieces",
  }).returning();
  insertedTools.push(boschDriver);

  const [festoolSaw] = await db.insert(tools).values({
    assetId: "TL-5432",
    name: "Festool TS 55 REQ Track Saw",
    slug: "festool-ts-55-track-saw",
    description: "The Festool TS 55 REQ Track Saw is a precision cutting system that produces splinter-free cuts every time.",
    brand: "Festool",
    model: "TS 55 REQ",
    categoryId: catMap.get("woodworking")!,
    locationId: mainBranch.id,
    status: "available",
    skillLevel: "advanced",
    replacementCost: "575.00",
    serialNumber: "FS-2024-011",
    specifications: {
      "Power": "1,200W",
      "Blade Diameter": "160mm",
      "Speed": "1,350-3,550 RPM",
      "Cutting Depth": "55mm at 90 degrees",
      "Bevel Capacity": "-1 to 47 degrees",
      "Weight": "4.5 kg",
    } as Record<string, string>,
    safetyInfo: "This tool requires training before first use\nAlways use with guide rail",
    userManualUrl: "https://example.com/manuals/festool-ts55.pdf",
    quickStartGuideUrl: "https://example.com/guides/festool-ts55-quickstart.pdf",
  }).returning();
  insertedTools.push(festoolSaw);

  // FIX: changed skillLevel from "professional" to "expert"
  const [lieNielsenPlane] = await db.insert(tools).values({
    assetId: "TL-4321",
    name: "Lie-Nielsen No. 4 Smoothing Plane",
    slug: "lie-nielsen-no4-plane",
    description: "The Lie-Nielsen No. 4 Smoothing Plane is a premium hand plane made from ductile iron with a Manganese Bronze frog.",
    brand: "Lie-Nielsen",
    model: "No. 4",
    categoryId: catMap.get("woodworking")!,
    locationId: mainBranch.id,
    status: "available",
    skillLevel: "expert",
    replacementCost: "425.00",
    serialNumber: "LN-2024-012",
    specifications: {
      "Body Material": "Ductile Iron",
      "Blade Material": "A2 Tool Steel",
      "Blade Width": "2 inches",
      "Length": "9-5/8 inches",
      "Weight": "4 lbs 2 oz",
    } as Record<string, string>,
    safetyInfo: "Blade is extremely sharp - handle with care\nAlways retract blade when not in use",
  }).returning();
  insertedTools.push(lieNielsenPlane);

  const [gracoSprayer] = await db.insert(tools).values({
    assetId: "TL-3210",
    name: "Graco Magnum X5 Airless Paint Sprayer",
    slug: "graco-magnum-x5-sprayer",
    description: "The Graco Magnum X5 is a powerful airless paint sprayer perfect for the ambitious DIYer or handyman.",
    brand: "Graco",
    model: "Magnum X5",
    categoryId: catMap.get("painting")!,
    locationId: eastBranch.id,
    status: "available",
    skillLevel: "intermediate",
    replacementCost: "329.00",
    serialNumber: "GR-2024-017",
    specifications: {
      "Max PSI": "3,000",
      "Flow Rate": "0.27 GPM",
      "Tip Size": ".015 max",
      "Hose Length": "25 ft",
      "Pump Type": "Stainless Steel Piston",
      "Power": "5/8 HP",
    } as Record<string, string>,
    safetyInfo: "Never point sprayer at people or animals\nRelieve pressure before servicing",
    userManualUrl: "https://example.com/manuals/graco-x5.pdf",
  }).returning();
  insertedTools.push(gracoSprayer);

  const [flukeMultimeter] = await db.insert(tools).values({
    assetId: "TL-2109",
    name: "Fluke 117 Electricians True RMS Multimeter",
    slug: "fluke-117-multimeter",
    description: "The Fluke 117 is designed specifically for electricians with Non-Contact Voltage Detection and AutoVolt.",
    brand: "Fluke",
    model: "117",
    categoryId: catMap.get("electrical")!,
    locationId: mainBranch.id,
    status: "available",
    skillLevel: "advanced",
    replacementCost: "199.00",
    serialNumber: "FL-2024-024",
    specifications: {
      "AC Voltage": "600V",
      "DC Voltage": "600V",
      "Resistance": "40 MOhm",
      "Capacitance": "10,000 uF",
      "Frequency": "50 kHz",
      "Safety Rating": "CAT III 600V",
    } as Record<string, string>,
    safetyInfo: "Verify meter is working before use\nNever exceed rated voltage",
  }).returning();
  insertedTools.push(flukeMultimeter);

  const [hondaMower] = await db.insert(tools).values({
    assetId: "TL-1098",
    name: "Honda 21 inch Self-Propelled Lawn Mower",
    slug: "honda-21-lawn-mower",
    description: "The Honda HRN216VKA features the exclusive MicroCut Twin Blade System for superior mulching and bagging.",
    brand: "Honda",
    model: "HRN216VKA",
    categoryId: catMap.get("garden-landscaping")!,
    locationId: eastBranch.id,
    status: "available",
    skillLevel: "beginner",
    replacementCost: "449.00",
    serialNumber: "HN-2024-021",
    specifications: {
      "Engine": "Honda GCV170",
      "Cutting Width": "21 inches",
      "Cutting Height": "7 positions 3/4 to 4 inches",
      "Drive System": "Smart Drive",
      "Bag Capacity": "1.9 bushels",
      "Fuel Capacity": "0.24 gallon",
    } as Record<string, string>,
    safetyInfo: "Wear closed-toe shoes when operating\nClear area of debris before mowing",
  }).returning();
  insertedTools.push(hondaMower);

  const [floorJack] = await db.insert(tools).values({
    assetId: "TL-0987",
    name: "Craftsman 3-Ton Floor Jack and Stand Set",
    slug: "craftsman-3-ton-floor-jack",
    description: "Professional-grade floor jack with 3-ton capacity and quick-lift technology.",
    brand: "Craftsman",
    model: "CMHT83000",
    categoryId: catMap.get("automotive")!,
    locationId: mainBranch.id,
    status: "checked_out",
    skillLevel: "intermediate",
    replacementCost: "179.00",
    serialNumber: "CF-2024-022",
    specifications: {
      "Capacity": "3 Tons / 6,000 lbs",
      "Min Height": "5-1/8 inches",
      "Max Height": "19-3/4 inches",
      "Saddle Diameter": "4-1/2 inches",
      "Weight": "55 lbs",
    } as Record<string, string>,
    safetyInfo: "Always use jack stands - never work under vehicle supported only by jack",
  }).returning();
  insertedTools.push(floorJack);

  const [pipeWrench] = await db.insert(tools).values({
    assetId: "TL-0876",
    name: "RIDGID 14 inch Pipe Wrench",
    slug: "ridgid-14-pipe-wrench",
    description: "The RIDGID 14 inch Straight Pipe Wrench is built from heavy-duty material with I-beam handle design.",
    brand: "RIDGID",
    model: "31020",
    categoryId: catMap.get("plumbing")!,
    locationId: mainBranch.id,
    status: "available",
    skillLevel: "intermediate",
    replacementCost: "49.99",
    serialNumber: "RG-2024-015",
    specifications: {
      "Length": "14 inches",
      "Pipe Capacity": "2 inches",
      "Handle Material": "Cast Iron",
      "Jaw Material": "Alloy Steel",
      "Weight": "3.75 lbs",
    } as Record<string, string>,
    safetyInfo: "Pull toward you when possible\nEnsure jaws are fully engaged before applying force",
  }).returning();
  insertedTools.push(pipeWrench);

  await db.insert(toolImages).values([
    { toolId: dewaltDrill.id, imageUrl: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800", altText: "DeWalt Drill - Front View", isPrimary: true, sortOrder: 0 },
    { toolId: dewaltDrill.id, imageUrl: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800", altText: "DeWalt Drill - In Use", isPrimary: false, sortOrder: 1 },
    { toolId: dewaltDrill.id, imageUrl: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800", altText: "DeWalt Drill - Kit Contents", isPrimary: false, sortOrder: 2 },
    { toolId: festoolSaw.id, imageUrl: "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=800", altText: "Festool Track Saw", isPrimary: true, sortOrder: 0 },
    { toolId: gracoSprayer.id, imageUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800", altText: "Paint Sprayer", isPrimary: true, sortOrder: 0 },
  ]);

  await db.insert(toolAccessories).values([
    { toolId: dewaltDrill.id, name: "20V MAX Compact Battery (2-pack)", description: "Lithium-ion batteries with fuel gauge", isIncluded: true },
    { toolId: dewaltDrill.id, name: "Charger", description: "Standard charger for 20V MAX batteries", isIncluded: true },
    { toolId: dewaltDrill.id, name: "Belt Hook", description: "Clip for hands-free carrying", isIncluded: true },
    { toolId: dewaltDrill.id, name: "Carrying Case", description: "Hard plastic carrying case", isIncluded: true },
    { toolId: dewaltDrill.id, name: "Drill Bit Set", description: "Various drill bits - must be requested separately", isIncluded: false },
    { toolId: festoolSaw.id, name: "Splinterguard", description: "For clean cuts on melamine", isIncluded: true },
    { toolId: festoolSaw.id, name: "Saw Blade (Standard)", description: "48-tooth standard blade", isIncluded: true },
    { toolId: festoolSaw.id, name: "Guide Rail", description: "1400mm guide rail - must be requested separately", isIncluded: false },
    { toolId: festoolSaw.id, name: "Dust Extractor Adapter", description: "27mm hose adapter", isIncluded: true },
    { toolId: gracoSprayer.id, name: "RAC X 515 SwitchTip", description: "Standard spray tip for latex paints", isIncluded: true },
    { toolId: gracoSprayer.id, name: "25ft Airless Hose", description: "Standard pressure hose", isIncluded: true },
    { toolId: gracoSprayer.id, name: "Pump Armor", description: "Storage fluid for winterization", isIncluded: true },
  ]);

  const [cuttingBoard, floatingShelf, deckStain, brakeChange, tileBacksplash] = await db
    .insert(projects)
    .values([
      {
        name: "Wooden Cutting Board",
        slug: "wooden-cutting-board",
        description: "A beginner-friendly woodworking project.",
        difficulty: "beginner",
        estimatedTime: "3-4 hours",
        safetyNotes: [
          "Wear safety glasses at all times",
          "Keep fingers clear of blades and sanders",
          "Use push sticks near saw blades",
          "Only use food-safe finish (mineral oil or beeswax)",
        ],
        stepOverview: [
          { step: 1, title: "Select & Prep Wood", description: "Choose hardwood like maple, walnut, or cherry. Cut to rough size." },
          { step: 2, title: "Joint & Plane", description: "Flatten one face and one edge, then plane to final thickness." },
          { step: 3, title: "Glue Up", description: "Arrange strips, apply food-safe glue, and clamp overnight." },
          { step: 4, title: "Sand Smooth", description: "Progress through 80, 120, 180, and 220 grit sandpaper." },
          { step: 5, title: "Finish", description: "Apply mineral oil or beeswax finish. Let cure 24 hours." },
        ],
        isActive: true,
      },
      {
        name: "Floating Wall Shelf",
        slug: "floating-wall-shelf",
        description: "Modern minimalist wall-mounted shelf with hidden brackets.",
        difficulty: "beginner",
        estimatedTime: "2-3 hours",
        safetyNotes: [
          "Locate wall studs before drilling",
          "Wear safety glasses when drilling",
          "Check for electrical wires and pipes before drilling into walls",
        ],
        stepOverview: [
          { step: 1, title: "Measure & Mark", description: "Find studs, mark shelf location, ensure it's level." },
          { step: 2, title: "Cut Shelf Board", description: "Cut hardwood board to desired length." },
          { step: 3, title: "Install Brackets", description: "Screw hidden floating bracket into studs." },
          { step: 4, title: "Drill Bracket Holes", description: "Drill matching holes into back of shelf board." },
          { step: 5, title: "Mount & Finish", description: "Slide shelf onto brackets and apply finish." },
        ],
        isActive: true,
      },
      {
        name: "Refinish a Wooden Deck",
        slug: "refinish-wooden-deck",
        description: "Bring your weathered deck back to life with proper cleaning, sanding, and re-staining.",
        difficulty: "intermediate",
        estimatedTime: "1-2 weekends",
        safetyNotes: [
          "Wear respirator when sanding",
          "Use gloves when handling stain and cleaners",
          "Ensure good ventilation",
          "Dispose of oily rags properly - they can spontaneously combust",
        ],
        stepOverview: [
          { step: 1, title: "Clean Deck", description: "Sweep, then pressure wash with deck cleaner. Let dry 48 hours." },
          { step: 2, title: "Repair Damage", description: "Replace rotted boards, hammer down loose nails, replace with screws." },
          { step: 3, title: "Sand Surface", description: "Use orbital sander with 60-80 grit to remove old stain and smooth wood." },
          { step: 4, title: "Apply Stain", description: "Apply stain with brush or roller, working with the grain. Two coats recommended." },
          { step: 5, title: "Cure Time", description: "Allow 48-72 hours before walking on deck or replacing furniture." },
        ],
        isActive: true,
      },
      {
        name: "Change Your Car's Brake Pads",
        slug: "change-brake-pads",
        description: "Save money by replacing your own brake pads.",
        difficulty: "intermediate",
        estimatedTime: "2-3 hours",
        safetyNotes: [
          "ALWAYS use jack stands - never work under a car supported only by a jack",
          "Chock the wheels that stay on the ground",
          "Wear safety glasses and gloves",
          "Never breathe in brake dust",
          "Test brakes at low speed before driving normally",
        ],
        stepOverview: [
          { step: 1, title: "Lift & Secure Vehicle", description: "Loosen lugs, jack up vehicle, place jack stands, remove wheel." },
          { step: 2, title: "Remove Caliper", description: "Remove caliper bolts and hang caliper with wire." },
          { step: 3, title: "Replace Pads", description: "Remove old pads, compress caliper piston, install new pads." },
          { step: 4, title: "Reinstall Caliper", description: "Reinstall caliper, torque bolts to spec, replace wheel." },
          { step: 5, title: "Test", description: "Pump brake pedal until firm, test at low speed before normal driving." },
        ],
        isActive: true,
      },
      {
        name: "Install a Tile Backsplash",
        slug: "tile-backsplash-install",
        description: "Transform your kitchen with a custom tile backsplash.",
        difficulty: "advanced",
        estimatedTime: "2-3 days",
        safetyNotes: [
          "Wear safety glasses when cutting tile",
          "Use dust mask when mixing thinset and grout",
          "Turn off electrical outlets in work area",
          "Wear gloves when handling grout - it can burn skin",
        ],
        stepOverview: [
          { step: 1, title: "Prep Surface", description: "Clean wall, remove outlet covers, apply painter's tape, plan layout." },
          { step: 2, title: "Apply Thinset", description: "Mix thinset, apply to small area with notched trowel." },
          { step: 3, title: "Set Tiles", description: "Press tiles into thinset with spacers between. Cut tiles as needed for edges." },
          { step: 4, title: "Let Cure", description: "Allow thinset to cure 24 hours before grouting." },
          { step: 5, title: "Grout & Seal", description: "Apply grout, wipe excess, let cure, then apply grout sealer." },
        ],
        isActive: true,
      },
    ])
    .returning();

  await db.insert(projectTools).values([
    { projectId: cuttingBoard.id, toolId: milwaukeeSaw.id },
    { projectId: cuttingBoard.id, toolId: lieNielsenPlane.id },
    { projectId: floatingShelf.id, toolId: dewaltDrill.id },
    { projectId: floatingShelf.id, toolId: boschDriver.id },
    { projectId: floatingShelf.id, toolId: milwaukeeSaw.id },
    { projectId: deckStain.id, toolId: gracoSprayer.id },
    { projectId: brakeChange.id, toolId: floorJack.id },
    { projectId: tileBacksplash.id, toolId: dewaltDrill.id },
    { projectId: tileBacksplash.id, toolId: flukeMultimeter.id },
  ]);

  await db.insert(relatedProjects).values([
    { projectId: cuttingBoard.id, relatedProjectId: floatingShelf.id },
    { projectId: floatingShelf.id, relatedProjectId: cuttingBoard.id },
    { projectId: deckStain.id, relatedProjectId: tileBacksplash.id },
    { projectId: brakeChange.id, relatedProjectId: deckStain.id },
  ]);

  const today = new Date();
  const addDays = (days: number): string => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  };

  await db.insert(reservations).values([
    {
      toolId: floorJack.id,
      userId: demoUser.id,
      locationId: mainBranch.id,
      status: "checked_out",
      pickupDate: addDays(-2),
      returnDate: addDays(3),
      pickupTime: "10:00",
      actualPickupDate: new Date(new Date().setDate(today.getDate() - 2)),
      notes: "For brake change project",
    },
    {
      toolId: boschDriver.id,
      userId: demoUser.id,
      locationId: mainBranch.id,
      status: "pending",
      pickupDate: addDays(3),
      returnDate: addDays(7),
      pickupTime: "14:00",
      notes: "Need for deck project",
    },
    {
      toolId: milwaukeeSaw.id,
      userId: demoUser.id,
      locationId: mainBranch.id,
      status: "confirmed",
      pickupDate: addDays(5),
      returnDate: addDays(7),
      pickupTime: "09:00",
    },
    {
      toolId: dewaltDrill.id,
      userId: demoUser.id,
      locationId: mainBranch.id,
      status: "returned",
      pickupDate: addDays(-10),
      returnDate: addDays(-5),
      actualPickupDate: new Date(new Date().setDate(today.getDate() - 10)),
      actualReturnDate: new Date(new Date().setDate(today.getDate() - 5)),
    },
    {
      toolId: pipeWrench.id,
      userId: demoUser.id,
      locationId: mainBranch.id,
      status: "cancelled",
      pickupDate: addDays(-5),
      returnDate: addDays(-1),
    },
  ]);

  await db.insert(favorites).values([
    { userId: demoUser.id, toolId: dewaltDrill.id },
    { userId: demoUser.id, toolId: festoolSaw.id },
    { userId: demoUser.id, toolId: gracoSprayer.id },
  ]);

  await db.insert(savedProjects).values([
    { userId: demoUser.id, projectId: cuttingBoard.id },
    { userId: demoUser.id, projectId: floatingShelf.id },
  ]);

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const addDaysDate = (days: number): Date => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d;
  };

  await db.insert(notifications).values([
    {
      userId: demoUser.id,
      type: "pickup_reminder",
      title: "Upcoming Pickup",
      message: `Your reservation for "Bosch 12V Max Impact Driver" is scheduled for pickup on ${fmt(addDaysDate(3))}.`,
      isRead: false,
    },
    {
      userId: demoUser.id,
      type: "return_reminder",
      title: "Return Reminder",
      message: `Please return "Craftsman 3-Ton Floor Jack" by ${fmt(addDaysDate(3))}.`,
      isRead: false,
    },
    {
      userId: demoUser.id,
      type: "reservation_reminder",
      title: "Reservation Confirmed",
      message: `Your reservation for "Milwaukee M18 Circular Saw" has been confirmed. Pick up on ${fmt(addDaysDate(5))}.`,
      isRead: true,
      readAt: new Date(),
    },
    {
      userId: demoUser.id,
      type: "membership_expiring",
      title: "Membership Expiring Soon",
      message: "Your membership expires on 2026-01-15. Renew now to keep borrowing tools!",
      isRead: false,
    },
    {
      userId: demoUser.id,
      type: "general",
      title: "Welcome to ToolLib!",
      message: "Thanks for joining our tool library. Browse our catalog and start borrowing!",
      isRead: true,
      readAt: new Date(),
    },
  ]);

  await db.insert(userPreferences).values({
    userId: demoUser.id,
    emailNotifications: true,
    reminderDaysBefore: 2,
    preferredLocationId: mainBranch.id,
  });

  console.log(`✅ Seeded ${insertedCategories.length} categories`);
  console.log(`✅ Seeded ${insertedTools.length} tools with images & accessories`);
  console.log(`✅ Seeded 5 projects with tool links & related projects`);
  console.log(`✅ Seeded 5 reservations (varied states), 3 favorites, 2 saved projects`);
  console.log(`✅ Seeded 5 notifications & user preferences`);
  console.log("🌱 Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});