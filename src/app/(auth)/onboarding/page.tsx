'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Building2,
  Settings,
  ArrowRight,
  ArrowLeft,
  Check,
  Upload,
  Phone,
  MapPin,
} from 'lucide-react';
import { Button, Input, Card, CardContent, Select, Textarea } from '@/components/ui';
import { cn } from '@/lib/utils';

const steps = [
  { id: 1, title: 'Profile', description: 'Complete your profile', icon: User },
  { id: 2, title: 'Listings', description: 'Add your first property', icon: Building2 },
  { id: 3, title: 'Preferences', description: 'Configure settings', icon: Settings },
];

const stateOptions = [
  { value: 'TX', label: 'Texas' },
  { value: 'CA', label: 'California' },
  { value: 'FL', label: 'Florida' },
  { value: 'NY', label: 'New York' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'NV', label: 'Nevada' },
  { value: 'CO', label: 'Colorado' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'GA', label: 'Georgia' },
  { value: 'WA', label: 'Washington' },
];

const propertyTypeOptions = [
  { value: 'single_family', label: 'Single Family Home' },
  { value: 'condo', label: 'Condo / Townhouse' },
  { value: 'multi_family', label: 'Multi-Family' },
  { value: 'land', label: 'Land / Lot' },
  { value: 'commercial', label: 'Commercial' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Profile data
  const [profile, setProfile] = useState({
    phone: '',
    licenseNumber: '',
    bio: '',
    photo: null as File | null,
  });

  // Property data
  const [property, setProperty] = useState({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    propertyType: '',
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    price: '',
  });

  // Preferences data
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    dailyDigest: true,
    leadAlerts: true,
    timezone: 'America/Chicago',
  });

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handlePropertyChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setProperty((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Onboarding error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  return (
    <div className="w-full max-w-2xl">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
                    currentStep >= step.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 text-neutral-400'
                  )}
                >
                  {currentStep > step.id ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-6 h-6" />
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      currentStep >= step.id ? 'text-neutral-900' : 'text-neutral-400'
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-neutral-500 hidden sm:block">
                    {step.description}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-4',
                    currentStep > step.id ? 'bg-primary-600' : 'bg-neutral-200'
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-8">
          {/* Step 1: Profile */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">
                  Complete Your Profile
                </h2>
                <p className="mt-1 text-neutral-600">
                  Add some details to help buyers and colleagues find you.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center">
                  <User className="w-8 h-8 text-neutral-400" />
                </div>
                <Button variant="outline" size="sm" leftIcon={<Upload className="w-4 h-4" />}>
                  Upload Photo
                </Button>
              </div>

              <Input
                name="phone"
                label="Phone Number"
                placeholder="(512) 555-1234"
                value={profile.phone}
                onChange={handleProfileChange}
                leftIcon={<Phone className="w-4 h-4" />}
              />

              <Input
                name="licenseNumber"
                label="Real Estate License # (optional)"
                placeholder="0123456789"
                value={profile.licenseNumber}
                onChange={handleProfileChange}
              />

              <Textarea
                name="bio"
                label="Short Bio (optional)"
                placeholder="Tell us a bit about yourself and your experience..."
                value={profile.bio}
                onChange={handleProfileChange}
                rows={3}
              />
            </div>
          )}

          {/* Step 2: First Property */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">
                  Add Your First Property
                </h2>
                <p className="mt-1 text-neutral-600">
                  Get started by adding a listing. You can skip this and add later.
                </p>
              </div>

              <Input
                name="address"
                label="Street Address"
                placeholder="123 Main Street"
                value={property.address}
                onChange={handlePropertyChange}
                leftIcon={<MapPin className="w-4 h-4" />}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  name="city"
                  label="City"
                  placeholder="Austin"
                  value={property.city}
                  onChange={handlePropertyChange}
                />
                <Select
                  name="state"
                  label="State"
                  placeholder="Select state"
                  options={stateOptions}
                  value={property.state}
                  onChange={handlePropertyChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  name="zipCode"
                  label="ZIP Code"
                  placeholder="78704"
                  value={property.zipCode}
                  onChange={handlePropertyChange}
                />
                <Select
                  name="propertyType"
                  label="Property Type"
                  placeholder="Select type"
                  options={propertyTypeOptions}
                  value={property.propertyType}
                  onChange={handlePropertyChange}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input
                  name="bedrooms"
                  label="Beds"
                  type="number"
                  placeholder="3"
                  value={property.bedrooms}
                  onChange={handlePropertyChange}
                />
                <Input
                  name="bathrooms"
                  label="Baths"
                  type="number"
                  placeholder="2"
                  value={property.bathrooms}
                  onChange={handlePropertyChange}
                />
                <Input
                  name="sqft"
                  label="Sq Ft"
                  type="number"
                  placeholder="1,500"
                  value={property.sqft}
                  onChange={handlePropertyChange}
                />
              </div>

              <Input
                name="price"
                label="Listing Price"
                placeholder="$450,000"
                value={property.price}
                onChange={handlePropertyChange}
              />
            </div>
          )}

          {/* Step 3: Preferences */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">
                  Configure Your Preferences
                </h2>
                <p className="mt-1 text-neutral-600">
                  Set up notifications and other preferences.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-neutral-900">Notifications</h3>

                <label className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 cursor-pointer hover:bg-neutral-50">
                  <div>
                    <p className="font-medium text-neutral-900">Email Notifications</p>
                    <p className="text-sm text-neutral-500">
                      Receive updates about new leads and activity
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.emailNotifications}
                    onChange={(e) =>
                      setPreferences((prev) => ({
                        ...prev,
                        emailNotifications: e.target.checked,
                      }))
                    }
                    className="w-5 h-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 cursor-pointer hover:bg-neutral-50">
                  <div>
                    <p className="font-medium text-neutral-900">SMS Notifications</p>
                    <p className="text-sm text-neutral-500">
                      Get text alerts for urgent items
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.smsNotifications}
                    onChange={(e) =>
                      setPreferences((prev) => ({
                        ...prev,
                        smsNotifications: e.target.checked,
                      }))
                    }
                    className="w-5 h-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 cursor-pointer hover:bg-neutral-50">
                  <div>
                    <p className="font-medium text-neutral-900">Daily Digest</p>
                    <p className="text-sm text-neutral-500">
                      Receive a daily summary of activity
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.dailyDigest}
                    onChange={(e) =>
                      setPreferences((prev) => ({
                        ...prev,
                        dailyDigest: e.target.checked,
                      }))
                    }
                    className="w-5 h-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 cursor-pointer hover:bg-neutral-50">
                  <div>
                    <p className="font-medium text-neutral-900">New Lead Alerts</p>
                    <p className="text-sm text-neutral-500">
                      Instant notifications when new leads come in
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.leadAlerts}
                    onChange={(e) =>
                      setPreferences((prev) => ({
                        ...prev,
                        leadAlerts: e.target.checked,
                      }))
                    }
                    className="w-5 h-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between pt-6 border-t border-neutral-200">
            <div>
              {currentStep > 1 ? (
                <Button variant="outline" onClick={handleBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Back
                </Button>
              ) : (
                <Button variant="ghost" onClick={handleSkip}>
                  Skip for now
                </Button>
              )}
            </div>
            <div>
              {currentStep < 3 ? (
                <Button onClick={handleNext} rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Continue
                </Button>
              ) : (
                <Button onClick={handleComplete} isLoading={isLoading}>
                  Complete Setup
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
