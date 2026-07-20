import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../src/db/schema";

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db",
  });
  
  const db = drizzle(pool, { schema });

  console.log("🌱 Seeding database...");

  // Create a category first
  const [category] = await db
    .insert(schema.categories)
    .values({
      name: "Power Tools",
      slug: "power-tools",
      description: "Electric and battery-powered tools",
      status: "active",
    })
    .onConflictDoNothing()
    .returning();

  const categoryId = category?.id || (await db.select().from(schema.categories).limit(1))[0]?.id;

  if (!categoryId) {
    console.error("Failed to create or find category");
    await pool.end();
    return;
  }

  // Create tools
  const toolsData = [
    { name: "Circular Saw", slug: "circular-saw", skillLevel: "intermediate" as const },
    { name: "Power Drill", slug: "power-drill", skillLevel: "beginner" as const },
    { name: "Jigsaw", slug: "jigsaw", skillLevel: "beginner" as const },
    { name: "Orbital Sander", slug: "orbital-sander", skillLevel: "beginner" as const },
    { name: "Router", slug: "router", skillLevel: "advanced" as const },
    { name: "Miter Saw", slug: "miter-saw", skillLevel: "intermediate" as const },
    { name: "Table Saw", slug: "table-saw", skillLevel: "advanced" as const },
    { name: "Nail Gun", slug: "nail-gun", skillLevel: "intermediate" as const },
  ];

  const insertedTools = [];
  for (const tool of toolsData) {
    const [inserted] = await db
      .insert(schema.tools)
      .values({
        ...tool,
        categoryId,
        status: "available",
        isActive: true,
      })
      .onConflictDoNothing()
      .returning();
    
    if (inserted) {
      insertedTools.push(inserted);
    }
  }

  // Get all tools (including previously existing ones)
  const allTools = await db.select().from(schema.tools);
  const toolMap = new Map(allTools.map((t) => [t.slug, t.id]));

  console.log(`✅ Created ${insertedTools.length} tools`);

  // Create projects
  const projectsData = [
    {
      name: "Build a Wooden Bookshelf",
      slug: "build-wooden-bookshelf",
      description: "Create a beautiful freestanding bookshelf with adjustable shelves. Perfect for beginners looking to tackle their first furniture project.",
      difficulty: "beginner" as const,
      estimatedTime: "4-6 hours",
      safetyNotes: [
        "Always wear safety glasses when cutting wood",
        "Use hearing protection with power tools",
        "Keep work area clean and well-lit",
      ],
      stepOverview: [
        { step: 1, title: "Cut the Side Panels", description: "Measure and cut the two side panels to your desired height." },
        { step: 2, title: "Cut the Shelves", description: "Cut shelves to width, accounting for the dado joints." },
        { step: 3, title: "Sand All Pieces", description: "Sand all pieces smooth, starting with 120-grit and finishing with 220-grit." },
        { step: 4, title: "Assemble the Frame", description: "Attach shelves to side panels using wood glue and screws." },
        { step: 5, title: "Finish", description: "Apply your choice of stain or paint, then seal with polyurethane." },
      ],
      toolSlugs: ["circular-saw", "power-drill", "orbital-sander"],
    },
    {
      name: "DIY Floating Desk",
      slug: "diy-floating-desk",
      description: "Build a wall-mounted floating desk that saves space and looks modern. Great for home offices and small apartments.",
      difficulty: "intermediate" as const,
      estimatedTime: "6-8 hours",
      safetyNotes: [
        "Locate wall studs before mounting",
        "Use appropriate anchors for your wall type",
        "Have a helper when mounting heavy pieces",
        "Wear a dust mask when sanding",
      ],
      stepOverview: [
        { step: 1, title: "Design and Measure", description: "Plan your desk dimensions and mark stud locations on the wall." },
        { step: 2, title: "Build the Desktop", description: "Cut and join wood to create the desktop surface." },
        { step: 3, title: "Create Support Brackets", description: "Build or install heavy-duty brackets to support the desk." },
        { step: 4, title: "Mount to Wall", description: "Secure brackets to wall studs and attach the desktop." },
        { step: 5, title: "Add Cable Management", description: "Install cable routing holes and clips." },
        { step: 6, title: "Finish and Seal", description: "Apply finish of your choice for durability." },
      ],
      toolSlugs: ["circular-saw", "power-drill", "orbital-sander", "jigsaw"],
    },
    {
      name: "Custom Picture Frame",
      slug: "custom-picture-frame",
      description: "Create a professional-looking picture frame with mitered corners. Learn precision cutting techniques.",
      difficulty: "intermediate" as const,
      estimatedTime: "2-3 hours",
      safetyNotes: [
        "Use a sharp blade for clean miter cuts",
        "Secure workpiece firmly before cutting",
        "Mind your fingers near the blade",
      ],
      stepOverview: [
        { step: 1, title: "Measure Your Artwork", description: "Determine the exact dimensions needed for the frame opening." },
        { step: 2, title: "Cut Miter Joints", description: "Cut four frame pieces with precise 45-degree angles." },
        { step: 3, title: "Route the Rabbet", description: "Create a rabbet on the back to hold the glass and artwork." },
        { step: 4, title: "Glue and Clamp", description: "Assemble the frame using wood glue and corner clamps." },
        { step: 5, title: "Finish", description: "Sand smooth and apply your chosen finish." },
      ],
      toolSlugs: ["miter-saw", "router", "orbital-sander"],
    },
    {
      name: "Build a Garden Planter Box",
      slug: "garden-planter-box",
      description: "Construct a durable cedar planter box for your garden or patio. Weather-resistant and built to last.",
      difficulty: "beginner" as const,
      estimatedTime: "3-4 hours",
      safetyNotes: [
        "Use exterior-grade hardware to prevent rust",
        "Work in a well-ventilated area",
        "Wear gloves when handling treated lumber",
      ],
      stepOverview: [
        { step: 1, title: "Cut the Boards", description: "Cut cedar boards for sides, bottom, and corner posts." },
        { step: 2, title: "Assemble the Sides", description: "Attach side boards to corner posts using screws." },
        { step: 3, title: "Attach the Bottom", description: "Secure bottom boards with drainage gaps between them." },
        { step: 4, title: "Add Drainage Holes", description: "Drill additional drainage holes if needed." },
        { step: 5, title: "Optional Finish", description: "Apply natural oil finish if desired (cedar weathers naturally)." },
      ],
      toolSlugs: ["circular-saw", "power-drill"],
    },
    {
      name: "Advanced Dovetail Drawer",
      slug: "advanced-dovetail-drawer",
      description: "Master the art of dovetail joinery by building a traditional drawer. This project requires precision and patience.",
      difficulty: "advanced" as const,
      estimatedTime: "8-12 hours",
      safetyNotes: [
        "Keep chisels sharp for clean cuts",
        "Secure workpiece in a vise when chiseling",
        "Use push sticks with the router",
        "Work slowly and methodically",
      ],
      stepOverview: [
        { step: 1, title: "Mill Your Stock", description: "Prepare drawer parts to precise, consistent thickness." },
        { step: 2, title: "Mark the Dovetails", description: "Lay out tail and pin spacing with a marking gauge." },
        { step: 3, title: "Cut the Tails", description: "Cut tails using a dovetail saw or router jig." },
        { step: 4, title: "Transfer and Cut Pins", description: "Mark pins from tails and carefully cut to fit." },
        { step: 5, title: "Test Fit and Adjust", description: "Dry fit joints and pare as needed for perfect fit." },
        { step: 6, title: "Assemble the Drawer", description: "Glue up and attach the drawer bottom." },
        { step: 7, title: "Finish", description: "Sand smooth and apply a durable finish." },
      ],
      toolSlugs: ["table-saw", "router", "orbital-sander"],
    },
  ];

  const insertedProjects = [];
  for (const projectData of projectsData) {
    const { toolSlugs, ...project } = projectData;
    
    const [inserted] = await db
      .insert(schema.projects)
      .values(project)
      .onConflictDoNothing()
      .returning();

    if (inserted) {
      insertedProjects.push({ ...inserted, toolSlugs });

      // Link tools to project
      for (const toolSlug of toolSlugs) {
        const toolId = toolMap.get(toolSlug);
        if (toolId) {
          await db
            .insert(schema.projectTools)
            .values({ projectId: inserted.id, toolId })
            .onConflictDoNothing();
        }
      }
    }
  }

  console.log(`✅ Created ${insertedProjects.length} projects`);

  // Create some related project links
  const projectMap = new Map(
    (await db.select().from(schema.projects)).map((p) => [p.slug, p.id])
  );

  const relatedPairs = [
    ["build-wooden-bookshelf", "diy-floating-desk"],
    ["build-wooden-bookshelf", "garden-planter-box"],
    ["diy-floating-desk", "build-wooden-bookshelf"],
    ["custom-picture-frame", "advanced-dovetail-drawer"],
    ["advanced-dovetail-drawer", "custom-picture-frame"],
  ];

  for (const [projectSlug, relatedSlug] of relatedPairs) {
    const projectId = projectMap.get(projectSlug);
    const relatedProjectId = projectMap.get(relatedSlug);
    if (projectId && relatedProjectId) {
      await db
        .insert(schema.relatedProjects)
        .values({ projectId, relatedProjectId })
        .onConflictDoNothing();
    }
  }

  console.log("✅ Created related project links");
  console.log("🎉 Seeding complete!");

  await pool.end();
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
