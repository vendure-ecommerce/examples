import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/ui-components/ui/card';
import Link from 'next/link';
import { SignInForm } from '@/components/account/sign-in-form';
import { GoogleSignInButton } from '@/components/account/google-sign-in-button';
import { Alert, AlertDescription, AlertTitle } from '@/ui-components/ui/alert';
import { Separator } from '@/ui-components/ui/separator';

export default async function SignIn() {
  return (
    <section className="mt-24 flex items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="default" className="mb-4">
            <AlertTitle>Test Credentials</AlertTitle>
            <AlertDescription>
              <div>
                <strong>E-Mail: </strong> test@vendure.io
                <br />
                <strong>Password: </strong> test
              </div>
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4">
            <GoogleSignInButton />
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>
            
            <SignInForm />
          </div>
        </CardContent>
        <CardFooter>
          <Link className="text-center text-neutral-500 underline" href="/forgot-password">
            Forgot your password?
          </Link>
        </CardFooter>
      </Card>
    </section>
  );
}
