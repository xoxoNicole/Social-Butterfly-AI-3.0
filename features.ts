

export interface Feature {
  title: string;
  icon: string;
  description: string;
  category: 'core' | 'multimedia';
  badge?: string;
}

export const features: Feature[] = [
  { title: "Butterfly Academy", icon: "school", description: "Interactive learning pods to master your pitch, brand, and strategy.", category: 'core', badge: 'NEW' },
  { title: "The Sanctuary", icon: "self_improvement", description: "A safe space for mindset, motivation, and difficult conversations.", category: 'core' },
  { title: "Market Validation", icon: "rocket_launch", description: "Test your business idea against real market demand and get a data-driven viability report.", category: 'core' },
  { title: "Ready, Set, Launch!", icon: "flag", description: "Get a custom, step-by-step launch plan tailored to what you're building.", category: 'core' },
  { title: "Go-to-Market Plan", icon: "campaign", description: "Structure your launch strategy, from audience targeting to messaging and channel selection.", category: 'core' },
  { title: "Audience Discovery", icon: "group", description: "Identify and understand your target customer using trending topics and demand signals.", category: 'core' },
  { title: "Product Suite Strategy", icon: "inventory_2", description: "Design a profitable suite of offers, from entry-level products to high-ticket services.", category: 'core' },
  { title: "Customer Journey Mapping", icon: "map", description: "Build out the perfect customer journey to attract, convert, and retain loyal fans.", category: 'core' },
  { title: "Content Pillar Development", icon: "view_column", description: "Establish core content themes that resonate with your audience and build authority.", category: 'core' },
  { title: "AI-Powered Content Generation", icon: "spark", description: "Create compelling copy for social media, emails, and blogs with Gemini intelligence.", category: 'core' },
  { title: "Document Analysis", icon: "description", description: "Upload a document to ask questions, summarize, or extract key insights.", category: 'core' },
  { title: "Video Understanding & Reels", icon: "video_library", description: "Upload long videos to extract viral clips (reels), generate transcripts, or repurpose into emails/blogs.", category: 'multimedia' },
  { title: "Landing Page Architect", icon: "web", description: "Generate a high-converting, beautiful landing page for your business in seconds.", category: 'multimedia', badge: 'NEW' },
  { title: "Generate Images", icon: "image", description: "Create stunning visuals from a text description with Imagen 4.", category: 'multimedia' },
  { title: "Edit Images", icon: "edit", description: "Modify your images with simple text commands using Gemini.", category: 'multimedia' },
  { title: "Generate Video", icon: "videocam", description: "Bring your ideas to life by generating video from text with Veo.", category: 'multimedia', badge: 'BETA' },
  { title: "Animate Image", icon: "movie", description: "Turn a static image into a dynamic video clip with Veo.", category: 'multimedia', badge: 'BETA' },
  { title: "Faith Alignment Lens", icon: "favorite", description: "Optionally align your business strategy with Christian principles for purpose-driven ventures.", category: 'core' }
];