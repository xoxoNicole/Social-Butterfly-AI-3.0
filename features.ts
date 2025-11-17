export interface Feature {
  title: string;
  icon: string;
  description: string;
}

export const features: Feature[] = [
  { title: "Market Validation", icon: "rocket_launch", description: "Test your business idea against real market demand and get a data-driven viability report." },
  { title: "Go-to-Market Plan", icon: "campaign", description: "Structure your launch strategy, from audience targeting to messaging and channel selection." },
  { title: "Audience Discovery", icon: "group", description: "Identify and understand your target customer using trending topics and demand signals." },
  { title: "Product Suite Strategy", icon: "inventory_2", description: "Design a profitable suite of offers, from entry-level products to high-ticket services." },
  { title: "Customer Journey Mapping", icon: "map", description: "Build out the perfect customer journey to attract, convert, and retain loyal fans." },
  { title: "Content Pillar Development", icon: "view_column", description: "Establish core content themes that resonate with your audience and build authority." },
  { title: "Content Calendar Creation", icon: "edit_calendar", description: "Generate a ready-to-use content calendar to streamline your marketing efforts." },
  { title: "AI-Powered Content Generation", icon: "spark", description: "Create compelling copy for social media, emails, and blogs with Gemini intelligence." },
  { title: "Faith Alignment Lens", icon: "favorite", description: "Optionally align your business strategy with Christian principles for purpose-driven ventures." }
];
