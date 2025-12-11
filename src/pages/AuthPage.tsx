import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, LogIn, UserPlus } from 'lucide-react';

type AuthMode = 'login' | 'signup';

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        const result = await login(email, password);
        if (result.success) {
          toast.success('Welcome back!');
          navigate('/');
        } else {
          toast.error(result.error || 'Login failed');
        }
      } else {
        if (!username.trim()) {
          toast.error('Username is required');
          setLoading(false);
          return;
        }
        const result = await signup(username, email, password);
        if (result.success) {
          toast.success('Account created successfully!');
          navigate('/');
        } else {
          toast.error(result.error || 'Signup failed');
        }
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background grid-pattern">
      <div className="w-full max-w-md">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to game
        </Link>

        <div className="bg-card border border-border rounded-lg p-8 box-glow">
          <h1 className="text-3xl font-pixel text-center mb-2 text-primary text-glow">
            {mode === 'login' ? 'LOGIN' : 'SIGN UP'}
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            {mode === 'login' 
              ? 'Welcome back, player!' 
              : 'Create your account to save scores'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="SnakeMaster"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-input border-border focus:border-primary"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="player@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-input border-border focus:border-primary"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-input border-border focus:border-primary"
                required
                minLength={6}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full font-game"
              disabled={loading}
            >
              {loading ? (
                <span className="animate-pulse">Loading...</span>
              ) : mode === 'login' ? (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Sign Up
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-accent hover:text-accent/80 transition-colors text-sm"
            >
              {mode === 'login' 
                ? "Don't have an account? Sign up" 
                : 'Already have an account? Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
