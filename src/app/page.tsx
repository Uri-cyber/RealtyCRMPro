import Link from 'next/link';
import {
  Home,
  Users,
  BarChart3,
  Calendar,
  MessageSquare,
  Building2,
  ArrowRight,
  Check,
  Star,
} from 'lucide-react';

const features = [
  {
    icon: Building2,
    title: 'Property Management',
    description: 'Add, edit, and manage all your listings in one place with MLS integration.',
  },
  {
    icon: Users,
    title: 'Lead Pipeline',
    description: 'Track buyer leads through your sales pipeline with AI-powered scoring.',
  },
  {
    icon: Calendar,
    title: 'Showing Calendar',
    description: 'Schedule and manage property showings with automated reminders.',
  },
  {
    icon: MessageSquare,
    title: 'Communication Hub',
    description: 'Send emails and SMS to leads with pre-built automation templates.',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    description: 'Track conversion rates, lead sources, and agent performance.',
  },
];

const pricingPlans = [
  {
    name: 'Starter',
    price: '$99',
    period: '/month',
    description: 'Perfect for solo sellers and new agents',
    features: [
      '1 user',
      'Up to 25 listings',
      'Basic automation',
      'Email support',
      'Lead capture forms',
    ],
  },
  {
    name: 'Pro',
    price: '$299',
    period: '/month',
    description: 'For growing teams and brokerages',
    features: [
      '5 users',
      'Unlimited listings',
      'Advanced automation',
      'Priority support',
      'AI lead scoring',
      'MLS integration',
      'Custom reports',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$999',
    period: '/month',
    description: 'For large brokerages with custom needs',
    features: [
      'Unlimited users',
      'Unlimited everything',
      'White-label option',
      'Dedicated account manager',
      'API access',
      'Custom integrations',
      'SLA guarantee',
    ],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-neutral-900">RealtyCRM Pro</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-neutral-600 hover:text-neutral-900">
                Features
              </a>
              <a href="#pricing" className="text-sm text-neutral-600 hover:text-neutral-900">
                Pricing
              </a>
              <a href="#testimonials" className="text-sm text-neutral-600 hover:text-neutral-900">
                Testimonials
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="btn-primary text-sm"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-white -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
              <Star className="w-4 h-4 fill-current" />
              #1 CRM for Real Estate Sellers
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 tracking-tight">
              Close More Deals with{' '}
              <span className="text-primary-600">AI-Powered</span> Lead Management
            </h1>
            <p className="mt-6 text-lg text-neutral-600 max-w-2xl mx-auto">
              RealtyCRM Pro helps real estate sellers and agents manage properties,
              capture leads, automate follow-ups, and close deals faster than ever.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="btn-primary btn-lg w-full sm:w-auto"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                href="/demo"
                className="btn-outline btn-lg w-full sm:w-auto"
              >
                Watch Demo
              </Link>
            </div>
            <p className="mt-4 text-sm text-neutral-500">
              No credit card required. 14-day free trial.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-neutral-900">
              Everything You Need to Succeed
            </h2>
            <p className="mt-4 text-lg text-neutral-600 max-w-2xl mx-auto">
              Powerful features designed specifically for real estate professionals
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow"
              >
                <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-neutral-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white">10,000+</div>
              <div className="mt-2 text-primary-100">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white">$2.5B+</div>
              <div className="mt-2 text-primary-100">Properties Managed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white">35%</div>
              <div className="mt-2 text-primary-100">Faster Closings</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white">98%</div>
              <div className="mt-2 text-primary-100">Customer Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-neutral-900">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-lg text-neutral-600 max-w-2xl mx-auto">
              Choose the plan that fits your business
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-xl p-8 shadow-card ${
                  plan.popular ? 'ring-2 ring-primary-600' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="badge-primary">Most Popular</span>
                  </div>
                )}
                <h3 className="text-xl font-semibold text-neutral-900">{plan.name}</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-bold text-neutral-900">{plan.price}</span>
                  <span className="text-neutral-500 ml-1">{plan.period}</span>
                </div>
                <p className="mt-2 text-sm text-neutral-600">{plan.description}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-neutral-600">
                      <Check className="w-4 h-4 text-success-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`mt-8 w-full ${
                    plan.popular ? 'btn-primary' : 'btn-outline'
                  } justify-center`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-neutral-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to Transform Your Real Estate Business?
          </h2>
          <p className="mt-4 text-lg text-neutral-400">
            Join thousands of agents who are closing more deals with RealtyCRM Pro.
          </p>
          <div className="mt-8">
            <Link href="/signup" className="btn-primary btn-lg">
              Start Your Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">RealtyCRM Pro</span>
              </div>
              <p className="mt-4 text-sm text-neutral-400">
                The AI-powered CRM built for real estate success.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-sm text-neutral-400 hover:text-white">Features</a></li>
                <li><a href="#pricing" className="text-sm text-neutral-400 hover:text-white">Pricing</a></li>
                <li><a href="#" className="text-sm text-neutral-400 hover:text-white">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-neutral-400 hover:text-white">About</a></li>
                <li><a href="#" className="text-sm text-neutral-400 hover:text-white">Blog</a></li>
                <li><a href="#" className="text-sm text-neutral-400 hover:text-white">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-neutral-400 hover:text-white">Help Center</a></li>
                <li><a href="#" className="text-sm text-neutral-400 hover:text-white">Contact</a></li>
                <li><a href="#" className="text-sm text-neutral-400 hover:text-white">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-neutral-800 text-center text-sm text-neutral-400">
            © {new Date().getFullYear()} RealtyCRM Pro. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
