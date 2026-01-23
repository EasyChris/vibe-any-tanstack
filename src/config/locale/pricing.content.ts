import { type Dictionary, t } from "intlayer"

export default {
  key: "pricing",
  content: {
    title: t({ en: "Choose Your Plan", zh: "选择你的计划" }),
    subtitle: t({
      en: "Select the perfect plan for your AI-powered journey",
      zh: "选择适合你的 AI 之旅的完美计划",
    }),
    loginRequired: t({
      en: "Please login first before purchasing",
      zh: "请先登录后再购买",
    }),
    paymentFailed: t({
      en: "Payment processing failed, please try again",
      zh: "支付处理失败，请重试",
    }),
    processing: t({ en: "Processing...", zh: "处理中..." }),
    loading: t({ en: "Loading...", zh: "加载中..." }),
    getStarted: t({ en: "Get Started", zh: "立即开始" }),
    currentPlan: t({ en: "Current Plan", zh: "当前计划" }),
    upgradePlan: t({ en: "Upgrade", zh: "升级" }),
    downgradePlan: t({ en: "Downgrade Not Supported", zh: "不支持降级" }),
    upgradeFailed: t({ en: "Upgrade failed, please try again", zh: "升级失败，请重试" }),
    popular: t({ en: "Popular", zh: "热门" }),
    free: t({ en: "Free", zh: "免费" }),
    once: t({ en: "once", zh: "一次性" }),
    lifetime: t({ en: "lifetime", zh: "终身" }),
    save20: t({ en: "Save 20%", zh: "省 20%" }),
    month: t({ en: "month", zh: "月" }),
    year: t({ en: "year", zh: "年" }),
    plans: {
      free: {
        title: t({ en: "Free", zh: "免费版" }),
        description: t({
          en: "Perfect for getting started with basic AI features",
          zh: "非常适合开始使用基础 AI 功能",
        }),
        price: "$0",
        popular: false,
        features: [
          t({ en: "Up to 10 AI conversations per month", zh: "每月最多 10 次 AI 对话" }),
          t({ en: "Basic text generation", zh: "基础文本生成" }),
          t({ en: "Community support", zh: "社区支持" }),
          t({ en: "Access to free models", zh: "访问免费模型" }),
        ],
        buttonText: t({ en: "Get Started", zh: "立即开始" }),
        buttonHref: "/signup",
      },
      pro: {
        title: t({ en: "Pro", zh: "专业版" }),
        description: t({
          en: "Best for professionals and growing businesses",
          zh: "最适合专业人士和成长中的企业",
        }),
        price: "$29",
        originalPrice: "$49",
        popular: true,
        features: [
          t({ en: "Unlimited AI conversations", zh: "无限 AI 对话" }),
          t({ en: "Advanced text and image generation", zh: "高级文本和图像生成" }),
          t({ en: "Priority support", zh: "优先支持" }),
          t({ en: "Access to premium models", zh: "访问高级模型" }),
          t({ en: "API access and integrations", zh: "API 访问和集成" }),
        ],
        buttonText: t({ en: "Start Pro Trial", zh: "开始专业版试用" }),
        buttonHref: "/upgrade",
      },
      lifetime: {
        title: t({ en: "Lifetime", zh: "终身版" }),
        description: t({
          en: "One-time payment for unlimited access forever",
          zh: "一次性付款，永久无限访问",
        }),
        price: "$299",
        originalPrice: "$999",
        popular: false,
        features: [
          t({ en: "Everything in Pro plan", zh: "专业版的所有功能" }),
          t({ en: "Lifetime updates and new features", zh: "终身更新和新功能" }),
          t({ en: "Premium customer support", zh: "高级客户支持" }),
          t({ en: "Early access to beta features", zh: "抢先体验测试版功能" }),
          t({ en: "Custom integrations", zh: "自定义集成" }),
          t({ en: "Dedicated account manager", zh: "专属客户经理" }),
          t({ en: "White-label options", zh: "白标选项" }),
        ],
        buttonText: t({ en: "Buy Lifetime", zh: "购买终身版" }),
        buttonHref: "/purchase",
      },
    },
  },
} satisfies Dictionary
