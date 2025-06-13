import { auth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Mic, 
  Users, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  Sparkles,
  Mail,
  BarChart3
} from "lucide-react";

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="border-b border-slate-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                NotionIQ
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              {session ? (
                <Link href="/dashboard">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-8">
            <Sparkles className="h-4 w-4 mr-2" />
            Intelligent Meeting Transcription
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
            Transform Your
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {" "}Meetings{" "}
            </span>
            Into Action
          </h1>
          
          <p className="text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Automatically transcribe, organize, and share your meeting conversations with professional-grade accuracy. 
            Turn discussions into actionable insights with NotionIQ&apos;s intelligent transcription platform.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            {session ? (
              <Link href="/dashboard">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8 py-3 text-lg">
                  Open Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signup">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8 py-3 text-lg">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="px-8 py-3 text-lg border-slate-300 hover:border-slate-400">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need for
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {" "}Smart Meetings
              </span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Professional transcription tools that integrate seamlessly with your workflow
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <Mic className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Real-time Transcription</h3>
              <p className="text-slate-600">
                Capture every word with industry-leading accuracy. Automatic speaker identification and timestamp tracking.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-100">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center mb-6">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Professional Notes</h3>
              <p className="text-slate-600">
                Generate structured meeting notes, action items, and summaries automatically from your conversations.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Team Collaboration</h3>
              <p className="text-slate-600">
                Share transcripts, edit content collaboratively, and manage meeting records across your organization.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 border border-orange-100">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl flex items-center justify-center mb-6">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Smart Distribution</h3>
              <p className="text-slate-600">
                Automatically send professional PDF transcripts to clients and team members with customizable templates.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-8 border border-cyan-100">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Time Management</h3>
              <p className="text-slate-600">
                Track meeting duration, edit timestamps, and organize conversations with powerful filtering and search.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-8 border border-violet-100">
              <div className="w-12 h-12 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Analytics & Insights</h3>
              <p className="text-slate-600">
                Gain valuable insights from your meeting patterns, participant engagement, and conversation trends.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Meetings?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join thousands of professionals who trust NotionIQ to capture, organize, and share their most important conversations.
          </p>
          
          {session ? (
            <Link href="/dashboard">
              <Button size="lg" variant="secondary" className="px-8 py-3 text-lg bg-white text-blue-600 hover:bg-blue-50">
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href="/signup">
                <Button size="lg" variant="secondary" className="px-8 py-3 text-lg bg-white text-blue-600 hover:bg-blue-50">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="px-8 py-3 text-lg border-white text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">NotionIQ</span>
            </div>
            
            <div className="flex items-center space-x-6">
              <span className="text-sm">© 2024 NotionIQ. All rights reserved.</span>
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-sm">Secure & Private</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
