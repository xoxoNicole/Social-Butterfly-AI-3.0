

export type UpdateType = 'feature' | 'fix' | 'improvement';

export interface UpdateLog {
  id: string;
  date: string;
  title: string;
  description: string;
  type: UpdateType;
}

const today = new Date().toLocaleDateString();

export const appUpdates: UpdateLog[] = [
  {
    id: 'feat-site-architect',
    date: today,
    title: 'New Feature: Site Architect',
    description: 'You can now generate complete, beautiful landing pages instantly! Describe your business, pick a style (Modern, Bold, Minimal, etc.), and Social Butterfly will write the HTML and Tailwind CSS code for you. You can see a live preview and download the code to host it anywhere.',
    type: 'feature'
  },
  {
    id: 'info-veo-beta',
    date: today,
    title: 'Video Studio (Veo) in BETA',
    description: 'Video and Animation features are currently in BETA. Due to high demand and strict low-provisioning policies from Google Cloud, video generation limits are currently restricted. We have requested increased quotas and expect higher limits soon. Thank you for your patience as we scale!',
    type: 'improvement'
  },
  {
    id: 'feat-trial-300',
    date: today,
    title: 'New Free Trial System',
    description: 'We have updated our onboarding! New users now receive a one-time grant of 300 credits to fully explore the platform—including chat, images, and strategy tools—before needing a subscription.',
    type: 'feature'
  },
  {
    id: 'feat-trial-provisioning',
    date: today,
    title: 'New Trial Credit System',
    description: 'We have updated our credit system. New users now receive a one-time grant of 300 credits to explore all features, including chat, images, and tools. When these run out, you can choose a plan to keep building.',
    type: 'feature'
  },
  {
    id: 'fix-admin-plan-visibility',
    date: today,
    title: 'Admin Dashboard & Provisioning',
    description: 'Improved the Admin Dashboard to show billing cycles (Monthly/Annual) and hardened the subscription provisioning logic to prevent credit errors.',
    type: 'improvement'
  },
  {
    id: 'fix-mobile-overlap',
    date: today,
    title: 'Mobile Interface Fix',
    description: 'Fixed a critical issue where the main sidebar overlapped with the Image Studio and other creative tools on mobile devices.',
    type: 'fix'
  },
  {
    id: 'fix-watermark',
    date: today,
    title: 'Watermark Rendering',
    description: 'Resolved an issue where the Butterfly logo watermark was not appearing on generated images.',
    type: 'fix'
  },
  {
    id: 'feat-early-grant',
    date: today,
    title: 'Early Adopter Grant',
    description: 'As a thank you to our early supporters, we have provisioned 100,000 credits to early user accounts! Go create something amazing.',
    type: 'feature'
  },
  {
    id: 'fix-sync-auth',
    date: today,
    title: 'Cross-Device Sync & Auth',
    description: 'Resolved issues with syncing logins between mobile and desktop. Your session, profile data, and credits now sync perfectly across all devices.',
    type: 'fix'
  },
  {
    id: 'fix-profile-persistence',
    date: today,
    title: 'Profile Persistence',
    description: 'Fixed an issue where profile photos and business details might not save correctly. Your profile is now rock solid.',
    type: 'fix'
  },
  {
    id: 'fix-video-gen-v6',
    date: today,
    title: 'Video Generation API Key Fix',
    description: 'Fixed a critical issue where video downloads failed with "API Key Invalid" errors. We implemented a robust workaround for secure file retrieval from Google Cloud.',
    type: 'fix'
  },
  {
    id: 'fix-video-gen-v5',
    date: today,
    title: 'Video Download Critical Fix V5',
    description: 'Resolved an API Key validation error during video download by improving how the download link is constructed. This ensures the key is passed correctly to the server.',
    type: 'fix'
  },
  {
    id: 'fix-video-gen-v4',
    date: today,
    title: 'Video Download Critical Fix',
    description: 'Fixed an API Key encoding issue that prevented videos from downloading successfully. Videos should now generate and download without "API Key invalid" errors.',
    type: 'fix'
  },
  {
    id: 'fix-video-gen-v3',
    date: today,
    title: 'Video Download Stability Fix',
    description: 'Fixed a critical issue where video generation would fail to download the file or result in an unplayable video. We improved the download mechanism to ensure you always get your content.',
    type: 'fix'
  },
  {
    id: 'fix-video-gen-v2',
    date: today,
    title: 'Video Generation Stability',
    description: 'Improved error handling for video downloads to prevent corrupt file errors when generating with Veo.',
    type: 'fix'
  },
  {
    id: 'feat-api-integration',
    date: today,
    title: 'Full Feature Activation',
    description: 'Great news! Image Generation, Video Generation (Veo), Image Editing, and Document Analysis are now fully connected to the AI engine. You can start creating immediately.',
    type: 'feature'
  },
  {
    id: 'fix-spinner-freeze',
    date: today,
    title: 'Fixed Infinite Loading Screen',
    description: 'Resolved a bug where the application would get stuck on the loading spinner for logged-in users.',
    type: 'fix'
  },
  {
    id: 'fix-browser-load-v4',
    date: today,
    title: 'Chrome & Firefox Loading Fix',
    description: 'Resolved a module conflict preventing the app from loading in some browsers. The experience should be smooth now.',
    type: 'fix'
  },
  {
    id: 'fix-browser-load-v3',
    date: today,
    title: 'Startup Issue Resolved',
    description: 'We fixed a critical configuration issue that prevented the application from loading on Chrome and other browsers. The app is now fully stable.',
    type: 'fix'
  },
  {
    id: 'feat-account-mgmt-v2',
    date: today,
    title: 'Account Management & Settings',
    description: 'You now have more control! We added a dedicated Account tab in Settings where you can view your plan details, upgrade your subscription easily, update your password, and manage your account data.',
    type: 'feature'
  },
  {
    id: 'feat-001',
    date: today,
    title: 'Social Butterfly-AI 3.0 Launch',
    description: 'Welcome to the new version! We have introduced the Creative AI Studio, allowing you to generate images, edit visuals, and analyze documents directly within the app.',
    type: 'feature'
  }
];