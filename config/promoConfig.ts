/**
 * Active promotional banner config.
 * Set to null to disable the banner entirely.
 * Update this file to run future promotions — no need to touch LandingPage.
 */

export type PromoConfig = {
  /** Main message shown in the banner */
  message: string;
  /** Discount/promo code to display prominently */
  code: string;
  /** CTA label */
  ctaLabel: string;
  /** CTA link */
  ctaHref: string;
  /** Percentage discount to show on pricing cards (e.g. 40 for 40% off) */
  discountPercent?: number;
};

const activePromo: PromoConfig | null = {
  message: 'Good Friday Sale — get 40% off any plan.',
  code: 'GOODFRIDAY40',
  ctaLabel: 'Get the deal',
  ctaHref: '#pricing',
  discountPercent: 40,
};

export default activePromo;
