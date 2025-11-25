
/**
 * ============================================================================
 * STRIPE CONFIGURATION
 * ============================================================================
 *
 * This file contains all Stripe Payment Links for the application.
 *
 * IMPORTANT:
 * 1. Replace the placeholder URLs below with your actual Stripe Payment Links.
 * 2. In your Stripe Dashboard, for EACH Payment Link, go to "After payment" settings,
 *    select "Don't show confirmation page", and set the redirect to your app's URL
 *    with specific query parameters. This is CRITICAL.
 *
 *    FORMAT:
 *    https://your-app-url.com/?payment=success&plan=[PLAN_ID]&billing=[BILLING_CYCLE]
 *
 *    NOTE: You MUST include the "https://" prefix. If you are unsure of the exact
 *    URL to use, the subscription modal in the app contains a "Developer Tip"
 *    section that will generate the correct URL for you to copy.
 *
 *    [PLAN_ID] can be: 'plus', 'pro', 'ultra', 'team', 'business'
 *    [BILLING_CYCLE] can be: 'monthly', 'annual'
 *
 *    EXAMPLES:
 *    - Pro Monthly:   https://your-app-url.com/?payment=success&plan=pro&billing=monthly
 *    - Ultra Annual:  https://your-app-url.com/?payment=success&plan=ultra&billing=annual
 *
 * This setup allows for a secure, no-backend payment integration.
 */

import { PlanID } from './plans';

type StripeConfig = {
    [key in PlanID]: {
        monthly: string;
        annual: string;
    }
}

export const STRIPE_PAYMENT_LINKS: StripeConfig = {
    // Free Plan - placeholder as it is usually not purchased via link
    free: {
        monthly: '',
        annual: '',
    },
    // Individual Plans
    plus: {
        monthly: 'https://buy.stripe.com/28E6oH2SVbRx7IEbnEfjG02',
        annual: 'https://buy.stripe.com/14AeVd9hj3l13so1N4fjG03',
    },
    pro: {
        monthly: 'https://buy.stripe.com/00wbJ1ctv6xdaUQ1N4fjG04',
        annual: 'https://buy.stripe.com/eVq9AT2SVf3J1kg8bsfjG05',
    },
    ultra: {
        monthly: 'https://buy.stripe.com/00wcN58dfcVBfb6ajAfjG06',
        annual: 'https://buy.stripe.com/eVqeVd0KN8FlaUQ77ofjG07',
    },
    // Team Plans
    team: {
        monthly: 'https://buy.stripe.com/aFa28rgJL5t96EA8bsfjG08',
        annual: 'https://buy.stripe.com/aFa3cv513cVB4ws1N4fjG09',
    },
    business: {
        monthly: 'https://buy.stripe.com/14A28r79b4p55Aw3VcfjG0a',
        annual: 'https://buy.stripe.com/8x29AT9hjaNt1kg77ofjG0b',
    },
};


// --- Credit Top-Up Links (One-Time Purchases) ---

// Placeholder for buying 500 credits
export const STRIPE_TOP_UP_500_CREDITS = 'https://buy.stripe.com/dRmfZh1OR4p5gfacrIfjG0c';
