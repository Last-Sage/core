"use client";

import { useState } from "react";
import { Navbar, Sidebar } from "@/components/layout";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Input, SearchInput, Badge, Progress } from "@/components/ui";
import { Plus, ArrowRight, Zap, Shield, Sparkles } from "lucide-react";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar 
        title="NIXITO" 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        isMenuOpen={sidebarOpen}
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Content */}
      <main className="pt-16 lg:pl-64">
        <div className="container page">
          {/* Hero Section */}
          <section className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
            <Badge variant="warning" className="mb-4">✨ PWA Ready</Badge>
            <h1 className="h1 mb-4">Welcome to NIXITO</h1>
            <p className="body-lg text-[var(--color-text-secondary)] mb-8">
              A warm minimalist design system with amber accents, 
              glassmorphism effects, and pill-shaped components.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="primary" icon={Sparkles}>
                Get Started
              </Button>
              <Button variant="tertiary" icon={ArrowRight} iconPosition="right">
                Learn More
              </Button>
            </div>
          </section>

          {/* Search */}
          <section className="max-w-xl mx-auto mb-12">
            <SearchInput placeholder="Search components, docs, resources..." />
          </section>

          {/* Feature Cards */}
          <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-10)] flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-[var(--color-primary-hover)]" />
                </div>
                <CardTitle>Lightning Fast</CardTitle>
                <CardDescription>
                  Built with Next.js 15 and optimized for Core Web Vitals.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={92} />
                <p className="micro text-[var(--color-text-muted)] mt-2">Performance Score: 92/100</p>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-[var(--color-dark)] flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Secure by Default</CardTitle>
                <CardDescription>
                  Supabase backend with Row Level Security enabled.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="success">Auth</Badge>
                  <Badge variant="success">RLS</Badge>
                  <Badge variant="info">TypeScript</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-[var(--color-dark)]" />
                </div>
                <CardTitle>Beautiful UI</CardTitle>
                <CardDescription>
                  Warm minimalist design with Lucide icons and smooth animations.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant="secondary" size="sm">
                  View Components
                </Button>
              </CardFooter>
            </Card>
          </section>

          {/* Form Demo */}
          <section className="max-w-lg mx-auto">
            <Card padding="lg">
              <CardHeader>
                <CardTitle>Quick Demo</CardTitle>
                <CardDescription>Try out the NIXITO form components</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input label="Email" type="email" placeholder="you@example.com" />
                  <Input label="Password" type="password" placeholder="••••••••" />
                  <Button variant="primary" className="w-full" icon={Plus}>
                    Create Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}
