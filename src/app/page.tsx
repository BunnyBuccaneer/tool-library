import Link from "next/link";
import { db } from "@/db";
import { tools, reservations, users } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { TopNav } from "@/components/layout/top-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wrench, Users, MapPin, Shield, Search, Calendar, Hammer } from "lucide-react";

export const dynamic = "force-dynamic";

const features = [
  {
    icon: Wrench,
    title: "Thousands of Tools",
    description:
      "From power drills to table saws, access professional-grade tools for any project.",
  },
  {
    icon: MapPin,
    title: "Multiple Locations",
    description:
      "Pick up and return tools at the location most convenient for you.",
  },
  {
    icon: Users,
    title: "Community Driven",
    description:
      "Join thousands of members saving money and reducing waste through sharing.",
  },
  {
    icon: Shield,
    title: "Fully Insured",
    description:
      "Every rental is covered. Borrow with confidence knowing you are protected.",
  },
];

const howItWorks = [
  {
    icon: Search,
    title: "1. Find a Tool",
    description: "Browse our catalog of power tools, hand tools, and garden equipment.",
    color: "text-blue-600 bg-blue-100",
  },
  {
    icon: Calendar,
    title: "2. Reserve It",
    description: "Pick your dates, schedule a pickup time, and the tool is yours.",
    color: "text-green-600 bg-green-100",
  },
  {
    icon: Hammer,
    title: "3. Build & Return",
    description: "Complete your project and return the tool for others to use.",
    color: "text-purple-600 bg-purple-100",
  },
];

export default async function HomePage() {
  let stats = { tools: 0, members: 0, reservations: 0 };

  try {
    const [toolCount, memberCount, resCount] = await Promise.all([
      db.select({ count: count() }).from(tools).where(eq(tools.isActive, true)),
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(reservations),
    ]);

    stats = {
      tools: toolCount[0]?.count ?? 0,
      members: memberCount[0]?.count ?? 0,
      reservations: resCount[0]?.count ?? 0,
    };
  } catch {
    // Tables may not exist yet — leave stats at 0
  }

  return (
    <div className="min-h-screen">
      <TopNav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Borrow the tools you need.{" "}
              <span className="text-blue-200">Skip the cost.</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-blue-100">
              Access thousands of professional-grade tools with a simple
              membership. Save money, reduce waste, and build anything you
              imagine.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button
  size="lg"
  className="bg-white shadow-lg hover:bg-blue-50"
  asChild
>
  <Link href="/tools" className="!text-blue-700 font-semibold">
    Browse Tools
  </Link>
</Button>
<Button
  size="lg"
  variant="outline"
  className="border-2 border-white bg-transparent hover:bg-white/10"
  asChild
>
  <Link href="/auth/register" className="!text-white font-semibold">
    Become a Member
  </Link>
</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Live Stats */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="text-center border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-600">
                {stats.tools.toLocaleString()}
              </div>
              <div className="mt-1 text-sm text-gray-500">Tools Available</div>
            </CardContent>
          </Card>
          <Card className="text-center border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600">
                {stats.members.toLocaleString()}
              </div>
              <div className="mt-1 text-sm text-gray-500">Active Members</div>
            </CardContent>
          </Card>
          <Card className="text-center border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-purple-600">
                {stats.reservations.toLocaleString()}
              </div>
              <div className="mt-1 text-sm text-gray-500">Total Reservations</div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Why join the Tool Library?
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Everything you need for your next project, without the commitment of
            buying.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="text-center border-0 shadow-md hover:shadow-lg transition-shadow"
              >
                <CardContent className="pt-6">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Three simple steps to your next project.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {howItWorks.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="text-center">
                  <div
                    className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${step.color}`}
                  >
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 max-w-xs mx-auto">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to start building?
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            Join today and get access to our full tool inventory.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/auth/register">Get Started</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600 text-white font-bold text-xs">
                TL
              </div>
              <span className="text-sm font-medium text-gray-600">
                Tool Library
              </span>
            </div>
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} Tool Library. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}