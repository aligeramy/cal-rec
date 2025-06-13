import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Users,
  Calendar
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Fetch real transcript statistics
  const [
    totalTranscripts,
    statusCounts,
    recentTranscripts,
    totalDuration,
    thisWeekCount
  ] = await Promise.all([
    // Total transcripts count
    prisma.meetingTranscript.count(),
    
    // Count by status
    prisma.meetingTranscript.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    }),
    
    // Recent transcripts (last 10)
    prisma.meetingTranscript.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        status: true,
        clientName: true,
        duration: true,
        createdAt: true,
        startTime: true
      }
    }),
    
    // Total duration of all completed transcripts
    prisma.meetingTranscript.aggregate({
      where: {
        status: 'completed',
        duration: { not: null }
      },
      _sum: {
        duration: true
      }
    }),
    
    // Transcripts created this week
    prisma.meetingTranscript.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 7))
        }
      }
    })
  ]);

  // Process status counts into a more usable format
  const counts = statusCounts.reduce((acc, curr) => {
    acc[curr.status] = curr._count.status;
    return acc;
  }, {} as Record<string, number>);

  const completedCount = counts['completed'] || 0;
  const processingCount = counts['processing'] || 0;
  const pendingCount = counts['pending'] || 0;

  const totalMinutes = totalDuration._sum.duration || 0;
  const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Link 
          href="/dashboard/transcripts" 
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <FileText className="h-4 w-4 mr-2" />
          View All Transcripts
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Transcripts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transcripts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTranscripts}</div>
            <p className="text-xs text-muted-foreground">
              {thisWeekCount} created this week
            </p>
          </CardContent>
        </Card>

        {/* Completed Transcripts */}
        <Card className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800 dark:text-green-200">{completedCount}</div>
            <p className="text-xs text-green-600 dark:text-green-400">
              {totalTranscripts > 0 ? Math.round((completedCount / totalTranscripts) * 100) : 0}% success rate
            </p>
          </CardContent>
        </Card>

        {/* Processing Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processingCount + pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              {processingCount} processing, {pendingCount} pending
            </p>
          </CardContent>
        </Card>

        {/* Total Hours */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours}h</div>
            <p className="text-xs text-muted-foreground">
              From {completedCount} completed meetings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transcripts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Transcripts
          </CardTitle>
          <CardDescription>
            Your latest meeting transcriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentTranscripts.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No transcripts yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by creating your first meeting transcript
              </p>
              <Link 
                href="/dashboard/transcripts" 
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
              >
                Get Started
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTranscripts.map((transcript) => (
                <div 
                  key={transcript.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {transcript.status === 'completed' && (
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      )}
                      {transcript.status === 'processing' && (
                        <Clock className="h-5 w-5 text-blue-600 animate-pulse" />
                      )}
                      {transcript.status === 'failed' && (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      {transcript.status === 'pending' && (
                        <Clock className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-secondary truncate">
                        {transcript.title || 'Untitled Meeting'}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        {transcript.clientName && (
                          <>
                            <Users className="h-3 w-3" />
                            <span>{transcript.clientName}</span>
                          </>
                        )}
                        {transcript.duration && (
                          <>
                            <Clock className="h-3 w-3" />
                            <span>{transcript.duration} min</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{formatDate(transcript.startTime || transcript.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={
                        transcript.status === 'completed' ? 'outline' :
                        transcript.status === 'processing' ? 'secondary' :
                        transcript.status === 'failed' ? 'destructive' : 'outline'
                      }
                      className={
                        transcript.status === 'completed' 
                          ? 'bg-green-50 text-green-800 border-green-200 hover:bg-green-100 dark:bg-green-950 dark:text-green-200 dark:border-green-800 dark:hover:bg-green-900' 
                          : ''
                      }
                    >
                      {transcript.status.charAt(0).toUpperCase() + transcript.status.slice(1)}
                    </Badge>
                    <Link 
                      href={`/dashboard/transcripts/${transcript.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
              
              {recentTranscripts.length >= 10 && (
                <div className="text-center pt-4">
                  <Link 
                    href="/dashboard/transcripts"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View all transcripts →
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and helpful links
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              href="/dashboard/transcripts" 
              className="flex items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h3 className="font-medium">View All Transcripts</h3>
                <p className="text-sm text-muted-foreground">Browse and manage transcripts</p>
              </div>
            </Link>
            
            <Link 
              href="/dashboard/transcripts?status=processing" 
              className="flex items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Clock className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <h3 className="font-medium">Processing Queue</h3>
                <p className="text-sm text-muted-foreground">Check processing status</p>
              </div>
            </Link>
            
            <Link 
              href="/dashboard/transcripts?status=failed" 
              className="flex items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <XCircle className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <h3 className="font-medium">Failed Transcripts</h3>
                <p className="text-sm text-muted-foreground">Review and retry failed items</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
