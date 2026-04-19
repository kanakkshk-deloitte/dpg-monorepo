import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OtpInput } from '@/components/auth/otp-input';
import { requestOtp, type AuthIdentifier } from '@/lib/auth-api';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

interface AuthState extends AuthIdentifier {
  userExists: boolean;
  name?: string;
  redirectTo?: string;
}

function getAuthIdentifier(state: AuthState): AuthIdentifier {
  return state.email ? { email: state.email } : { phoneNumber: state.phoneNumber };
}

export function OtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOtp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const state = location.state as AuthState | null;
  const identifierLabel = state?.email ?? state?.phoneNumber;

  useEffect(() => {
    if (!identifierLabel) {
      navigate('/auth/login');
      return;
    }

    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    if (countdown > 0) {
      const interval = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(interval);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
    return () => clearTimeout(timer);
  }, [countdown, identifierLabel, navigate]);

  const handleOtpComplete = async (otp: string) => {
    if (!state || !identifierLabel) return;

    setIsLoading(true);
    try {
      await verifyOtp(getAuthIdentifier(state), otp, state.userExists ? undefined : state.name);
      toast.success(state.userExists ? 'Welcome back!' : 'Account created successfully!');
      navigate(state.redirectTo ?? '/', { replace: true });
    } catch {
      toast.error('Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!state || !identifierLabel || countdown > 0) return;

    setIsLoading(true);
    try {
      await requestOtp(getAuthIdentifier(state));
      setCountdown(60);
      toast.success('OTP resent successfully');
    } catch {
      toast.error('Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  if (!identifierLabel) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 w-fit -ml-2"
            onClick={() => navigate('/auth/login')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <CardTitle className="text-2xl">Enter verification code</CardTitle>
          <CardDescription>
            We sent a code to {identifierLabel}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center py-4">
            <OtpInput onComplete={handleOtpComplete} disabled={isLoading} />
          </div>

          {isLoading && (
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-sm text-muted-foreground">
                Resend code in {countdown}s
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isLoading}
                className="text-sm text-primary hover:underline disabled:opacity-50"
              >
                Resend code
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
