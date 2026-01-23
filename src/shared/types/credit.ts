export enum CreditsType {
  // add
  ADD_FIRST_REGISTRATION = "add_first_registration", // initial credits for first registration
  ADD_SUBSCRIPTION_PAYMENT = "add_subscription_payment", // user pay for credits
  ADD_ONE_TIME_PAYMENT = "add_one_time_payment", // user pay for credits
  ADD_DAILY_BONUS = "add_daily_bonus", // daily bonus credits
  ADD_ADMIN = "add_admin", // admin add credits
  ADD_REFUND = "add_refund", // refund credits
  // deduct
  DEDUCT_AI_USE = "deduct_ai_use", // user use ai (legacy)
  DEDUCT_AI_TEXT = "ai_text", // AI text generation
  DEDUCT_AI_IMAGE = "ai_image", // AI image generation
  DEDUCT_AI_SPEECH = "ai_speech", // AI speech synthesis
  DEDUCT_AI_VIDEO = "ai_video", // AI video generation
  DEDUCT_EXPIRED = "deduct_expired", // user's credit expired
}
