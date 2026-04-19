import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { checkUser, requestOtp, type AuthIdentifier } from '@/lib/auth-api';
import { toast } from 'sonner';

type AuthMode = 'phone' | 'email';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const redirectTo = searchParams.get('redirect') ?? '/';

  const identifier: AuthIdentifier = mode === 'email' ? { email } : { phoneNumber };
  const contactValue = mode === 'email' ? email : phoneNumber;
  const contactLabel = mode === 'email' ? 'email address' : 'phone number';

  const handleModeChange = (value: string) => {
    if (value !== 'phone' && value !== 'email') return;
    setMode(value);
    setUserExists(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactValue.trim()) return;

    setIsLoading(true);
    try {
      const response = await checkUser(identifier);
      const exists = response.userExists;
      setUserExists(exists);

      if (exists) {
        await requestOtp(identifier);
        navigate('/auth/otp', {
          state: { ...identifier, userExists: exists, name: '', redirectTo },
        });
      } else {
        if (!name.trim()) {
          setIsLoading(false);
          toast.info('Please enter your name to create an account');
          return;
        }
        await requestOtp(identifier);
        navigate('/auth/otp', {
          state: { ...identifier, userExists: exists, name, redirectTo },
        });
      }
    } catch {
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 w-fit -ml-2"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <CardTitle className="text-2xl">
            {userExists === null
              ? 'Sign in or create account'
              : userExists
                ? 'Welcome back'
                : 'Create your account'}
          </CardTitle>
          <CardDescription>
            {userExists === null
              ? `Enter your ${contactLabel} to continue`
              : userExists
                ? `Enter your ${contactLabel} to sign in`
                : `Enter your ${contactLabel} and name to get started`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Tabs value={mode} onValueChange={handleModeChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="phone">Phone</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-2">
              {mode === 'phone' ? (
                <Input
                  type="tel"
                  placeholder="+911234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isLoading}
                  required
                />
              ) : (
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              )}
            </div>

            {userExists === false && (
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            )}

            {userExists !== null && userExists === false && (
              <p className="text-sm text-muted-foreground">
                {mode === 'email'
                  ? "We'll send you an OTP to verify your email address."
                  : "We'll send you an OTP to verify your phone number."}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {userExists === null ? 'Continue' : 'Send OTP'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
