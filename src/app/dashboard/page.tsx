import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">MA WORK JP Portal Dashboard</h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" />
              <path d="M12 16v-4l1-1" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">123</div>
            <p className="text-xs text-muted-foreground">100% of target</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-4a4 4 0 0 0-8 0v4" />
              <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">456</div>
            <p className="text-xs text-muted-foreground">150 new employees this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Renewals in 3 Months</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M20 10c0 4.42-3.4 8-8 8s-8-3.58-8-8 3.4-8 8-8" />
              <path d="M12 14c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Z" />
              <path d="M15 11h1" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78</div>
            <p className="text-xs text-muted-foreground">Visas & Contracts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M18 8h-1.294c-.503 0-1.445.43-2.106 1.088L12 13.826a2.476 2.476 0 0 0-1.602 2.345L10.5 21" />
              <path d="M14 21h-4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1Z" />
              <path d="M7.304 13.088C7.96 12.43 8.903 12 9.406 12H17" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Expiring soon</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Renewals</CardTitle>
            <Separator className="my-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src="https://picsum.photos/seed/apple/50/50" />
                <AvatarFallback>AA</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">John Appleseed</p>
                <p className="text-sm text-muted-foreground">Visa expiring in 2 months</p>
              </div>
              <Button variant="outline" size="sm">View Details</Button>
            </div>
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src="https://picsum.photos/seed/banana/50/50" />
                <AvatarFallback>BB</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">Jane Bananas</p>
                <p className="text-sm text-muted-foreground">Contract ending in 1 month</p>
              </div>
              <Button variant="outline" size="sm">View Details</Button>
            </div>
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src="https://picsum.photos/seed/cherry/50/50" />
                <AvatarFallback>CC</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">Peter Cherries</p>
                <p className="text-sm text-muted-foreground">Visa expiring in 1 month</p>
              </div>
              <Button variant="outline" size="sm">View Details</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alerts</CardTitle>
            <Separator className="my-2" />
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center justify-between">
                <span className="text-sm">Visa expiring soon for John Appleseed</span>
                <Button variant="destructive" size="sm">Dismiss</Button>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-sm">Contract renewal for Jane Bananas</span>
                <Button variant="destructive" size="sm">Dismiss</Button>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-sm">Visa expiring soon for Peter Cherries</span>
                <Button variant="destructive" size="sm">Dismiss</Button>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
            <Separator className="my-2" />
          </CardHeader>
          <CardContent>
            <Calendar />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Company Quick Access</CardTitle>
            <Separator className="my-2" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <Button className="w-full justify-start" variant="outline">
                <Avatar className="mr-2 h-6 w-6">
                  <AvatarImage src="https://picsum.photos/seed/company1/50/50" />
                  <AvatarFallback>C1</AvatarFallback>
                </Avatar>
                Company A
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Avatar className="mr-2 h-6 w-6">
                  <AvatarImage src="https://picsum.photos/seed/company2/50/50" />
                  <AvatarFallback>C2</AvatarFallback>
                </Avatar>
                Company B
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Avatar className="mr-2 h-6 w-6">
                  <AvatarImage src="https://picsum.photos/seed/company3/50/50" />
                  <AvatarFallback>C3</AvatarFallback>
                </Avatar>
                Company C
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
