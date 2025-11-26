

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
    id: 'announcement-founders-era',
    date: today,
    title: 'Welcome to the Founder\'s Era',
    description: 'Social Butterfly-AI is no longer just a chatbot—it is a Launchpad. With the new MVP Builder (Vibe Coding), you can turn text into functional software prototypes in seconds. We have also introduced the "Founder\'s Roadmap" to guide you through domains, hosting, and scaling. Your empire starts today.',
    type: 'feature'
  },
  {
    id: 'feat-site-architect',
    date: today,
    title: 'New Feature: MVP Builder',
    description: 'Describe your dream tool, dashboard, or app, and I\'ll build the functional prototype right before your eyes. Includes a full code inspector and export options for Founders.',
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
    id: 'fix-profile-persistence',
    date: today,
    title: 'Profile Persistence',
    description: 'Fixed an issue where profile photos and business details might not save correctly. Your profile is now rock solid.',
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
    id: 'feat-account-mgmt-v2',
    date: today,
    title: 'Account Management & Settings',
    description: 'You now have more control! We added a dedicated Account tab in Settings where you can view your plan details, upgrade your subscription easily, update your password, and manage your account data.',
    type: 'feature'
  }
];