import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AuthErrorPage() {
  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <div className="mx-auto rounded-full bg-red-100 p-4">
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <CardTitle className="text-2xl">Authentication Error</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-500">
          There was a problem signing you in. Please try again or contact
          support if the issue persists.
        </p>
      </CardContent>
      <CardFooter className="flex justify-center gap-3">
        <Button variant="outline" asChild>
          <Link href="/">Go Home</Link>
        </Button>
        <Button asChild>
          <Link href="/auth/login">Try Again</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
