import { auth } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  FileText, 
  Mic, 
  Users, 
  Clock, 
  ArrowRight,
  Sparkles,
  Mail,
  BarChart3
} from "lucide-react";

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Image
                src="/logo.svg"
                alt="NotionIQ Logo"
                width={32}
                height={32}
                className="w-8 h-8 dark:filter dark:brightness-0 dark:invert"
              />
              <span className="text-xl font-bold text-primary">
                NotionIQ
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              {session ? (
                <Link href="/dashboard">
                  <Button>
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button>
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        {/* Professional background pattern */}
        <div className="absolute inset-0 -z-10">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          
          {/* Gradient overlays */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>
          
          {/* Subtle geometric shapes */}
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rotate-45 rounded-lg"></div>
          <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 rotate-12 rounded-lg"></div>
          <div className="absolute bottom-1/3 left-1/3 w-20 h-20 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 -rotate-12 rounded-lg"></div>
        </div>
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          {/* Professional accent lines */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-8"></div>
          
          {/* Enhanced badge */}
          <div className="inline-flex items-center px-6 py-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full text-blue-800 dark:text-blue-200 text-sm font-semibold mb-8 border border-blue-200/50 dark:border-blue-800/50 shadow-lg animate-float">
            <Sparkles className="h-4 w-4 mr-2 animate-glow text-blue-600" />
            AI-Powered Meeting Intelligence
          </div>
          
                     {/* Enhanced main heading */}
           <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight">
             <span className="text-slate-900 dark:text-white">Transform Your</span>
             <br />
             <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent animate-gradient">
               Meetings Into Action
             </span>
           </h1>
          
                     {/* Enhanced subtitle */}
           <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed">
             Professional meeting transcription made simple.
           </p>
          
          {/* Enhanced CTA section */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
            {session ? (
              <>
                <Link href="/dashboard">
                  <Button size="default" className="px-10 py-4 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-xl">
                    Open Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
               
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button size="lg" className="px-15 py-6 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-lg">
                    Login to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
    
              </>
            )}
          </div>
          

        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need for
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                {" "}Smart Meetings
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional transcription tools that integrate seamlessly with your workflow
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/20 dark:to-indigo-900/30 rounded-2xl p-8 border border-blue-200 dark:border-blue-800">
              <div className="w-12 h-12 bg-blue-600 dark:bg-blue-500 rounded-xl flex items-center justify-center mb-6">
                <Mic className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Real-time Transcription</h3>
              <p className="text-muted-foreground">
                Capture every word with industry-leading accuracy. Automatic speaker identification and timestamp tracking.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/30 rounded-2xl p-8 border border-emerald-200 dark:border-emerald-800">
              <div className="w-12 h-12 bg-emerald-600 dark:bg-emerald-500 rounded-xl flex items-center justify-center mb-6">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Professional Notes</h3>
              <p className="text-muted-foreground">
                Generate structured meeting notes, action items, and summaries automatically from your conversations.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/30 rounded-2xl p-8 border border-purple-200 dark:border-purple-800">
              <div className="w-12 h-12 bg-purple-600 dark:bg-purple-500 rounded-xl flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Team Collaboration</h3>
              <p className="text-muted-foreground">
                Share transcripts, edit content collaboratively, and manage meeting records across your organization.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/30 rounded-2xl p-8 border border-orange-200 dark:border-orange-800">
              <div className="w-12 h-12 bg-orange-600 dark:bg-orange-500 rounded-xl flex items-center justify-center mb-6">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Smart Distribution</h3>
              <p className="text-muted-foreground">
                Automatically send professional PDF transcripts to clients and team members with customizable templates.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950/20 dark:to-cyan-900/30 rounded-2xl p-8 border border-cyan-200 dark:border-cyan-800">
              <div className="w-12 h-12 bg-cyan-600 dark:bg-cyan-500 rounded-xl flex items-center justify-center mb-6">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Time Management</h3>
              <p className="text-muted-foreground">
                Track meeting duration, edit timestamps, and organize conversations with powerful filtering and search.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950/20 dark:to-violet-900/30 rounded-2xl p-8 border border-violet-200 dark:border-violet-800">
              <div className="w-12 h-12 bg-violet-600 dark:bg-violet-500 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Analytics & Insights</h3>
              <p className="text-muted-foreground">
                Gain valuable insights from your meeting patterns, participant engagement, and conversation trends.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Image
                src="/logo.svg"
                alt="NotionIQ Logo"
                width={32}
                height={32}
                className="w-8 h-8 dark:filter dark:brightness-0 dark:invert"
              />
              <span className="text-xl font-bold text-foreground">NotionIQ</span>
            </div>
            
            <div className="flex items-center space-x-6">
              <ThemeToggle />
              <span className="text-sm text-muted-foreground">© 2025 NotionIQ. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
